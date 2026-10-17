import { useCallback, useEffect, useRef, useState, type ComponentType, type DragEvent, type ReactNode } from 'react'
import { Extension, type AnyExtension } from '@tiptap/core'
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { IconLock, IconPaperclip, IconSquareRounded } from '@tabler/icons-react'
import { AttachmentCard } from './AttachmentCard'
import { ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { Button } from './Button'
import { Card } from './Card'
import { cn } from './cn'
import { ComposeBox, ComposeKeys, COMPOSE_EDITOR_CLASSES } from './ComposeBox'
import {
  CaptionedReference,
  PersonMention,
  ReferenceTrigger,
  SlashCommands,
  UrgentPersonMention,
  formatSection,
  typeTrigger,
  type CodeFormat,
  type MentionPerson,
  type ReferenceSection,
  type SlashCommand,
} from './ComposerTriggers'
import { FieldLine } from './Field'
import { FilePicker } from './FilePicker'
import { Kbd } from './Kbd'
import { WRITING_BOX_CLASSES } from './looks'
import { PastedImages } from './PastedImages'
import { KeptSelection } from './SelectionToolbar'
import { isSuggestionActive } from './suggestionPopup'
import { ToolbarButton } from './Toolbar'

/**
 * The one box every app writes a comment, a reply and a chat line in, from the
 * approved prototype (`concept/comments-everywhere`, Miky 17 October): the
 * package's `ComposeBox` with everything each app built around it — `@`,
 * `!@`, `[` and `/`, the keys, drafts, files, the edit mode, sending and a
 * refused send. An app hands over only its people, its `[` sections, its `/`
 * Insert rows and a send that says whether the relay accepted it.
 *
 * It speaks the editor's document. What that document writes as a message,
 * and the document an edit or a draft opens with, are `@estiva-app/conversation`'s
 * (`composerText`, `composerDocument`, `composerDraft`).
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/every-app-writes-and-reacts-with-one-shared-box.md
 */

/** What the relay said about a send, an edit or an upload. */
export type SendAnswer = { accepted: true } | { accepted: false; reason: string }

/** What an upload answered: the app's own record of the file, or why not. */
export type UploadAnswer = { accepted: true; value: unknown } | { accepted: false; reason: string }

/** Where a file in the box is: Send waits for one uploading. */
export type BoxFileState = 'uploading' | 'ready' | 'failed'

/** A file in the box. */
export interface BoxFile {
  id: string
  name: string
  size?: number
  contentType?: string
  state: BoxFileState
  /** Why it failed, under its name. */
  note?: string
  /** What `upload` answered for it: the app's own record (an `imeta`, a URL). */
  value?: unknown
}

/** A draft, in the box's terms — `@estiva-app/conversation`'s `composerDraft` is one. */
export interface CommentBoxDraft {
  read(): JSONContent | undefined
  write(body: JSONContent): void
  clear(): void
}

/** Editing something already sent: the same box, with Cancel and Save. */
export interface CommentBoxEdit {
  /** What it says now, as `composerDocument` opens it. */
  body: JSONContent
  /** Its files, which can be taken off; none can be added. */
  files?: BoxFile[]
  onCancel: () => void
  /** Save; the box holds the words until the answer, and a refusal is said under it. */
  onSave: (body: JSONContent, files: BoxFile[]) => Promise<SendAnswer>
}

export interface CommentBoxProps {
  /** Who `@` and `!@` offer. */
  people: readonly MentionPerson[]
  /** What `[` lists for what was typed, already in the app's order. Absent, `[` opens nothing. */
  references?: (query: string) => readonly ReferenceSection[]
  /** Called with a listener while `[` is open; call it when `references` would answer differently (a search landed). */
  referencesChanged?: (listener: () => void) => () => void
  /** A `[` row's and chip's 16px icon from what it points at; absent, a neutral square. */
  referenceIcon?: (uri: string | null) => ReactNode | undefined
  /** The app's own `/` Insert rows, after the shared Format section: {@link commentBoxRows} and its own. */
  insert?: readonly SlashCommand[]
  /** `/` → Code: a mark inside the line, or a block. */
  code?: CodeFormat
  /** Send what is written, with the files that are ready; resolves with the relay's answer. */
  send: (body: JSONContent, files: BoxFile[]) => Promise<SendAnswer>
  /**
   * The app shows a send before the relay answers: the box empties at once,
   * and a refusal puts the words back. Otherwise the box holds the words, shut,
   * until the answer.
   */
  showsAtOnce?: boolean
  /** The editor's accessible name: what the box is for. */
  label: string
  /** Said in the empty box. */
  placeholder: ReactNode
  /** Keeps what is written when the box goes away. Give the box a React `key` per destination. */
  draft?: CommentBoxDraft
  /** Editing something already sent. */
  edit?: CommentBoxEdit
  /** Offers the paperclip, `/` → File, a pasted picture and a dropped file: uploads one, and answers. */
  upload?: (file: File) => Promise<UploadAnswer>
  /** The file picker's `accept`. */
  accept?: string
  /** The box cannot write here (an archived file, signed out): a line saying why takes its place. */
  closed?: { reason: ReactNode }
  /** How a `nostr:` reference the box holds is drawn — the app's own chip. Absent, as its URI. */
  referenceView?: ComponentType<ReferenceViewProps>
  /** The app's own extra editor extensions: link chips, highlights. */
  extensions?: readonly AnyExtension[]
  autoFocus?: boolean
  /** Called with what was sent once it went out: at once when `showsAtOnce`, else on the answer. */
  onSent?: (body: JSONContent, files: BoxFile[]) => void
  /** Called when a send shown at once was refused, so the app takes it back. */
  onRefused?: () => void
  className?: string
}

const ATTACH_EVENT = 'commentbox:attach'

/** Asks the box around the editor for a file, as the paperclip does. */
const askForFile = (editor: Editor) => editor.view.dom.dispatchEvent(new CustomEvent(ATTACH_EVENT, { bubbles: true }))

/**
 * The `/` Insert rows the kit offers. Pass the ones an app can perform, in
 * its order, with its own after them; an edit drops File and Urgent itself.
 */
export const commentBoxRows: Readonly<Record<'file' | 'mention' | 'urgent' | 'reference', SlashCommand>> = {
  file: { key: 'insert-file', row: { label: 'File' }, keywords: ['attach', 'upload'], run: askForFile },
  mention: { key: 'insert-mention', row: { label: 'Mention', shortcut: '@' }, keywords: ['@', 'Mention a person'], run: typeTrigger('@') },
  urgent: { key: 'insert-urgent', row: { label: 'Urgent', shortcut: '!@' }, keywords: ['!@', 'Urgent mention'], run: typeTrigger('!@') },
  reference: { key: 'insert-reference', row: { label: 'Reference', shortcut: '[' }, keywords: ['[', 'Reference'], run: typeTrigger('[') },
}

/** Ctrl/Cmd+Enter sends as Enter does; Escape cancels an edit (an open list takes Escape first). */
const BoxKeys = Extension.create<{ onEscape: () => boolean }>({
  name: 'commentBoxKeys',
  addOptions() {
    return { onEscape: () => false }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': ({ editor }) => (editor.storage as unknown as { composeKeys?: { send: (() => boolean) | null } }).composeKeys?.send?.() ?? false,
      Escape: () => (isSuggestionActive() ? false : this.options.onEscape()),
    }
  },
})

