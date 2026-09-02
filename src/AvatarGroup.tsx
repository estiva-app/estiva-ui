import { Avatar } from './Avatar'

/**
 * Up to three overlapping 24px faces with a `bg-surface` ring — Peek's member
 * stack (2026-09-01), with one generalisation on the way in: a member is a
 * name plus an optional picture URL, resolved by the caller, exactly as
 * Avatar takes its `src`. Peek's version took bare names because its Avatar
 * wrapper resolves pictures itself; a consumer without such a wrapper could
 * never have shown one.
 *
 * The ring sits on the Avatar itself: the old extra wrapper was a 24px
 * window minus a 2px border with a fixed 24px Avatar inside, so
 * overflow-hidden clipped 4px of face — and the right edge of the initials
 * with it, which is how "CO" rendered as "C(". One box, whole letters.
 */
export interface AvatarGroupMember {
  name: string
  /** Resolved by the caller. Absent draws the initials. */
  picture?: string
}

export interface AvatarGroupProps {
  members: AvatarGroupMember[]
}

export function AvatarGroup({ members }: AvatarGroupProps) {
  const visible = members.slice(0, 3)
  return (
    <div className="flex items-center pr-2">
      {visible.map((member, i) => (
        <Avatar
          key={i}
          size={24}
          name={member.name}
          src={member.picture}
          alt={member.name}
          className="-mr-2 relative border-2 border-bg-surface"
        />
      ))}
    </div>
  )
}
