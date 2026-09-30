import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { IconDotsVertical } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Menu } from './Menu'
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
 */
export interface NavItemProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
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
  className?: string
}

export function NavItem({ label, href, count, countLabel, active = false, icon, menu, menuLabel, className, ...props }: NavItemProps) {
  const row = (
    // @estiva-escape(no-copied-look): N5 (Katerina, 24 September: record only): a row that fills on hover, as PersonTrigger's row also does
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // shrink-0: the row keeps its 32px inside an overflowing flex column
        // — without it the list compresses instead of scrolling (the missing-
        // shrink-0 family; Katerina, 2026-09-02).
        'flex h-8 min-w-0 shrink-0 items-center gap-2 rounded-md px-2 text-body-2 transition-colors',
        active ? 'bg-bg-active text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
        // With a menu the ⋮ sits beside the link, so the row keeps its hover
        // look while the ⋮ is pointed at and while its menu is open.
        menu != null && !active && 'group-hover/nav:bg-bg-hover group-hover/nav:text-text-primary group-has-[[aria-expanded=true]]/nav:bg-bg-hover group-has-[[aria-expanded=true]]/nav:text-text-primary',
        className,
      )}
      {...props}
    >
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {count ? (
        <WithTooltip label={countLabel ?? `${count} open`}>
          {/* A 16px box, centred: the slot is an icon's width, so a number
              here sits on the same axis as a SectionHeader's action above it
              — right edges alone left a digit 4px off a 16px icon (Katerina,
              2026-09-09). A three-digit count grows the box leftwards. */}
          <span
            className={cn(
              'min-w-4 shrink-0 text-center font-mono text-caption tabular-nums text-text-muted',
              // With a menu, the ⋮ takes this place while it shows.
              menu != null && 'transition-opacity group-hover/nav:opacity-0 group-focus-within/nav:opacity-0 group-has-[[aria-expanded=true]]/nav:opacity-0',
            )}
          >
            {count}
          </span>
        </WithTooltip>
      ) : menu != null ? (
        // No count, but a menu: the count's place is kept free, so a long
        // label truncates before the ⋮ instead of running under it.
        <span aria-hidden="true" className="min-w-4 shrink-0" />
      ) : null}
    </a>
  )
  if (menu == null) return row
  const name = menuLabel ?? `More options for ${label}`
  return (
    <div className="group/nav relative shrink-0">
      {row}
      {/* `right-1`: the 24px button's 16px icon then ends 8px from the row's
          edge, where the count ends (px-2), so the ⋮ lands on the number. */}
      <div className="absolute inset-y-0 right-1 flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/nav:opacity-100 has-[[aria-expanded=true]]:opacity-100">
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
    </div>
  )
}
