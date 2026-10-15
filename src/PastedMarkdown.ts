import { Extension, type JSONContent } from '@tiptap/core'
import { Slice, type ResolvedPos } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface PastedMarkdownOptions {
  /**
   * Plain text read as the blocks it spells, as editor JSON (`{ type: 'doc',
   * content }`), or `undefined` to paste it as text. The app passes its
   * protocol's reader — for a block document, `@estiva-app/protocol`'s
   * `descriptionTextToBlockDocument` through `toEditorDocument` — so a paste
   * reads text exactly as the agent's write of the same text does.
   */
  read: (text: string) => JSONContent | undefined
}

/** Inside a table cell: a pasted table there stays text, never a table in a table. */
function inTableCell($context: ResolvedPos): boolean {
  for (let depth = $context.depth; depth > 0; depth--) {
    const role = $context.node(depth).type.spec.tableRole
    if (role === 'cell' || role === 'header_cell') return true
  }
  return false
}

const hasTable = (blocks: JSONContent[]): boolean => blocks.some((block) => block.type === 'table' || hasTable(block.content ?? []))

/**
 * Markdown pasted as plain text lands as what it spells: a heading, a list, a
 * checklist, a quote or callout, a table (LEAF-10; Miky, 2026-10-15). Only a
 * paste with no HTML on the clipboard is read — a copy from a web page already
 * pastes its own structure — and a paste that spells nothing but paragraphs
 * pastes exactly as before. Ctrl/Cmd+Shift+V, the plain-text paste, keeps the
 * text as typed, and so does a paste into code.
 *
 * For an editor that saves a block document. A message box leaves it out: a
 * message's text has no table (SPEC §13.2), so a pasted table stays text there.
 */
export const PastedMarkdown = Extension.create<PastedMarkdownOptions>({
  name: 'pastedMarkdown',
  addOptions() {
    return { read: () => undefined }
  },
  addProseMirrorPlugins() {
    const options = this.options
    return [
      new Plugin({
        key: new PluginKey('pastedMarkdown'),
        props: {
          // Reached only for a text paste outside code; `plain` is the Shift paste.
          clipboardTextParser: (text, $context, plain, view) => {
            if (plain) return undefined as unknown as Slice
            const blocks = options.read(text.replace(/\r\n?/g, '\n'))?.content ?? []
            if (blocks.every((block) => block.type === 'paragraph')) return undefined as unknown as Slice
            if (inTableCell($context) && hasTable(blocks)) return undefined as unknown as Slice
            try {
              return Slice.maxOpen(view.state.schema.nodeFromJSON({ type: 'doc', content: blocks }).content)
            } catch {
              // A block this editor's schema does not hold (a table without TableKit): paste the text.
              return undefined as unknown as Slice
            }
          },
        },
      }),
    ]
  },
})