const SQUARE = <IconSquareRounded size={16} stroke={1.5} className="text-text-secondary" />
const SMALL_SQUARE = <IconSquareRounded size={14} stroke={1.5} />

/** Nothing written: no text and no chip. */
const isEmpty = (editor: Editor) => {
  if (editor.state.doc.textContent.trim().length > 0) return false
  let empty = true
  editor.state.doc.descendants((node) => {
    if (node.isAtom && !node.isText && node.type.name !== 'hardBreak') empty = false
  })
  return empty
}

let fileCount = 0

export function CommentBox({
  people,
  references,
  referencesChanged,
  referenceIcon,
  insert = [],
  code = 'block',
  send,
  showsAtOnce = false,
  label,
  placeholder,
  draft,
  edit,
  upload,
  accept,
  closed,
  referenceView,
  extensions = [],
  autoFocus,
  onSent,
  onRefused,
  className,
}: CommentBoxProps) {
  const [files, setFiles] = useState<BoxFile[]>(edit?.files ?? [])
  const [sending, setSending] = useState(false)
  const [refused, setRefused] = useState<string | null>(null)
  const picker = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)
  // The latest props, for the editor's callbacks, which are made once.
  const latest = useRef({ edit, people, references, upload, draft })
  latest.current = { edit, people, references, upload, draft }
  const save = useRef<() => boolean>(() => false)

  const attachFiles = useCallback((picked: File[]): boolean => {
    const uploadOne = latest.current.upload
    if (!uploadOne || latest.current.edit) return false
    for (const file of picked) {
      fileCount += 1
      const id = `file-${fileCount}`
      setFiles((all) => [...all, { id, name: file.name, size: file.size, contentType: file.type, state: 'uploading' }])
      uploadOne(file).then(
        (answer) =>
          setFiles((all) =>
            all.map((f) => (f.id !== id ? f : answer.accepted ? { ...f, state: 'ready', value: answer.value } : { ...f, state: 'failed', note: answer.reason })),
          ),
        () => setFiles((all) => all.map((f) => (f.id === id ? { ...f, state: 'failed', note: 'It could not be uploaded.' } : f))),
      )
    }
    return true
  }, [])

  // An edit cannot add a file or make a mention urgent, as in every app before the box; no upload, no File.
  const rows = insert.filter((c) => !((edit || !upload) && c.key === commentBoxRows.file.key) && !(edit && c.key === commentBoxRows.urgent.key))

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      KeptSelection,
      ComposeKeys,
      BoxKeys.configure({
        onEscape: () => {
          const editing = latest.current.edit
          if (!editing) return false
          editing.onCancel()
          return true
        },
      }),
      PersonMention.configure({ people: () => latest.current.people }),
      UrgentPersonMention.configure({ people: () => latest.current.people }),
      CaptionedReference.configure({ icon: SMALL_SQUARE, iconFor: referenceIcon }),
      ReferenceTrigger.configure({
        items: () => [],
        sections: (query) => latest.current.references?.(query) ?? [],
        subscribe: referencesChanged,
        ariaLabel: 'References',
        sectionLabel: 'References',
        icon: SQUARE,
        iconFor: referenceIcon,
      }),
      SlashCommands.configure({ sections: [formatSection(code), ...(rows.length > 0 ? [{ label: 'Insert', commands: rows }] : [])] }),
      ReferenceNode.configure({ view: referenceView ?? null }),
      PastedImages.configure({ onImages: attachFiles }),
      ...extensions,
    ],
    content: edit?.body ?? draft?.read(),
    editable: !closed,
    editorProps: { attributes: { class: COMPOSE_EDITOR_CLASSES, role: 'textbox', 'aria-multiline': 'true', 'aria-label': label } },
  })

  // Drafts: every change is kept, and an empty box is no draft.
  useEffect(() => {
    if (!editor || edit) return
    const keep = () => {
      const kept = latest.current.draft
      if (!kept) return
      if (isEmpty(editor)) kept.clear()
      else kept.write(editor.getJSON())
    }
    editor.on('update', keep)
    return () => {
      editor.off('update', keep)
    }
  }, [editor, edit])

  useEffect(() => {
    editor?.setEditable(!closed && !sending)
  }, [editor, closed, sending])

  useEffect(() => {
    if (!editor || !(autoFocus || edit)) return
    const frame = requestAnimationFrame(() => editor.commands.focus('end'))
    return () => cancelAnimationFrame(frame)
    // Once, as the box opens.
  }, [editor])

  // `/` → File asks for a file the way the paperclip does.
  useEffect(() => {
    const box = root.current
    if (!box || !upload || edit) return
    const ask = () => picker.current?.click()
    box.addEventListener(ATTACH_EVENT, ask)
    return () => box.removeEventListener(ATTACH_EVENT, ask)
  }, [upload, edit])

  const uploading = files.some((f) => f.state === 'uploading')
  const ready = files.some((f) => f.state === 'ready')

  const go = useCallback(
    (ed: Editor): boolean => {
      const body = ed.getJSON()
      const sent = files.filter((f) => f.state === 'ready')
      setRefused(null)
      const answered = (answer: Promise<SendAnswer>) => answer.catch((): SendAnswer => ({ accepted: false, reason: 'it could not be sent' }))
      if (showsAtOnce) {
        // Shown at once: the box empties now (ComposeBox clears it); a refusal puts the words back above anything written since.
        setFiles((all) => all.filter((f) => f.state !== 'ready'))
        draft?.clear()
        onSent?.(body, sent)
        void answered(send(body, sent)).then((answer) => {
          if (answer.accepted) return
          onRefused?.()
          if (ed.isDestroyed) {
            // The box went away before the answer: the words wait in its draft.
            draft?.write(body)
            return
          }
          if (isEmpty(ed)) ed.commands.setContent(body)
          else ed.commands.insertContentAt(0, body.content ?? [])
          ed.commands.focus('end')
          setFiles((all) => [...sent, ...all])
          setRefused(answer.reason)
        })
        return true
      }
      // Held: the words stay, shut, until the relay answers.
      setSending(true)
      void answered(send(body, sent)).then((answer) => {
        setSending(false)
        if (!answer.accepted) {
          setRefused(answer.reason)
          return
        }
        if (!ed.isDestroyed) ed.commands.clearContent(true)
        setFiles((all) => all.filter((f) => !sent.includes(f)))
        draft?.clear()
        onSent?.(body, sent)
      })
      return false
    },
    [files, showsAtOnce, send, draft, onSent, onRefused],
  )

  save.current = () => {
    if (!editor || !edit || sending || uploading) return true
    setRefused(null)
    setSending(true)
    void edit
      .onSave(editor.getJSON(), files)
      .catch((): SendAnswer => ({ accepted: false, reason: 'it could not be saved' }))
      .then((answer) => {
        setSending(false)
        if (!answer.accepted) setRefused(answer.reason)
      })
    return true
  }

  // Enter and Ctrl/Cmd+Enter save an edit; the send box wires them through ComposeBox.
  useEffect(() => {
    if (!editor || !edit) return
    const storage = (editor.storage as unknown as { composeKeys?: { send: (() => boolean) | null } }).composeKeys
    if (!storage) return
    storage.send = () => save.current()
    return () => {
      storage.send = null
    }
  }, [editor, edit])

  if (closed) {
    return (
      <Card fill="inset" className={cn('flex items-start gap-3 px-4 py-3', className)}>
        <IconLock size={16} stroke={1.5} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
        <p className="text-body-2 text-text-secondary">{closed.reason}</p>
      </Card>
    )
  }

  const fileCards =
    files.length > 0 ? (
      <>
        {files.map((f) => (
          <AttachmentCard
            key={f.id}
            pending
            name={f.name}
            size={f.size}
            contentType={f.contentType}
            state={f.state}
            note={f.note}
            onRemove={() => setFiles((all) => all.filter((one) => one !== f))}
          />
        ))}
      </>
    ) : undefined

  const refusedLine = refused && (
    <FieldLine tone="error">
      Not {edit ? 'saved' : 'sent'}: {refused}. Your text is back in the box.
    </FieldLine>
  )

  if (edit) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className={cn(WRITING_BOX_CLASSES, 'focus-within:border-border-strong transition-colors', sending && '[&_.ProseMirror]:text-text-muted')}>
          <EditorContent editor={editor} />
          {fileCards && <div className="flex flex-wrap gap-2">{fileCards}</div>}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-caption text-text-muted">
              <Kbd>Esc</Kbd> to cancel · <Kbd>Enter</Kbd> to save
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outlined" size="small" onClick={edit.onCancel}>
                Cancel
              </Button>
              <Button variant="primary" size="small" disabled={uploading || sending} onClick={() => save.current()}>
                Save
              </Button>
            </div>
          </div>
        </div>
        {sending && <FieldLine>Saving…</FieldLine>}
        {refusedLine}
      </div>
    )
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    const dropped = Array.from(event.dataTransfer?.files ?? [])
    if (dropped.length === 0 || !upload) return
    event.preventDefault()
    attachFiles(dropped)
  }

  return (
    <div ref={root} className={cn('flex flex-col gap-1', className)} onDragOver={upload ? (e) => e.preventDefault() : undefined} onDrop={onDrop}>
      <ComposeBox
        editor={editor}
        onSend={go}
        placeholder={placeholder}
        tools={
          upload ? (
            <ToolbarButton tooltip="Attach a file" aria-label="Attach a file" disabled={sending} onClick={() => picker.current?.click()}>
              <IconPaperclip size={16} stroke={1.5} />
            </ToolbarButton>
          ) : undefined
        }
        attachments={fileCards}
        ready={ready}
        holding={uploading || sending}
        selection={{ link: true }}
        className={cn(sending && '[&_[data-composer-editor]]:text-text-muted')}
      />
      {upload && <FilePicker ref={picker} multiple accept={accept} onPick={attachFiles} />}
      {sending && <FieldLine>Sending…</FieldLine>}
      {uploading && !sending && <FieldLine>Uploading… Send waits for the file.</FieldLine>}
      {refusedLine}
    </div>
  )
}
