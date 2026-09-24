import { statSync } from 'node:fs'
import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'
import {
  bindingOfTag,
  classesOf,
  functionComponents,
  parseFile,
  partsOfFile,
  resolveModule,
  walk,
  type Node,
  type Parser,
  type PartBinding,
} from './no-restyled-part'

type Locals = Map<string, PartBinding | 'namespace'>

const child = (node: Node, key: string) => node[key] as Node | null | undefined
const children = (node: Node, key: string) => ((node[key] as (Node | null)[] | undefined) ?? []).filter((n): n is Node => !!n)
const nameOf = (node: Node | null | undefined): string | undefined =>
  node?.type === 'Identifier' || node?.type === 'JSXIdentifier' ? (node.name as string) : undefined
const tagName = (element: Node) => nameOf(child(child(element, 'openingElement') as Node, 'name'))
/**
 * Whether a name is the part itself: imported, re-exported, or an app wrapper
 * that hands everything on (Peek's `EmptyState`). A component that only hands
 * its `className` to one (Ship's `Activity`) is the app's own, and is followed.
 */
const isPart = (binding: PartBinding | undefined, part: string) => binding?.part === part && binding.props === 'all'
const attributeOf = (opening: Node, name: string) => children(opening, 'attributes').find((a) => a.type === 'JSXAttribute' && nameOf(child(a, 'name')) === name)

// ---------------------------------------------------------------- shape 1: a line drawn by hand

/**
 * An empty state is a line, not a paragraph of prose. The words are not read:
 * UIG-1's pass on words alone fired on a hint and a status note, and words
 * missed four of Peek's dialogs ("There is nowhere else to move it…", "Every
 * topic is already in your Open work."). Where the line sits decides.
 */
const SHORT = 120

/**
 * The element's words, when words are all it holds: text, a string, a name
 * dropped into a sentence ("There is nowhere else in {teamName} to put it.").
 * A line with no words of its own — a count, a message's body — is not one.
 */
function onlyWords(element: Node): string | undefined {
  let line = ''
  let own = ''
  for (const kid of children(element, 'children')) {
    let piece: string
    if (kid.type === 'JSXText') piece = String(kid.value)
    else if (kid.type === 'JSXExpressionContainer') {
      const e = child(kid, 'expression') as Node
      if (e.type === 'JSXEmptyExpression') continue
      if (e.type === 'Literal' && typeof e.value === 'string') piece = e.value
      else if (e.type === 'TemplateLiteral' && children(e, 'expressions').length === 0) piece = children(e, 'quasis').map((q) => (q.value as { cooked: string }).cooked).join('')
      else if (e.type === 'Identifier' || e.type === 'MemberExpression') {
        line += 'x'
        continue
      } else return undefined
    } else return undefined
    own += piece
    line += piece
  }
  if (!/[a-z]{2,}/i.test(own)) return undefined
  return line.replace(/\s+/g, ' ').trim()
}

const isCount = (node: Node | null | undefined): boolean => {
  if (node?.type === 'ChainExpression') return isCount(child(node, 'expression'))
  return node?.type === 'MemberExpression' && !node.computed && /^(?:length|size)$/.test(nameOf(child(node, 'property')) ?? '')
}
const isNumber = (node: Node | null | undefined, n: number) => node?.type === 'Literal' && node.value === n

/**
 * What a condition says about a list: `empty` when it is true for an empty one
 * (`rows.length === 0`, `!rows.length`, `isEmpty(rows)`), `full` when it is
 * true for a list with rows (`rows.length > 0`, `rows.length`), nothing when it
 * does not ask. `a && b` says what either side says.
 */
