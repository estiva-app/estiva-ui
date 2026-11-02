import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react'
import type { AnyExtension, Editor } from '@tiptap/core'
import { EditorContent, useEditor, useEditorState, type JSONContent } from '@tiptap/react'
import type { AttachmentViewProps, ReferenceViewProps } from './BlockNodes'
import { cn } from './cn'
import { documentExtensions, type DocumentCodec, type DocumentMentions, type DocumentReferences } from './DocumentEditor'
import { useFormBusy } from './formBusy'
import type { LinkChipsOptions } from './LinkChips'
import { EDITOR_SELECTION_CLASSES, FIELD_SHELL_CLASSES, FIELD_SHELL_FOCUS_CLASSES } from './looks'
import { ReferenceMenuView } from './ReferenceMenu'
import { richTextClassName } from './RichText'
import { SelectionToolbar } from './SelectionToolbar'
import { isSuggestionOpen } from './suggestionPopup'

export interface DocumentFieldProps {
  /** What the field holds, in `format`; `''` when nothing is written. A value that is not its own edit coming back is loaded into it. */
  value: string
  /** The format `value` is in, handed to `codec.read`. */
  format: string
  /** How the app's text and the editor's document turn into each other: `DocumentEditor`'s. */
  codec: DocumentCodec
  /** Every edit, as it is typed: the text and its format, or `''` once it is emptied or holds only spaces and blank lines. Nothing is saved: the form around it sends. */
  onChange: (value: string, contentFormat: string | undefined) => void
  /** The editor's accessible name: the label of the `Field` around it. */
  label: string
  /** Muted words in the empty field. */
  placeholder?: ReactNode
  /** `[` and `/` → File. */
  references?: DocumentReferences
  /** `@` and `/` → Mention. */
  mentions?: DocumentMentions
  /** A pasted app URL drawn as the chip of what it names (`LinkChips`). */
  linkChips?: LinkChipsOptions
  /** Plain text pasted as the blocks it spells: the app's reader of markdown, as the editor's document. */
  readMarkdown?: (text: string) => JSONContent | undefined
  /** Draws a link: the app's own, which resolves what it names. */
  referenceView?: ComponentType<ReferenceViewProps>
  /** Draws a placed file: the app's own card. */
  attachmentView?: ComponentType<AttachmentViewProps>
  /** More of the app's own extensions. */
  extensions?: readonly AnyExtension[]
  /** Set by a required `Field` around it, for a screen reader. */
  'aria-required'?: boolean | 'true' | 'false'
}

const NONE: readonly AnyExtension[] = []
const nothing = () => {}

/** Nothing but spaces and blank lines: no word, and no link, card or picture (any part of it that is not text or a line break). */
const isBlank = (editor: Editor) => {
  let blank = true
  editor.state.doc.descendants((node) => {
    if (node.isText ? /\S/.test(node.text ?? '') : node.isLeaf && node.type.name !== 'hardBreak') blank = false
    return blank
  })
  return blank
}

/**
 * A form's field that holds a document: a description written in the form that files it. The document editor's
 * grammar (`DocumentEditor`'s blocks, marks, `[`, `@` and `/`) in a field's box, as a Textarea's beside it. It is the
 * form's: every edit goes back as it is typed, nothing is saved on leaving, Ctrl/Cmd+Enter sends the form, and while
 * the form sends nothing can be written in it.
 *
 * **Told apart by everything it has handed back, not only the last** (Peek's `ProseField`, RIC-13). Keys pressed faster
 * than React renders reach the editor before the value from the previous one comes back. Compared with the last edit
 * alone, that older value looked like one from outside and was loaded over the newer text. A value this field wrote is
 * never an outside value, however late it arrives; each is dropped once the value has shown it, so the queue holds only
 * the edits still in flight. A queue, not a set: `a`, `ab`, `a` (a key and its Backspace) repeats a value.
 */
