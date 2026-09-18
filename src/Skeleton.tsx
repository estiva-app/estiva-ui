import type { CSSProperties } from 'react'
import { cn } from './cn'

/**
 * Peek's Skeleton (2026-08-28), the generic parts only: the bar, a row
 * shaped like a list row, and a list of them. Peek's placeholders shaped
 * like a conversation card or a huddle card know what those are and stay
 * in Peek, built from the bar.
 *
 * A list reveals after 150ms (`animate-skeleton-in`, in the preset) so a
 * fast load never flashes a skeleton — Peek's rule.
 */
/** One pulsing bar at the inset colour: the piece every placeholder here is
 *  built from. It draws nothing of its own — give it a width and a height. */
export function SkeletonBar({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('bg-bg-inset rounded-sm animate-pulse', className)} style={style} />
}

const ROW_BAR_WIDTHS = [150, 100, 170, 120, 90, 140, 110, 160]

/** A 32px row: a 16px square and a bar, like a row with a face and a name. */
export function SkeletonRow({ barWidth = 130 }: { barWidth?: number }) {
  return (
    <div className="flex items-center gap-2 px-2 h-[32px] rounded-lg">
      <SkeletonBar className="w-4 h-4 shrink-0" />
      <SkeletonBar className="h-3.5" style={{ width: barWidth }} />
    </div>
  )
}

/** Rows of varied widths, so the placeholder does not read as a pattern. */
export function SkeletonList({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 animate-skeleton-in', className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} barWidth={ROW_BAR_WIDTHS[i % ROW_BAR_WIDTHS.length]} />
      ))}
    </div>
  )
}
