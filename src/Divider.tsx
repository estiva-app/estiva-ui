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
      className={cn('bg-border-subtle', orientation === 'horizontal' ? 'h-px mx-3' : 'w-px self-stretch shrink-0', className)}
    />
  )
}
