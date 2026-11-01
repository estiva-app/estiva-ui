import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { Button } from './Button'
import { cn } from './cn'
import { FieldLine, type FieldLineTone } from './Field'
import { Form } from './Form'
import { Textarea } from './Textarea'
import { TextInput } from './TextInput'

/** What happened to a save, to say under it: `error` keeps the field open, `warning` saved. Said in a `FieldLine` of that tone. */
export interface EditableTextOutcome {
  kind: Exclude<FieldLineTone, 'helper'>
  message: string
}

/** A commit's answer: `true` saved, `false` refused (you have said why), or an outcome to say under it. */
export type EditableTextAnswer = boolean | EditableTextOutcome

/** Saved: `true`, or an outcome that is not a refusal. */
const saved = (answer: EditableTextAnswer | undefined) => answer === true || (typeof answer === 'object' && answer.kind !== 'error')

/**
 * Text you click to edit — Ship's EditableText (2026-09-01), verbatim. Its
 * own comment always called it a package candidate: nothing here knows what
 * is being edited.
 *
 * The editing state is Base UI's `Input` — or `Field.Control` as a
 * `<textarea>` when multiline — since stage 3 of the migration (2026-09-07).
 * The read state, the draft, and every rule about committing stay here:
 * Base UI has no opinion about what an edit means, and this component is
 * nothing but that opinion.
 *
 * Reads as text until clicked; then it is a field. Enter commits (Shift+Enter
 * is a new line when multiline), Escape cancels, blur commits. A commit that
 * fails keeps the field open with the text in it, so an edit is never
 * silently lost — the caller has already said why. An unchanged value is not
 * committed at all. Empty shows the placeholder, muted.
 */
export interface EditableTextProps {
  value: string
  /** What shows, muted, while the value is empty. */
  placeholder: string
  /**
   * Resolve `true` when saved; `false` (or throw) keeps the field open with
   * the text. Or an outcome: `error` keeps it open, `warning` saved; `buttons`
   * says either under it, and a throw's own words as an `error`.
   */
  onCommit: (value: string) => Promise<EditableTextAnswer> | EditableTextAnswer
  multiline?: boolean
  /** Applied to both the text and the field, so they are the same size. In `buttons`, placement only: it goes on the whole. */
  className?: string
  /** The accessible name of the field — "Title", "Description". */
  label: string
  /**
   * What to *show* when not editing, when that differs from what is edited —
   * a value carrying a raw reference that the caller renders as a live object
   * below the text, say.
   *
   * It overrides the display branch only. `value` is still what the editor
   * opens with and what a commit compares against, so nothing is silently lost
   * — which is the failure a naive `value={stripped}` would cause.
   */
  display?: string
  /**
   * What to *draw* when not editing, when the value is structured rather than
   * a line of prose.
   *
   * A node, not a string, because a heading and a bullet are elements. Added
   * for a rich text field (SPEC §13): the app renders the parsed body and
   * hands the result in.
   *
   * `display` stays the **string**, and stays what decides emptiness — so a
   * blank field still shows its placeholder rather than an empty element. Like
   * `display`, this overrides the display branch only: `value` is what the
   * editor opens with and what a commit compares against, so what is edited is
   * unchanged.
   *
   * `whitespace-pre-wrap` is dropped when this is set. Structured content
   * carries its own line breaks, and preserving the source's as well doubles
   * every one of them.
   */
  displayNode?: ReactNode
  /** Show the value only — no edit affordance. For a reader who cannot write. */
  readOnly?: boolean
  /**
   * How it is edited. `inline`, the default: the text is the button, and
   * leaving the field saves. `buttons`: the text with a button beside it, a
   * field with Save and Cancel, and what happened said under it — an edit to
   * confirm, in a dialog (Peek's Details, 2 November).
   */
  manner?: 'inline' | 'buttons'
  /** `buttons`: the words on the button that opens the field — "Rename". "Edit" when absent. */
  editLabel?: string
  /** `buttons`: its words while the value is empty, with a plus — "Add a summary". `editLabel` when absent. */
  addLabel?: string
  /** `buttons`: the field's own placeholder, while it is edited. */
  fieldPlaceholder?: string
  /** `buttons`: an empty value cannot be saved, as a name cannot. */
  required?: boolean
  /** `buttons`: what a draft becomes before it is compared and saved — one line, say. Trimmed when absent. */
  clean?: (draft: string) => string
  /** `buttons`: said between the field and its buttons as it is typed — a count past a limit. */
  draftNote?: (draft: string) => ReactNode
  /** `buttons`: opens as the field, holding the value — a menu's Rename. */
  defaultEditing?: boolean
}

