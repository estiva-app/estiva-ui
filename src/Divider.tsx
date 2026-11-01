import { createContext, useContext, useId, type ReactNode } from 'react'
import { Separator } from '@base-ui/react/separator'
import { cn } from './cn'
import { SectionLabel } from './SectionLabel'

/**
 * Inside a `Menu` or a `Popover` a hairline runs edge to edge of the rows,
 * with no inset of its own. The two panels used to reach in for it
 * (`[&>[role=separator]]:mx-0`); they say so through this instead (UIG-9,
 * 17 September). Not exported: only those two panels set it.
 */
export const DividerInPanel = createContext(false)

/**
 * Peek's Divider (2026-08-28): a hairline in `border-subtle`, inset 12px each
 * side. Plus what Ship added: `orientation="vertical"` — the same hairline
 * standing up, stretching to its row's height, no inset.
 *
 * On Base UI's `Separator` since stage 6 of the migration (2026-09-14). It
 * writes the `separator` role and `aria-orientation` this component used to
 * write by hand, and adds `data-orientation`. Nothing it draws changed.
 */
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  /**
   * Words in the middle of the line — "New since you last read this", a
   * date. Horizontal only; the line splits around the label. A string names
   * the line for assistive tech; so does a node, by its words.
   */
  label?: ReactNode
  /**
   * How the words in the middle are drawn.
   *
   * - `caption` (default): the muted caption, the line inset 12px each side.
   * - `section`: Peek's line between stretches of a list (its `DateDivider`,
   *   measured 31 October): the words in `SectionLabel`'s muted voice, cut
   *   short with an ellipsis where there is no room; the lines edge to edge,
   *   8px in and 6px above and below — 24px tall.
   */
  look?: 'caption' | 'section'
  /**
   * Stays at the top of the list that scrolls under it until the next one
   * takes its place: `sticky top-0` on the surface's fill, as Peek's date
   * lines are. Put each one first in the box that holds its stretch.
   */
  sticky?: boolean
  /**
   * `warning` for a line that asks for attention: the label in the warning
   * colour, the lines in its wash. Peek and Ship both drew their "new since
   * you last read" rule in the accent, which measures 3.3:1 on Ship's
   * background and could not be read (Katerina, 2026-09-08); the warning
   * colour measures 9.6:1 there. Default: the muted text, `border-subtle`
   * lines, for a date. The caption look's only: the section look is always
   * muted.
   */
  tone?: 'default' | 'warning'
  className?: string
}

export function Divider({ orientation = 'horizontal', label, tone = 'default', look = 'caption', sticky = false, className }: DividerProps) {
  const inset = useContext(DividerInPanel) ? 'mx-0' : 'mx-3'
  const labelId = useId()
  if (label != null && label !== false && label !== '' && orientation === 'horizontal') {
    const line = tone === 'warning' ? 'bg-warning-muted' : 'bg-border-subtle'
    // A string names the line itself, as it always has; a node names it by its words.
    const named = typeof label === 'string' ? { 'aria-label': label } : { 'aria-labelledby': labelId }
    const id = typeof label === 'string' ? undefined : labelId
    const stays = sticky && 'sticky top-0 z-10 bg-bg-surface'
    if (look === 'section') {
      // No warning here: SectionLabel has no warning voice, and a line that asks for attention is the caption
      // look's, as both apps' "New" lines are.
      return (
        <Separator orientation="horizontal" {...named} className={cn('flex shrink-0 items-center gap-2 px-2 py-1.5', stays, className)}>
          <span aria-hidden="true" className="h-px flex-1 bg-border-subtle" />
          {/* min-w-0 on the way down: a long label is cut short with an ellipsis instead of pushing past the edge. */}
          <span id={id} className="flex min-w-0">
            <SectionLabel tone="muted" truncate>
              {label}
            </SectionLabel>
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-border-subtle" />
        </Separator>
      )
    }
    return (
      <Separator
        orientation="horizontal"
        {...named}
        className={cn('flex shrink-0 items-center gap-2', inset, stays, className)}
      >
        <span aria-hidden="true" className={cn('h-px flex-1', line)} />
        <span id={id} className={cn('shrink-0 text-caption', tone === 'warning' ? 'text-warning-default' : 'text-text-muted')}>{label}</span>
        <span aria-hidden="true" className={cn('h-px flex-1', line)} />
      </Separator>
    )
  }
  return (
    <Separator
      orientation={orientation}
      // shrink-0 on both orientations: a 1px flex child in an overflowing
      // column shrinks to nothing, and a hairline that renders 0px tall is a
      // hairline nobody can see — Peek's `/` menu had been drawing two of
      // them, measured 0px, since it was built (2026-09-05).
      className={cn('shrink-0 bg-border-subtle', orientation === 'horizontal' ? cn('h-px', inset) : 'w-px self-stretch', className)}
    />
  )
}
