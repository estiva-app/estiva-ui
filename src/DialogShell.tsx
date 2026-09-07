import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'

/**
 * Peek's DialogShell (2026-08-28), verbatim: the portal, the backdrop, the
 * 502px card and its chrome — a 48px header with the title and a close
 * button, a body, a 48px footer for the buttons. A dialog is just what goes
 * in the three slots. On Base UI's `Dialog` since stage 3 of the migration
 * (2026-09-07).
 *
 * **What that fixed, and this page used to say it did not:** focus is trapped
 * inside the card, so Tab cannot walk out into the page behind it, and it
 * returns to whatever opened the dialog when it closes. Both were missing and
 * both were written down as missing. The portal, the outside press and the
 * Escape key are Base UI's too — the `keydown` listener this file kept on
 * `document` is gone, and with it the bug where two open dialogs both closed
 * on one Escape.
 *
 * The card is mounted only while it is open, as before: this component has no
 * `open` prop, and a caller renders it or does not. So `open` is `true` and
 * `onOpenChange` reports the ways Base UI closes it — Escape, a press outside,
 * the close button — through the one `onClose` the callers already pass.
 *
 * The DOM is the same shape it was, deliberately: a backdrop, then a
 * full-screen flex layer that centres the card. Base UI positions nothing for
 * a dialog, so keeping the layer is what keeps the pixels.
 */
export interface DialogShellProps {
  /** Labels the dialog for assistive tech, and renders as the header text
   *  unless `headerContent` replaces it. */
  title: string
  onClose: () => void
  /** Replaces the title text in the header — a back button beside the title,
   *  a count chip after it. The close button stays. */
  headerContent?: ReactNode
  /** Absent: no footer row, and the body keeps the card's own bottom edge
   *  (a roster that simply ends). */
  footer?: ReactNode
  children: ReactNode
  /** Extra classes on the body (e.g. `flex flex-col gap-6`, or a max height with `overflow-y-auto`). */
  bodyClassName?: string
  width?: number
  /**
   * A question that has to be answered rather than clicked away: a press on
   * the backdrop no longer closes it, and it announces itself as an alert.
   * Escape and the close button still work. `ConfirmDialog` is this
   * (Katerina, D20, 2026-09-07); a form or a roster is not.
   */
  alert?: boolean
}

export function DialogShell({ title, onClose, headerContent, footer, children, bodyClassName, width = 502, alert = false }: DialogShellProps) {
  // The two families are the same parts with different dismiss rules, so the
  // chrome below is written once. AlertDialog re-exports Dialog's Backdrop,
  // Popup, Portal and Title types, which is why this substitutes cleanly.
  const Parts = alert ? AlertDialog : Dialog
  return (
    <Parts.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Parts.Portal>
        {/* Backdrop */}
        <Parts.Backdrop className="fixed inset-0 z-40 bg-scrim" />

        {/* Dialog */}
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <Parts.Popup
            /* The header names it when the header is the title. When
               `headerContent` replaces that text there is nothing to point at,
               so the name is spelled instead — as this component always did. */
            aria-label={headerContent != null ? title : undefined}
            className="bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden"
            style={{ width }}
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
              {headerContent ?? (
                <Parts.Title className="text-h4 text-text-primary" render={<span />}>
                  {title}
                </Parts.Title>
              )}
              <IconButton tooltip="Close" aria-label="Close" onClick={onClose}>
                <IconX size={16} stroke={1.5} />
              </IconButton>
            </div>

            {/* Body */}
            <div className={cn('pl-5 pr-4 py-4', footer != null && 'border-b border-border-subtle', bodyClassName)}>{children}</div>

            {/* Footer */}
            {footer != null && <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">{footer}</div>}
          </Parts.Popup>
        </div>
      </Parts.Portal>
    </Parts.Root>
  )
}
