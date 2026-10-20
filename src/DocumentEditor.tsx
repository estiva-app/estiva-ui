import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { AnyExtension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react'
import { TableKit } from '@tiptap/extension-table'
import { IconMessagePlus } from '@tabler/icons-react'
import type { HandleBlock } from './BlockHandle'
import { AttachmentNode, BlockId, Callout, Checklist, ReferenceNode, UnknownBlock, isChecklistTick, type AttachmentViewProps, type ReferenceViewProps } from './BlockNodes'
import { Button } from './Button'
import { CodeBlockColours } from './CodeBlockColours'
import { CommentHighlights, anchorOfSelection, type SelectionAnchor } from './CommentHighlights'
import { PersonReference, ReferenceTrigger, SlashCommands, formatSection, typeTrigger, type MentionPerson, type ReferenceSection, type SlashCommand, type SlashSection } from './ComposerTriggers'
import { EditorBlockHandle, blockDropCursor } from './EditorBlockHandle'
import { EditorTableControls } from './EditorTableControls'
import { FieldLine } from './Field'
import { FilePicker } from './FilePicker'
import { LinkChips, type LinkChipsOptions } from './LinkChips'
import { BareLinks, DocumentKit, LINK_MARK_ATTRIBUTES, PasteOverWords } from './links'
import { PastedImages } from './PastedImages'
import { PastedMarkdown } from './PastedMarkdown'
import { ReferenceCards } from './ReferenceCards'
import { ReferenceMenu, ReferenceMenuView, isReferenceMenuOpen } from './ReferenceMenu'
import { richTextClassName } from './RichText'
import { KeptSelection, SelectionToolbar } from './SelectionToolbar'
import { isSuggestionOpen } from './suggestionPopup'

/**
 * How the app's saved text and the editor's document turn into each other. The
 * package speaks only the editor's document; the translation is
 * `@estiva-app/protocol`'s, which the package does not depend on (the record
 * below):
 *
 *     { read: (value, format) => toEditorDocument(documentForEditing(value, format), { links: true }),
 *       write: (doc) => publishableFromEditor(doc) }
 */
export interface DocumentCodec {
  /** The saved text, in its format, as the editor's document. */
  read: (value: string, format: string) => JSONContent
  /** The editor's document as the text to save, and the format it is in. */
  write: (doc: JSONContent) => { value: string; contentFormat?: string }
}

/**
 * Where text typed when the sign-in ends is kept through the passkey trip, and
 * put back, unsaved, after it. The app's own store, by key.
 */
export interface HeldTyping {
  /** What is held for `key` from the last ending, or `undefined`. */
  text: (key: string) => string | undefined
  /** Forget what is held for `key`: it was saved. */
  release: (key: string) => void
  /** While the editor is open, let an ending read its unsaved text. Returns what stops that, as the editor closes. */
  register: (key: string, read: () => string | undefined) => () => void
  /** Whether the sign-in has ended: nothing is saved then, and the text is held instead. */
  ended: () => boolean
}

/** What `[` lists, and how. Without it `[` is a bracket. */
export interface DocumentReferences {
  /** The sections for what was typed after `[`, already narrowed and in the app's order. */
  sections: (query: string) => readonly ReferenceSection[]
  /** Called with a listener while the list is open; call it when `sections` would answer differently (a search landed). */
  subscribe?: (listener: () => void) => () => void
  /** Names the list. */
  ariaLabel: string
  /** The heading of rows that bring no section of their own. */
  sectionLabel: string
  /** A row's 16px icon, unless the row brings its own. Default none. */
  icon?: ReactNode
}

/** Whom `@` offers. Without it `@` is an at sign. */
export interface DocumentMentions {
  /** Everyone `@` can offer, asked as the query changes. */
  people: () => readonly MentionPerson[]
  /** The `nostr:npub…` a person is written as; `null` for someone without one, who is not offered. */
  uriOf: (person: MentionPerson) => string | null
}

export interface DocumentEditorProps {
  /** The saved text. A new value while the editor is open is somebody else's save, or your own coming back. */
  value: string
  /** The format `value` is in, handed to `codec.read`. */
  format: string
  codec: DocumentCodec
  /**
   * Save. Called when you leave, never while typing, with the text, its format,
   * and the saved text this edit started from — so the app can tell whom the
   * save names anew. Answer whether it was saved.
   */
  onCommit: (value: string, contentFormat: string | undefined, editedFrom: string) => Promise<boolean> | boolean
  /** The editor's accessible name. */
  label: string
  /** Muted words over an empty editor. */
  placeholder?: ReactNode
  /** For reading: nothing is typed or saved; chips open, and comments on a selection work when on. */
  readOnly?: boolean
  /** Who saved the text last, when it was not you: named in "… saved a newer version". */
  changedBy?: { name: string } | null
  /** A save refused after the editor closed, with nothing left on screen to say it. */
  onLeftUnsaved?: () => void
  /** Where text typed when the sign-in ends is held, under `holdKey`. */
  hold?: HeldTyping
  holdKey?: string
  /** `[` and `/` → *Link to a file*. */
  references?: DocumentReferences
  /** `@`. */
  mentions?: DocumentMentions
  /** A pasted app URL drawn as the chip of what it names (`LinkChips`). */
  linkChips?: LinkChipsOptions
  /** `/` → File, and a pasted picture: upload one file and answer the attachment's attributes (its `imeta` fields). */
  upload?: (file: File) => Promise<Record<string, unknown>>
  /** Plain text pasted as the blocks it spells: the app's reader of markdown, as the editor's document. */
  readMarkdown?: (text: string) => JSONContent | undefined
  /** `/` → Table. Default on. */
  table?: boolean
  /** Comment on what is selected: the selection strip's Comment, and the comment highlights. Without it, neither. */
  onCommentOnSelection?: (anchor: SelectionAnchor) => void
  /** The app's rows in a block's handle menu, after the editing ones: Copy link, Comment. */
  blockRows?: (block: HandleBlock) => ReactNode
  /** Draws a chip: the app's own, which resolves what it names. */
  referenceView?: ComponentType<ReferenceViewProps>
  /** Draws a placed file: the app's own card. */
  attachmentView?: ComponentType<AttachmentViewProps>
  /** Drawn after the text: the cards chips ask for, as the app draws them. */
  cards?: (editor: Editor | null) => ReactNode
  /** Around everything the editor draws: the app's providers, which may read the editor. */
  wrap?: (children: ReactNode, editor: Editor | null) => ReactNode
  /** The editor, once it is there, and `null` as it goes. */
  onEditor?: (editor: Editor | null) => void
  /** More of the app's own extensions. */
  extensions?: readonly AnyExtension[]
}

/** The editor's own document held for this place when the sign-in ended, block ids and all; `null` when none. */
function heldDocument(hold: HeldTyping | undefined, key: string | undefined): JSONContent | null {
  const text = hold && key ? hold.text(key) : undefined
  if (!text) return null
  try {
    const doc = JSON.parse(text) as JSONContent
    return doc?.type === 'doc' ? doc : null
  } catch {
    return null
  }
}

/**
 * One document's text as one surface that is always an editor — Leaf's page,
 * Ship's description and Peek's panel, which each had their own until this.
 * Every app's document can do the same things, wherever it is written.
 *
 * - **Saves when you leave:** on blur, on unmount and on a checklist tick.
 *   Never while typing. Escape leaves and keeps the text. A refused save keeps
 *   the text and says so; one refused after the editor closed goes to
 *   `onLeftUnsaved`.
 * - **Someone else's save arrives** while you are not in it: it is loaded.
 *   While you are in it, it waits, and a line says who saved a newer version,
 *   with "Load it"; leaving with a change saves yours over it — the later save
 *   wins (Miky, LEAF-3's kickoff and 13 October). Your own save coming back is
 *   never mistaken for someone else's.
 * - **The sign-in ending** holds what was typed (`hold`), and the editor opens
 *   with it, unsaved, after the passkey tap.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/every-app-edits-a-document-with-one-shared-editor.md
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/the-block-editor-kit-lives-in-protocol-and-ui.md
 */
export function DocumentEditor({
  value,
  format,
  codec,
  onCommit,
  label,
  placeholder,
  readOnly = false,
  changedBy = null,
  onLeftUnsaved,
  hold,
  holdKey,
  references,
  mentions,
  linkChips,
  upload,
  readMarkdown,
  table = true,
  onCommentOnSelection,
  blockRows,
  referenceView,
  attachmentView,
  cards,
  wrap,
  onEditor,
  extensions = [],
}: DocumentEditorProps) {
  const [failed, setFailed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // The latest props, for the editor's callbacks, which are made once.
  const latest = useRef({ value, format, codec, hold, references, mentions, upload, readMarkdown, onLeftUnsaved })
  useEffect(() => {
    latest.current = { value, format, codec, hold, references, mentions, upload, readMarkdown, onLeftUnsaved }
  })
  const ended = () => latest.current.hold?.ended() ?? false
  /*
    The text the editor holds as saved or loaded. A value that differs is
    someone else's save: loaded at once while you are not in it, waiting with a
    line while you are. `saved` is the same, for the editor's callbacks.
  */
  const [base, setBase] = useState(value)
  const saved = useRef(value)
  // The value your own save replaced: until your save comes back, the value still holds it, and it is not someone else's.
  const [superseded, setSuperseded] = useState<string | null>(null)
  // Every text your own saves wrote since someone else's last loaded: an echo of an earlier one can arrive after a later save.
  const own = useRef(new Set<string>())
  // A save out: nothing is loaded over the text it carries until it is answered.
  const [saving, setSaving] = useState(false)
  const committing = useRef(false)
  // What was typed here when the sign-in last ended, back after the passkey tap and not yet saved.
  // Not when it is what the value already holds (a save out as the sign-in ended went through), or nothing would
  // ever take later changes: only a save clears `restored`, and a save of what is saved sends nothing.
  const [held] = useState(() => {
    const doc = heldDocument(hold, holdKey)
    // A held document the codec cannot write (another version's, or cut short) is not text anyone can keep.
    try {
      return doc && codec.write(doc).value !== value ? doc : null
    } catch {
      return null
    }
  })
  // Until it is saved it is your unsaved text: someone else's save waits behind it, as behind a refused one.
  const [restored, setRestored] = useState(held !== null)
  // The text as last typed. Saving on the way out reads this, not the editor, which may already be torn down.
  const typed = useRef<JSONContent | null>(held)
  const again = useRef(false)
  const left = useRef(false)
  /*
    True from the moment the file dialog is asked for until the window has focus
    again: the dialog takes focus, and that blur must not save and leave.
  */
  const picking = useRef(false)
  const picker = useRef<HTMLInputElement>(null)

  const save = useCallback(
    async (doc: JSONContent | null) => {
      // Read only: a box ticked in a node view is not a save. After an ending the text is held, and a save would be refused.
      if (!doc || readOnly || ended()) return
      // A change made while a save is out goes next, not nowhere.
      if (committing.current) {
        again.current = true
        return
      }
      const next = latest.current.codec.write(doc)
      if (next.value === saved.current) return
      committing.current = true
      setSaving(true)
      // The later save wins: whatever the value holds as you save is replaced by yours.
      const replaced = latest.current.value
      const editedFrom = saved.current
      try {
        const ok = await onCommit(next.value, next.contentFormat, editedFrom)
        if (ok) {
          // The editor already shows it, and may hold more typed since: `shown` keeps the effect below from setting it.
          saved.current = next.value
          shown.current = next.value
          own.current.add(next.value)
          setSuperseded(replaced)
          setBase(next.value)
          setRestored(false)
          // A save out as the sign-in ended: what was held then may hold more than this, typed since.
          const store = latest.current.hold
          if (store && holdKey && !store.ended()) store.release(holdKey)
        }
        if (left.current) {
          // Refused because the sign-in ended: the text is held for after the tap, not lost.
          if (!ok && !ended()) latest.current.onLeftUnsaved?.()
        } else setFailed(!ok)
      } catch {
        // A save that throws is a refusal: the text stays, and says so.
        if (left.current) {
          if (!ended()) latest.current.onLeftUnsaved?.()
        } else setFailed(true)
      } finally {
        committing.current = false
        setSaving(false)
        if (again.current) {
          again.current = false
          // After an ending it is held for after the tap, and a save would only be refused.
          if (!ended()) void latestSave.current(typed.current)
        }
      }
    },
    [onCommit, holdKey, readOnly],
  )

  // While open, an ending reads the unsaved text. Keyed on the key and on there being a store, not on the store object:
  // a new `hold` each render must not unregister, since the app's unregister forgets what was held unless an ending is under way.
  const holds = !!hold
  useEffect(() => {
    const store = latest.current.hold
    if (!holds || !store || !holdKey) return
    return store.register(holdKey, () => {
      const doc = typed.current
      return doc && latest.current.codec.write(doc).value !== saved.current ? JSON.stringify(doc) : undefined
    })
  }, [holdKey, holds])

  // The latest `save`, for the editor's `onBlur` (made once) and the unmount below.
  const latestSave = useRef(save)
  useEffect(() => {
    latestSave.current = save
  }, [save])
  // The text the editor was last set to, so a `base` it already shows is not set again under the caret.
  const shown = useRef(value)

  const openPicker = () => {
    picking.current = true
    const released = () => {
      picking.current = false
      window.removeEventListener('focus', released)
    }
    window.addEventListener('focus', released)
    picker.current?.click()
  }
  const pickFile = useRef(openPicker)
  pickFile.current = openPicker

  /* `/` File and a pasted picture: the upload first, then the block — its attributes are the upload's answer. */
  const attach = async (chosen: File[]) => {
    const uploadOne = latest.current.upload
    if (!uploadOne) return
    setUploadError(null)
    try {
      for (const file of chosen) {
        const attrs = await uploadOne(file)
        if (!editor || editor.isDestroyed) return
        editor.chain().focus().insertContent({ type: 'attachment', attrs }).run()
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : String(error))
    }
  }
  const attachTo = useRef(attach)
  attachTo.current = attach

  const editor = useEditor(
    {
      extensions: [
        DocumentKit.configure({
          strike: false,
          heading: { levels: [1, 2, 3] },
          dropcursor: blockDropCursor,
          codeBlock: false,
          // A link on words is made by pasting a URL over them or by the strip's Link, and opens on a click, as a bare
          // address does — through `BareLinks`, which opens only a followable address and never hands the tab this window;
          // Tiptap's own click opens without that. A bare address stays text: a link made on it by typing would change what is saved.
          link: { openOnClick: false, shouldAutoLink: () => false, HTMLAttributes: LINK_MARK_ATTRIBUTES },
        }),
        PasteOverWords,
        KeptSelection,
        BareLinks,
        CodeBlockColours,
        TableKit.configure({ table: { resizable: false } }),
        BlockId,
        Checklist,
        Callout,
        ReferenceNode.configure({ view: referenceView ?? null }),
        // The card a chip asks for, after its line (SPEC §13.3); drawn by the app's `cards`.
        ReferenceCards,
        // A click on a chip offers Open and its card.
        ReferenceMenu,
        UnknownBlock,
        AttachmentNode.configure({ view: attachmentView ?? null }),
        SlashCommands.configure({ sections: slashSections({ table, file: !!upload, link: !!references, pickFile }) }),
        ...(references
          ? [
              ReferenceTrigger.configure({
                items: () => [],
                sections: (query) => latest.current.references?.sections(query) ?? [],
                subscribe: (listener) => latest.current.references?.subscribe?.(listener) ?? (() => {}),
                nodeName: 'reference',
                ariaLabel: references.ariaLabel,
                sectionLabel: references.sectionLabel,
                icon: references.icon ?? null,
              }),
            ]
          : []),
        ...(mentions
          ? [PersonReference.configure({ people: () => latest.current.mentions?.people() ?? [], uriOf: (person) => latest.current.mentions?.uriOf(person) ?? null })]
          : []),
        ...(linkChips ? [LinkChips.configure(linkChips)] : []),
        ...(upload
          ? [
              // A pasted picture is placed as `/` File places one; text on the clipboard stays text.
              PastedImages.configure({
                onImages: (pasted) => {
                  if (!latest.current.upload) return false
                  void attachTo.current(pasted)
                  return true
                },
              }),
            ]
          : []),
        // Markdown pasted as plain text lands as the blocks it spells, tables included.
        ...(readMarkdown ? [PastedMarkdown.configure({ read: (text) => latest.current.readMarkdown?.(text) })] : []),
        // Where each comment is, drawn as a decoration, so a save never carries it.
        ...(onCommentOnSelection ? [CommentHighlights] : []),
        ...extensions,
      ],
      // Made once. A value coming back must not rebuild the editor under the caret; see the effect below.
      content: held ?? codec.read(value, format),
      editable: !readOnly,
      editorProps: {
        // Focusable when read only too: the selection strip, and so Comment on its words, shows only in a focused view.
        attributes: { 'aria-label': label, role: 'textbox', 'aria-multiline': 'true', tabindex: '0', class: richTextClassName('default', 'outline-none') },
        handleKeyDown: (view, event) => {
          if (event.key !== 'Escape') return false
          // An open list or chip menu closes first; the next Escape leaves.
          if (isSuggestionOpen() || isReferenceMenuOpen(view.state)) return false
          const { selection, tr } = view.state
          // Words selected: the first Escape lets go of them, which also closes the strip.
          if (!selection.empty) {
            view.dispatch(tr.setSelection(TextSelection.create(tr.doc, selection.to)))
            return true
          }
          view.dom.blur()
          return true
        },
      },
      onUpdate: ({ editor: e, transaction }) => {
        typed.current = e.getJSON()
        // A click on a box does not focus the field, so no blur will save it.
        if (isChecklistTick(transaction)) void latestSave.current(typed.current)
      },
      onFocus: () => setFocused(true),
      onBlur: () => {
        setFocused(false)
        // The file dialog took focus: the person has not left.
        if (picking.current) return
        // Yours, if you changed anything: it replaces what waited. If not, what waited is loaded as you leave (below).
        void latestSave.current(typed.current)
      },
    },
    [],
  )

  /*
    Someone else's save. Not in the editor: theirs is the text now. In it, or
    with your own text unsaved after a refusal or an ending: it waits, and the
    line below says so. Never over a save that is still out.
  */
  const arrived = value !== base && value !== superseded && !own.current.has(value)
  // Read only, there is nothing of yours to keep: theirs loads even while you select words to comment on.
  if (arrived && (readOnly || (!focused && !saving && !failed && !restored))) {
    own.current.clear()
    setBase(value)
  }
  const waiting = arrived && !readOnly && (focused || failed || restored)

  // The text the editor should hold, set into it when it changes — never under your own typing, which `shown` already holds.
  useEffect(() => {
    saved.current = base
    if (!editor || editor.isDestroyed || base === shown.current) return
    editor.commands.setContent(latest.current.codec.read(base, latest.current.format), { emitUpdate: false })
    shown.current = base
    typed.current = null
  }, [editor, base])

  // Made read only or editable while open: the editor follows, without being made again.
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable === readOnly) editor.setEditable(!readOnly, false)
  }, [editor, readOnly])

  const empty = useEditorState({ editor, selector: ({ editor: ed }) => !ed || ed.isEmpty })

  // "Load it": theirs replaces what you have not saved.
  const load = () => {
    setBase(latest.current.value)
    setFailed(false)
    setRestored(false)
  }

  // Closing saves on the way out. Not when the sign-in ended: the save would be refused and reported as lost over
  // the passkey screen, and the text is held on the device instead.
  useEffect(
    () => () => {
      left.current = true
      if (!ended()) void latestSave.current(typed.current)
    },
    [],
  )

  useEffect(() => {
    onEditor?.(editor)
    return () => onEditor?.(null)
  }, [editor, onEditor])

  const who = changedBy?.name ?? 'Someone'
  const drawn = (
    <div className="flex flex-col gap-1">
      <EditorBlockHandle editor={editor} actions={blockRows}>
        {/* A table's handles and ➕ bars while you point at it; the block handle stays the table's. */}
        <EditorTableControls editor={editor}>
          <EditorContent editor={editor} className="-mx-2 cursor-text px-2 py-1" data-document-editor="" />
        </EditorTableControls>
        {empty && !readOnly && placeholder && (
          <span aria-hidden className="pointer-events-none absolute left-0 top-1 text-body-2 text-text-muted">
            {placeholder}
          </span>
        )}
      </EditorBlockHandle>
      {cards?.(editor)}
      {/* Read only with comments off, the strip would have nothing in it: no strip. */}
      {(!readOnly || onCommentOnSelection) && <SelectionToolbar
        editor={editor}
        marks={readOnly ? [] : ['bold', 'italic', 'underline', 'code']}
        link={!readOnly}
        actions={
          onCommentOnSelection
            ? [
                {
                  label: 'Comment',
                  icon: <IconMessagePlus size={16} stroke={1.5} />,
                  run: (ed) => {
                    const anchor = anchorOfSelection(ed)
                    if (!anchor) return
                    // The draft's highlight keeps what is selected marked; the selection itself can go.
                    ed.commands.setTextSelection(ed.state.selection.to)
                    onCommentOnSelection(anchor)
                  },
                },
              ]
            : []
        }
      />}
      <ReferenceMenuView editor={editor} />
      {/* Always there, so `/` → File, made as the editor opened, has a dialog to open even if `upload` came and went. */}
      <FilePicker ref={picker} multiple onPick={(files) => void attach(files)} />
      {waiting && (
        <FieldLine tone="helper">
          {`${who} saved a newer version.`}{' '}
          {/* Pressing it must not take focus from the editor: that blur would save yours over theirs first. */}
          <Button variant="muted" size="small" onMouseDown={(event) => event.preventDefault()} onClick={load}>
            Load it
          </Button>{' '}
          {/* What Load it costs, said where it is pressed (Miky, WBD-3's /land, 20 October). */}
          (replaces your changes)
        </FieldLine>
      )}
      {uploadError && <FieldLine tone="error">{uploadError}</FieldLine>}
      {failed && <FieldLine tone="error">Could not save. Your text is still here.</FieldLine>}
    </div>
  )
  return <>{wrap ? wrap(drawn, editor) : drawn}</>
}

/**
 * `/`: the shared Format section with a document's checklist and callouts,
 * then Insert with what this editor can do. *Link to a file* types `[`, so its
 * list opens (Miky's QA note, 15 October).
 */
function slashSections({ table, file, link, pickFile }: { table: boolean; file: boolean; link: boolean; pickFile: { current: () => void } }): SlashSection[] {
  const insert: SlashCommand[] = [
    // Three by three with a header row, as every app's Insert → Table makes it.
    ...(table ? [{ key: 'insert-table', row: { label: 'Table' }, run: (editor: Editor) => void editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }] : []),
    ...(file ? [{ key: 'insert-file', row: { label: 'File' }, keywords: ['attach', 'upload'], run: () => pickFile.current() }] : []),
    ...(link ? [{ key: 'insert-link', row: { label: 'Link to a file', shortcut: '[' }, keywords: ['[', 'link', 'reference'], run: typeTrigger('[') }] : []),
  ]
  return [formatSection('block'), ...(insert.length > 0 ? [{ label: 'Insert', commands: insert }] : [])]
}
