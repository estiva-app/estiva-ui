import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useInAppClick } from './AppProvider'
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
 * - the alignment is a class, not a `style` object, so it is part of the
 *   class list like every other size in the package;
 * - a chip that leads somewhere takes `href` and `onClick`, the way `NavItem`
 *   does: the package draws an anchor, the app's router takes the click.
 *
 * **Why the baseline.** The chip's words sit on the sentence's baseline,
 * whatever the line's height and whatever wraps the chip. `items-baseline`
 * makes its words the chip's baseline, and `align-baseline` puts that on the
 * sentence's; the `icon` slot, and any child holding an icon or a picture or
 * holding nothing at all (an app's own chip in an editor, a colour swatch), is
 * centred instead, because such a child has no baseline of its own and would
 * sit with its bottom edge on the words' (3.8px high, measured 2026-09-13). `1.4em` keeps the chip one 14px
 * line tall.
 *
 * It was `align-top` until PEE-72 (2026-10-29), which held only while the
 * line was 19.6px and the chip was the line's own child. RichText's 21px
 * lines (0.64) put every chip's words 1px high, measured on peek.estiva.app;
 * a link's chip inside its hover card's trigger (0.75) was level only by
 * chance, its baseline taken from its icon.
 */

/** The shape every tone shares. Exported for a rich-text editor that renders chips from strings. */
export const INLINE_CHIP_CLASSES =
  'inline-flex h-[1.4em] items-baseline gap-1 rounded-sm px-1 mx-0.5 align-baseline text-body-2 font-normal select-none [&>:is(svg,img,:empty)]:self-center [&>:has(svg,img)]:self-center'

/** What a chip is made of, by what it stands for. */
export const INLINE_CHIP_TONE_CLASSES = {
  /** A thing or a place — anything that is not a person. */
  neutral: 'bg-bg-active text-text-primary',
  /** A person. */
  person: 'bg-accent-muted text-accent-text',
  /** A person, called urgently. */
  urgent: 'bg-warning-muted text-warning-default',
  /**
   * A reference nobody could resolve — still a mention, just an anonymous one.
   * Its height is the body line's 19.6px written out, because `1.4em` here is
   * the caption's em, 16.8px. Its smaller letters would set a baseline of
   * their own and make the line 3px taller, so a strut — an invisible letter
   * in the body's type, no wider than nothing, its gap taken back — sets the
   * chip's baseline and the letters sit on it.
   */
  quiet:
    "h-[19.6px] bg-bg-active text-text-muted font-mono text-caption before:invisible before:-mr-1 before:w-0 before:font-sans before:text-body-2 before:content-['x']",
  /** A file this reader cannot open — deleted, or not theirs to see: said in words, quieter than a link. */
  muted: 'bg-bg-active text-text-muted',
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
  const inApp = useInAppClick(href, props.onClick)
  const body = (
    <>
      {icon && <span className="flex size-4 shrink-0 items-center justify-center self-center text-text-secondary">{icon}</span>}
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
    <a href={href} className={classes} {...props} onClick={inApp}>
      {body}
    </a>
  )
}
