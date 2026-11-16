import type { MouseEvent, ReactNode } from 'react'
import { cn } from './cn'
import { Link } from './Link'
import { MenuItemBody, menuItemClassName } from './Menu'
import { MetaText } from './MetaText'
import { Person } from './Person'

export interface ActivityLineProps {
  /** Who did it: their face and name. */
  person: { name: string; picture?: string; bot?: boolean }
  /** What they did, after their name: "replied to you", "reacted 👍 to your message". The app's words. */
  did: string
  /** When, short: "2h", "Fri 14:02". At the right of the first line, in a count's type. */
  time: string
  /** What kind of thing it is, a 16px icon beside the first line: a reply, a mention, a reaction. */
  mark?: ReactNode
  /** Where it was said, before the words: "Design › Brief". */
  where?: string
  /** What they said, cut to one line. */
  words?: string
  /** Seen already: the name in the secondary text, as an Earlier line. Default: new, in the primary text. */
  seen?: boolean
  /** Opens where it was said, as a link: Cmd- or Ctrl-click opens a new tab. Absent, the line is a button. */
  href?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  'aria-label'?: string
  /** Placement only. */
  className?: string
  /** Marks for the app's own tests and photo runs: `data-reaction`, `data-seen`. */
  [data: `data-${string}`]: string | boolean | undefined
}

/**
 * One thing that happened, in a list of them: a mark for what kind of thing it is, who did it and what, when; under
 * it where it was said and the words. A menu row's look: a fill under the pointer and no edge, 8px corners, the mark
 * beside the first line. Peek drew it twice by hand, as a card with an edge that showed on hover (its lit row's card)
 * and inside a menu row (the navigation prototype's dot), five boxes with their own type each (Katerina, 16 November).
 */
export function ActivityLine({ person, did, time, mark, where, words, seen = false, href, onClick, className, ...rest }: ActivityLineProps) {
  const body = (
    <MenuItemBody leading={mark} leadingAt="top">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('flex min-w-0 shrink-0 text-body-2-strong', seen ? 'text-text-secondary' : 'text-text-primary')}>
            <Person size={16} name={person.name} {...(person.picture ? { picture: person.picture } : {})} {...(person.bot ? { bot: true } : {})} />
          </span>
          <span className="min-w-0 truncate text-body-2 text-text-secondary">{did}</span>
          <MetaText size="chip" className="ml-auto shrink-0">
            {time}
          </MetaText>
        </span>
        {(where || words) && (
          <span className="truncate text-caption text-text-muted">
            {where && <span className="text-text-secondary">{`${where}${words ? ' · ' : ''}`}</span>}
            {words}
          </span>
        )}
      </span>
    </MenuItemBody>
  )
  const row = menuItemClassName({ size: 'default', className })
  if (href) {
    return (
      <Link href={href} variant="plain" className={row} {...(onClick ? { onClick } : {})} {...rest}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" className={row} {...(onClick ? { onClick } : {})} {...rest}>
      {body}
    </button>
  )
}
