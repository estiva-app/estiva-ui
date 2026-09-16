import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

interface JSXAttributeValue {
  type: string
  value?: unknown
  expression?: { type: string; value?: unknown; expressions?: unknown[]; quasis?: { value: { cooked: string | null } }[] }
}

interface JSXAttribute {
  type: 'JSXAttribute'
  name: { type: string; name?: string }
  value: JSXAttributeValue | null
}

interface JSXOpeningElement {
  name: { type: string; name?: string }
  attributes: (JSXAttribute | { type: 'JSXSpreadAttribute' })[]
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
}

/**
 * What the package has instead of one raw element: the component the message
 * names, and where one element does more than one job, the others after it.
 * `null` is an element the package has no part for yet.
 */
export interface RawElementPart {
  use: string
  more?: string
}

/**
 * The mapping (UIG-7), derived from the package's exports: every interactive
 * element in the HTML standard's list ("interactive content"), plus `<dialog>`,
 * `<form>` and `<progress>`, which have a part here. docs/GATES.md prints it.
 *
 * Not here, on purpose: `<summary>` (it lives inside a `<details>`, which is
 * reported), `<option>`, `<optgroup>` and `<datalist>` (they live inside a
 * `<select>` or beside an input), `<fieldset>` and `<legend>` (a group's frame,
 * no control of its own), and `<img>` without `usemap`, `<hr>`, `<kbd>`, which
 * are not controls. An `<audio>` or `<video>` is a control only with `controls`.
 */
export const RAW_ELEMENT_PARTS: Record<string, RawElementPart | null> = {
  a: { use: 'Link', more: ' For a chip, `InlineChip`; for a whole card, `Card` with `href`.' },
  button: { use: 'Button' },
  textarea: { use: 'Textarea' },
  select: { use: 'Select' },
  dialog: { use: 'DialogShell', more: ' To ask yes or no, `ConfirmDialog`.' },
  label: { use: 'Field', more: ' For words beside a tick box, `Checkbox` with `label`.' },
  details: { use: 'CollapsibleSection' },
  progress: { use: 'ProgressBar' },
  form: { use: 'Form' },
  meter: null,
  iframe: null,
  embed: null,
  object: null,
  audio: null,
  video: null,
  img: null,
}

/**
 * An `<input>` is as many controls as its `type`. A type missing from here
 * (text, email, password, url, tel, number, or one the browser does not know)
 * is a text box.
 */
export const RAW_INPUT_PARTS: Record<string, RawElementPart | null> = {
  search: { use: 'SearchInput' },
  checkbox: { use: 'Checkbox' },
  file: { use: 'FilePicker' },
  submit: { use: 'Button' },
  button: { use: 'Button' },
  reset: { use: 'Button' },
  image: { use: 'Button' },
  radio: null,
  range: null,
  color: null,
  date: null,
  'datetime-local': null,
  month: null,
  week: null,
  time: null,
}

const TEXT_INPUT: RawElementPart = { use: 'TextInput' }
const ANY_INPUT: RawElementPart = {
  use: 'TextInput',
  more: ' For a search, `SearchInput`; for a tick box, `Checkbox`; to pick files, `FilePicker`.',
}

function attribute(element: JSXOpeningElement, name: string): JSXAttribute | undefined {
  return element.attributes.find((a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.name === name)
}

/** An attribute's value when the code spells it out, `undefined` when it is computed. */
function literal(attr: JSXAttribute): string | boolean | undefined {
  const value = attr.value
  if (value === null) return true
  if (value.type === 'Literal') return typeof value.value === 'string' ? value.value : undefined
  if (value.type !== 'JSXExpressionContainer' || !value.expression) return undefined
  const expression = value.expression
  if (expression.type === 'Literal' && (typeof expression.value === 'string' || typeof expression.value === 'boolean')) return expression.value
  if (expression.type === 'TemplateLiteral' && expression.expressions?.length === 0) return expression.quasis?.[0]?.value.cooked ?? undefined
  return undefined
}

/** Present, and not written as `={false}`. */
function isOn(element: JSXOpeningElement, name: string): boolean {
  const attr = attribute(element, name)
  return attr !== undefined && literal(attr) !== false
}

type Found = { report: 'raw'; element: string; part: RawElementPart } | { report: 'noPart'; element: string } | null

/** What this element is to the rule: a raw element with a part, one with none yet, or none of its business. */
export function classify(element: JSXOpeningElement): Found {
  if (element.name.type !== 'JSXIdentifier' || !element.name.name) return null
  const name = element.name.name

  if (name === 'input') {
    const attr = attribute(element, 'type')
    const type = attr ? literal(attr) : 'text'
    if (typeof type !== 'string') return { report: 'raw', element: '<input>', part: ANY_INPUT }
    const key = type.toLowerCase()
    // A hidden input draws nothing and takes no focus: it is data, not a control.
    if (key === 'hidden') return null
    if (!(key in RAW_INPUT_PARTS)) return { report: 'raw', element: '<input>', part: TEXT_INPUT }
    const part = RAW_INPUT_PARTS[key]
    const shown = `<input type="${key}">`
    return part ? { report: 'raw', element: shown, part } : { report: 'noPart', element: shown }
  }

  if (!Object.hasOwn(RAW_ELEMENT_PARTS, name)) return null
  if ((name === 'audio' || name === 'video') && !isOn(element, 'controls')) return null
  if (name === 'img' && !attribute(element, 'usemap') && !attribute(element, 'useMap')) return null

  const part = RAW_ELEMENT_PARTS[name]
  return part ? { report: 'raw', element: `<${name}>`, part } : { report: 'noPart', element: `<${name}>` }
}

/**
 * A raw interactive element in an app, where the package has a part for it
 * (UIG-3 began it with `<button>`; UIG-7 made it every element). A control
 * the app writes itself has a look, a focus ring and keys that nobody else
 * keeps in step with — and it looks nearly right, which is why nobody catches
 * it by eye. Every message names the part to use.
 *
 * An element the package has no part for yet is refused too, with a message
 * that says so: the part is made in the package, not by hand in an app
 * (Katerina, 16 September).
 *
 * Only a JSX element written with a lowercase name. `<Button>`,
 * `<Foo.button>` and `createElement('button')` are not this rule's business.
 */
export const noRawElement: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'A raw interactive element where @estiva-app/ui has a part, or where it needs one' },
    schema: [],
    messages: {
      raw: 'Use `{{use}}` from @estiva-app/ui instead of a raw {{element}}.{{more}}',
      noPart: '@estiva-app/ui has no part for a raw {{element}} yet. Do not build one here: ask Katerina, and it gets made in @estiva-app/ui.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      // ESLint's types know ESTree's nodes, not JSX's; the parser hands this one over.
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElement
        const found = classify(element)
        if (!found) return
        if (isEscaped(context, element)) return
        if (found.report === 'noPart') context.report({ loc: element.loc, messageId: 'noPart', data: { element: found.element } })
        else context.report({ loc: element.loc, messageId: 'raw', data: { element: found.element, use: found.part.use, more: found.part.more ?? '' } })
      },
    }
  },
}
