import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * The icon rail: a 64px strip of RailItems (the shell of Peek's NavRail,
 * 2026-09-02 — its entries and their routes stayed in the app).
 *
 * It has no border and no surface of its own — it stands on the app
 * background, beside whatever card or column the app draws. Collapsing
 * is the caller's: the rail does not know about the burger, it only gets
 * given less room (or none) to stand in. Desktop only.
 */
export interface RailProps {
  /** Names the navigation region for assistive tech. */
  'aria-label'?: string
  children: ReactNode
  className?: string
}

export function Rail({ 'aria-label': ariaLabel = 'Navigation', children, className }: RailProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('flex w-16 shrink-0 flex-col items-start gap-2 px-2 py-3', className)}>
      {children}
    </nav>
  )
}
