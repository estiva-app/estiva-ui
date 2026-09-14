import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from './cn'

/**
 * A word in a sentence that stands for something: a person, a place, a thing
 * written into running text. One line high, level with the words around it.
 *
 * The shape is Peek's inline chip (D67, Peek PR #206, 2026-09-13), class for
 * class, moved into the package so both apps draw one (UIG-27). Three things
 * changed on the way, all ruled by Katerina:
 *
 * - the person tone is `person`, not `mention` — every chip here is a
 *   mention of something;
 * - the alignment is a class (`align-top h-[1.4em]`), not a `style` object,
 *   so it is part of the class list like every other size in the package;
 * - a chip that leads somewhere takes `href` and `onClick`, the way `NavItem`
 *   does: the package draws an anchor, the app's router takes the click.
 *
 * **Why `align-top` and `1.4em`.** `1.4em` is the body text's line height,
 * so the chip is exactly one line tall; `vertical-align: top` pins it to the
 * line box, which keeps the line at 19.6px and the chip's words level with
 * the sentence's, with or without an icon. Measured in Peek on 2026-09-13:
 * `text-bottom` made the line 21.2px and lifted the chip's words 1.6px;
 * `baseline` lifted them 3.8px once an icon came first.
 */

/** The shape every tone shares. Exported for a rich-text editor that renders chips from strings. */
export const INLINE_CHIP_CLASSES =
  'inline-flex h-[1.4em] items-center gap-1 rounded-sm px-1 mx-0.5 align-top text-body-2 font-normal select-none'

/** What a chip is made of, by what it stands for. */
export const INLINE_CHIP_TONE_CLASSES = {
  /** A thing or a place — anything that is not a person. */
  neutral: 'bg-bg-active text-text-primary',
  /** A person. */
  person: 'bg-accent-muted text-accent-primary',
  /** A person, called urgently. */
  urgent: 'bg-warning-muted text-warning-default',
  /**
   * A reference nobody could resolve — still a mention, just an anonymous one.
   * Its height is the body line's 19.6px written out, because `1.4em` here is
   * the caption's em: 16.8px, with the letters 1.8px above the sentence's
   * baseline. At 19.6px they sit 0.4px off it (measured 2026-09-14; Peek's
   * copy of this chip still has the 16.8px box).
   */
  quiet: 'h-[19.6px] bg-bg-active text-text-muted font-mono text-caption',
} as const

export type InlineChipTone = keyof typeof INLINE_CHIP_TONE_CLASSES

/** The chip's classes for a tone, with anything the caller adds. For renderers that cannot use the component. */
export function inlineChipClassName(tone: InlineChipTone, className?: string) {
  return cn(INLINE_CHIP_CLASSES, INLINE_CHIP_TONE_CLASSES[tone], className)
}

export interface InlineChipProps extends Omit<ComponentPropsWithRef<'a'>, 'children'> {
  /** What the chip stands for. Default `neutral`. */
  tone?: InlineChipTone
  /** Drawn before the label in a 16px box: a 16px icon, or a 14px one it centres. */
  icon?: ReactNode
  /**
   * Where the chip leads. With it the chip is an anchor; without it, a span.
   * A router app passes `onClick` too, and navigates there itself.
   */
  href?: string
  children: ReactNode
}

export function InlineChip({ tone = 'neutral', icon, href, className, children, ...props }: InlineChipProps) {
  const body = (
    <>
      {icon && <span className="flex size-4 shrink-0 items-center justify-center text-text-secondary">{icon}</span>}
      {children}
    </>
  )
  const classes = inlineChipClassName(tone, className)
  // Without somewhere to go it is a label, and a label is not a link.
  if (href === undefined) {
    return (
      <span className={classes} {...(props as ComponentPropsWithRef<'span'>)}>
        {body}
      </span>
    )
  }
  return (
    <a href={href} className={classes} {...props}>
      {body}
    </a>
  )
}
