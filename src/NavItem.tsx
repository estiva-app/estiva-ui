import { useId, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { IconAlertSquareRounded, IconChevronRight, IconDotsVertical } from '@tabler/icons-react'
import { cn } from './cn'
import { COLLAPSIBLE_PANEL_CLASSES, SIDEBAR_ROW_CLASSES, SIDEBAR_ROW_TEXT_CLASSES } from './looks'
import { IconButton } from './IconButton'
import { Menu } from './Menu'
import { UnreadDot } from './UnreadDot'
import { WithTooltip } from './Tooltip'

/**
 * One row of a sidebar: a label, an optional count, an active state
 * (Ship's NavItem, 2026-09-02, verbatim).
 *
 * A count is a number of ONE thing, and its tooltip says which ("18
 * open", "5 active") — the caller passes the number and the words for it,
 * and a zero is not drawn at all. That is this row's rule; a *tab's*
 * count draws its zero (see Tabs) — both rulings stand, deliberately.
 *
 * Active is the same fill as a selected tab — `bg-active`, neutral.
 *
 * `menu` gives the row a "More options" menu (UIG-44, Katerina, 30
 * September): a ⋮ that shows while the row is pointed at, focused or its
 * menu is open, in the count's place — the count steps aside rather than
 * sitting under it. The ⋮ is beside the link, not inside it (a button inside
 * an anchor is not a button), and follows it in the Tab order.
 *
 * `children` are rows under this one (Katerina, 2 October: Leaf's folder
 * tree). The row stays a link; while it is pointed at or focused its icon
 * gives way to an arrow that folds the rows, in the icon's own place — so a
 * row with rows under it is as wide as one without. The arrow is beside the
 * link, like the ⋮. The rows slide as `CollapsibleSection`'s do, indented
 * past the icon so their icons start under this row's label.
 *
 * `hint` is shown only while the row is pointed at or focused, left of the
 * count — a neutral `Chip`, typically. It takes its own room while it shows,
 * so the label ends with "…" before it instead of running under it.
 *
 * `unread` brightens the row's words and icon, sets the label in medium, and
 * draws the `UnreadDot` at the right; `urgent` with it draws the warning badge
 * in the dot's place (Katerina, 2 October: Peek's row, moved in). The ⋮ lands
 * on whatever is in that place, and with nothing there it takes no room until
 * the row is pointed at, so a label at rest keeps the row's whole width.
 *
 * Active is `bg-nav-active`, the current row in a sidebar, which each theme
 * sets: the selected tab's neutral fill in most, Signal's blue in Signal.
 */
export interface NavItemProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children'> {
  label: string
  href: string
  /** `0` or absent renders no counter. */
  count?: number
  /** What the count counts, for the tooltip — "18 open", "5 active". */
  countLabel?: string
  active?: boolean
  /** 16px, stroke 1.5. */
  icon?: ReactNode
  /** The row's "More options" menu: `MenuItem`s. Absent, the row has no menu and is exactly the plain row. */
  menu?: ReactNode
  /** The ⋮'s accessible name and tooltip. Default "More options for {label}". */
  menuLabel?: string
  /** Shown only while the row is pointed at or focused, left of the count: a neutral `Chip`, typically. */
  hint?: ReactNode
  /** Something new here: brighter words, the label in medium, and the `UnreadDot` at the right. Say so in the row's own words for assistive tech too. */
  unread?: boolean
  /** With `unread`: the warning badge in the dot's place. */
  urgent?: boolean
  /** Rows under this one, folding under it: `NavItem`s. While the row is pointed at or focused, its icon becomes the arrow. */
  children?: ReactNode
  /** With `children`: open unless told otherwise. */
  defaultOpen?: boolean
  /** With `children`: the caller owns the state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function NavItem({
  label,
  href,
  count,
  countLabel,
  active = false,
  icon,
  menu,
  menuLabel,
  hint,
  unread = false,
  urgent = false,
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  ...props
}: NavItemProps) {
  const [openState, setOpenState] = useState(defaultOpen)
  const panelId = useId()
  const hasRows = children != null && children !== false
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }
  // The row draws beside it — the ⋮, the arrow — so the pointer can leave the
  // link for them while the row still reads as the one it is on.
  const besides = menu != null || hasRows
  // What sits at the right at rest, after the count: the dot, or the badge.
  const mark = unread ? (urgent ? <UrgentMark /> : <UnreadDot />) : null
  // Under the ⋮ while it shows: the count and the mark step aside for it.
  // "While it shows" is the pointer on the row or the keyboard in it
  // (`:focus-visible`), never any focus: a clicked row keeps its focus, and
  // with `focus-within` its icon and dot went while the arrow and the ⋮ stayed
  // hidden (Katerina, 5 October).
  // A screen with no hover shows the ⋮ always (below), so what it lands on
  // steps aside always: the row reads as it does under a pointer.
  const stepsAside = menu != null && 'transition-opacity group-hover/nav:opacity-0 group-has-[:focus-visible]/nav:opacity-0 group-has-[[data-nav-menu]_[aria-expanded=true]]/nav:opacity-0 [@media(hover:none)]:opacity-0'

  const row = (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // shrink-0: the row keeps its 32px inside an overflowing flex column
        // — without it the list compresses instead of scrolling (the missing-
        // shrink-0 family; Katerina, 2026-09-02).
        'flex h-8 min-w-0 shrink-0 items-center gap-2 px-2 text-body-2',
        SIDEBAR_ROW_CLASSES,
        active ? 'bg-bg-nav-active text-text-primary' : cn(unread ? 'text-text-primary' : SIDEBAR_ROW_TEXT_CLASSES, 'hover:bg-bg-hover'),
        // With a menu the ⋮ sits beside the link, so the row keeps its hover
        // look while the ⋮ is pointed at and while its menu is open. The same
        // for the arrow.
        besides && !active && 'group-hover/nav:bg-bg-hover group-hover/nav:text-text-primary',
        menu != null && !active && 'group-has-[[data-nav-menu]_[aria-expanded=true]]/nav:bg-bg-hover group-has-[[data-nav-menu]_[aria-expanded=true]]/nav:text-text-primary',
        className,
      )}
      {...props}
    >
      {(icon || hasRows) && (
        <span
          className={cn(
            // With rows under it the slot is kept even with no icon: the arrow lands in it.
            'flex min-w-4 shrink-0 items-center',
            hasRows && 'transition-opacity group-hover/nav:opacity-0 group-has-[:focus-visible]/nav:opacity-0',
          )}
        >
          {icon}
        </span>
      )}
      <span className={cn('flex-1 truncate', unread && 'font-medium')}>{label}</span>
      {hint != null && (
        // Takes room only while it shows, so the label gives way to it.
        <span className="hidden shrink-0 items-center group-hover/nav:flex group-has-[:focus-visible]/nav:flex">{hint}</span>
      )}
      {count ? (
        <WithTooltip label={countLabel ?? `${count} open`}>
          {/* A 16px box, centred: the slot is an icon's width, so a number
              here sits on the same axis as a SectionHeader's action above it
              — right edges alone left a digit 4px off a 16px icon (Katerina,
              2026-09-09). A three-digit count grows the box leftwards. */}
          <span
            className={cn(
              'min-w-4 shrink-0 text-center font-mono text-caption tabular-nums text-text-muted',
              // With a menu and no mark after it, the ⋮ takes this place while it shows.
              !mark && stepsAside,
            )}
          >
            {count}
          </span>
        </WithTooltip>
      ) : null}
      {mark ? (
        // `-mr-1`: the 24px slot's dot then sits on the axis of a count and
        // of the ⋮ (8px from the edge to the 16px box), one column with a
        // folder heading's dot and ⋮ (Katerina, 5 October).
        <span className={cn('-mr-1 flex shrink-0', stepsAside)}>{mark}</span>
      ) : menu != null && !count ? (
        // Nothing at the right, but a menu: no room is kept at rest, so the
        // label has the row's whole width; while the ⋮ shows, its 24px slot
        // is kept, so a long label ends before it instead of running under it.
        <span aria-hidden="true" className="hidden w-6 shrink-0 group-hover/nav:block group-has-[:focus-visible]/nav:block group-has-[[data-nav-menu]_[aria-expanded=true]]/nav:block [@media(hover:none)]:block" />
      ) : null}
    </a>
  )
  if (!besides && hint == null) return row
  const name = menuLabel ?? `More options for ${label}`
  const line = (
    <div className="group/nav relative shrink-0">
      {row}
      {hasRows && (
        // `left-1`: the 24px button's 16px arrow then sits where the icon
        // sits (the row's px-2), so the icon turns into the arrow in place.
        <div className="absolute inset-y-0 left-1 flex items-center opacity-0 transition-opacity group-hover/nav:opacity-100 group-has-[:focus-visible]/nav:opacity-100">
          <IconButton
            tooltip={open ? 'Collapse' : 'Expand'}
            aria-label={open ? `Hide what is under ${label}` : `Show what is under ${label}`}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
          >
            <IconChevronRight size={16} stroke={1.5} className={cn('transition-transform duration-150', open && 'rotate-90')} />
          </IconButton>
        </div>
      )}
      {menu != null && (
        // `right-1`: the 24px button's 16px icon ends 8px from the row's
        // edge, where a count ends (px-2) — and where a SectionHeader's
        // actions and ⋮ end, so a folder's ⋮ and its rows' ⋮ are one column
        // (Katerina, 5 October: the rows move to the heading, not the
        // heading to the rows). Over a dot or the empty slot it sits 4px
        // right of the slot's centre.
        // On a screen with no hover it always shows: nothing there can point
        // at the row, and the menu has no other way in.
        <div data-nav-menu className={cn('absolute inset-y-0 right-1 flex items-center', 'opacity-0 transition-opacity group-hover/nav:opacity-100 group-has-[:focus-visible]/nav:opacity-100 has-[[aria-expanded=true]]:opacity-100 [@media(hover:none)]:opacity-100')}>
          <Menu
            align="right"
            trigger={
              <IconButton tooltip="More options" aria-label={name}>
                <IconDotsVertical size={16} stroke={1.5} />
              </IconButton>
            }
          >
            {menu}
          </Menu>
        </div>
      )}
    </div>
  )
  if (!hasRows) return line
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="flex shrink-0 flex-col">
      {line}
      {/* CollapsibleSection's slide, the same way: Base UI measures the panel
          and the height transitions, none under prefers-reduced-motion. */}
      <Collapsible.Panel
        id={panelId}
        hiddenUntilFound
        className={COLLAPSIBLE_PANEL_CLASSES}
      >
        {/* `pl-6`: past the 16px icon and its 8px gap, so the rows' icons start under this row's label. */}
        <div className="flex flex-col gap-0.5 pt-0.5 pl-6">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

/** Urgent and unread: a 12px warning mark on its tint, in the dot's 24px slot. */
function UrgentMark() {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center" data-urgent>
      <div className="flex items-center rounded-full bg-warning-muted p-0.5 signal:shadow-glow-warning">
        <IconAlertSquareRounded size={12} stroke={2.5} className="text-warning-default" />
      </div>
    </div>
  )
}
