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
  /**
   * Says who is in it and is nothing to press: the pill's own look, not greyed as a disabled one — in a list's row,
   * which opens its thing (Katerina, 17 November: "clicking on the pill should not show the members list. And we need to
   * use the estiva ui component"). `onClick` is not taken with it.
   */
  readOnly?: boolean
  /** The button's accessible name, when the list it opens is not "members" — "Who follows <name>: 4". Defaults to "4 members". */
  label?: string
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
export function MembersPill({ members, count, onClick, readOnly = false, label, className }: MembersPillProps) {
  const total = count ?? members.length
  if (total === 0) return null
  const name = label ?? `${total} ${total === 1 ? 'member' : 'members'}`
  if (readOnly)
    return (
      // The outlined Button's own pixels — its height, corners, line and words — with nothing to press: one picture, read as one.
      // @estiva-escape(no-copied-look): the read-only pill IS the outlined Button's look, drawn without a button
      <span role="img" aria-label={name} className={cn('inline-flex h-8 min-h-8 shrink-0 items-center gap-2 rounded-md border border-border-default pl-[3px] pr-2 font-sans font-medium text-btn-default text-text-primary', className)}>
        <AvatarGroup members={members} />
        <span className={cn(MONO_CAPTION_CLASSES, 'signal:tabular-nums')}>{total}</span>
      </span>
    )
  return (
    <Button variant="outlined" aria-label={name} disabled={!onClick} onClick={onClick} className={cn('gap-2 pl-[3px] pr-2', className)}>
      <AvatarGroup members={members} />
      <span className={cn(MONO_CAPTION_CLASSES, 'signal:tabular-nums')}>{total}</span>
    </Button>
  )
}
