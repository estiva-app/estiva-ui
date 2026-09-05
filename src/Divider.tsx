import { cn } from './cn'

/**
 * Peek's Divider (2026-08-28): a hairline in `border-subtle`, inset 12px each
 * side. Plus what Ship added: `orientation="vertical"` — the same hairline
 * standing up, stretching to its row's height, no inset — and the separator
 * role for assistive tech.
 */
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      // shrink-0 on both orientations: a 1px flex child in an overflowing
      // column shrinks to nothing, and a hairline that renders 0px tall is a
      // hairline nobody can see — Peek's `/` menu had been drawing two of
      // them, measured 0px, since it was built (2026-09-05).
      className={cn('shrink-0 bg-border-subtle', orientation === 'horizontal' ? 'h-px mx-3' : 'w-px self-stretch', className)}
    />
  )
}