export function EditableText(props: EditableTextProps) {
  return props.manner === 'buttons' ? <WithButtons {...props} /> : <Inline {...props} />
}

function Inline({ value, display, displayNode, placeholder, onCommit, multiline = false, className, label, readOnly = false }: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [busy, setBusy] = useState(false)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      fieldRef.current?.focus()
      fieldRef.current?.select()
    }
  }, [editing])

  const open = () => {
    setDraft(value)
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setDraft(value)
  }

  const commit = async () => {
    if (busy) return
    const next = draft.trim()
    if (next === value) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      const ok = await onCommit(next)
      if (ok && saved(ok)) setEditing(false)
    } catch {
      /* the caller has shown why; keep the field open */
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    } else if (event.key === 'Enter' && !(multiline && event.shiftKey)) {
      event.preventDefault()
      void commit()
    }
  }

  const fieldClass = cn(
    'w-full rounded-md border border-border-strong bg-bg-inset px-2 py-1 text-text-primary outline-none',
    multiline && 'resize-none',
    className,
  )

  if (readOnly) {
    return (
      /*
        No `aria-label` here. It sat on a bare `<div>`, which has no role, and
        ARIA does not let an author name a generic element — so the name was
        written and never read. Read-only, this is a line of text: whatever
        names the region around it (a `Field`, a `Property`) names this too.
      */
      <div
        className={cn('w-full px-2 py-1', multiline && !displayNode && 'whitespace-pre-wrap', (display ?? value) ? 'text-text-primary' : 'text-text-muted', className)}
      >
        {(display ?? value) ? (displayNode ?? (display ?? value)) : placeholder}
      </div>
    )
  }

  if (editing) {
    return multiline ? (
      <BaseField.Control
        ref={fieldRef as RefObject<HTMLTextAreaElement>}
        render={<textarea rows={4} />}
        aria-label={label}
        value={draft}
        disabled={busy}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => void commit()}
        className={fieldClass}
      />
    ) : (
      <Input
        ref={fieldRef as RefObject<HTMLInputElement>}
        aria-label={label}
        value={draft}
        disabled={busy}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => void commit()}
        className={fieldClass}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      /*
        No `title`. It was the one native browser tooltip left in the package —
        its own timing, its own look, no theme — saying "Click to edit" beside
        an `aria-label` that already says it. The hover border is the
        affordance, and anything that needs a designed hint uses `WithTooltip`.
      */
      aria-label={`Edit ${label.toLowerCase()}`}
      className={cn(
        'w-full rounded-md border border-transparent px-2 py-1 text-left transition-colors hover:border-border-default',
        multiline && !displayNode && 'whitespace-pre-wrap',
        (display ?? value) ? 'text-text-primary' : 'text-text-muted',
        className,
      )}
    >
      {(display ?? value) ? (displayNode ?? (display ?? value)) : placeholder}
    </button>
  )
}

/**
 * The `buttons` manner, Peek's Details drawn exactly (C13, 2 November): the
 * text and its button in one row; the field with Save and Cancel beside it on
 * one line, under it when `multiline`; what happened said under the field
 * (8px), or under the text once it closed (12px). Escape in the field abandons
 * the edit and nothing else: the dialog around it stays.
 */
