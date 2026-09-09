import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * Peek's Chip (2026-08-28), verbatim: a 20px pill in one of six colour
 * types, with room for a 12px icon either side. Under Signal the label is
 * mono and the coloured types carry a hairline, as Peek has it. The icon
 * slots centre their icon (Ship's addition — an icon beside text otherwise
 * rides on the baseline).
 *
 * The label is the `chip` type token, 11px / 500. It used to be spelled as a
 * plain class under a note that it must never be merged; `cn()` knows the ramp
 * now, so a token size survives beside a colour and the note is retired.
 */
export type ChipType = 'neutral' | 'brand' | 'info' | 'warning' | 'success' | 'error'

export interface ChipProps {
  type?: ChipType
  label?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  className?: string
}

const typeStyles: Record<ChipType, string> = {
  neutral: 'bg-bg-inset text-text-primary',
  brand: 'bg-accent-muted text-accent-primary signal:border signal:border-accent-outline',
  info: 'bg-info-muted text-info-default signal:border signal:border-info-outline',
  warning: 'bg-warning-muted text-warning-default signal:border signal:border-warning-outline signal:shadow-glow-warning',
  success: 'bg-success-muted text-success-default signal:border signal:border-success-outline',
  error: 'bg-error-muted text-error-default signal:border signal:border-error-outline',
}

export function Chip({ type = 'neutral', label, leadingIcon, trailingIcon, className }: ChipProps) {
  return (
    <div className={cn('inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full max-h-[20px] px-2 py-1', typeStyles[type], className)}>
      {leadingIcon && <span className="flex size-3 shrink-0 items-center justify-center">{leadingIcon}</span>}
      {label && (
        // `truncate` rather than `whitespace-nowrap` (2026-09-09): the same
        // no-wrap, and a chip given a `max-w-*` cuts a long label with an
        // ellipsis instead of growing past it — Ship's project chip on an
        // issue row. A chip with no cap draws exactly as before.
        <span className="min-w-0 truncate text-chip signal:font-mono signal:text-[10px] signal:font-semibold signal:tracking-[0.02em] signal:tabular-nums">{label}</span>
      )}
      {trailingIcon && <span className="flex size-3 shrink-0 items-center justify-center">{trailingIcon}</span>}
    </div>
  )
}