function whenTrue(test: Node | null | undefined): 'empty' | 'full' | undefined {
  if (!test) return undefined
  if (isCount(test)) return 'full'
  switch (test.type) {
    case 'UnaryExpression': {
      if (test.operator !== '!') return undefined
      const inner = whenTrue(child(test, 'argument'))
      return inner === 'empty' ? 'full' : inner === 'full' ? 'empty' : undefined
    }
    case 'LogicalExpression':
      if (test.operator !== '&&') return undefined
      return whenTrue(child(test, 'left')) ?? whenTrue(child(test, 'right'))
    case 'BinaryExpression': {
      let [count, other, op] = [child(test, 'left'), child(test, 'right'), String(test.operator)]
      if (!isCount(count)) [count, other, op] = [other, count, ({ '<': '>', '>': '<', '<=': '>=', '>=': '<=' } as Record<string, string>)[op] ?? op]
      if (!isCount(count)) return undefined
      if (isNumber(other, 0)) return op === '===' || op === '==' || op === '<=' ? 'empty' : op === '>' || op === '!==' || op === '!=' ? 'full' : undefined
      if (isNumber(other, 1)) return op === '<' ? 'empty' : op === '>=' ? 'full' : undefined
      return undefined
    }
    case 'CallExpression': {
      const callee = child(test, 'callee')
      const name = callee?.type === 'MemberExpression' ? nameOf(child(callee, 'property')) : nameOf(callee)
      return name && /^is(?:Empty|Blank)$/.test(name) ? 'empty' : undefined
    }
    default:
      return undefined
  }
}

const isMapCall = (node: Node | null | undefined) => {
  const callee = node?.type === 'CallExpression' ? child(node, 'callee') : undefined
  return callee?.type === 'MemberExpression' && nameOf(child(callee, 'property')) === 'map'
}

/**
 * Whether a branch **is** a list: a `.map(…)`, or a box that holds only that —
 * `<ul>{rows.map(…)}</ul>`. A branch that shows something else and lists a few
 * things inside it (an answer with its sources) is not the list the line stands
 * in for.
 */
function isAList(branch: Node | null | undefined, depth = 0): boolean {
  if (!branch || depth > 2) return false
  if (isMapCall(branch)) return true
  if (branch.type !== 'JSXElement' && branch.type !== 'JSXFragment') return false
  if (branch.type === 'JSXElement' && !/^[a-z]/.test(tagName(branch) ?? '')) return false
  const kids = children(branch, 'children').filter((k) => !(k.type === 'JSXText' && !String(k.value).trim()) && !(k.type === 'JSXExpressionContainer' && (child(k, 'expression') as Node).type === 'JSXEmptyExpression'))
  return kids.length === 1 && (kids[0].type === 'JSXExpressionContainer' ? isMapCall(child(kids[0], 'expression')) : isAList(kids[0], depth + 1))
}

/** A box around one thing and nothing else: a wrapper that pads or places the line. */
function soleChildOf(parent: Node | undefined, element: Node): boolean {
  if (parent?.type !== 'JSXElement' || !/^[a-z]/.test(tagName(parent) ?? '')) return false
  const kids = children(parent, 'children').filter((k) => !(k.type === 'JSXText' && !String(k.value).trim()) && !(k.type === 'JSXExpressionContainer' && (child(k, 'expression') as Node).type === 'JSXEmptyExpression'))
  return kids.length === 1 && kids[0] === element
}

/**
 * Whether the element stands where a list's rows would be: one side of a
 * condition whose other side maps a list, or under a condition that asks if
 * something is empty — `cond && …`, `cond ? … : …`, `if (cond) return …`.
 */
function standsInForAList(element: Node): boolean {
  let at = element
  for (let depth = 0; depth < 3 && soleChildOf(at.parent, at); depth += 1) at = at.parent as Node
  const parent = at.parent
  if (!parent) return false
  if (parent.type === 'ConditionalExpression' && parent.test !== at) {
    const consequent = parent.consequent === at
    const other = child(parent, consequent ? 'alternate' : 'consequent')
    return whenTrue(child(parent, 'test')) === (consequent ? 'empty' : 'full') || isAList(other)
  }
  if (parent.type === 'LogicalExpression' && parent.operator === '&&' && parent.right === at) return whenTrue(child(parent, 'left')) === 'empty'
  if (parent.type === 'ReturnStatement') {
    let holder = parent.parent
    if (holder?.type === 'BlockStatement' && children(holder, 'body').length === 1) holder = holder.parent
    return holder?.type === 'IfStatement' && child(holder, 'consequent') !== undefined && whenTrue(child(holder, 'test')) === 'empty'
  }
  return false
}

