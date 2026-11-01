import type { CSSProperties } from 'react'
import { cn } from './cn'

/**
 * Peek's Skeleton (2026-08-28): the bar, a row shaped like a list row, a
 * list of them, and the conversation's placeholder, moved with the
 * conversation (Katerina, 31 October). Placeholders of an app's own cards
 * stay in the app, built from the bar.
 *
 * A list reveals after 150ms (`animate-skeleton-in`, in the preset) so a
 * fast load never flashes a skeleton — Peek's rule.
 */
const SKELETON_SHAPE = { bar: 'rounded-sm', round: 'rounded-full', control: 'rounded-md' } as const

/** One pulsing bar at the inset colour: the piece every placeholder here is
 *  built from. It draws nothing of its own — give it a width and a height.
 *  `on="inset"` on an inset card, where the inset colour would vanish;
 *  `shape` for a line of words, a face or a ring, or a control. */
export function SkeletonBar({ className, style, on = 'surface', shape = 'bar' }: { className?: string; style?: CSSProperties; on?: 'surface' | 'inset'; shape?: keyof typeof SKELETON_SHAPE }) {
  return <div className={cn('animate-pulse', SKELETON_SHAPE[shape], on === 'inset' ? 'bg-bg-active' : 'bg-bg-inset', className)} style={style} />
}

const ROW_BAR_WIDTHS = [150, 100, 170, 120, 90, 140, 110, 160]

/** A 32px row: a 16px square and a bar, like a row with a face and a name. */
export function SkeletonRow({ barWidth = 130 }: { barWidth?: number }) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-2 h-[32px] rounded-lg">
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

/** One comment's placeholder: a face, a name and a time, and two lines of words. */
function SkeletonCard({ secondLine }: { secondLine: number }) {
  return (
    <div className="rounded-lg px-2 pt-2">
      <div className="flex w-full items-center gap-2">
        <SkeletonBar className="h-6 w-6 shrink-0" />
        <SkeletonBar className="h-3.5 w-[110px]" />
        <SkeletonBar className="h-3 w-10" />
      </div>
      <div className="flex flex-col gap-2 pb-2 pl-8 pr-2 pt-2">
        <SkeletonBar className="h-3.5 w-full" />
        {/* Never wider than its row: in a 384px column the line ran past the edge. */}
        <SkeletonBar className="h-3.5 max-w-full" style={{ width: secondLine }} />
      </div>
    </div>
  )
}

/** Comments still coming: three placeholders shaped like `ConversationCard`, revealed after 150ms. Peek's, moved with the conversation. */
export function SkeletonConversation({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 animate-skeleton-in', className)} aria-hidden>
      <SkeletonCard secondLine={420} />
      <SkeletonCard secondLine={300} />
      <SkeletonCard secondLine={500} />
    </div>
  )
}
