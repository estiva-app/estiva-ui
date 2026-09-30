import type { MouseEventHandler, ReactNode } from 'react'
import { cn } from './cn'
import { CHIP_TEXT_CLASSES } from './looks'

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
  /**
   * The chip is a link: a real anchor with the chip's own round shape, so the
   * keyboard ring is round too. It sits above a row's covering `Link`, so the
   * row opens one thing and the chip another (UIG-33, Katerina 28 September).
   */
  href?: string
  /** With `href`: a router app takes the click here, like `Link`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
  className?: string
}

const typeStyles: Record<ChipType, string> = {
  neutral: 'bg-bg-inset text-text-primary',
  brand: 'bg-accent-muted text-accent-text signal:border signal:border-accent-outline',
  info: 'bg-info-muted text-info-default signal:border signal:border-info-outline',
  warning: 'bg-warning-muted text-warning-default signal:border signal:border-warning-outline signal:shadow-glow-warning',
  success: 'bg-success-muted text-success-default signal:border signal:border-success-outline',
  error: 'bg-error-muted text-error-default signal:border signal:border-error-outline',
}

export function Chip({ type = 'neutral', label, leadingIcon, trailingIcon, href, onClick, className }: ChipProps) {
  const classes = cn('inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full max-h-[20px] px-2 py-1', typeStyles[type], className)
  const inside = (
    <>
      {leadingIcon && <span className="flex size-3 shrink-0 items-center justify-center">{leadingIcon}</span>}
      {label && (
        // A chip given a `max-w-*` cuts a long label with an ellipsis instead
        // of growing past it — Ship's project chip on an issue row
        // (2026-09-09). Clipped sideways only: `overflow-x-clip`, not
        // `truncate`, because `truncate` is `overflow: hidden` on both axes and
        // the label's line box (11px under Signal) is tighter than its glyphs —
        // the screenshot diff caught every descender cut off. `clip` is the
        // one overflow that leaves the other axis visible. A chip with no cap
        // draws exactly as before.
        <span className={cn('min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap signal:tracking-wide', CHIP_TEXT_CLASSES)}>{label}</span>
      )}
      {trailingIcon && <span className="flex size-3 shrink-0 items-center justify-center">{trailingIcon}</span>}
    </>
  )
  // `relative` lifts a linked chip above a covering link that comes before it.
  if (href) return <a href={href} onClick={onClick} className={cn('relative', classes)}>{inside}</a>
  return <div className={classes}>{inside}</div>
}
