import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { Button, type ButtonAction } from './Button'
import { cn } from './cn'

/**
 * What an app shows while nobody is signed in to it: its logo, one line saying
 * why, and at most one button. Peek's AuthShell (PEEK-116), moved here so every
 * app draws the same screen (AUT-3, 2026-10-17).
 *
 * The words are the caller's: a shared part has none of its own for why entry
 * stopped.
 */
export interface EntryShellProps {
  /**
   * The app's own mark, drawn at the top in every state, as given: the app
   * sizes it. An element that takes a `className`, because while `busy` the
   * pulse goes on the mark itself.
   */
  logo: ReactElement<{ className?: string }>
  /**
   * Entry is still being decided: the logo alone, pulsing, revealed after
   * 150ms (as a Skeleton is), so an entry that resolves at once flashes
   * nothing. The message and the action are not drawn. Assistive technology
   * hears a busy status named `busyLabel`.
   */
  busy?: boolean
  /** What a screen reader hears while `busy`; nothing is drawn for it. */
  busyLabel?: string
  /**
   * The one line saying why nobody is signed in, announced politely when it
   * appears. Nothing is drawn for an empty one.
   */
  message?: ReactNode
  /**
   * The one thing to do about it, drawn under the line (or alone, with no
   * `message`) as the package's primary Button. Leave it out when nothing the
   * person can do would help: a button that cannot work is worse than none.
   * `onClick` runs from the tap itself, so a prompt that needs the person's
   * gesture may start in it; `disabled` holds the button while that runs, so a
   * second tap starts nothing.
   */
  action?: ButtonAction & { disabled?: boolean }
  className?: string
}

const isEmpty = (node: ReactNode) => node == null || node === false || (typeof node === 'string' && node.trim() === '')

export function EntryShell({ logo, busy = false, busyLabel = 'Loading', message, action, className }: EntryShellProps) {
  return (
    <div className={cn('min-h-screen bg-bg-base flex items-center justify-center p-6', className)}>
      {busy ? (
        <div role="status" aria-busy="true" aria-label={busyLabel} className="flex flex-col items-center gap-4">
          {/* On the mark itself, not on a box around it: a box would pulse its own square corners
              and, where an app themes the pulse (Peek's Signal shimmer), sweep outside the mark. */}
          {cloneElement(logo, { className: cn(logo.props.className, 'animate-skeleton-in animate-pulse') })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {logo}
          {!isEmpty(message) && (
            <p role="status" className="text-body-2 text-text-secondary max-w-sm text-center">
              {message}
            </p>
          )}
          {action && (
            <Button variant="primary" type="button" onClick={action.onClick} disabled={action.disabled}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
