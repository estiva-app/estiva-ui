import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { Button } from './Button'
import { cn } from './cn'

/**
 * What an app shows while nobody is signed in to it: its logo, one line saying
 * why, and at most one button. Peek's AuthShell (PEEK-116), moved here so every
 * app draws the same screen (AUT-3, 2026-10-17).
 *
 * It is the same canvas in every state — the logo, and at most one affordance —
 * because the thing it must never look like is a separate sign-in page for an
 * identity the person already holds.
 *
 * The words are the caller's: a shared part has none of its own for why entry
 * stopped, and the apps take them from the one place that says them for all.
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
   * nothing. The message and the action are not drawn.
   */
  busy?: boolean
  /** The one line saying why nobody is signed in. */
  message?: ReactNode
  /**
   * The one thing to do about it — "Continue", "Try again" — drawn under the
   * line as the package's primary Button. Leave it out when nothing the
   * person can do would help: a button that cannot work is worse than none.
   * `onClick` runs from the tap itself, so a passkey prompt may start in it.
   */
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EntryShell({ logo, busy = false, message, action, className }: EntryShellProps) {
  return (
    <div className={cn('min-h-screen bg-bg-base flex items-center justify-center p-6', className)}>
      <div className="flex flex-col items-center gap-4">
        {busy ? (
          // On the mark itself, not on a box around it: a box would pulse its own square corners
          // and, where an app themes the pulse (Peek's Signal shimmer), sweep outside the mark.
          cloneElement(logo, { className: cn(logo.props.className, 'animate-skeleton-in animate-pulse') })
        ) : (
          <>
            {logo}
            {message != null && <p className="text-body-2 text-text-secondary max-w-sm text-center">{message}</p>}
            {action && (
              <Button variant="primary" type="button" onClick={action.onClick}>
                {action.label}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