// ---------------------------------------------------------------- shape 2: the right part at the wrong scope

/** A content box that fills its viewport: `min-h-full` or `h-full` on `contentClassName`. */
const FILLS = /^(?:min-h-full|h-full)$/

function isPageScope(opening: Node): boolean {
  const scope = attributeOf(opening, 'scope')
  if (!scope) return true
  const value = child(scope, 'value')
  return value?.type === 'Literal' && value.value === 'page'
}

interface FileFacts {
  file: string
  locals: Locals
  components: Map<string, Node>
  /** A local name imported from the app's own files: where from, and under what name. */
  imports: Map<string, { file: string; name: string }>
}

const factsCache = new Map<string, { mtime: number; facts: FileFacts | null }>()

function factsOf(file: string, program: Node, parser: Parser): FileFacts {
  const imports = new Map<string, { file: string; name: string }>()
  for (const statement of children(program, 'body')) {
    if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue
    const target = resolveModule(file, String((child(statement, 'source') as Node).value))
    if (!target) continue
    for (const specifier of children(statement, 'specifiers')) {
      if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') continue
      const local = nameOf(child(specifier, 'local'))
      const imported = nameOf(child(specifier, 'imported'))
      if (local && imported) imports.set(local, { file: target, name: imported })
    }
  }
  return { file, locals: partsOfFile(file, program, parser), components: functionComponents(program), imports }
}

function factsOfFile(file: string, parser: Parser): FileFacts | null {
  const mtime = statSync(file).mtimeMs
  const cached = factsCache.get(file)
  if (cached && cached.mtime === mtime) return cached.facts
  factsCache.set(file, { mtime, facts: null })
  const program = parseFile(parser, file)
  const facts = program ? factsOf(file, program, parser) : null
  factsCache.set(file, { mtime, facts })
  return facts
}

interface PageState {
  file: string
  line: number
}

/**
 * Every page-scope `EmptyState` a component can draw, following the app's own
 * components it draws in turn, in its file and in the files it imports from,
 * four deep.
 */
function pageStatesOf(facts: FileFacts, name: string, parser: Parser, depth: number, seen: Set<string>): PageState[] {
  const key = `${facts.file}#${name}`
  if (depth > 4 || seen.has(key)) return []
  seen.add(key)
  const local = facts.components.get(name)
  if (!local) {
    const from = facts.imports.get(name)
    const there = from ? factsOfFile(from.file, parser) : null
    return there && from ? pageStatesOf(there, from.name, parser, depth + 1, seen) : []
  }
  const found: PageState[] = []
  walk(local, (node) => {
    if (node.type !== 'JSXOpeningElement') return
    const tag = child(node, 'name')
    const binding = bindingOfTag(tag, facts.locals)
    if (isPart(binding, 'EmptyState')) {
      if (isPageScope(node)) found.push({ file: facts.file, line: node.loc?.start.line ?? 0 })
      return
    }
    const component = binding?.props === 'all' ? undefined : nameOf(tag)
    if (component && /^[A-Z]/.test(component)) found.push(...pageStatesOf(facts, component, parser, depth + 1, seen))
  })
  return found
}

const fileName = (file: string) => file.replace(/\\/g, '/').split('/').pop()

/**
 * UIG-23: an empty state drawn by hand, or the right part at the wrong scope.
 *
 * **A line drawn by hand.** A plain box whose only content is a short line
 * saying there is nothing ("No tickets yet.") where a list's rows would be: one
 * side of a condition whose other side maps the list, or under a condition that
 * asks if something is empty. Both halves are needed. The words alone fire on a
 * hint and a status note (UIG-1 measured it); the place alone fires on any
 * line a list shows beside itself.
 *
 * **The wrong scope.** A `page`-scope `EmptyState` centres in the room a flex
 * column gives it. Inside a `ScrollArea` the content box is only as tall as
 * what is in it, so the state sits at the top of its pane. The rule looks at
 * the `ScrollArea`'s content and at every component of the app's own placed in
 * it, following them into their files, because that is how four of them
 * arrived on Folders in one merge (peek `7f22e5e`): the state was drawn in one
 * file and scrolled in another. A `contentClassName` with `min-h-full` or
 * `h-full` gives the state its room, and passes.
 *
 * Not judged: the package's `EmptyState` and a part's own lines (a
 * `FieldLine`, a palette's empty row) — a part is already a part.
 */
