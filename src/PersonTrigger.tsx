import type { ComponentPropsWithRef } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { cn } from './cn'
import { Avatar } from './Avatar'
import { Person, type PersonProps } from './Person'

/**
 * The person, as the button that opens the account menu.
 *
 * Two shapes, one component (Katerina, 2026-09-01):
 *
 * - the row — face · name · chevron on a 32px button with a hover fill, as
 *   Ship's top bar draws it. The chevron is 14px, the small-control size.
 * - `compact` — the face alone, as Peek's top bar draws it: no chevron, no
 *   padding, and no hover fill, because the face fills the whole control and
 *   a fill would have nowhere to show.
 *
 * What it opens — the menu and everything in it — stays in the app.
 */
export interface PersonTriggerProps
  extends Omit<PersonProps, 'className'>,
    Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Whether what it opens is open — the row shape holds its hover fill while so. */
  open?: boolean
  /** Face only — Peek's top-bar shape. Defaults the face to 36px; the row shape to 22px. */
  compact?: boolean
}

export function PersonTrigger({ name, picture, fallback, size, open = false, compact = false, className, ...props }: PersonTriggerProps) {
  if (compact) {
    return (
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn('cursor-pointer rounded-full focus:outline-none', className)}
        {...props}
      >
        <Avatar name={name} src={picture} size={size ?? 36} />
      </button>
    )
  }
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      className={cn(
        // The size is an arbitrary value (the body-2 token): this list goes through
        // cn(), and tw-merge silently drops a custom text-{size} once a
        // text-{colour} follows it. Measured: the name rendered 16px.
        'flex h-8 cursor-pointer items-center gap-1.5 rounded-md pl-1.5 pr-1.5 text-[14px] leading-[140%] text-text-primary transition-colors hover:bg-bg-hover',
        open && 'bg-bg-hover',
        className,
      )}
      {...props}
    >
      <Person name={name} picture={picture} fallback={fallback} size={size ?? 22} className="gap-2" />
      <IconChevronDown size={14} stroke={1.5} className="shrink-0 text-text-muted" />
    </button>
  )
}
