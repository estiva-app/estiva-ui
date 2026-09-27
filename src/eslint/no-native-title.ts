import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'
import { bindingOfTag, partsOfFile, type Node, type Parser, type PartBinding } from './no-restyled-part'

/**
 * The parts whose `title` is their own: the words of a heading or a dialog,
 * drawn on the page. Every other part hands a `title` on to its element, and
 * the browser shows it as its tooltip. `no-native-title.test.ts` holds this
 * list to the catalogue: a part that gains a `title` of its own joins it.
 */
export const PARTS_WITH_A_TITLE = ['CollapsibleSection', 'ConfirmDialog', 'ContainerHeader', 'DialogShell', 'ListColumn', 'Panel', 'SectionHeader'] as const

const child = (node: Node, key: string) => node[key] as Node | null | undefined
const nameOf = (node: Node | null | undefined): string | undefined =>
  node?.type === 'JSXIdentifier' || node?.type === 'Identifier' ? (node.name as string) : undefined

/**
 * UIG-24: the browser's tooltip where ours belongs.
 *
 * A `title` on an element is the browser's hover box: grey, in the system's
 * font, after a delay nobody chose, and never on a touch screen. The package's
 * `WithTooltip` is the tooltip here (and `IconButton`'s `tooltip`, which draws
 * it). The rule reads the attribute, never the page: a tooltip's words are not
 * on the page until it opens.
 *
 * Judged: a `title` on a plain element, and on a part of the package (or an
 * app's wrapper that hands all its props on to one) whose `title` is not its
 * own — `<Button title>` reaches the `<button>`. Not judged, on purpose:
 *
 * - the `<title>` **element**, in an `<svg>` (a label for a screen reader) or
 *   a document's head: an element, not an attribute, so the rule never sees it;
 * - a part whose `title` is its own heading (`PARTS_WITH_A_TITLE`);
 * - the app's own components: what one does with a `title` is its own business,
 *   and its elements are judged where it draws them;
 * - a story's `title` (`meta = { title: 'Group/Name' }`): an object key, not an
 *   attribute.
 */
export const noNativeTitle: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: "A title attribute: the browser's tooltip where WithTooltip is the part" },
    schema: [],
    messages: {
      native:
        "`title` is the browser's tooltip, not ours. Wrap it in `WithTooltip` from @estiva-app/ui, or use `IconButton`'s `tooltip`: its page (Primitives/Tooltip) says when it shows and how.",
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    const parser = (context.languageOptions?.parser ?? {}) as Parser
    let locals: Map<string, PartBinding | 'namespace'> | undefined
    return {
      Program(program) {
        locals = partsOfFile(context.filename, program as unknown as Node, parser)
      },
      JSXAttribute(ruleNode: Rule.Node) {
        const attribute = ruleNode as unknown as Node
        if (nameOf(child(attribute, 'name')) !== 'title') return
        const opening = attribute.parent as Node
        const tag = child(opening, 'name')
        const name = nameOf(tag)
        if (!(name && /^[a-z]/.test(name))) {
          const binding = locals && bindingOfTag(tag, locals)
          if (!binding || binding.props !== 'all') return
          if ((PARTS_WITH_A_TITLE as readonly string[]).includes(binding.part)) return
        }
        if (isEscaped(context, opening)) return
        context.report({ loc: attribute.loc as NonNullable<Rule.Node['loc']>, messageId: 'native' })
      },
    }
  },
}
