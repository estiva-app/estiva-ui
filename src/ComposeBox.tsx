import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Extension } from '@tiptap/core'
import { EditorContent, type Editor } from '@tiptap/react'
import { IconArrowUp } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Toolbar } from './Toolbar'
import { cn } from './cn'
import { richTextClassName } from './RichText'
import { WRITING_BOX_CLASSES } from './looks'
import { SelectionToolbar, type SelectionToolbarProps } from './SelectionToolbar'
import { isSuggestionActive } from './suggestionPopup'

/**
 * The box a message, a reply or a comment is written in, from Katerina's Leaf
 * prototype (9 October). Peek's `ComposeBox`, its look and its keys, with
 * what only Peek knows left in Peek: drafts, uploads, highlights, its text
 * format. The app makes the editor (its extensions are its own) and adds
 * `ComposeKeys`; this draws the box around it and sends.
 */

/** The editor's own classes inside the box: Peek's, rich text with no outline. Put them in `editorProps.attributes.class`. */
export const COMPOSE_EDITOR_CLASSES = richTextClassName('default', 'outline-none w-full bg-transparent min-h-[20px] [&>p+p]:-mt-1')

type ComposeKeysStorage = { send: (() => boolean) | null }

/**
 * Enter sends; Shift+Enter is a new line — in a list a new item (or out of the
 * list, on an empty one), in a quote a new line (or out of it, on an empty one).
 * Peek's keys, as its ComposeBox has them. Enter while a `/`, `@` or `[` list is
 * open picks a row instead. `ComposeBox` says what sending does.
 */
export const ComposeKeys = Extension.create<Record<string, never>, ComposeKeysStorage>({
  name: 'composeKeys',
  addStorage() {
    return { send: null }
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (isSuggestionActive()) return false
        this.storage.send?.()
        return true
      },
      'Shift-Enter': ({ editor }) => {
        const { $from } = editor.state.selection
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d)
          if (node.type.name === 'listItem') {
            return node.textContent.length === 0 ? editor.commands.liftListItem('listItem') : editor.commands.splitListItem('listItem')
          }
          if (node.type.name === 'blockquote') {
            if ($from.parent.textContent.length === 0) return editor.commands.lift('paragraph')
            break
          }
        }
        return editor.commands.splitBlock()
      },
    }
  },
})

/** Nothing written: no text, no chip and no picture — empty lines, lists or quotes only. */
function isEmptyDoc(editor: Editor): boolean {
  const doc = editor.state.doc
  if (doc.textContent.length > 0) return false
  let empty = true
  doc.descendants((node) => {
    if (node.isAtom && node.type.name !== 'hardBreak') empty = false
  })
  return empty
}

export interface ComposeBoxProps {
  /** The app's editor, with `ComposeKeys` in its extensions and `COMPOSE_EDITOR_CLASSES` on it. `null` while it loads. */
  editor: Editor | null
  /**
   * Send what is written. The box empties afterwards — unless this returns
   * `false`: nothing was sent, and the words stay.
   */
  onSend: (editor: Editor) => void | boolean
  /** Said in the empty box: words, and a `Kbd` where a key helps ("type / for commands"). */
  placeholder: ReactNode
  /** The tools under the text, left: `ToolbarButton`s (attach, highlight). One Tab stop. */
  tools?: ReactNode
  /** What is attached, under the text: `AttachmentCard pending`s. */
  attachments?: ReactNode
  /** Something to send even with no words — a file ready. */
  ready?: boolean
  /** Sending waits — a file still uploading. */
  holding?: boolean
  /** The bar down the text's left: an urgent mention or a highlight, as Peek draws it. */
  marked?: boolean
  /** The selection strip's buttons: its marks, Link, and the app's own (`actions`). */
  selection?: Pick<SelectionToolbarProps, 'marks' | 'link' | 'actions'>
  className?: string
}

/**
 * The box for writing: the text, the selection strip over it, what is
 * attached, the tools and Send. Enter sends (`ComposeKeys`), and so does the
 * button.
 */
export function ComposeBox({ editor, onSend, placeholder, tools, attachments, ready = false, holding = false, marked = false, selection, className }: ComposeBoxProps) {
  const [empty, setEmpty] = useState(true)
  const canSend = (!empty || ready) && !holding

  const send = useCallback((): boolean => {
    if (!editor || holding || (isEmptyDoc(editor) && !ready)) return true
    if (onSend(editor) === false) return true
    editor.commands.clearContent(true)
    editor.commands.focus()
    return true
  }, [editor, holding, ready, onSend])

  // Enter, through `ComposeKeys`, sends the way the button does.
  useEffect(() => {
    if (!editor) return
    const storage = (editor.storage as unknown as { composeKeys?: ComposeKeysStorage }).composeKeys
    if (!storage) return
    storage.send = send
    return () => {
      storage.send = null
    }
  }, [editor, send])

  useEffect(() => {
    if (!editor) return
    const read = () => setEmpty(isEmptyDoc(editor))
    read()
    editor.on('update', read)
    return () => {
      editor.off('update', read)
    }
  }, [editor])

  return (
    <div className={cn('relative', className)}>
      <div className={cn(WRITING_BOX_CLASSES, 'focus-within:border-border-strong transition-colors')}>
        <div data-composer-editor className={cn('relative min-h-[20px] transition-all', marked && 'border-l-4 border-border-strong pl-2')}>
          <EditorContent editor={editor} />
          <SelectionToolbar editor={editor} {...selection} />
          {empty && (
            <div className="pointer-events-none absolute inset-0 flex flex-wrap items-center gap-1 text-body-2 text-text-muted">{placeholder}</div>
          )}
        </div>

        {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}

        {/* The tools are one strip — one Tab stop, arrows along it; Send, the answer rather than a tool, keeps its own. */}
        <div className="flex items-center justify-between">
          {tools ? (
            <Toolbar aria-label="Compose tools" surface={false} className="flex items-center gap-1">
              {tools}
            </Toolbar>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2.5">
            <span className="hidden select-none font-mono text-menu font-normal tracking-wider text-text-muted signal:inline">Enter to send · Shift+Enter new line</span>
            {/* Focus stays in the text: the press sends on its way down. A keyboard press is the click (`detail` 0), so a click never sends twice. */}
            <IconButton
              variant="primary"
              onMouseDown={(e) => {
                e.preventDefault()
                send()
              }}
              onClick={(e) => {
                if (e.detail === 0) send()
              }}
              disabled={!canSend}
              aria-label="Send"
              tooltip="Send"
              tooltipShortcut="Enter"
              glow={canSend}
            >
              <IconArrowUp size={16} stroke={1.5} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  )
}
