import { useRef, type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'
import { ContainerHeader } from './ContainerHeader'
import { IconButton } from './IconButton'
import { ScrollArea } from './ScrollArea'

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
  /** Extra classes on the body: its layout and any padding override (`flex flex-col gap-6`, `p-0 py-2`). */
  bodyClassName?: string
  /**
   * How tall the body may get before it scrolls, as the cap class —
   * `max-h-[400px]`, `max-h-[70vh]`. Setting it makes the body a `ScrollArea`,
   * so a long roster or a tall form scrolls in the package's bar rather than
   * the browser's (D40, ADOPTION B19).
   *
   * Without it the body is what it always was and grows to its content, so no
   * dialog written before 0.12.2 moves a pixel. A `bodyClassName` carrying
   * `overflow-y-auto` and no cap never scrolled anything — the box grew — and
   * is the case this replaces.
   */
  bodyMaxHeight?: string
  width?: number
  /**
   * A question that has to be answered rather than clicked away: a press on
   * the backdrop no longer closes it, and it announces itself as an alert.
   * Escape and the close button still work. `ConfirmDialog` is this
   * (Katerina, D20, 2026-09-07); a form or a roster is not.
   */
  alert?: boolean
}

export function DialogShell({ title, onClose, headerContent, footer, children, bodyClassName, bodyMaxHeight, width = 502, alert = false }: DialogShellProps) {
  // The two families are the same parts with different dismiss rules, so the
  // chrome below is written once. AlertDialog re-exports Dialog's Backdrop,
  // Popup, Portal and Title types, which is why this substitutes cleanly.
  const Parts = alert ? AlertDialog : Dialog
  const popupRef = useRef<HTMLDivElement>(null)
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
          {/* @estiva-escape(no-copied-look): A3 (Katerina, 24 September: leave CommandPalette alone): a dialog's window and the palette's are left as they are */}
          <Parts.Popup
            ref={popupRef}
            /*
              Focus the card, not the first control in it.

              Base UI's default is the first tabbable element, which here is the
              ✕ in the header — so every dialog opened with a visible ring on
              its close button, which the screenshot diff caught as a 28px
              square nobody had asked for. Focusing the card arms the trap and
              lets a screen reader read the dialog, with no control lit up.

              A field with `autoFocus` still wins: React focuses it while the
              popup mounts, and Base UI does not move focus that has already
              landed inside. Both dialogs in Ship rely on that.
            */
            initialFocus={popupRef}
            /* The header names it when the header is the title. When
               `headerContent` replaces that text there is nothing to point at,
               so the name is spelled instead — as this component always did. */
            aria-label={headerContent != null ? title : undefined}
            /* `outline-none` because the card is a programmatic focus target,
               not something a keyboard user tabs to: without it Chrome rings
               the whole 502px card on open, which the diff caught the moment
               `initialFocus` moved off the ✕. The controls inside keep their
               own focus styling. */
            className="bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden outline-none"
            style={{ width }}
          >
            {/* Header: the package's one header bar, with the dialog's own title in it (UIG-22). */}
            <ContainerHeader
              title={
                headerContent ?? (
                  <Parts.Title className="text-h4 text-text-primary" render={<span />}>
                    {title}
                  </Parts.Title>
                )
              }
              actions={
                /*
                The ✕ IS the `Close` part now, rather than a button that calls
                `onClose` beside one (stage 4, 2026-09-07). Stage 3 could not do
                this: an `IconButton` carrying a `tooltip` returned the tooltip
                wrapper `<div>` as its root, so the part composed onto the
                wrapper and not the button. Porting Tooltip removed the wrapper
                — the trigger is the button itself — and the composition works.

                What it buys: the dialog closes through its own state machine,
                so the ✕, Escape and the outside press are one path with one
                reason attached, instead of one of the three going around.
              */
                <Parts.Close
                  render={
                    <IconButton tooltip="Close" aria-label="Close">
                      <IconX size={16} stroke={1.5} />
                    </IconButton>
                  }
                />
              }
            />

            {/* Body. With a cap it scrolls in the package's bar: the cap goes
                on the viewport (ScrollArea's rule — on the region the viewport
                grows to its content and nothing scrolls), and the padding and
                the caller's layout go on the content, so the bar is drawn over
                the padding rather than beside it. */}
            {bodyMaxHeight ? (
              // The line above the footer on a box of the shell's own, not pushed into ScrollArea (UIG-9).
              <div className={cn(footer != null && 'border-b border-border-subtle')}>
                <ScrollArea viewportClassName={bodyMaxHeight} contentClassName={cn('pl-5 pr-4 py-4', bodyClassName)}>
                  {children}
                </ScrollArea>
              </div>
            ) : (
              <div className={cn('pl-5 pr-4 py-4', footer != null && 'border-b border-border-subtle', bodyClassName)}>{children}</div>
            )}

            {/* Footer */}
            {footer != null && <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">{footer}</div>}
          </Parts.Popup>
        </div>
      </Parts.Portal>
    </Parts.Root>
  )
}
