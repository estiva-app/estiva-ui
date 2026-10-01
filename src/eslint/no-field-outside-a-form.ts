import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'
import { bindingOfTag, partsOfFile, type Node, type Parser, type PartBinding } from './no-restyled-part'

/**
 * The parts a person types into to send something. `Field` is the labelled
 * row; `TextInput` and `Textarea` are judged on their own only in a file that
 * draws no `Field`, so a field is reported once, at its label.
 */
export const FIELD_PARTS = ['Field', 'TextInput', 'Textarea'] as const

/** The parts that are a `Form`: the package's own, and the palette's form level, which is one (UIG-29). */
export const FORM_PARTS = ['Form', 'CommandPaletteForm'] as const

const child = (node: Node, key: string) => node[key] as Node | null | undefined
const nameOf = (node: Node | null | undefined): string | undefined =>
  node?.type === 'JSXIdentifier' || node?.type === 'Identifier' ? (node.name as string) : undefined

/**
 * A field outside a `Form` (Katerina, 1 October, after Peek's and Ship's
 * Archive dialog: a resolution typed into a `ConfirmDialog`, sent by its
 * button, with no form around it — Ctrl+Enter did nothing, and the field
 * stayed open while it archived).
 *
 * `Form` owns what a field needs to be sent: Enter and Ctrl+Enter, `busy`
 * switching every field off at once, and where focus goes after. A field
 * outside one has none of it, and the dialog around it is the wrong one: a
 * question with a field in it is a `DialogShell` with a `Form`
 * (ConfirmDialog's page, **When not**).
 *
 * Judged: a `Field`, a `TextInput` or a `Textarea` of the package (or an
 * app's re-export or wrapper of one) with no `Form` around it in the same
 * file. Not judged, on purpose:
 *
 * - `EditableText` and `SearchInput`: one saves itself as you leave it, the
 *   other filters a list, and neither is sent (Form's page, **When not**);
 * - a `TextInput` or `Textarea` in a file that draws a `Field`: the `Field`
 *   is reported, and a control handed to it from a function of its own (a
 *   `switch` over field kinds) cannot be followed to it;
 * - the app's own components: a component that draws a field for a form its
 *   caller holds says so with an escape on the field, naming that caller.
 */
export const noFieldOutsideAForm: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'A field with no Form around it' },
    schema: [],
    messages: {
      loose:
        '`{{part}}` has no `Form` around it, so nothing owns sending it: Enter and Ctrl+Enter, `busy`, and focus after. Put it in `Form` from @estiva-app/ui; in a dialog, that is `DialogShell` with a `Form`, never `ConfirmDialog` (Primitives/Form says how).',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    const parser = (context.languageOptions?.parser ?? {}) as Parser
    let locals: Map<string, PartBinding | 'namespace'> | undefined
    const loose: { opening: Node; part: string }[] = []
    let drawsAField = false
    const partOf = (element: Node): string | undefined => {
      const tag = child(child(element, 'openingElement') as Node, 'name')
      const name = nameOf(tag)
      if (!name || /^[a-z]/.test(name)) return undefined
      const binding = locals && bindingOfTag(tag, locals)
      return binding && binding.props === 'all' ? binding.part : undefined
    }
    return {
      Program(program) {
        locals = partsOfFile(context.filename, program as unknown as Node, parser)
      },
      JSXElement(ruleNode: Rule.Node) {
        const element = ruleNode as unknown as Node
        const part = partOf(element)
        if (!part || !(FIELD_PARTS as readonly string[]).includes(part)) return
        if (part === 'Field') drawsAField = true
        for (let up = element.parent as Node | undefined; up; up = up.parent as Node | undefined) {
          if (up.type !== 'JSXElement') continue
          const around = partOf(up)
          if (around && (FORM_PARTS as readonly string[]).includes(around)) return
          if (around === 'Field') return
        }
        loose.push({ opening: child(element, 'openingElement') as Node, part })
      },
      'Program:exit'() {
        for (const { opening, part } of loose) {
          if (part !== 'Field' && drawsAField) continue
          if (isEscaped(context, opening)) continue
          context.report({ loc: opening.loc as NonNullable<Rule.Node['loc']>, messageId: 'loose', data: { part } })
        }
      },
    }
  },
}
