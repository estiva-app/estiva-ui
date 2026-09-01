import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * THE micro-label (2026-09-01): every section title — sidebar sections, menu
 * headings, panel sections, the rail's stacked property labels — renders
 * through this span, so a style change is one edit.
 *
 * Merged by Katerina's ruling (2026-09-01): the app carried two
 * near-identical micro-labels — this one at 12px (mono 10px under Signal)
 * and the rail's 9px uppercase `menu`-token label — and near-twins drift.
 * One label now, at the menu token's metrics: 9px / 115% / 500, uppercase,
 * tracked. Signal keeps only its mono voice; size and case are shared.
 *
 * Primary text by default (Peek's ruling 2026-07-23: labels stay primary);
 * pass a colour class where a quieter label is wanted — the rail's stacked
 * label reads secondary.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-[9px] leading-[115%] font-medium uppercase tracking-[0.08em] text-text-primary signal:font-mono',
        className,
      )}
    >
      {children}
    </span>
  )
}
