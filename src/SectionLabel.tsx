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
 * Deliberately NOT the same thing as Property's stacked field label (the
 * 9px `menu`-token one): they were merged for a day and unmerged by
 * Katerina's ruling (2026-09-01) — a section title and a field label are
 * different voices, at different sizes, on purpose.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-[12px] leading-[12px] font-medium text-text-primary signal:font-mono signal:text-[10px] signal:uppercase signal:tracking-[0.14em]',
        className,
      )}
    >
      {children}
    </span>
  )
}
