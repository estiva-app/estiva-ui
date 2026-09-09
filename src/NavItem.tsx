import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from './cn'
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
  className?: string
}

export function NavItem({ label, href, count, countLabel, active = false, icon, className, ...props }: NavItemProps) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // shrink-0: the row keeps its 32px inside an overflowing flex column
        // — without it the list compresses instead of scrolling (the missing-
        // shrink-0 family; Katerina, 2026-09-02).
        'flex h-8 min-w-0 shrink-0 items-center gap-2 rounded-md px-2 text-body-2 transition-colors',
        active ? 'bg-bg-active text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
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
          <span className="min-w-4 shrink-0 text-center font-mono text-caption tabular-nums text-text-muted">{count}</span>
        </WithTooltip>
      ) : null}
    </a>
  )
}
