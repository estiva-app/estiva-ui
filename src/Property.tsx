import type { ReactNode } from 'react'
import { cn } from './cn'

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
 *   is the `menu` token (9px / 115% / 500), uppercase and letter-spaced —
 *   its own voice, deliberately not SectionLabel's (unmerged, Katerina
 *   2026-09-01). A literal string, not merged, so the token size survives.
 *
 * **A name and its value, in the markup made for it** (stage 6 of the
 * migration, 2026-09-14). Base UI has no part for this, so it is HTML's own:
 * a `<dl>` holding one `<dt>` (the label) and one `<dd>` (the value), so a
 * screen reader hears the label as the name of what follows rather than as a
 * loose word beside it. Each property is a list of one, which needs no
 * wrapper from the caller.
 */
export interface PropertyProps {
  label: string
  layout?: 'row' | 'stacked'
  children: ReactNode
  className?: string
}

/**
 * The value's `<dd>` draws no box of its own (`display: contents`): whatever
 * the caller passes stays a child of the row or the column, exactly as it was
 * before the `<dd>` existed — a control that fills the row (`flex-1`) still
 * fills it, and two values still sit the row's gap apart.
 */
const VALUE_CLASSES = 'contents'

export function Property({ label, layout = 'row', children, className }: PropertyProps) {
  if (layout === 'stacked') {
    return (
      // gap-3 — the one label-above-content distance (Katerina, 2026-09-01):
      // Peek's topic-details sections already sit at 12px, Ship's rail was
      // 6px, and unifying means the bigger, calmer one.
      <dl className={cn('flex flex-col gap-3', className)}>
        <dt className="text-menu uppercase tracking-[0.08em] text-text-secondary">{label}</dt>
        <dd className={VALUE_CLASSES}>{children}</dd>
      </dl>
    )
  }
  return (
    <dl className={cn('flex items-center gap-2', className)}>
      <dt className="w-[68px] shrink-0 text-caption text-text-secondary">{label}</dt>
      <dd className={VALUE_CLASSES}>{children}</dd>
    </dl>
  )
}
