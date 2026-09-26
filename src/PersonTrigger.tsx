import type { ComponentPropsWithRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { IconChevronDown } from '@tabler/icons-react'
import { cn } from './cn'
import { Avatar } from './Avatar'
import { Person, type PersonProps } from './Person'

/**
 * The person, as the button that opens the account menu. On Base UI's Button
 * since stage 2 of the migration (2026-09-07).
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
  /** Face only — no chevron, no hover fill. Defaults the face to 36px; the row shape to 22px. */
  compact?: boolean
}

export function PersonTrigger({ name, picture, fallback, size, open = false, compact = false, className, ...props }: PersonTriggerProps) {
  if (compact) {
    return (
      <BaseButton
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        /*
          The face alone is an icon-only control, so it owes a name. It has
          one already — the person — and taking it from there means no caller
          can forget: measured 2026-09-08, this button announced **"AD"**, the
          initials, with no `aria-label` anywhere. A caller that wants to name
          the destination rather than the person still can, and `IdentityMenu`
          does ("Account menu").
        */
        aria-label={props['aria-label'] ?? name ?? fallback}
        /*
          No `focus:outline-none` here any more. It removed the browser's ring
          and put nothing in its place, so this control — the account trigger
          in Peek's top bar — had **no visible focus at all** (measured
          2026-09-08: `outline: solid 2px rgba(0,0,0,0)`, no shadow). Left
          alone it wears the same ring `Button`, `IconButton` and a `Tab`
          wear, which is the ring the rest of the package already relies on.
        */
        className={cn('cursor-pointer rounded-full', className)}
        {...props}
      >
        <Avatar name={name} src={picture} size={size ?? 36} />
      </BaseButton>
    )
  }
  return (
    // @estiva-escape(no-copied-look): N5 (Katerina, 24 September: record only): a row that fills on hover, as NavItem also does
    <BaseButton
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      className={cn(
        'flex h-8 min-h-8 cursor-pointer items-center gap-1.5 rounded-md pl-1.5 pr-1.5 text-body-2 text-text-primary transition-colors hover:bg-bg-hover',
        open && 'bg-bg-hover',
        // Under a `Menu` the open state is Base UI's, not a prop: the trigger
        // carries `data-popup-open` while its menu is up, and sets its own
        // `aria-expanded`. Both spellings hold the fill, so this works whether
        // the caller drives it or the menu does.
        'data-[popup-open]:bg-bg-hover',
        className,
      )}
      {...props}
    >
      <Person name={name} picture={picture} fallback={fallback} size={size ?? 22} />
      <IconChevronDown size={14} stroke={1.5} className="shrink-0 text-text-muted" />
    </BaseButton>
  )
}
