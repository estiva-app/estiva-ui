// @estiva-escape(component-has-a-page, component-has-a-story): CommentBox's own frame, not offered to apps — CommentBox's page and stories show it (Katerina, 21 Oct: one box)
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Extension } from '@tiptap/core'
import { EditorContent, type Editor } from '@tiptap/react'
import { IconArrowUp } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Toolbar } from './Toolbar'
import { cn } from './cn'
import { richTextClassName } from './RichText'
import { ScrollArea } from './ScrollArea'
import { WRITING_BOX_CLASSES } from './looks'
import { SelectionToolbar, type SelectionToolbarProps } from './SelectionToolbar'
import { isSuggestionActive } from './suggestionPopup'

/**
 * The frame `CommentBox` writes in, from Katerina's Leaf prototype (9
 * October): the text, scrolling in a `ScrollArea` past half the window, the
 * bar down its left while it is marked, what is attached, and a footer. The
 * send box and the edit box are this one frame with different footers, so a
 * change to the box is made once (Katerina, 21 Oct: the scrollbar had to be
 * fixed in two copies). It was `ComposeBox`, a part of its own until 0.85.0;
 * no app used it, and two box names invited the wrong pick.
 */

/** The classes the box's editor wears: rich text with no outline. It never scrolls itself; the box does, in a `ScrollArea`. */
export const COMPOSE_EDITOR_CLASSES = richTextClassName('default', 'outline-none w-full bg-transparent min-h-[20px] [&>p+p]:-mt-1')

/**
 * A long draft stops at half the window and scrolls inside the box, so its
 * first line can be reached (PEE-59). The package's `ScrollArea` scrolls it,
 * not the browser: its bar, and one that shows while there is more (Katerina,
 * 21 Oct: the browser's bar, and none at all in some browsers).
 *
 * The region reaches into the box's right padding (the box's `p-3`) and its
 * content gives it back, so the text ends where it did and the bar sits 3px
 * from the box's edge, as every other box's bar does (Katerina, 21 Oct: the gap
 * on the right; measured 15px before, 3px after).
 */
export const COMPOSE_SCROLL_CLASSES = { area: '-mr-3', viewport: 'max-h-[50vh]', content: 'pr-3' }

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

/** Nothing written: no text, no chip and no picture — empty lines, spaces, lists or quotes only. */
export function isEmptyDoc(editor: Editor): boolean {
  const doc = editor.state.doc
  if (doc.textContent.trim().length > 0) return false
  let empty = true
  doc.descendants((node) => {
    // A text node is a leaf, so an atom too: only spaces are left of it here.
    if (node.isAtom && !node.isText && node.type.name !== 'hardBreak') empty = false
  })
  return empty
}

export interface BoxFrameProps {
  /** The box's editor, with `ComposeKeys` in its extensions and `COMPOSE_EDITOR_CLASSES` on it. `null` while it loads. */
  editor: Editor | null
  /** The bar down the text's left: an urgent mention or a highlight, as Peek draws it. */
  marked?: boolean
  /** The selection strip over the text, with these buttons. Absent, no strip (the edit box). */
  selection?: Pick<SelectionToolbarProps, 'marks' | 'link' | 'actions'>
  /** Said while the text is empty: words, and a `Kbd` where a key helps. */
  placeholder?: ReactNode
  empty?: boolean
  /** What is attached, under the text: `AttachmentCard pending`s. */
  attachments?: ReactNode
  /** The row under it all: the tools and Send, or the keys and Cancel/Save. */
  footer: ReactNode
  /** On the box itself. */
  className?: string
}

/** The one frame both boxes draw: the bordered box, its text in a `ScrollArea`, what is attached, the footer. */
export function BoxFrame({ editor, marked = false, selection, placeholder, empty = false, attachments, footer, className }: BoxFrameProps) {
  return (
    <div className={cn(WRITING_BOX_CLASSES, 'focus-within:border-border-strong transition-colors', className)}>
      <div data-composer-editor data-marked={marked || undefined} className={cn('relative min-h-[20px] transition-all', marked && 'border-l-4 border-border-strong pl-2')}>
        <ScrollArea className={COMPOSE_SCROLL_CLASSES.area} viewportClassName={COMPOSE_SCROLL_CLASSES.viewport} contentClassName={COMPOSE_SCROLL_CLASSES.content}>
          <EditorContent editor={editor} />
        </ScrollArea>
        {selection && <SelectionToolbar editor={editor} {...selection} />}
        {empty && placeholder != null && (
          <div className="pointer-events-none absolute inset-0 flex flex-wrap items-center gap-1 text-body-2 text-text-muted">{placeholder}</div>
        )}
      </div>
      {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}
      {footer}
    </div>
  )
}

export interface SendBoxProps {
  /** The box's editor. `null` while it loads. */
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
 * The send box: the frame with the selection strip over the text, the tools
 * and Send under it. Enter sends (`ComposeKeys`), and so does the button.
 */
export function SendBox({ editor, onSend, placeholder, tools, attachments, ready = false, holding = false, marked = false, selection, className }: SendBoxProps) {
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
      <BoxFrame
        editor={editor}
        marked={marked}
        selection={selection ?? {}}
        placeholder={placeholder}
        empty={empty}
        attachments={attachments}
        footer={
        // The tools are one strip — one Tab stop, arrows along it; Send, the answer rather than a tool, keeps its own.
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
        }
      />
    </div>
  )
}
