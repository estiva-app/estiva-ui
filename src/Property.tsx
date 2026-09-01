import type { ReactNode } from 'react'
import { cn } from './cn'
import { SectionLabel } from './SectionLabel'

/**
 * A labelled property row — "Status", "Lead", and whatever else a page
 * declares (2026-09-01). Both apps carried one, and they had already
 * drifted: Peek's label was `text-xs` — a Tailwind default with the wrong
 * line-height, not the caption token — and Ship's had grown a layout Peek's
 * lacked. One component, both layouts, the token:
 *
 * - `row` — Peek's: a 68px label column that lines the values up into a
 *   column of their own; `text-secondary` rather than muted because a
 *   property label is content, not a placeholder.
 * - `stacked` — Ship's rail: the label above a full-width control. The label
 *   is the merged SectionLabel (9px / 115% / 500, uppercase, tracked —
 *   Katerina, 2026-09-01), read secondary because it labels a value.
 */
export interface PropertyProps {
  label: string
  layout?: 'row' | 'stacked'
  children: ReactNode
  className?: string
}

export function Property({ label, layout = 'row', children, className }: PropertyProps) {
  if (layout === 'stacked') {
    return (
      // gap-3 — the one label-above-content distance (Katerina, 2026-09-01):
      // Peek's topic-details sections already sit at 12px, Ship's rail was
      // 6px, and unifying means the bigger, calmer one.
      <div className={cn('flex flex-col gap-3', className)}>
        <SectionLabel className="text-text-secondary">{label}</SectionLabel>
        {children}
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="w-[68px] shrink-0 text-caption text-text-secondary">{label}</span>
      {children}
    </div>
  )
}
