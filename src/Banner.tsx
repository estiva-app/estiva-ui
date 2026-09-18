import type { ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'
import { Button } from './Button'
import { cn } from './cn'
import { IconButton } from './IconButton'

/**
 * The strip under the header where the app says something happened —
 * one line, gone when there is nothing to say (Ship's Banner,
 * 2026-09-02, verbatim; `info` and `warning` added on extraction,
 * Katerina's ruling — the semantic set is four everywhere else).
 *
 * body-2, her ruling (2026-09-01): the caption this once claimed never
 * rendered, so 14px is what it has always been and what she kept.
 * An `error` announces itself (`role="alert"`); the other tones are
 * polite (`role="status"`).
 *
 * `icon` and `action` put a 16px icon before the line and one small muted
 * Button after it (Katerina, 2026-09-18, UIG-13: Peek's composer strip became
 * a Banner in the `info` tone). With either, the banner is one line and the
 * text truncates.
 *
 * `onDismiss` adds an `✕` at the right-hand end (Katerina, D21,
 * 2026-09-07). Without it the strip is exactly what it was — a banner an
 * app removes by not rendering it. With it the row is 40px rather than
 * 36px, because the button is taller than the line of text.
 *
 * **A banner is not a toast.** This is the strip under the header, at the
 * app's full width, for something that stays true. Transient feedback is
 * `Toast`, and something that floats over the page and must not fade is a
 * `Toast` with `durationMs: 0` — which is what Peek's "topic deleted"
 * notice is (D21), not this.
 */
export type BannerTone = 'ok' | 'error' | 'info' | 'warning'

export interface BannerProps {
  tone: BannerTone
  /** The one line. Text, or text with a name in `font-medium`. */
  children: ReactNode
  /**
   * A 16px icon before the line, in the tone's colour (Katerina, 2026-09-18:
   * Peek's composer strip became a Banner). With an icon or an action the
   * banner is one line, and the text truncates.
   */
  icon?: ReactNode
  /** The one thing to do: the package's Button, muted and small, at the end of the line. */
  action?: { label: string; onClick?: () => void }
  /** Adds an `✕` at the right-hand end. Absent: the app removes the banner. */
  onDismiss?: () => void
  /** The dismiss button's accessible name. Defaults to "Dismiss". */
  dismissLabel?: string
  className?: string
}

const TONE_STYLES: Record<BannerTone, string> = {
  ok: 'bg-success-muted text-success-default',
  error: 'bg-error-muted text-error-default',
  info: 'bg-info-muted text-info-default',
  warning: 'bg-warning-muted text-warning-default',
}

export function Banner({ tone, children, icon, action, onDismiss, dismissLabel = 'Dismiss', className }: BannerProps) {
  const role = tone === 'error' ? 'alert' : 'status'
  // Nothing beside the line, no row: every banner that predates the props keeps
  // the DOM and the height it had.
  if (!onDismiss && !icon && !action) {
    return (
      <div role={role} className={cn('px-4 py-2 text-body-2', TONE_STYLES[tone], className)}>
        {children}
      </div>
    )
  }
  const oneLine = Boolean(icon || action)
  return (
    <div role={role} className={cn('flex items-center gap-3 px-4 py-2 text-body-2', TONE_STYLES[tone], className)}>
      {icon && <span className="flex shrink-0">{icon}</span>}
      <span className={cn('min-w-0 flex-1', oneLine && 'truncate')}>{children}</span>
      {action && (
        <Button variant="muted" size="small" className="shrink-0" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {/* `current` so the ✕ takes the tone's colour rather than the
          muted grey an IconButton wears on a neutral surface. */}
      {onDismiss && (
        <IconButton variant="current" aria-label={dismissLabel} onClick={onDismiss} className="-mr-1 shrink-0">
          <IconX size={16} stroke={1.5} />
        </IconButton>
      )}
    </div>
  )
}
