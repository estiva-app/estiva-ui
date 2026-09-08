import { Avatar } from './Avatar'

/**
 * Up to three overlapping 24px faces with a `bg-surface` ring — Peek's member
 * stack (2026-09-01), with one generalisation on the way in: a member is a
 * name plus an optional picture URL, resolved by the caller, exactly as
 * Avatar takes its `src`. Peek's version took bare names because its Avatar
 * wrapper resolves pictures itself; a consumer without such a wrapper could
 * never have shown one.
 *
 * The ring is drawn OUTSIDE the face, as a shadow (2026-09-03). It was a
 * `border` before, which box-sizing takes out of the inside: a 24px avatar
 * showed 20px of face, and at 18px only 14px — noticeably smaller than the
 * number asked for. A shadow costs the face nothing, so `size` means the
 * size. It replaced an even older wrapper whose `overflow-hidden` clipped
 * 4px of face and the right edge of the initials with it ("CO" as "C(") —
 * hence the rule this file keeps: nothing that clips ever wraps the face.
 */
export interface AvatarGroupMember {
  name: string
  /** Resolved by the caller. Absent draws the initials. */
  picture?: string
}

export interface AvatarGroupProps {
  members: AvatarGroupMember[]
  /**
   * Face size in pixels; the overlap follows it. 24 is the members pill,
   * 18 the replies row (Katerina, 2026-09-03) — that row drew its own stack
   * for two months for want of this one number, and drifted while it did.
   */
  size?: number
}

export function AvatarGroup({ members, size = 24 }: AvatarGroupProps) {
  const visible = members.slice(0, 3)
  /*
    A third of the face, so a stack reads the same at any size — which is
    exactly the ratio both hand-drawn stacks had arrived at independently
    (8px on 24, 6px on 18). The container gives the last face its overlap
    back as padding, so the group measures its true width.
  */
  const overlap = Math.round(size / 3)
  // The ring scales with the face — 2px at 24, 1.5px at 18, which is what both
  // hand-drawn stacks used before this component carried either of them.
  const ring = size / 12
  return (
    <div className="flex items-center" style={{ paddingRight: overlap }}>
      {visible.map((member, i) => (
        /*
          The wrapper carries the overlap and the ring; the face carries
          neither. It must never clip — see the note at the top of the file —
          so it has the avatar's own radius and no overflow of its own.
        */
        <span
          key={i}
          className="relative flex rounded-sm"
          style={{ marginRight: -overlap, boxShadow: `0 0 0 ${ring}px var(--bg-surface)` }}
        >
          {/* Each face says whose it is: a stack stands on its own, with no
              name beside it to borrow. It read as its initials before —
              "AD BC CD" — which is the drawing, not the person. */}
          <Avatar size={size} name={member.name} src={member.picture} label={member.name} />
        </span>
      ))}
    </div>
  )
}
