import type { MouseEventHandler } from 'react'
import { IconUsers } from '@tabler/icons-react'
import { Chip } from './Chip'

/**
 * The team a page's thing belongs to: the one chip right after its name in the
 * page's bar (`PageHeader`'s `after`), on an initiative's page and on a file's.
 *
 * Katerina, 17 November: "one chip after the name, the team"; 18 November (D4,
 * D7): the same chip in Ship and Leaf as Peek's. Each app drew it by hand, the
 * kit's Chip with the team icon at a chip's 12px; on 23 November she asked for it
 * here, in the same release as the initiative's ◎.
 *
 * It opens the team's page where the app has one (Peek, Ship). Where it has none
 * (Leaf), it only names the team.
 */
export interface TeamChipProps {
  /** The team's name, as its page says it. */
  name: string
  /** The team's page. Leave it out where the app has no team page: the chip then opens nothing. */
  href?: string
  /** With `href`: a router app takes the click here, like `Chip`'s. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** The chip after a page's name saying which team its thing belongs to. */
export function TeamChip({ name, href, onClick }: TeamChipProps) {
  return <Chip label={name} leadingIcon={<IconUsers size={12} stroke={1.5} aria-hidden />} href={href} onClick={onClick} />
}
