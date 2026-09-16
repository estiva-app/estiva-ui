import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

interface JSXOpeningElement {
  type: string
  name: { type: string; name?: string }
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
  parent?: Parent
}

interface Parent {
  type: string
  name?: { name?: string }
  openingElement?: unknown
  parent?: Parent
}

/**
 * The elements this package writes by hand. The set the count used (UIG-1,
 * docs/GATES.md §5 and §7): every element that carries behaviour or a role of
 * its own. A `div` or a `span` is layout and is nobody's business here.
 */
export const RAW_ELEMENTS = new Set(['a', 'button', 'input', 'textarea', 'select', 'dialog', 'form', 'label'])

/**
 * A raw element nested inside another element, in the package itself (UIG-5,
 * the inward tracer).
 *
 * The package is allowed to write raw elements — that is what a primitive is.
 * Two shapes are right, and both are facts about the code rather than a
 * judgement:
 *
 * - **the component's own outermost element.** `NavItem` is an `<a>`, `Link` is
 *   an `<a>`, a `MenuItem` outside a `Menu` is a `<button>`. A primitive owning
 *   its element is the whole point of it.
 * - **handed to a Base UI `render` prop.** `render={<button type="button" />}`
 *   tells a Base UI part which element to be; the behaviour stays Base UI's.
 *
 * Anything else is an element buried inside a bigger component, where its look
 * and its behaviour are kept in step by nobody — the package's own version of
 * the rule the apps get from UIG-3 and UIG-7.
 *
 * It keeps its reason on the line above if it stays: `// @estiva-escape: <why>`.
 */
export const rawElementOutsideAWrapper: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'A raw element nested inside a component, rather than the component itself' },
    schema: [],
    messages: {
      nested:
        'A raw <{{name}}> inside another element. In this package a raw element is either the component\'s own outermost element or handed to a Base UI `render` prop; one buried inside belongs in a component of its own (Link, Button, MenuItem...).',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      // ESLint's types know ESTree's nodes, not JSX's; the parser hands this one over.
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElement
        const name = element.name.name
        if (element.name.type !== 'JSXIdentifier' || !name || !RAW_ELEMENTS.has(name)) return

        // An opening tag's own parent is its JSXElement: that is this element,
        // not an element around it.
        let parent = element.parent
        if (parent?.type === 'JSXElement' && parent.openingElement === (element as unknown)) parent = parent.parent

        // Whichever comes first going outward decides: an element around it
        // means it is nested; a `render` prop means Base UI draws it.
        for (let p = parent; p; p = p.parent) {
          if (p.type === 'JSXAttribute') {
            if (p.name?.name === 'render') return
            continue
          }
          if (p.type !== 'JSXElement' && p.type !== 'JSXFragment') continue
          if (isEscaped(context, element)) return
          context.report({ loc: element.loc, messageId: 'nested', data: { name } })
          return
        }
      },
    }
  },
}
