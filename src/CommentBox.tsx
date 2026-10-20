import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type DragEvent, type ReactNode } from 'react'
import { Extension, type AnyExtension, type EditorOptions } from '@tiptap/core'
import { Editor, EditorContent, type JSONContent } from '@tiptap/react'
import { IconLock, IconPaperclip, IconSquareRounded } from '@tabler/icons-react'
import { AttachmentCard } from './AttachmentCard'
import { ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { Button } from './Button'
import { Card } from './Card'
import { CardUnder } from './CardUnder'
import { cn } from './cn'
import { ComposeBox, ComposeKeys, COMPOSE_EDITOR_CLASSES, isEmptyDoc as isEmpty } from './ComposeBox'
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
  type SlashSection,
} from './ComposerTriggers'
import { FieldLine } from './Field'
import { FilePicker } from './FilePicker'
import { Kbd } from './Kbd'
import { BoxKit, PasteOverWords } from './links'
import { WRITING_BOX_CLASSES } from './looks'
import { PastedImages } from './PastedImages'
import { KeptSelection } from './SelectionToolbar'
import { isSuggestionOpen } from './suggestionPopup'
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
  onSave: (body: JSONContent, files: BoxFile[], under: BoxSentUnder) => Promise<SendAnswer>
}

/**
 * What a draft shows under the box, as the app reads it from the box's
 * document — `@estiva-app/conversation`'s `boxReadOf`, which reads it as the
 * message will be sent (why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-link-on-words-counts-toward-the-card.md).
 */
export interface BoxUnderRead {
  /** The one card, before any ✕: what it names, and the app's own view of it, drawn as it draws a sent one. */
  card?: { value: string; view: ReactNode }
  /** The live parts, drawn as the app draws them under a sent message. An edit carries none, so the edit box shows none. */
  parts?: readonly { key: string; view: ReactNode }[]
  /** Everything the draft names. A ✕ is forgotten once what it took off is no longer named, so a link put back gets its card again. */
  names: readonly string[]
}

/** What the box shows under itself while something is written. */
export interface BoxUnder {
  /** Read on every change, and once more as it is sent. */
  read: (body: JSONContent) => BoxUnderRead
  /** Called with a listener; call it when `read` would answer differently (what a link names came back). */
  changed?: (listener: () => void) => () => void
}

/** What was under the box as it was sent or saved. */
export interface BoxSentUnder {
  /** The card still shown, by what it names: absent when there was none, or ✕ took it off. */
  card?: string
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
  /** Send what is written, with the files that are ready and the card still shown; resolves with the relay's answer. */
  send: (body: JSONContent, files: BoxFile[], under: BoxSentUnder) => Promise<SendAnswer>
  /** The card and parts under the box while something is written, with ✕ on the card. Absent, nothing shows under it. */
  under?: BoxUnder
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
  onSent?: (body: JSONContent, files: BoxFile[], under: BoxSentUnder) => void
  /** Called when a send shown at once was refused, so the app takes it back. */
  onRefused?: () => void
  /** The bar down the text's left edge shows while this holds, besides while an urgent mention is in the box: the app's own marks (a highlight). */
  marked?: (editor: Editor) => boolean
  /** Called with the box's editor once it is drawn, and with `null` as it goes: an app's launcher inserts into the box last used. */
  onEditor?: (editor: Editor | null) => void
  className?: string
}

const ATTACH_EVENT = 'commentbox:attach'

/** Asks the box around the editor for a file, as the paperclip does. */
const askForFile = (editor: Editor) => editor.view.dom.dispatchEvent(new CustomEvent(ATTACH_EVENT, { bubbles: true }))

/**
 * The `/` Insert rows the kit offers. Pass the ones an app can perform, in
 * its order, with its own after them; an edit drops Upload and Urgent itself.
 * `file` is the Upload row, named as in a document's `/`.
 */
export const commentBoxRows: Readonly<Record<'file' | 'mention' | 'urgent' | 'reference', SlashCommand>> = {
  file: { key: 'insert-file', row: { label: 'Upload' }, keywords: ['attach', 'file', 'picture'], run: askForFile },
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
      // Open now, with no grace: the first Escape closes a list, the next is a deliberate cancel (suggestionPopup).
      Escape: () => (isSuggestionOpen() ? false : this.options.onEscape()),
    }
  },
})

/** What `removed` still holds of what the draft names; the same set when nothing was forgotten. */
const stillNamed = (removed: ReadonlySet<string>, names: readonly string[]): ReadonlySet<string> =>
  [...removed].every((value) => names.includes(value)) ? removed : new Set([...removed].filter((value) => names.includes(value)))

