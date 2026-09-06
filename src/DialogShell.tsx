import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'

/**
 * Peek's DialogShell (2026-08-28), verbatim: the portal, the backdrop, the
 * 502px card and its chrome — a 48px header with the title and a close
 * button, a body, a 48px footer for the buttons. A dialog is just what goes
 * in the three slots. Plus what Ship added: Escape closes it, and the card
 * says what it is to assistive tech.
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
}

export function DialogShell({ title, onClose, headerContent, footer, children, bodyClassName, width = 502 }: DialogShellProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      {/* eslint-disable-next-line better-tailwindcss/no-restricted-classes -- Backdrop. The scrim has no token: the suite draws it at three opacities (audit 2026-09-05, finding 12); a scrim token is a design ruling, taken with PLAN.md stage 0.6 */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden"
          style={{ width }}
        >
          {/* Header */}
          <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
            {headerContent ?? <span className="text-h4 text-text-primary">{title}</span>}
            <IconButton tooltip="Close" aria-label="Close" onClick={onClose}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </div>

          {/* Body */}
          <div className={cn('pl-5 pr-4 py-4', footer != null && 'border-b border-border-subtle', bodyClassName)}>{children}</div>

          {/* Footer */}
          {footer != null && <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">{footer}</div>}
        </div>
      </div>
    </>,
    document.body,
  )
}
