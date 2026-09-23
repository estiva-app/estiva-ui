import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

/** The JSX an element is made of, as far as this rule reads it. */
interface Node {
  type: string
  [key: string]: unknown
}

interface JSXElement extends Node {
  type: 'JSXElement'
  openingElement: {
    name: { type: string; name?: string; object?: { name?: string }; property?: { name?: string } }
    attributes: { type: string; name?: { name?: string }; value?: Node | null }[]
    loc: NonNullable<Rule.Node['loc']>
    range: [number, number]
  }
  children: Node[]
}

const isElement = (n: unknown): n is JSXElement => typeof n === 'object' && n !== null && (n as Node).type === 'JSXElement'

function tagOf(el: JSXElement): string {
  const n = el.openingElement.name
  if (n.type === 'JSXIdentifier') return n.name ?? ''
  if (n.type === 'JSXMemberExpression') return `${n.object?.name ?? ''}.${n.property?.name ?? ''}`
  return ''
}

function attribute(el: JSXElement, name: string) {
  return el.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === name)
}

/** Every string literal under a node: a `cn()` call, a template, a ternary. */
function strings(node: Node | null | undefined, out: string[] = []): string[] {
  if (!node || typeof node !== 'object') return out
  if (node.type === 'Literal' && typeof node.value === 'string') out.push(node.value)
  else if (node.type === 'TemplateLiteral') for (const q of node.quasis as { value: { cooked: string | null } }[]) out.push(q.value.cooked ?? '')
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue
    if (Array.isArray(value)) for (const v of value) strings(v as Node, out)
    else if (value && typeof value === 'object' && (value as Node).type) strings(value as Node, out)
  }
  return out
}

/** The classes an element is given, variants taken off: `md:px-3` is `px-3`. */
function classesOf(el: JSXElement): string[] {
  const value = attribute(el, 'className')?.value
  if (!value) return []
  const text = value.type === 'Literal' ? String(value.value) : strings(value.expression as Node).join(' ')
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => c.replace(/^(?:[^:\s[\]]+:)+/, ''))
}

/**
 * An element's children as a reader sees them: whitespace and comments gone,
 * `{open && <X />}` read as `<X />`.
 */
function meaningful(el: JSXElement): Node[] {
  const out: Node[] = []
  for (const child of el.children) {
    if (child.type === 'JSXText') {
      if (String(child.value).trim()) out.push(child)
    } else if (child.type === 'JSXExpressionContainer') {
      const e = child.expression as Node
      if (e.type === 'JSXEmptyExpression') continue
      if (e.type === 'LogicalExpression' && isElement(e.right)) out.push(e.right as Node)
      else if (isElement(e)) out.push(e)
      else out.push(child)
    } else if (child.type === 'JSXElement' || child.type === 'JSXFragment') out.push(child)
  }
  return out
}

/** Parts that draw a line of text: a title made of one is still a title. */
const TEXT_PARTS = new Set(['EditableText', 'Person', 'Breadcrumb', 'Link', 'SectionLabel', 'InlineChip'])
/** What a title written as an expression looks like: a name, a field, a template, a fallback. */
const VALUE_EXPRESSIONS = new Set(['Identifier', 'MemberExpression', 'TemplateLiteral', 'Literal', 'LogicalExpression', 'ConditionalExpression', 'ChainExpression', 'CallExpression'])

/** Whether the row carries a title: text, a value, a heading, or a part that draws text, three boxes deep at most. */
function carriesTitle(el: JSXElement, depth = 0): boolean {
  if (depth > 3) return false
  for (const child of meaningful(el)) {
    if (child.type === 'JSXText') return true
    if (child.type === 'JSXExpressionContainer') {
      if (VALUE_EXPRESSIONS.has((child.expression as Node).type)) return true
      continue
    }
    if (!isElement(child)) continue
    const tag = tagOf(child)
    // `Dialog.Title`, `Parts.Title`: a part's title, named as one.
    if (/^h[1-6]$/.test(tag) || TEXT_PARTS.has(tag) || /\.(?:Title|Heading)$/.test(tag)) return true
    // A part's own words are its label, a Button's "Save": only plain boxes are looked into.
    if (/^[a-z]/.test(tag) && carriesTitle(child, depth + 1)) return true
  }
  return false
}

const ROW = (c: string[]) => c.includes('flex') && !c.includes('flex-col')
const OWN_SIDE_PADDING = (c: string[]) => c.some((x) => /^-?(?:p|px|pl|pr|ps|pe)-/.test(x))
/** A column that takes the height it is given: the pane a header bar tops. */
const FILLS = (c: string[]) => c.includes('flex-col') && c.some((x) => /^(?:h-full|h-screen|flex-1|grow|min-h-0|h-dvh)$/.test(x))
/** A header bar's own geometry: a column bar's height, or the hairline under it. */
const BAR = (c: string[]) => c.some((x) => /^(?:h|min-h)-(?:10|11|12|13|14|\[(?:4[0-9]|5[0-6])px\])$/.test(x)) || c.some((x) => /^border-b(?:-|$)/.test(x))
/** A row a person presses is a row of its own kind, not a header. */
const INTERACTIVE = ['onClick', 'href', 'role', 'onKeyDown', 'onPointerDown']

/**
 * UIG-22: a column's header bar built by hand.
 *
 * The general rules cannot see this one: a hand-made header is made entirely of
 * legal parts, a box, some text, some padding. So this rule reads the shape.
 * A row, first in a column, with side padding of its own and a title in it,
 * where the column fills the height it is given, or the row has a header bar's
 * height or the hairline under one. `ContainerHeader` is that bar: 48px, the
 * title, the column's buttons at the right edge, a hairline under it.
 *
 * What it leaves alone, on purpose: a group heading inside a list (the row one
 * section starts with), a label strip on a card, and a row a person presses.
 * Only a lowercase element is judged: a part is already a part.
 */
export const noHandmadeHeader: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: "A column's header bar drawn by hand where ContainerHeader is the part" },
    schema: [],
    messages: {
      handmade:
        "A column's header bar drawn by hand. Use `ContainerHeader` from @estiva-app/ui: 48px, the title, the column's buttons at the right edge (`actions`), a hairline under it.",
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const column = node as unknown as JSXElement
        const kids = meaningful(column)
        const first = kids[0]
        if (kids.length < 2 || !isElement(first) || !/^[a-z]/.test(tagOf(first))) return
        const own = classesOf(first)
        if (!ROW(own) || !OWN_SIDE_PADDING(own)) return
        if (INTERACTIVE.some((name) => attribute(first, name))) return
        if (!FILLS(classesOf(column)) && !BAR(own)) return
        if (!carriesTitle(first)) return
        if (isEscaped(context, first.openingElement)) return
        context.report({ loc: first.openingElement.loc, messageId: 'handmade' })
      },
    }
  },
}
