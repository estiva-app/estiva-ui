import { AvatarGroup, type AvatarGroupMember } from './AvatarGroup'
import { Button } from './Button'
import { cn } from './cn'
import { MONO_CAPTION_CLASSES } from './looks'

export interface MembersPillProps {
  /** Who is in it, in order. Up to three faces are drawn. */
  members: AvatarGroupMember[]
  /** The number beside the faces. Defaults to how many members there are. */
  count?: number
  /** Opens the list — usually a `MembersDialog`. Without it the pill is disabled. */
  onClick?: () => void
  className?: string
}

/**
 * Who is in this: up to three faces and the total, in a small outlined pill
 * that opens the full list.
 *
 * Moved from Peek's `MembersPill` (2026-10-06), unchanged: the package's
 * Button, outlined, at its default 32px — the faces sit 3px inside the
 * hairline on the top, the bottom and the left, 8px from the count (Katerina's
 * pick of 15 September). `disabled` rather than another element when there is
 * nothing to press, so one element keeps one set of pixels.
 */
export function MembersPill({ members, count, onClick, className }: MembersPillProps) {
  const total = count ?? members.length
  if (total === 0) return null
  return (
    <Button variant="outlined" aria-label={`${total} ${total === 1 ? 'member' : 'members'}`} disabled={!onClick} onClick={onClick} className={cn('gap-2 pl-[3px] pr-2', className)}>
      <AvatarGroup members={members} />
      <span className={cn(MONO_CAPTION_CLASSES, 'signal:tabular-nums')}>{total}</span>
    </Button>
  )
}
