import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Extension, Node } from '@tiptap/core'
import { history, redo, undo } from '@tiptap/pm/history'
import { EditorContent, useEditor } from '@tiptap/react'
import { cn } from './cn'

/**
 * A line of plain text on a page that you edit where it stands, as in a
 * document: a title, a summary. Ship's title editor (Katerina, 29 September,
 * findings E1 and E2), moved here for the summary (Miky, 16 October: "it feels
 * like a document, not a form") so every app's header edits the same way.
 *
 * - **No box**, on hover or on click, and nothing moves: the text is the
 *   editor, in its own size and colour. The text cursor is the only sign.
 * - **The caret goes where you click**, and nothing is selected.
 * - **Enter saves and moves on** — `onEnter` says where: the title to the
 *   summary, the summary to the description.
 * - **Escape stops editing and keeps the text**, saving it, as leaving does.
 *   Nothing is thrown away; Ctrl+Z undoes.
 * - **An unchanged value is not a write.** Leaving it empty brings the saved
 *   one back, unless `clearable`: then empty is saved, as nothing.
 * - **A refused save keeps your text where it is**, and the app says why
 *   beside it; a change made elsewhere does not overwrite it until you have
 *   saved, changed or emptied it.
 *
 * One paragraph and no marks, so pasted line breaks become spaces and it wraps
 * like text, which a one-line `<input>` cannot. A Tiptap editor rather than a
 * raw `contenteditable`, so it is the same kind of surface as the description
 * under it.
 */
export interface InlineTextProps {
  /** The saved text. A new value is loaded when you are not in the field and hold nothing unsaved. */
  value: string
  /** What it is for, muted, while it is empty: "Untitled", "Add a summary". */
  placeholder: string
  /** The accessible name: "Title", "Summary". */
  label: string
  /** Save it: resolve `true` when saved; `false` keeps your text in place. */
  onCommit: (value: string) => Promise<boolean> | boolean
  /** The text as it is being written, on focus and every change; `null` when you leave. For a count. */
  onText?: (text: string | null) => void
  /** Enter, after the save has started: where the caret goes next. */
  onEnter?: () => void
  /** `title`: the page's heading. `summary`: the line under it, quieter. */
  variant?: 'title' | 'summary'
  /** Empty is a value (a summary). Otherwise leaving it empty brings the saved one back (a title). */
  clearable?: boolean
  /** Text only, the same size and place: nobody can change it, or the editor is not ready. */
  readOnly?: boolean
  /** Placement only. */
  className?: string
  ref?: Ref<InlineTextHandle>
}

type CaretAt = 'start' | 'end'

export interface InlineTextHandle {
  /** Put the caret in it, at the start or the end. */
  focus: (at?: CaretAt) => void
}

/** Size and tone, per variant: the same for the text at rest and while it is written. */
const VARIANT = {
  title: 'text-h2 text-text-primary',
  summary: 'text-body-1 text-text-secondary',
} as const

/** The room around the text: the caret has a little space at the edges, and the text still lines up with what is above and below it. */
const ROOM = '-mx-2 px-2 py-1'

// The whole schema: one paragraph of text. Written with the core, so the
// package's peers stay what they were.
const OneLine = Node.create({ name: 'doc', topNode: true, content: 'paragraph' })
const Paragraph = Node.create({
  name: 'paragraph',
  content: 'text*',
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: () => ['p', 0],
})
const Text = Node.create({ name: 'text' })
const Undo = Extension.create({
  name: 'inlineTextUndo',
  addProseMirrorPlugins: () => [history()],
  addKeyboardShortcuts() {
    const run = (command: typeof undo) => () => command(this.editor.state, this.editor.view.dispatch)
    return { 'Mod-z': run(undo), 'Shift-Mod-z': run(redo), 'Mod-y': run(redo) }
  },
})

const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] })

/** One line: every run of white space, line breaks included, is one space. */
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

export function InlineText({ value, placeholder, label, onCommit, onText, onEnter, variant = 'title', clearable = false, readOnly = false, className, ref }: InlineTextProps) {
  const saved = useRef(value)
  // The placeholder follows the text as it is typed or deleted, not the saved value.
  const [empty, setEmpty] = useState(!value)
  // Read at key time: the editor's handlers are built once, and a prop they
  // closed over would be the first render's.
  const latest = useRef({ onEnter, onText, onCommit, clearable })
  latest.current = { onEnter, onText, onCommit, clearable }

  const save = useCallback(async (text: string) => {
    const next = oneLine(text)
    if (next === saved.current) return
    if (!next && !latest.current.clearable) return
    if (await latest.current.onCommit(next)) saved.current = next
  }, [])

  const editor = useEditor({
    extensions: [OneLine, Paragraph, Text, Undo],
    content: doc(value),
    editable: !readOnly,
    editorProps: {
      attributes: {
        'aria-label': label,
        role: 'textbox',
        'aria-multiline': 'false',
        'aria-placeholder': placeholder,
        ...(readOnly ? { 'aria-readonly': 'true' } : {}),
        class: 'outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          void save(view.state.doc.textContent)
          latest.current.onEnter?.()
          return true
        }
        if (event.key === 'Escape') {
          view.dom.blur()
          return true
        }
        return false
      },
      // A paste is its plain text on this one line, whatever it was copied from.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        if (text == null) return false
        view.dispatch(view.state.tr.insertText(text.replace(/\s+/g, ' ')))
        return true
      },
    },
    onFocus: ({ editor: e }) => latest.current.onText?.(e.getText()),
    onUpdate: ({ editor: e }) => {
      setEmpty(e.isEmpty)
      latest.current.onText?.(e.getText())
    },
    onBlur: ({ editor: e }) => {
      latest.current.onText?.(null)
      // Left empty where empty is not a value: the saved text comes back, so
      // the page never shows the placeholder while everyone else sees the text.
      if (e.isEmpty && saved.current && !latest.current.clearable) {
        e.commands.setContent(doc(saved.current), { emitUpdate: false })
        setEmpty(false)
        return
      }
      void save(e.getText())
    },
  }, [readOnly])

  // A change made elsewhere is loaded while you are not in the field and hold
  // nothing unsaved; your own save coming back is left alone.
  useEffect(() => {
    if (!editor || editor.isDestroyed || value === saved.current || editor.isFocused) return
    if (oneLine(editor.getText()) !== saved.current) return
    editor.commands.setContent(doc(value), { emitUpdate: false })
    saved.current = value
    setEmpty(!value)
  }, [editor, value])

  useImperativeHandle(ref, () => ({
    focus: (at = 'start') => editor?.commands.focus(at),
  }), [editor])

  return (
    <div className={cn('relative', VARIANT[variant], className)}>
      <EditorContent editor={editor} className={cn(ROOM, !readOnly && 'cursor-text')} />
      {/* Empty — never saved, or just deleted — shows what it is for, muted,
          and is not part of the text. Drawn over the editor, where the text starts. */}
      {empty && !readOnly && (
        <span aria-hidden className="pointer-events-none absolute left-0 top-1 text-text-muted">{placeholder}</span>
      )}
    </div>
  )
}
