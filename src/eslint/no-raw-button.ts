import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

interface JSXOpeningElement {
  name: { type: string; name?: string }
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
}

/**
 * A raw `<button>` in an app (UIG-3, the tracer). The package's `Button`,
 * `IconButton`, `MenuItem` and chips are buttons already; an app that writes
 * its own has a look and a behaviour nobody else keeps in step with.
 *
 * Only the JSX element named `button`. `<Button>`, `<Foo.button>` and
 * `createElement('button')` are not this rule's business.
 */
export const noRawButton: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'A raw <button> where @estiva-app/ui has one' },
    schema: [],
    messages: {
      raw: 'Use `Button` from @estiva-app/ui instead of a raw <button>.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      // ESLint's types know ESTree's nodes, not JSX's; the parser hands this one over.
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElement
        if (element.name.type !== 'JSXIdentifier' || element.name.name !== 'button') return
        if (isEscaped(context, element)) return
        context.report({ loc: element.loc, messageId: 'raw' })
      },
    }
  },
}