export function DocumentField({
  value,
  format,
  codec,
  onChange,
  label,
  placeholder,
  references,
  mentions,
  linkChips,
  readMarkdown,
  referenceView,
  attachmentView,
  extensions = NONE,
  'aria-required': required,
}: DocumentFieldProps) {
  // The latest props, for the editor's callbacks, which are made once.
  const latest = useRef({ value, format, codec, onChange, references, mentions, readMarkdown })
  useEffect(() => {
    latest.current = { value, format, codec, onChange, references, mentions, readMarkdown }
  })
  // What this field has handed back and the value has not shown yet, oldest first.
  const inFlight = useRef<string[]>([value])
  // `''` too is the codec's to read, as the document editor reads it: a block typed into it then gets its id.
  const read = (text: string) => latest.current.codec.read(text, latest.current.format)
  // No upload in a field: `/` has no Upload, and a pasted picture stays the browser's.
  const pickFile = useRef(nothing)
  const attach = useRef(async () => {})
  const [initial] = useState(() => read(value))

  const editor = useEditor(
    {
      extensions: documentExtensions({
        latest,
        references,
        mentions,
        linkChips,
        table: false,
        upload: false,
        readMarkdown: !!readMarkdown,
        comments: false,
        referenceView,
        attachmentView,
        pickFile,
        attach,
        extensions,
      }),
      // Made once: a value coming back must not rebuild the editor under the caret; see the effect below.
      content: initial,
      editorProps: {
        attributes: {
          'aria-label': label,
          role: 'textbox',
          'aria-multiline': 'true',
          ...(required !== undefined && required !== false ? { 'aria-required': 'true' } : {}),
          // Three lines tall at rest, as a Textarea of three rows beside it. A row or a card is its whole line (`LinkPlaces`).
          // eslint-disable-next-line token-spacing/no-restricted-classes -- @estiva-escape: three lines of the field's own text (140% of 14px each), the height of a Textarea of three rows
          class: richTextClassName('default', cn('outline-none min-h-[4.2em] [&_[data-link-place]]:inline-block [&_[data-link-place]]:w-full [&_[data-link-place]]:align-top', EDITOR_SELECTION_CLASSES)),
        },
        /*
          Ctrl/Cmd+Enter sends the form around it, as from any of its fields. The field asks the form itself: the
          editor marks every Enter it is given as handled (a browser's Enter would otherwise change the text), and the
          form leaves a handled key alone — measured in Chrome, the form never heard it. An open list keeps its keys.
        */
        handleKeyDown: (view, event) => {
          if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || isSuggestionOpen()) return false
          const form = view.dom.closest('form')
          if (!form) return false
          form.requestSubmit()
          return true
        },
      },
      onUpdate: ({ editor: ed }) => {
        // Emptied, or only spaces and blank lines, it holds nothing: `''`, so a required field is missing again (Peek's ProseField).
        const next = isBlank(ed) ? { value: '' } : latest.current.codec.write(ed.getJSON())
        inFlight.current.push(next.value)
        latest.current.onChange(next.value, next.contentFormat)
      },
    },
    [],
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const at = inFlight.current.indexOf(value)
    if (at !== -1) {
      // Its own edit coming round, possibly late. Values render in order, so nothing handed back before it can still
      // arrive: drop those, keep the rest.
      inFlight.current = inFlight.current.slice(at + 1)
      return
    }
    inFlight.current = []
    // `read` takes the latest codec and format, set by the effect above, which runs first.
    editor.commands.setContent(read(value), { emitUpdate: false })
  }, [editor, value])

  /*
    While its form sends it waits, as the fields beside it do. The form's disabled fieldset switches off every native
    control in it, and a document's box is not one: it is told here, before the paint, with no edit handed back.
  */
  const busy = useFormBusy()
  useLayoutEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable === busy) editor.setEditable(!busy, false)
  }, [editor, busy])

  const empty = useEditorState({ editor, selector: ({ editor: ed }) => !ed || ed.isEmpty })

  // A press on the box's padding puts the caret in, as a Textarea's does.
  const into = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !editor) return
    event.preventDefault()
    editor.commands.focus('end')
  }

  return (
    <>
      <div className={cn(FIELD_SHELL_CLASSES, FIELD_SHELL_FOCUS_CLASSES, 'relative cursor-text px-3 py-2')} onMouseDown={into}>
        <EditorContent editor={editor} />
        {empty && placeholder && (
          <span aria-hidden className="pointer-events-none absolute left-3 top-2 text-body-2 text-text-muted">
            {placeholder}
          </span>
        )}
      </div>
      <SelectionToolbar editor={editor} marks={['bold', 'italic', 'underline', 'code']} link />
      <ReferenceMenuView editor={editor} />
    </>
  )
}
