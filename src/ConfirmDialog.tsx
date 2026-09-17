import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { DialogShell } from './DialogShell'

/**
 * A question with two answers, before something a person would want back —
 * Ship's ConfirmDialog (2026-09-01), verbatim. Its own comment always called
 * it a package candidate: nothing here knows what is being confirmed.
 *
 * The confirm button is `destructive` when the action is (a deletion, an
 * archive); `primary` otherwise. While the action runs the buttons wait;
 * an action that resolves `false` keeps the dialog open, so the caller's
 * banner can say why.
 *
 * On Base UI's `AlertDialog` since stage 3 of the migration (2026-09-07),
 * through `DialogShell`'s `alert`. **A press on the backdrop no longer
 * closes it** (Katerina, D20): a destructive question is answered, not
 * clicked away. Escape and the close button still cancel, as they did.
 */
export interface ConfirmDialogProps {
  title: string
  /** The body — plain sentences, body-2. */
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => Promise<boolean | void> | boolean | void
  onClose: () => void
}

export function ConfirmDialog({ title, children, confirmLabel, destructive = false, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true)
    try {
      const ok = await onConfirm()
      if (ok !== false) onClose()
    } finally {
      setBusy(false)
    }
  }
  return (
    <DialogShell
      alert
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="muted" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={() => void confirm()} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {/* The words' look on a box of the dialog's own, not pushed into DialogShell's body (UIG-9). */}
      <div className="flex flex-col gap-3 text-body-2 text-text-primary">{children}</div>
    </DialogShell>
  )
}
