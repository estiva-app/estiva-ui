import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from './cn'
import { Link } from './Link'

/**
 * A box that stands for one thing — a conversation, a project, a file, an
 * object from another app — drawn as its frame: 8px corners, a fill, a
 * hairline. What goes inside, and the space around it, is the caller's.
 *
 * Both apps drew their cards by hand: 18 of them, sorted by Katerina from
 * photographs on 14 September (UIG-27, docs/GATES.md §0). Her rulings:
 *
 * - **The fill is chosen by what the card sits on**: `surface` on the page,
 *   `elevated` on something already filled, `inset` inside a message, `none`
 *   for a hairline alone.
 * - **The hairline follows the fill**: the default hairline on `surface` and
 *   `elevated`, the subtle one on `inset` and `none`. Every card has 8px
 *   corners.
 * - **A card you can pick answers the pointer.** `hairline`: the hairline one
 *   step stronger — what a card that is a link does. `fill`: the card lights
 *   up and its hairline shows — what a card in a feed does, where the light
 *   says which one you are on.
 * - **A card that cannot be read has a dashed hairline**, in both apps.
 *
 * No padding of its own: the cards measured 0 to 12px, and a card with none
 * was one whose content pads itself.
 */
export type CardFill = 'surface' | 'elevated' | 'inset' | 'none'
export type CardHover = 'none' | 'hairline' | 'fill'
export type CardAttention = 'accent' | 'warning'

const FILL_CLASSES: Record<CardFill, string> = {
  surface: 'bg-bg-surface border-border-default',
  elevated: 'bg-bg-elevated border-border-default',
  inset: 'bg-bg-inset border-border-subtle',
  none: 'border-border-subtle',
}

/** One step stronger than the fill's own hairline. */
const HAIRLINE_HOVER_CLASSES: Record<CardFill, string> = {
  surface: 'hover:border-border-strong',
  elevated: 'hover:border-border-strong',
  inset: 'hover:border-border-default',
  none: 'hover:border-border-default',
}

const ATTENTION_CLASSES: Record<CardAttention, string> = {
  accent: 'border-accent-muted hover:border-accent-muted',
  warning: 'border-warning-muted hover:border-warning-muted',
}

export interface CardProps extends ComponentPropsWithRef<'div'> {
  /** What the card sits on. Default `surface`. */
  fill?: CardFill
  /** The whole card is a link: an anchor, and its hairline answers the pointer. Navigation stays the app's, as with `Link`. */
  href?: string
  /** How it answers the pointer. Default `hairline` with an `href`, `none` without. */
  hover?: CardHover
  /** No hairline until it is pointed at — a row in a feed that shows its edge only when you are on it. */
  quietUntilHover?: boolean
  /** The one you are on: the selected fill, a subtle hairline, and no hover. */
  selected?: boolean
  /** Being changed in place: the selected fill with the accent hairline, and no hover. */
  active?: boolean
  /** A hairline that asks to be looked at — something new (`accent`), or urgent (`warning`). */
  attention?: CardAttention
  /** It stands for something that could not be read: the hairline is dashed. */
  unreadable?: boolean
  children: ReactNode
}

export function Card({
  fill = 'surface',
  href,
  hover = href ? 'hairline' : 'none',
  quietUntilHover = false,
  selected = false,
  active = false,
  attention,
  unreadable = false,
  className,
  children,
  ...props
}: CardProps) {
  const still = selected || active
  const classes = cn(
    'rounded-lg border',
    // A card that never changes has nothing to ease between, and the apps' still cards carry no transition.
    hover !== 'none' && 'transition-colors',
    FILL_CLASSES[fill],
    quietUntilHover && 'border-transparent',
    !still && hover === 'hairline' && HAIRLINE_HOVER_CLASSES[fill],
    !still && hover === 'fill' && 'hover:bg-bg-hover hover:border-border-default',
    !still && hover !== 'none' && !href && props.onClick && 'cursor-pointer',
    selected && 'bg-bg-selected border-border-subtle',
    active && 'bg-bg-selected border-accent-primary',
    !active && attention && ATTENTION_CLASSES[attention],
    unreadable && 'border-dashed',
    href && 'block',
    className,
  )
  if (href !== undefined) {
    const { ref, ...anchorProps } = props as ComponentPropsWithRef<'a'>
    return (
      <Link href={href} variant="plain" ref={ref} className={classes} {...anchorProps}>
        {children}
      </Link>
    )
  }
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
