import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * THE section-title label (Peek's, 2026-09-01, verbatim): every section
 * heading — sidebar sections, menu headings, panel titles — renders through
 * this span, so a style change is one edit. It existed in both apps,
 * character for character except the Signal treatment, which is exactly how
 * "one edit" stops being true; now it exists once.
 *
 * 12px / 12px / 500, primary text (Peek's ruling 2026-07-23: labels stay
 * primary, in Signal too). Metrics as arbitrary values for the tw-merge
 * reason the README records. Under Signal it becomes the mono uppercase
 * micro-label.
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
