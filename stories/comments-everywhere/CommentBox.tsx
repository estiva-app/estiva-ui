import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Extension } from '@tiptap/core'
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { IconLock, IconPaperclip, IconSquareRounded } from '@tabler/icons-react'
import { AttachmentCard } from '../../src/AttachmentCard'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { cn } from '../../src/cn'
import { ComposeBox, ComposeKeys, COMPOSE_EDITOR_CLASSES } from '../../src/ComposeBox'
import {
  CaptionedReference,
  PersonMention,
  ReferenceTrigger,
  SlashCommands,
  UrgentPersonMention,
  formatSection,
  type CodeFormat,
  type MentionPerson,
  type ReferenceSection,
  type SlashSection,
} from '../../src/ComposerTriggers'
import { FieldLine } from '../../src/Field'
import { Kbd } from '../../src/Kbd'
import { richTextClassName } from '../../src/RichText'
import { KeptSelection } from '../../src/SelectionToolbar'
import { isSuggestionActive } from '../../src/suggestionPopup'
import { ToolbarButton } from '../../src/Toolbar'
import { WRITING_BOX_CLASSES } from '../../src/looks'

/**
 * The shared comment box, as a prototype: the package's `ComposeBox` with
 * everything each app builds around it today — the four triggers, the keys,
 * drafts, files, the edit mode, sending and a refused send — so an app hands
 * over only its people, its `[` sections, its `/` Insert rows and a send.
 *
 * Nothing here is wired to a relay: `send` is the app's, and the stories fake it.
 */

/** What the relay said about a send. */
export type SendAnswer = { accepted: true } | { accepted: false; reason: string }

/** A file in the box. */
export interface BoxFile {
  id: string
  name: string
  size: number
  contentType: string
  state: 'uploading' | 'ready' | 'failed'
  note?: string
}

/** What the box is told by its app. */
export interface CommentBoxSupply {
  /** Who `@` and `!@` offer. */
  people: MentionPerson[]
  /** What `[` lists, already in the app's order. */
  references: (query: string) => ReferenceSection[]
  /** The app's own `/` Insert rows, after the shared Format section. */
  insert: SlashSection
  /** `/` → Code: a mark inside the line (Peek) or a block (Ship, Leaf). */
  code: CodeFormat
  /** Send what is written; resolves with the relay's answer. */
  send: (body: JSONContent, files: BoxFile[]) => Promise<SendAnswer>
  /**
   * The app shows a send before the relay answers (Peek): the box empties at
   * once, and a refusal puts the words back. Otherwise (Ship, Leaf today) the
   * box holds the words, shut, until the answer.
   */
  showsAtOnce?: boolean
}

/** Where a story opens the box. */
export interface BoxStart {
  /** Already written. */
  body?: JSONContent
  /** A list open: typed after what is written. */
  open?: '@' | '!@' | '[' | '/'
  /** Sent, and the relay has not answered. */
  sending?: boolean
  /** Sent and refused: the words back and the note. */
  refused?: string
  files?: BoxFile[]
}

export interface CommentBoxProps extends CommentBoxSupply {
  placeholder: ReactNode
  /** Keeps what is written when the box goes away, per thread or chat. */
  draftKey?: string
  /** Editing a comment that was sent: Cancel and Save in place of Send. */
  edit?: {
    body: JSONContent
    onCancel: () => void
    onSave: (body: JSONContent) => void
  }
  /** Offer the paperclip. */
  attach?: boolean
  /** The box cannot write here: why, and how it shows. */
  closed?: { reason: ReactNode; look: 'notice' | 'greyed' }
  start?: BoxStart
  autoFocus?: boolean
  /** Called with what was sent once it went out (before the answer, when `showsAtOnce`). */
  onSent?: (body: JSONContent, files: BoxFile[]) => void
  /** Called when a send shown at once was refused, so the app takes it back. */
  onRefused?: () => void
  className?: string
}

/** Drafts, by key: a box that goes away and comes back finds its words. */
const drafts = new Map<string, JSONContent>()

const isEmpty = (body: JSONContent | undefined) => !body?.content?.some((block) => (block.content?.length ?? 0) > 0)