const SQUARE = <IconSquareRounded size={16} stroke={1.5} className="text-text-secondary" />
const SMALL_SQUARE = <IconSquareRounded size={14} stroke={1.5} />

/** What the box's editor reads as it runs: the box holding it now, swapped in when a box takes a spare. */
interface BoxLive {
  edit?: CommentBoxEdit
  people: readonly MentionPerson[]
  references?: CommentBoxProps['references']
  referencesChanged?: CommentBoxProps['referencesChanged']
  referenceIcon?: CommentBoxProps['referenceIcon']
  /** Takes pasted pictures; false when the box takes no files. */
  attach: (files: File[]) => boolean
}

/** One editor's link to the box holding it: the live props, and the `/` sections the box refills every render. */
interface BoxHold {
  current: BoxLive
  sections: SlashSection[]
}

/** What an app adds to every box's editor: a spare is built only for these. */
interface BoxApp {
  extensions: readonly AnyExtension[]
  referenceView: ComponentType<ReferenceViewProps> | null
}

const NO_EXTENSIONS: readonly AnyExtension[] = []
const sameApp = (a: BoxApp, b: BoxApp) =>
  a.referenceView === b.referenceView && a.extensions.length === b.extensions.length && a.extensions.every((one, i) => one === b.extensions[i])

function boxExtensions(hold: BoxHold, app: BoxApp): AnyExtension[] {
  const iconFor = (uri: string | null) => hold.current.referenceIcon?.(uri)
  return [
    BoxKit.configure({ link: { openOnClick: false } }),
    PasteOverWords,
    KeptSelection,
    ComposeKeys,
    BoxKeys.configure({
      onEscape: () => {
        const editing = hold.current.edit
        if (!editing) return false
        editing.onCancel()
        return true
      },
    }),
    PersonMention.configure({ people: () => hold.current.people }),
    // An edit makes nobody urgent (CON-24): `!@` opens no list there, as `/` offers no Urgent.
    UrgentPersonMention.extend({
      addOptions() {
        const parent = this.parent!()
        return { ...parent, suggestion: { ...parent.suggestion, allow: () => !hold.current.edit } }
      },
    }).configure({ people: () => hold.current.people }),
    CaptionedReference.configure({ icon: SMALL_SQUARE, iconFor }),
    ReferenceTrigger.configure({
      items: () => [],
      sections: (query) => hold.current.references?.(query) ?? [],
      subscribe: (listener) => hold.current.referencesChanged?.(listener) ?? (() => {}),
      ariaLabel: 'References',
      sectionLabel: 'References',
      icon: SQUARE,
      iconFor,
    }),
    SlashCommands.configure({ sections: hold.sections }),
    ReferenceNode.configure({ view: app.referenceView }),
    PastedImages.configure({ onImages: (files: File[]) => hold.current.attach(files) }),
    ...app.extensions,
  ]
}

interface Held {
  editor: Editor
  hold: BoxHold
  destroyAt?: ReturnType<typeof setTimeout>
}

function buildBox(app: BoxApp, options: Partial<EditorOptions>): Held {
  const hold: BoxHold = { current: { people: [], attach: () => false }, sections: [] }
  return { editor: new Editor({ ...options, extensions: boxExtensions(hold, app) }), hold }
}

/*
  A box's editor, built ahead, as Peek's composer has been since 4ef41d41:
  building one (schema, commands, view) is the longest single step in drawing
  a box. One is built while the page is idle for the app `keepCommentBoxWarm`
  names, and the next empty box with those extensions takes it and builds the
  next; any other box builds its own on the spot.
*/
let warmApp: BoxApp | null = null
let spare: Held | null = null
let sparing = false

function scheduleSpare() {
  if (!warmApp || spare || sparing || typeof window === 'undefined' || !window.requestIdleCallback) return
  sparing = true
  window.requestIdleCallback(() => {
    sparing = false
    // No autofocus: it would fire on the detached spare. The box that takes it focuses it.
    if (warmApp && !spare) spare = buildBox(warmApp, { autofocus: false })
  })
}

/** Keeps an editor built ahead for the next empty box given these `extensions` and `referenceView`, so it opens at once. */
export function keepCommentBoxWarm(app: { extensions?: readonly AnyExtension[]; referenceView?: ComponentType<ReferenceViewProps> } = {}): void {
  const next = { extensions: app.extensions ?? NO_EXTENSIONS, referenceView: app.referenceView ?? null }
  if (warmApp && sameApp(warmApp, next)) return
  warmApp = next
  spare?.editor.destroy()
  spare = null
  scheduleSpare()
}

