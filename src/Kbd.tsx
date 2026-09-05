import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * A keyboard hint — the small chip that names the key which does the same thing.
 *
 * **The look is SearchInput's shortcut chip** (Katerina, 2026-09-05), which is
 * the one the apps already show: an inset pill with a hairline border, and under
 * Signal and Ship the keycap treatment — mono, 10px, a lighter fill and a thicker
 * bottom edge, so it reads as a key rather than a label.
 *
 * It existed before this file did, drawn inline inside `MenuItem` and again
 * inside `SearchInput`. Extracted when `Tooltip` needed a third copy.
 *
 * **Sizes are arbitrary values on purpose.** `text-caption` beside a
 * `text-{color}` is dropped by tailwind-merge, so the chip silently inherited
 * whatever size surrounded it — 10px in a composer, something else elsewhere.
 * `text-[12px]` survives the merge.
 *
 * Content is whatever names the key — a trigger character (`/`, `@`), a chord
 * (`Cmd+B`, `Ctrl+Alt+1`), or a word (`Esc`). It does not format anything: a caller
 * that knows the platform passes the label it wants.
 */
export interface KbdProps {
  children: ReactNode
  className?: string
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm border border-border-strong bg-bg-inset px-1 py-px font-sans text-[12px] leading-[120%] font-normal text-text-secondary',
        'signal:border-b-2 signal:pt-[2px] signal:pb-px signal:bg-[rgba(255,255,255,.05)] signal:font-mono signal:text-[10px]',
        'ship:border-b-2 ship:pt-[2px] ship:pb-px ship:bg-[rgba(255,255,255,.05)] ship:font-mono ship:text-[10px]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