/** Ctrl/Cmd+Enter sends as Enter does; Escape cancels an edit (a list open takes Escape first). */
const BoxKeys = Extension.create<{ onEscape: () => boolean }>({
  name: 'boxKeys',
  addOptions() {
    return { onEscape: () => false }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': ({ editor }) => {
        const storage = (
          editor.storage as unknown as {
            composeKeys?: { send: (() => boolean) | null }
          }
        ).composeKeys
        return storage?.send?.() ?? false
      },
      Escape: () => (isSuggestionActive() ? false : this.options.onEscape()),
    }
  },
})

/** The editor every place's box and card share: the same nodes, so a chip reads the same written and sent. */
export function boxExtensions(supply: Pick<CommentBoxSupply, 'people' | 'references' | 'insert' | 'code'>, onEscape: () => boolean = () => false) {
  return [
    StarterKit.configure({ link: { openOnClick: false } }),
    KeptSelection,
    ComposeKeys,
    BoxKeys.configure({ onEscape }),
    PersonMention.configure({ people: () => supply.people }),
    UrgentPersonMention.configure({ people: () => supply.people }),
    CaptionedReference.configure({
      icon: <IconSquareRounded size={14} stroke={1.5} />,
    }),
    ReferenceTrigger.configure({
      items: () => [],
      sections: supply.references,
      ariaLabel: 'Messages and files',
      sectionLabel: 'Files',
      icon: <IconSquareRounded size={16} stroke={1.5} className="text-text-secondary" />,
    }),
    SlashCommands.configure({
      sections: [formatSection(supply.code), supply.insert],
    }),
  ]
}

/** A body as a card draws it, with the same chips the box writes. */
export function Body({
  body,
  supply,
  size = 'default',
  className,
}: {
  body: JSONContent
  supply: Pick<CommentBoxSupply, 'people' | 'references' | 'insert' | 'code'>
  size?: 'default' | 'small'
  className?: string
}) {
  const editor = useEditor(
    {
      extensions: boxExtensions(supply),
      content: body,
      editable: false,
      editorProps: {
        attributes: { class: richTextClassName(size, 'outline-none') },
      },
    },
    [body],
  )
  return <EditorContent editor={editor} className={className} />
}

let fileCount = 0

/** A file picked from the paperclip: it uploads for a moment, then is ready. */
function pickFile(): BoxFile {
  fileCount += 1
  return {
    id: `file-${fileCount}`,
    name: fileCount % 2 ? 'room-plan.pdf' : 'press-photo.jpg',
    size: 182_000,
    contentType: fileCount % 2 ? 'application/pdf' : 'image/jpeg',
    state: 'uploading',
  }
}

