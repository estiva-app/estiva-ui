import { useRef, useState, type ReactNode } from 'react'
import { Button, type ButtonAction } from './Button'
import { DialogShell } from './DialogShell'

/**
 * A question with two answers — three, with a safer `alternative` — before something a person would want back —
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
/** A third answer: the safer one, with the sentence that says why. */
export interface ConfirmDialogAlternative extends ButtonAction {
  /** The sentence above the button — "To take it out of every list and keep it readable, archive it instead." */
  sentence: string
}

export interface ConfirmDialogProps {
  title: string
  /** The body — plain sentences, body-2. */
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => Promise<boolean | void> | boolean | void
  /** Cancel, Escape, the ✕, and an action that went through: once, when it was closed while the action ran. */
  onClose: () => void
  /**
   * A third, safer answer — "Archive instead" — drawn after the words, under
   * its sentence, and switched off while the confirm runs (Peek's, 2 November).
   * It closes nothing: what it opens takes this question's place.
   */
  alternative?: ConfirmDialogAlternative
}

export function ConfirmDialog({ title, children, confirmLabel, destructive = false, onConfirm, onClose, alternative }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  // Closed while the action ran (Escape, the ✕): the action that then goes through does not close it a second time.
  const closed = useRef(false)
  const close = () => {
    closed.current = true
    onClose()
  }
  const confirm = async () => {
    closed.current = false
    setBusy(true)
    try {
      const ok = await onConfirm()
      if (ok !== false && !closed.current) close()
    } finally {
      setBusy(false)
    }
  }
  return (
    <DialogShell
      alert
      title={title}
      onClose={close}
      footer={
        <>
          <Button variant="muted" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={() => void confirm()} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {/* The words' look on a box of the dialog's own, not pushed into DialogShell's body (UIG-9). */}
      <div className="flex flex-col gap-3 text-body-2 text-text-primary">
        {children}
        {/* Its sentence and its button one block, 8px apart, as Peek's delete question drew them. */}
        {alternative && (
          <div className="flex flex-col items-start gap-2">
            <p>{alternative.sentence}</p>
            <Button variant="outlined" size="small" onClick={alternative.onClick} disabled={busy}>
              {alternative.label}
            </Button>
          </div>
        )}
      </div>
    </DialogShell>
  )
}