/** `useEditor` with no deps, taking a spare when one fits: built once, given the latest `editorProps`, destroyed when the box goes. */
function useBoxEditor(app: BoxApp, content: JSONContent | undefined, options: Pick<EditorOptions, 'editable' | 'editorProps'>): Held {
  const [held] = useState(() => {
    const fits = !content && spare && !spare.editor.isDestroyed && warmApp && sameApp(warmApp, app)
    const taken = fits ? spare : null
    if (taken) {
      spare = null
      taken.editor.setOptions(options)
    }
    const one = taken ?? buildBox(app, { ...options, content })
    // A render thrown away never mounts: what it built goes with it. Later than React lets a transition run (5 s).
    one.destroyAt = setTimeout(() => one.editor.destroy(), 10_000)
    scheduleSpare()
    return one
  })
  // Mounted, it is this box's until it unmounts — and not remounted at once, as in StrictMode.
  useLayoutEffect(() => {
    clearTimeout(held.destroyAt)
    return () => {
      held.destroyAt = setTimeout(() => held.editor.destroy(), 1)
    }
  }, [held])
  // The attributes are what changes after it is built: the label.
  const props = useRef(options.editorProps)
  props.current = options.editorProps
  const attributes = JSON.stringify(options.editorProps.attributes ?? {})
  useEffect(() => {
    if (!held.editor.isDestroyed) held.editor.setOptions({ editorProps: props.current })
  }, [held, attributes])
  return held
}