export const noHandmadeEmptyState: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'An empty state drawn by hand, or a page-scope EmptyState that cannot centre' },
    schema: [],
    messages: {
      handmade:
        'A line saying there is nothing is an EmptyState. Use `EmptyState` from @estiva-app/ui: `scope="section"` inside a section, `scope="page"` for a whole page.',
      wrongScope:
        'A page-scope EmptyState inside a ScrollArea sits at the top of its pane, not the middle: the ScrollArea\'s content is only as tall as what is in it. Use `scope="section"` when the pane has anything else on it; when the whole pane is empty, draw the page EmptyState in place of the ScrollArea, not inside it.',
      wrongScopeVia:
        '`{{component}}` draws a page-scope EmptyState ({{where}}) inside this ScrollArea, where it sits at the top of its pane, not the middle: the ScrollArea\'s content is only as tall as what is in it. Use `scope="section"` there when the pane has anything else on it; when the whole pane is empty, draw the page EmptyState in place of the ScrollArea, not inside it.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    const parser = (context.languageOptions?.parser ?? {}) as Parser
    const file = context.filename
    let facts: FileFacts | undefined
    // A ScrollArea inside another is walked by both; each state is reported once.
    const reported = new Set<Node>()
    const scopeOf = (node: Node) => context.sourceCode.getScope(node as unknown as Parameters<typeof context.sourceCode.getScope>[0])

    return {
      Program(program) {
        facts = factsOf(file, program as unknown as Node, parser)
      },
      JSXElement(ruleNode: Rule.Node) {
        const element = ruleNode as unknown as Node
        const opening = child(element, 'openingElement') as Node
        const tag = tagName(element)

        // Shape 1: a plain box holding only a "nothing" line, where a list would be.
        if (tag && /^[a-z]/.test(tag)) {
          const words = onlyWords(element)
          if (!words || words.length > SHORT) return
          if (!standsInForAList(element)) return
          if (isEscaped(context, opening)) return
          context.report({ loc: opening.loc as NonNullable<Rule.Node['loc']>, messageId: 'handmade' })
          return
        }

        // Shape 2: a page-scope EmptyState in a ScrollArea that does not fill.
        if (!facts || !isPart(bindingOfTag(child(opening, 'name'), facts.locals), 'ScrollArea')) return
        const content = attributeOf(opening, 'contentClassName')
        if (content && classesOf(child(content, 'value'), scopeOf).some((c) => FILLS.test(c.replace(/^(?:[^:\s[\]]+:)+/, '')))) return
        const here = facts
        for (const kid of children(element, 'children')) {
          walk(kid, (node) => {
            if (node.type !== 'JSXOpeningElement') return
            const name = child(node, 'name')
            const binding = bindingOfTag(name, here.locals)
            if (isPart(binding, 'EmptyState')) {
              if (!isPageScope(node) || reported.has(node) || isEscaped(context, node)) return
              reported.add(node)
              context.report({ loc: node.loc as NonNullable<Rule.Node['loc']>, messageId: 'wrongScope' })
              return
            }
            const component = binding?.props === 'all' ? undefined : nameOf(name)
            if (!component || !/^[A-Z]/.test(component)) return
            const states = pageStatesOf(here, component, parser, 0, new Set())
            if (!states.length || reported.has(node) || isEscaped(context, node)) return
            reported.add(node)
            // In reading order: file, then line.
            for (const state of [...states].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
              const where = state.file === file ? `line ${state.line}` : `${fileName(state.file)}:${state.line}`
              context.report({ loc: node.loc as NonNullable<Rule.Node['loc']>, messageId: 'wrongScopeVia', data: { component, where } })
            }
          })
        }
      },
    }
  },
}
