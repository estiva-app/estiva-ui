import { useId, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { DialogShell } from './DialogShell'
import { Form } from './Form'

/**
 * A dialog that sends a form: `DialogShell` holding a `Form`, with Cancel and
 * the button that sends it in the footer — what Peek's Archive, New folder,
 * Move and Start a topic each wired by hand, and `ResolveDialog` too (C10,
 * 2 November). The look is theirs, unchanged.
 *
 * It owns the send: the button says its busy words while it waits, the fields
 * and both buttons are off until the answer comes, and a send that went
 * through closes it. An answer of `false` keeps it open, because the caller
 * has said why; so does a throw.
 *
 * **Cancel waits too** (decided once for all, 2 November; only Peek's Archive
 * did it before): nothing can stop a send already under way, so a Cancel
 * pressed then would close over a write still running, and its answer, a
 * refusal included, would have nowhere to land. `ConfirmDialog` waits the same
 * way. Escape and the ✕ still close it, as they do there.
 */
export interface FormDialogProps {
  /** The dialog's heading. */
  title: string
  /** The words on the button that sends the form: "Move", "Create". */
  submitLabel: string
  /** Its words while the form sends — "Moving…". Absent, they stay as they are. */
  busyLabel?: string
  /** How the sending button looks: `primary`, or `resolve` for a Resolve. */
  submitVariant?: 'primary' | 'resolve'
  /** Whether there is enough to send. While it is not, the button is greyed and Enter sends nothing. */
  ready?: boolean
  /** Sends the form. Answer `false` to keep the dialog open (you have said why); anything else closes it. */
  onSubmit: () => Promise<boolean | void> | boolean | void
  /** Cancel, Escape, the ✕, a press outside, and a send that went through: once, when it was closed while it sent. */
  onClose: () => void
  /** What the form holds: the words before the fields, then the fields. The form puts 24px between them. */
  children: ReactNode
}

export function FormDialog({ title, submitLabel, busyLabel, submitVariant = 'primary', ready = true, onSubmit, onClose, children }: FormDialogProps) {
  const [busy, setBusy] = useState(false)
  // Known at once rather than at the next render: two Ctrl+Enters before it re-renders send once.
  const sending = useRef(false)
  // Closed while it sent (Escape, the ✕): the send that then goes through does not close it a second time.
  const closed = useRef(false)
  const formId = useId()

  const close = () => {
    closed.current = true
    onClose()
  }

  const send = async () => {
    if (!ready || sending.current) return
    sending.current = true
    closed.current = false
    setBusy(true)
    let answer: boolean | void = false
    try {
      answer = await onSubmit()
    } catch {
      /* a refusal: the caller has said why, and the dialog stays */
      answer = false
    } finally {
      sending.current = false
      setBusy(false)
    }
    if (answer !== false && !closed.current) close()
  }

  return (
    <DialogShell
      title={title}
      onClose={close}
      footer={
        <>
          <Button variant="muted" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant={submitVariant} type="submit" form={formId} disabled={!ready || busy}>
            {busy && busyLabel ? busyLabel : submitLabel}
          </Button>
        </>
      }
    >
      <Form id={formId} busy={busy} onSubmit={send}>
        {children}
      </Form>
    </DialogShell>
  )
}
