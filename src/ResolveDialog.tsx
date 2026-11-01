import { useId, useState } from 'react'
import { Button } from './Button'
import { DialogShell } from './DialogShell'
import { Field } from './Field'
import { Form } from './Form'
import { Textarea } from './Textarea'

export interface ResolveDialogProps {
  /** Resolve, with what was written (an empty string for none). Answer `false` when it was refused: the dialog stays, with `refused` under the field. */
  onResolve: (note: string) => Promise<boolean | void> | boolean | void
  onCancel: () => void
  /** Why the last resolve was refused, in plain words. */
  refused?: string
}

/**
 * Resolve, with an optional note: the same dialog in every app (Katerina, 31 October). Ctrl+Enter resolves from the
 * note; Enter there is a new line. Peek's, moved with the conversation.
 */
export function ResolveDialog({ onResolve, onCancel, refused }: ResolveDialogProps) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const formId = useId()
  return (
    <DialogShell
      title="Resolve"
      onClose={onCancel}
      footer={
        <>
          <Button variant="muted" onClick={onCancel}>
            Cancel
          </Button>
          {/* Outlined at rest and green on hover in Signal, the kit's `resolve` look. */}
          <Button variant="resolve" type="submit" form={formId} disabled={busy}>
            Resolve
          </Button>
        </>
      }
    >
      <Form
        id={formId}
        busy={busy}
        onSubmit={async () => {
          setBusy(true)
          try {
            await onResolve(note)
          } finally {
            setBusy(false)
          }
        }}
      >
        <Field label="Resolution message (optional)" error={refused}>
          <Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Summarize the outcome or decision..." className="h-[109px]" />
        </Field>
      </Form>
    </DialogShell>
  )
}