export function CommentBox({
  people,
  references,
  insert,
  code,
  send,
  showsAtOnce = false,
  placeholder,
  draftKey,
  edit,
  attach = false,
  closed,
  start,
  autoFocus,
  onSent,
  onRefused,
  className,
}: CommentBoxProps) {
  // An edit cannot add a file or make a mention urgent, as in Peek and Ship today.
  const rows = edit
    ? {
        ...insert,
        commands: insert.commands.filter((c) => c.key !== 'insert-file' && c.key !== 'insert-!@'),
      }
    : insert
  const supply = { people, references, insert: rows, code }
  const [files, setFiles] = useState<BoxFile[]>(start?.files ?? [])
  const root = useRef<HTMLDivElement>(null)

  // `/` → File asks for a file the way the paperclip does.
  useEffect(() => {
    const box = root.current
    if (!box || !attach) return
    const pick = () => setFiles((all) => [...all, pickFile()])
    box.addEventListener('box:attach', pick)
    return () => box.removeEventListener('box:attach', pick)
  }, [attach])
  const [sending, setSending] = useState(start?.sending ?? false)
  const [refused, setRefused] = useState<string | null>(start?.refused ?? null)
  const escape = useRef<() => boolean>(() => false)
  escape.current = () => {
    if (!edit) return false
    edit.onCancel()
    return true
  }

  const initial = edit?.body ?? start?.body ?? (draftKey ? drafts.get(draftKey) : undefined)
  const editor = useEditor({
    extensions: boxExtensions(supply, () => escape.current()),
    content: initial,
    editable: !closed && !sending,
    editorProps: {
      attributes: {
        class: COMPOSE_EDITOR_CLASSES,
        'aria-label': typeof placeholder === 'string' ? placeholder : 'Write',
      },
    },
  })

  // Drafts: every change is kept under the box's key.
  useEffect(() => {
    if (!editor || !draftKey || edit) return
    const keep = () => {
      const body = editor.getJSON()
      if (isEmpty(body)) drafts.delete(draftKey)
      else drafts.set(draftKey, body)
    }
    editor.on('update', keep)
    return () => {
      editor.off('update', keep)
    }
  }, [editor, draftKey, edit])

  useEffect(() => {
    editor?.setEditable(!closed && !sending)
  }, [editor, closed, sending])

  // A story's open list: focus the end and type the trigger, as a person would.
  useEffect(() => {
    if (!editor) return
    const frame = requestAnimationFrame(() => {
      if (start?.open) {
        const end = editor.state.doc.content.size - 1
        const before = editor.state.doc.textBetween(Math.max(0, end - 1), end)
        editor
          .chain()
          .focus(end)
          .insertContent(before && before !== ' ' ? ` ${start.open}` : start.open)
          .run()
      } else if (autoFocus || edit) {
        editor.commands.focus('end')
      }
    })
    return () => cancelAnimationFrame(frame)
    // Once, as the box opens.
  }, [editor])

  // A picked file uploads for a moment.
  useEffect(() => {
    const uploading = files.filter((f) => f.state === 'uploading' && f.id.startsWith('file-'))
    if (uploading.length === 0) return
    const timer = setTimeout(() => setFiles((all) => all.map((f) => (uploading.includes(f) ? { ...f, state: 'ready' } : f))), 1800)
    return () => clearTimeout(timer)
  }, [files])

  const uploading = files.some((f) => f.state === 'uploading')
  const ready = files.some((f) => f.state === 'ready')

  const go = useCallback(
    (ed: Editor): boolean => {
      const body = ed.getJSON()
      const sent = files.filter((f) => f.state === 'ready')
      setRefused(null)
      if (showsAtOnce) {
        // Shown at once: the box empties now; a refusal puts the words back above anything written since.
        setFiles((all) => all.filter((f) => f.state !== 'ready'))
        if (draftKey) drafts.delete(draftKey)
        onSent?.(body, sent)
        void send(body, sent).then((answer) => {
          if (answer.accepted) return
          ed.chain()
            .insertContentAt(0, body.content ?? [])
            .focus('end')
            .run()
          setFiles((all) => [...sent, ...all])
          setRefused(answer.reason)
          onRefused?.()
        })
        return true
      }
      // Held: the words stay, shut, until the relay answers.
      setSending(true)
      void send(body, sent).then((answer) => {
        setSending(false)
        if (!answer.accepted) {
          setRefused(answer.reason)
          return
        }
        ed.commands.clearContent(true)
        setFiles((all) => all.filter((f) => f.state !== 'ready'))
        if (draftKey) drafts.delete(draftKey)
        onSent?.(body, sent)
      })
      return false
    },
    [files, showsAtOnce, send, draftKey, onSent, onRefused],
  )

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

  const paperclip = attach ? (
    <ToolbarButton tooltip="Attach a file" aria-label="Attach a file" disabled={sending || !!closed} onClick={() => setFiles((all) => [...all, pickFile()])}>
      <IconPaperclip size={16} stroke={1.5} />
    </ToolbarButton>
  ) : undefined

  // Closed, as Peek does it: no box, a line in its place.
  if (closed?.look === 'notice') {
    return (
      <Card fill="inset" className={cn('flex items-start gap-3 px-4 py-3', className)}>
        <IconLock size={16} stroke={1.5} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
        <p className="text-body-2 text-text-secondary">{closed.reason}</p>
      </Card>
    )
  }

  // Editing a sent comment: the same box, with Cancel and Save.
  if (edit) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className={cn(WRITING_BOX_CLASSES, 'focus-within:border-border-strong transition-colors')}>
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
              <Button variant="primary" size="small" disabled={uploading} onClick={() => editor && edit.onSave(editor.getJSON())}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={root} className={cn('flex flex-col gap-1', className)}>
      <ComposeBox
        editor={editor}
        onSend={go}
        placeholder={closed ? <span>{closed.reason}</span> : placeholder}
        tools={paperclip}
        attachments={fileCards}
        ready={ready}
        holding={uploading || sending || !!closed}
        selection={{ link: true }}
        className={cn(closed && 'opacity-60', sending && '[&_[data-composer-editor]]:text-text-muted')}
      />
      {sending && <FieldLine>Sending…</FieldLine>}
      {uploading && !sending && <FieldLine>Uploading… Send waits for the file.</FieldLine>}
      {refused && <FieldLine tone="error">Not sent: {refused}. Your text is back in the box.</FieldLine>}
    </div>
  )
}
