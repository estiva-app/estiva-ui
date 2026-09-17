import { IconX } from '@tabler/icons-react'
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
  children: string
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

export function Banner({ tone, children, onDismiss, dismissLabel = 'Dismiss', className }: BannerProps) {
  const role = tone === 'error' ? 'alert' : 'status'
  // No dismiss, no row: every banner that predates the prop keeps the DOM and
  // the height it had.
  if (!onDismiss) {
    return (
      <div role={role} className={cn('px-4 py-2 text-body-2', TONE_STYLES[tone], className)}>
        {children}
      </div>
    )
  }
  return (
    <div role={role} className={cn('flex items-center gap-3 px-4 py-2 text-body-2', TONE_STYLES[tone], className)}>
      <span className="min-w-0 flex-1">{children}</span>
      {/* `current` so the ✕ takes the tone's colour rather than the
          muted grey an IconButton wears on a neutral surface. */}
      <IconButton variant="current" aria-label={dismissLabel} onClick={onDismiss} className="-mr-1 shrink-0">
        <IconX size={16} stroke={1.5} />
      </IconButton>
    </div>
  )
}
