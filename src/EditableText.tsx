import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { cn } from './cn'

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
  placeholder: string
  /** Resolve `true` when saved; `false` (or throw) keeps the field open with the text. */
  onCommit: (value: string) => Promise<boolean> | boolean
  multiline?: boolean
  /** Applied to both the text and the field, so they are the same size. */
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
}

export function EditableText({ value, display, displayNode, placeholder, onCommit, multiline = false, className, label, readOnly = false }: EditableTextProps) {
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
      if (ok) setEditing(false)
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
      <div
        aria-label={label}
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
      title="Click to edit"
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
