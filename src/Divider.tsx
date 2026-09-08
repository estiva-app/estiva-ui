import { cn } from './cn'

/**
 * Peek's Divider (2026-08-28): a hairline in `border-subtle`, inset 12px each
 * side. Plus what Ship added: `orientation="vertical"` — the same hairline
 * standing up, stretching to its row's height, no inset — and the separator
 * role for assistive tech.
 */
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  /**
   * Words in the middle of the line — "New since you last read this", a
   * date. Horizontal only; the line splits around the label.
   */
  label?: string
  /**
   * `warning` for a line that asks for attention: the label in the warning
   * colour, the lines in its wash. Peek and Ship both drew their "new since
   * you last read" rule in the accent, which measures 3.3:1 on Ship's
   * background and could not be read (Katerina, 2026-09-08); the warning
   * colour measures 9.6:1 there. Default: the muted text, `border-subtle`
   * lines, for a date.
   */
  tone?: 'default' | 'warning'
  className?: string
}

export function Divider({ orientation = 'horizontal', label, tone = 'default', className }: DividerProps) {
  if (label && orientation === 'horizontal') {
    const line = tone === 'warning' ? 'bg-warning-muted' : 'bg-border-subtle'
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={label}
        className={cn('flex shrink-0 items-center gap-2 mx-3', className)}
      >
        <span aria-hidden="true" className={cn('h-px flex-1', line)} />
        <span className={cn('shrink-0 text-caption', tone === 'warning' ? 'text-warning-default' : 'text-text-muted')}>{label}</span>
        <span aria-hidden="true" className={cn('h-px flex-1', line)} />
      </div>
    )
  }
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