/** Whether the document holds an urgent mention: the box draws its bar while one is in it. */
const holdsUrgent = (editor: Editor): boolean => {
  let found = false
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'urgentMention') found = true
    return !found
  })
  return found
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
  under,
  showsAtOnce = false,
  label,
  placeholder,
  draft,
  edit,
  upload,
  accept,
  closed,
  referenceView,
  extensions = NO_EXTENSIONS,
  autoFocus,
  onSent,
  onRefused,
  marked,
  onEditor,
  className,
}: CommentBoxProps) {
  const [files, setFiles] = useState<BoxFile[]>(edit?.files ?? [])
  const [sending, setSending] = useState(false)
  const [refused, setRefused] = useState<string | null>(null)
  // What shows under the box, and what ✕ took off.
  const [reading, setReading] = useState<BoxUnderRead | undefined>(undefined)
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set())
  const picker = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)
  // The latest props, for callbacks made once.
  const latest = useRef({ edit, upload, draft, under })
  latest.current = { edit, upload, draft, under }
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
  const { editor, hold } = useBoxEditor({ extensions, referenceView: referenceView ?? null }, edit?.body ?? draft?.read(), {
    editable: !closed,
    editorProps: { attributes: { class: COMPOSE_EDITOR_CLASSES, role: 'textbox', 'aria-multiline': 'true', 'aria-label': label } },
  })
  // The editor's callbacks are made once, with the editor: they read this box's latest props through its hold.
  hold.current = { edit, people, references, referencesChanged, referenceIcon, attach: attachFiles }
  // `/` reads its sections each time it opens, from this one array: refilled every render, so a row that
  // comes or goes with `upload`, `insert` or `code` after the box opened is offered as it is now.
  hold.sections.splice(0, hold.sections.length, formatSection(code), ...(rows.length > 0 ? [{ label: 'Insert', commands: rows }] : []))

  // The bar down the text's left edge, while an urgent mention or the app's own mark is in the box.
  const [marking, setMarking] = useState(false)
  const markedBy = useRef(marked)
  markedBy.current = marked
  useEffect(() => {
    const read = () => setMarking(holdsUrgent(editor) || !!markedBy.current?.(editor))
    read()
    editor.on('update', read)
    return () => {
      editor.off('update', read)
    }
  }, [editor])

  const handOut = useRef(onEditor)
  handOut.current = onEditor
  useEffect(() => {
    handOut.current?.(editor)
    return () => handOut.current?.(null)
  }, [editor])

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

  // What shows under the box, read on every change and whenever the app's answers change.
  const reads = !!under
  useEffect(() => {
    if (!editor || !reads) {
      setReading(undefined)
      return
    }
    const read = () => {
      const now = latest.current.under?.read(editor.getJSON())
      setReading(now)
      setRemoved((was) => stillNamed(was, now?.names ?? []))
    }
    read()
    editor.on('update', read)
    const unsubscribe = latest.current.under?.changed?.(read)
    return () => {
      editor.off('update', read)
      unsubscribe?.()
    }
  }, [editor, reads])

  // What goes with a send or a save: read from what is sent, minus what ✕ took off.
  const underOf = useCallback(
    (body: JSONContent): BoxSentUnder => {
      const card = latest.current.under?.read(body).card?.value
      return card && !removed.has(card) ? { card } : {}
    },
    [removed],
  )

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
  // A file that did not upload holds Send until its ✕ takes it off, so it is never sent without it unnoticed.
  const failed = files.filter((f) => f.state === 'failed').length
  const ready = files.some((f) => f.state === 'ready')

  const go = useCallback(
    (ed: Editor): boolean => {
      const body = ed.getJSON()
      const sent = files.filter((f) => f.state === 'ready')
      const sentUnder = underOf(body)
      setRefused(null)
      const answered = (answer: Promise<SendAnswer>) => answer.catch((): SendAnswer => ({ accepted: false, reason: 'try again in a moment' }))
      if (showsAtOnce) {
        // Shown at once: the box empties now (ComposeBox clears it); a refusal puts the words back above anything written since,
        // and what ✕ took off with them.
        const took = removed
        setFiles((all) => all.filter((f) => f.state !== 'ready'))
        draft?.clear()
        onSent?.(body, sent, sentUnder)
        void answered(send(body, sent, sentUnder)).then((answer) => {
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
          setRemoved((now) => new Set([...now, ...took]))
          setFiles((all) => [...sent, ...all])
          setRefused(answer.reason)
        })
        return true
      }
      // Held: the words stay, shut, until the relay answers.
      setSending(true)
      void answered(send(body, sent, sentUnder)).then((answer) => {
        setSending(false)
        if (!answer.accepted) {
          setRefused(answer.reason)
          return
        }
        if (!ed.isDestroyed) ed.commands.clearContent(true)
        setRemoved(new Set())
        setFiles((all) => all.filter((f) => !sent.includes(f)))
        draft?.clear()
        onSent?.(body, sent, sentUnder)
      })
      return false
    },
    [files, removed, underOf, showsAtOnce, send, draft, onSent, onRefused],
  )

  save.current = () => {
    if (!editor || !edit || sending || uploading) return true
    setRefused(null)
    setSending(true)
    const body = editor.getJSON()
    void edit
      .onSave(body, files, underOf(body))
      .catch((): SendAnswer => ({ accepted: false, reason: 'try again in a moment' }))
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

  // Under the box, outside its border: the card with its ✕, then the live parts (none in an edit, which carries none).
  const card = reading?.card && !removed.has(reading.card.value) ? reading.card : undefined
  const parts = edit ? [] : (reading?.parts ?? [])
  const underBox =
    card || parts.length > 0 ? (
      <div data-box-under className="mt-1 flex flex-col gap-2">
        {card && <CardUnder onRemove={() => setRemoved((was) => new Set([...was, card.value]))}>{card.view}</CardUnder>}
        {parts.map((part) => (
          <Fragment key={part.key}>{part.view}</Fragment>
        ))}
      </div>
    ) : undefined

  const refusedLine = refused && (
    <FieldLine tone="error">
      {edit ? `Not saved: ${refused}. Your changes are still in the box.` : `Not sent: ${refused}. Your text is back in the box.`}
    </FieldLine>
  )

  if (edit) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className={cn(WRITING_BOX_CLASSES, 'focus-within:border-border-strong transition-colors', sending && '[&_.ProseMirror]:text-text-muted')}>
          <div data-composer-editor data-marked={marking || undefined} className={cn('relative min-h-[20px]', marking && 'border-l-4 border-border-strong pl-2')}>
            <EditorContent editor={editor} />
          </div>
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
        {underBox}
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
        marked={marking}
        holding={uploading || failed > 0 || sending}
        selection={{ link: true }}
        className={cn(sending && '[&_[data-composer-editor]]:text-text-muted')}
      />
      {underBox}
      {upload && <FilePicker ref={picker} multiple accept={accept} onPick={attachFiles} />}
      {sending && <FieldLine>Sending…</FieldLine>}
      {uploading && !sending && <FieldLine>Uploading… Send waits for the file.</FieldLine>}
      {failed > 0 && !uploading && !sending && (
        <FieldLine>{failed === 1 ? 'Remove the file that did not upload to send.' : 'Remove the files that did not upload to send.'}</FieldLine>
      )}
      {refusedLine}
    </div>
  )
}
