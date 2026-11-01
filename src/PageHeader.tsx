import { Fragment, type ReactNode } from 'react'
import { IconLock } from '@tabler/icons-react'
import { cn } from './cn'
import { ContainerHeader } from './ContainerHeader'
import { MetaText } from './MetaText'
import { WithTooltip } from './Tooltip'

/** One of the quiet words at the right of a `PageHeader`: a count, and whether it is about what is finished. */
export interface PageHeaderMeta {
  /** The words: "6 open", "2 done". */
  label: string
  /** Words about what is finished: in the success colour. Default: the secondary text. */
  done?: boolean
}

/**
 * The bar at the top of a page: what the page is, and what acts on all of it.
 * ContainerHeader's bar (48px, a hairline under it, 16px in at each end) with
 * a fixed place for each thing the apps' own page bars hold, so they stop
 * laying them out one by one.
 *
 * At the left, in this order, 8px apart: an icon or a face, a lock, the title,
 * something right after it. At the right, 12px apart: quiet words (counts),
 * when it last changed, the members, then the page's buttons. Those numbers
 * are Peek's page bar and Leaf's, measured on 31 October: the counts and the
 * members are one group 12px clear of the buttons (Katerina, 8 October), and
 * the buttons sit 4px apart, as every bar's do.
 */
export interface PageHeaderProps {
  /**
   * The page's name. A string is one line in `body-2-strong`, cut short with
   * an ellipsis when there is no room. A node — a `Breadcrumb`, an
   * `InlineText` — is drawn as given, in the room that is left.
   */
  title: ReactNode
  /** Before the title, 16px: an icon at stroke 1.5, or a face (`Avatar size={16}`). A bare icon takes the secondary text colour. */
  leading?: ReactNode
  /** A lock before the title: only its members can open this page. Named "Private" to assistive technology and in a tooltip. */
  private?: boolean
  /** Right after the title, 8px from it, and never cut short: a small `Button`, a `Chip`. */
  after?: ReactNode
  /** Quiet words at the right, before the members: counts. A dot between each, each in `MetaText` (in Signal, the mono micro-type). */
  meta?: (string | PageHeaderMeta)[]
  /** When it last changed, in words — "Edited 2 minutes ago" — 12px italic, with the exact time in a tooltip. */
  time?: { label: string; exact: string }
  /** Who is in it: a `MembersPill`. */
  members?: ReactNode
  /** The page's own buttons, at the right edge: a `Toolbar` with `surface={false}` of `ToolbarButton`s, or one `IconButton`. */
  actions?: ReactNode
  /** Placement only. */
  className?: string
}

export function PageHeader({ title, leading, private: locked = false, after, meta, time, members, actions, className }: PageHeaderProps) {
  const words = (meta ?? []).map((one) => (typeof one === 'string' ? { label: one } : one))
  const quiet = words.length > 0 || time != null || members != null

  const name = (
    <div className="flex min-w-0 items-center gap-2">
      {leading != null && <span className="flex shrink-0 items-center text-text-secondary">{leading}</span>}
      {locked && (
        <WithTooltip label="Private">
          <IconLock size={16} stroke={1.5} role="img" aria-label="Private" className="shrink-0 text-text-secondary" />
        </WithTooltip>
      )}
      {typeof title === 'string' ? <span className="truncate text-body-2-strong text-text-primary">{title}</span> : <div className="flex min-w-0 items-center">{title}</div>}
      {after != null && <span className="flex shrink-0 items-center">{after}</span>}
    </div>
  )

  const right =
    quiet || actions != null ? (
      <>
        {quiet && (
          // The quiet group: 12px between its parts, and 12px clear of the buttons — the bar sets
          // its actions 4px apart, so the group adds the other 8px, as Peek's and Leaf's bars do.
          <div className={cn('flex items-center gap-3', actions != null && 'pr-2')}>
            {words.length > 0 && (
              <div className="flex items-center gap-2">
                {words.map((one, i) => (
                  <Fragment key={`${one.label}-${i}`}>
                    {i > 0 && (
                      // eslint-disable-next-line token-spacing/no-restricted-classes -- @estiva-escape: Peek's dot between its counts, 3px measured on 31 October; the scale steps from 2px to 4px
                      <span aria-hidden="true" className="size-[3px] shrink-0 rounded-full bg-text-muted" />
                    )}
                    <MetaText tone={one.done ? 'success' : 'secondary'}>{one.label}</MetaText>
                  </Fragment>
                ))}
              </div>
            )}
            {time && (
              <WithTooltip label={time.exact}>
                {/* Quieter than the title: 12px and italic, as every "time ago" line is (Katerina, 30 October), in the muted words (1 November). */}
                <span className="whitespace-nowrap text-caption italic text-text-muted">{time.label}</span>
              </WithTooltip>
            )}
            {members}
          </div>
        )}
        {actions}
      </>
    ) : undefined

  return <ContainerHeader title={name} actions={right} className={className} />
}
