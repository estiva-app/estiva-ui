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
      title={title}
      onClose={onClose}
      /* The size is an arbitrary value (the body-2 token): this list merges
         with a colour, and tw-merge drops a token size beside a colour. */
      bodyClassName="flex flex-col gap-3 text-[14px] leading-[1.4] text-text-primary"
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
      {children}
    </DialogShell>
  )
}
