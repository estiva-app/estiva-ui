import { cn } from './cn'

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
 */
export type BannerTone = 'ok' | 'error' | 'info' | 'warning'

export interface BannerProps {
  tone: BannerTone
  children: string
  className?: string
}

const TONE: Record<BannerTone, string> = {
  ok: 'bg-success-muted text-success-default',
  error: 'bg-error-muted text-error-default',
  info: 'bg-info-muted text-info-default',
  warning: 'bg-warning-muted text-warning-default',
}

export function Banner({ tone, children, className }: BannerProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('px-4 py-2 text-body-2', TONE[tone], className)}>
      {children}
    </div>
  )
}
