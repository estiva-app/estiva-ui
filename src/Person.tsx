import { cn } from './cn'
import { Avatar } from './Avatar'

/**
 * A face beside a name. Ship's Person (2026-09-01), which was Peek's minus
 * the projection type it took its profile from: this one is handed the two
 * strings and nothing else, so it cannot be handed a key. Peek keeps a
 * wrapper that resolves the profile, the way its Avatar wrapper resolves the
 * picture.
 *
 * A face beside a name needs no caption (Peek's rulings), and someone nobody
 * has published a name for gets the `fallback` — an em dash by default, the
 * same mark a property with no value uses — rather than the key back on
 * screen to say it. Pass "Anonymous" where the unnamed person is *you*, and
 * you know who that is.
 *
 * The text size is the caller's, so the face and the words are always set
 * together — see the Sizes story.
 */
export interface PersonProps {
  name?: string
  picture?: string
  /** Shown in place of a missing name. */
  fallback?: string
  size?: number
  className?: string
}

export function Person({ name, picture, fallback = '—', size = 20, className }: PersonProps) {
  return (
    // gap-2: the face-to-name distance is one rule (8px) wherever a person
    // appears — Katerina, 2026-09-01, set on Person so PersonTrigger and every
    // row agree by construction.
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar name={name} src={picture} size={size} />
      <span className={cn('truncate', !name && 'text-text-muted')}>{name ?? fallback}</span>
    </span>
  )
}
