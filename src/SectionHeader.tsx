import type { ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { useRender } from '@base-ui/react/use-render'
import { cn } from './cn'
import { SIDEBAR_ROW_CLASSES, SIDEBAR_ROW_TEXT_CLASSES } from './looks'
import { IconButton } from './IconButton'
import { SectionLabel } from './SectionLabel'

/**
 * The 32px row a section starts with (Peek's SectionHeader, 2026-09-01):
 * a SectionLabel, an optional collapse chevron that makes the title the
 * toggle, and actions that appear while the row is hovered or focused, as
 * IconButtons with tooltips.
 *
 * Three things changed on 2026-09-09, for `CollapsibleSection`:
 *
 * - **The title is a button when it toggles.** It was a `div` with an
 *   `onClick`, so the keyboard could not open or close a section at all.
 *   The button fills the row up to the actions, so the whole row is still
 *   the hit target; the actions sit beside it rather than inside it,
 *   because a button inside a button is invalid HTML — and was why every
 *   action had to stop its click from also toggling.
 * - **The hover is CSS.** The fill and the actions' reveal were React
 *   state (`isHovered`), which the README forbids — a mount cannot stay in
 *   step with a transition. `group-hover` now; the actions are in the row
 *   at `opacity-0` until hovered or focused, so a keyboard user reaches
 *   them too.
 * - **`render`** lets `CollapsibleSection` hand in Base UI's
 *   `Collapsible.Trigger` as the title button — one header for the
 *   hand-held section (`isExpanded` / `onToggle`) and the Base UI one,
 *   with no second click handler.
 *
 * One API change from Peek's original, safe because no call site used the
 * old shape yet: the two hard-wired action slots (add, sort) became
 * `actions` — the caller brings the icon, the tooltip and the handler.
 */
export interface SectionAction {
  /** 16px, stroke 1.5. */
  icon: ReactNode
  tooltip: string
  onClick: () => void
}

export interface SectionHeaderProps {
  title: string
  /** Collapsible: draws the chevron and makes the title a button that toggles. */
  chevron?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  /**
   * Beside the title and always visible, before the actions — a count.
   *
   * The actions come and go with the hover; this does not, because a count is
   * information rather than an affordance. Peek's Screener header carries its
   * number as a `Chip` here, and was the last hand-drawn folding header in the
   * app for want of the slot (ADOPTION B23).
   */
  trailing?: ReactNode
  /** Right-aligned, in the order given. */
  actions?: SectionAction[]
  /** `hover` reveals the actions while the row is hovered or focused; `always` keeps them. */
  showActions?: 'hover' | 'always'
  /**
   * `fill` lights the row under the pointer when it does something (a toggle,
   * actions); `none` keeps it still — a heading whose actions are always shown,
   * where the buttons light up on their own (UIG-14, Katerina, 19 September).
   */
  hover?: 'fill' | 'none'
  /**
   * `heading` (default): a section's title, the `SectionLabel`. `quiet`: a
   * small grey label over a list (12px, muted) — "Folders" over the folders,
   * which never reads as one of them. `row`: a row among rows — the chevron
   * and the title at a row's weight and colour, as a sidebar row is (Katerina,
   * 30 September: Leaf's folders, in Ship).
   */
  look?: 'heading' | 'quiet' | 'row'
  /**
   * What the title renders as, in Base UI's manner. A plain button with
   * `onToggle` by default; `CollapsibleSection` hands in `Collapsible.Trigger`.
   */
  render?: useRender.RenderProp
  className?: string
}

export function SectionHeader({ title, chevron = false, isExpanded = true, onToggle, trailing, actions, showActions = 'hover', hover = 'fill', look = 'heading', render, className }: SectionHeaderProps) {
  const row = look === 'row'
  const titleElement = useRender({
    render: render ?? (chevron ? <button type="button" onClick={onToggle} aria-expanded={isExpanded} /> : <span />),
    props: {
      // `text-left`: a button centres its text. `h-full` and `flex-1`: the
      // whole row up to the actions is the hit target, as it was when the
      // row itself carried the click.
      className: cn('flex h-full min-w-0 flex-1 items-center text-left', row ? 'gap-2' : 'gap-1'),
      children: (
        <>
          {chevron && (
            <IconChevronRight
              size={row ? 16 : 12}
              stroke={1.5}
              className={cn('shrink-0 transition-transform duration-150', !row && 'text-text-secondary', isExpanded && 'rotate-90')}
            />
          )}
          {look === 'quiet' ? (
            <span className="min-w-0 truncate text-caption text-text-muted">{title}</span>
          ) : row ? (
            // A row's words: NavItem's size and colour, brightening under the pointer with the row.
            <span className="min-w-0 flex-1 truncate text-body-2">{title}</span>
          ) : (
            <SectionLabel folds={chevron}>{title}</SectionLabel>
          )}
        </>
      ),
    },
  })

  return (
    <div
      className={cn(
        'group flex h-[32px] shrink-0 items-center gap-1 px-2',
        !row && 'transition-colors',
        // A row is NavItem's shape and colour: 6px corners, secondary words that brighten on hover.
        row ? cn(SIDEBAR_ROW_CLASSES, SIDEBAR_ROW_TEXT_CLASSES) : 'rounded-lg',
        // The fill says "this does something": a row with a toggle or actions
        // lights up, a fixed heading over rows does not (2026-09-09, the
        // Sidebar's fixed group).
        // A quiet label never lights up: it is a label; its button does.
        hover === 'fill' && look !== 'quiet' && (chevron || (actions && actions.length > 0)) && 'hover:bg-bg-hover',
        className,
      )}
    >
      {titleElement}
      {/* Outside the title button, like the actions: a chip inside a button
          would be part of the button's accessible name and part of its hit
          target, and the count is neither. */}
      {trailing != null && <div className="flex shrink-0 items-center">{trailing}</div>}
      {actions && actions.length > 0 && (
        <div
          // `-mr-1`: an IconButton is 24px around a 16px icon, so at the row's
          // `px-2` its icon ended 12px from the edge while a NavItem's number
          // ends 8px from it; pulled 4px, the icon and the number share a
          // right edge (Katerina, 2026-09-09; measured 4px off, then 0).
          className={cn(
            '-mr-1 flex shrink-0 items-center gap-1',
            showActions === 'hover' && 'opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100',
          )}
        >
          {actions.map((action) => (
            <IconButton key={action.tooltip} tooltip={action.tooltip} aria-label={action.tooltip} onClick={action.onClick}>
              {action.icon}
            </IconButton>
          ))}
        </div>
      )}
    </div>
  )
}
