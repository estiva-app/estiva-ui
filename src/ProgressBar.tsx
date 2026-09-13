import { Progress } from '@base-ui/react/progress'
import { cn } from './cn'

/**
 * How much of something is done: a thin rounded track with a success-coloured
 * fill. On Base UI's `Progress`, which owns the `progressbar` role and its
 * numbers; this component writes the look.
 *
 * Both apps hand-built one, each with its own `role="progressbar"` (UIG-27).
 * Their two looks are both kept, because each does a different job:
 *
 * - `default` is Ship's (`ui/ProgressBar.tsx`): 6px, the success colour — a
 *   bar someone reads, with the words printed beside it.
 * - `quiet` is Peek's (`ui/ProjectTickets.tsx`): 3px, the muted success colour
 *   — a glance on the same line as a count, "not a chart".
 *
 * The props are Ship's, unchanged. The bar alone says nothing a screen reader
 * can use beyond its numbers, so `label` is required; Base UI reads the value
 * out as a percentage.
 */
export type ProgressBarVariant = 'default' | 'quiet'

const TRACK_CLASSES: Record<ProgressBarVariant, string> = {
  default: 'h-1.5 w-full overflow-hidden rounded-full bg-bg-inset',
  quiet: 'h-[3px] w-full overflow-hidden rounded-full bg-bg-inset',
}

const INDICATOR_CLASSES: Record<ProgressBarVariant, string> = {
  default: 'h-full rounded-full bg-success-default transition-[width]',
  quiet: 'h-full rounded-full bg-success-muted transition-[width] duration-300',
}

export interface ProgressBarProps {
  /** How many are done. */
  value: number
  /** How many there are. At `0` the bar is empty. */
  max: number
  /** The accessible name — "Items done". */
  label: string
  /** Default `default`. */
  variant?: ProgressBarVariant
  /** Placement only: a width, a margin, `flex-1` in a row. */
  className?: string
}

export function ProgressBar({ value, max, label, variant = 'default', className }: ProgressBarProps) {
  return (
    // `max={0}` needs no guard: Base UI reads the 0/0 share as an empty bar.
    <Progress.Root value={value} max={max} aria-label={label} className={className}>
      <Progress.Track className={TRACK_CLASSES[variant]}>
        <Progress.Indicator className={INDICATOR_CLASSES[variant]} />
      </Progress.Track>
    </Progress.Root>
  )
}
