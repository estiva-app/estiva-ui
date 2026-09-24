import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * THE section-title label — every section heading (sidebar sections, menu
 * headings, panel titles) renders through this span, so a style change is
 * one edit. Peek's original, verbatim: 12px / 12px / 500, primary text
 * (Peek's ruling 2026-07-23: labels stay primary), the mono uppercase
 * micro-label under Signal. Metrics as arbitrary values for the tw-merge
 * reason the README records.
 *
 * `tone="secondary"` is a heading inside a menu or a list of results: it labels
 * the rows, it is not one of them (Katerina, 2026-09-01). `MenuSection` and
 * `CommandPalette` passed it as a class before UIG-9 (17 September).
 *
 * `tone="muted"` is a label that marks a place in a list rather than heading
 * it: a date between messages (Peek's `DateDivider`, UIG-25). `truncate` cuts a
 * long label short with an ellipsis where its row has no room, as a date line in
 * a narrow panel must.
 *
 * Deliberately NOT the same thing as Property's stacked field label (the
 * 9px `menu`-token one): they were merged for a day and unmerged by
 * Katerina's ruling (2026-09-01) — a section title and a field label are
 * different voices, at different sizes, on purpose.
 */
export function SectionLabel({
  children,
  tone = 'primary',
  truncate = false,
  className,
}: {
  children: ReactNode
  tone?: 'primary' | 'secondary' | 'muted'
  /** Cut a long label short with an ellipsis instead of letting it wrap or spill. */
  truncate?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-h5 leading-3 signal:font-mono signal:text-small signal:uppercase signal:tracking-widest',
        tone === 'secondary' ? 'text-text-secondary' : tone === 'muted' ? 'text-text-muted' : 'text-text-primary',
        truncate && 'min-w-0 truncate',
        className,
      )}
    >
      {children}
    </span>
  )
}
