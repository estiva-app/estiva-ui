import { useState } from 'react'
import { Field, FieldLine } from './Field'
import { FormDialog } from './FormDialog'
import { Textarea } from './Textarea'

export interface ResolveDialogProps {
  /** Resolve, with what was written (an empty string for none). Answer `false` when it was refused: the dialog stays, with `refused` under the field. */
  onResolve: (note: string) => Promise<boolean | void> | boolean | void
  /** Cancel, Escape, the ✕ — and a resolve that was not refused, which closes it. */
  onCancel: () => void
  /** Why the last resolve was refused, in plain words. */
  refused?: string
}

/**
 * Resolve, with an optional note: the same dialog in every app (Katerina, 31 October). Ctrl+Enter resolves from the
 * note; Enter there is a new line. Peek's, moved with the conversation; a `FormDialog` since 2 November, so Cancel waits
 * while it resolves and a resolve that went through closes it.
 */
export function ResolveDialog({ onResolve, onCancel, refused }: ResolveDialogProps) {
  const [note, setNote] = useState('')
  return (
    // Outlined at rest and green on hover in Signal, the kit's `resolve` look.
    <FormDialog title="Resolve" submitLabel="Resolve" submitVariant="resolve" onSubmit={() => onResolve(note)} onClose={onCancel}>
      <Field label="Resolution message (optional)">
        {/* The refusal in the error line's place, 6px under the note, without marking the note invalid: an invalid field
            stops the form, and Resolve could not try again (found in Leaf's adoption, 3 November). */}
        <Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Summarize the outcome or decision..." className="h-[109px]" />
        {refused && <FieldLine tone="error">{refused}</FieldLine>}
      </Field>
    </FormDialog>
  )
}