function WithButtons({
  value,
  display,
  displayNode,
  placeholder,
  onCommit,
  multiline = false,
  className,
  label,
  readOnly = false,
  editLabel = 'Edit',
  addLabel,
  fieldPlaceholder,
  required = false,
  clean = (draft: string) => draft.trim(),
  draftNote,
  defaultEditing = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(defaultEditing && !readOnly)
  const [draft, setDraft] = useState(value)
  const [outcome, setOutcome] = useState<EditableTextOutcome | null>(null)
  const [busy, setBusy] = useState(false)

  const cleaned = clean(draft)
  // A refused text can be sent again as it is: the refusal may have been the moment's, not the text's.
  const canSave = (!required || cleaned !== '') && (cleaned !== clean(value) || outcome?.kind === 'error')

  const open = () => {
    setDraft(value)
    setEditing(true)
  }
  const cancel = () => {
    setEditing(false)
    setOutcome(null)
  }
  const save = async () => {
    if (!canSave || busy) return
    setBusy(true)
    let answer: EditableTextAnswer
    try {
      answer = await onCommit(cleaned)
    } catch (error) {
      // Nothing may leave this stuck on "Saving…"; a throw with words says them.
      answer = error instanceof Error && error.message ? { kind: 'error', message: error.message } : false
    } finally {
      setBusy(false)
    }
    setOutcome(typeof answer === 'object' ? answer : null)
    // Only a refusal keeps the field open; the draft is kept on one.
    if (saved(answer)) setEditing(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key !== 'Escape') return
    // Escape abandons the edit, and only the edit: a dialog around it stays for a second Escape. Enter is the form's, and saves.
    event.preventDefault()
    event.stopPropagation()
    cancel()
  }
  const type = (next: string) => {
    setDraft(next)
    // Changing a refused text is a new attempt: the old reason goes.
    if (outcome?.kind === 'error') setOutcome(null)
  }
  const line = outcome && <FieldLine tone={outcome.kind}>{outcome.message}</FieldLine>

  if (editing) {
    const buttons = (
      <>
        <Button variant="primary" size="small" type="submit" disabled={!canSave || busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outlined" size="small" onClick={cancel}>
          Cancel
        </Button>
      </>
    )
    return (
      // The package Form: Enter in the one-line field saves, Ctrl+Enter from the text area; it locks while saving.
      <Form busy={busy} onSubmit={save} layout="free" className={cn('flex flex-col gap-2', className)}>
        {multiline ? (
          <>
            <Textarea autoFocus rows={4} value={draft} onChange={(event) => type(event.target.value)} aria-label={label} placeholder={fieldPlaceholder} onKeyDown={onKeyDown} />
            {draftNote?.(draft)}
            <div className="flex items-center gap-2">{buttons}</div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <TextInput autoFocus value={draft} onChange={(event) => type(event.target.value)} aria-label={label} placeholder={fieldPlaceholder} onKeyDown={onKeyDown} />
              {buttons}
            </div>
            {draftNote?.(draft)}
          </>
        )}
        {line}
      </Form>
    )
  }

  const shown = display ?? value
  const words = shown ? (displayNode ?? shown) : placeholder
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('flex gap-2', multiline ? 'items-start' : 'items-center')}>
        {multiline ? (
          <p className={cn('min-w-0 flex-1 text-body-2', shown ? 'break-words text-text-primary' : 'text-text-muted')}>{words}</p>
        ) : (
          <span className={cn('min-w-0 flex-1 truncate text-body-2', shown ? 'text-text-primary' : 'text-text-muted')}>{words}</span>
        )}
        {/* Absent, not disabled, for a reader who cannot write. */}
        {!readOnly && (
          <Button
            variant="outlined"
            size="small"
            leadingIcon={value || !addLabel ? <IconPencil size={14} stroke={1.5} /> : <IconPlus size={14} stroke={1.5} />}
            onClick={open}
          >
            {value || !addLabel ? editLabel : addLabel}
          </Button>
        )}
      </div>
      {line}
    </div>
  )
}
