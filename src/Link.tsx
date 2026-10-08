import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useInAppClick } from './AppProvider'
import { cn } from './cn'

/**
 * A link: an anchor with one of four looks, and nothing else of its own.
 *
 * It exists because both apps hand-wrote every link they have — 18 raw `<a>`
 * on 13 September 2026, in three jobs (UIG-27). The looks are the ones those
 * links already had, reduced by Katerina's ruling:
 *
 * - `text` — a link inside written text: the theme's link colour, always underlined,
 *   dimming on hover. The look a link in a body of text already had.
 * - `quiet` — a title or a timestamp that is also a link. It takes the colour
 *   and size of the text it sits in and underlines on hover. Two looks that
 *   differed only in their text became this one (her ruling, 13 September).
 * - `underlined` — a short "open it elsewhere" beside a note. It takes the
 *   note's colour, is always underlined, and brightens on hover. A dotted
 *   and a solid version became this one, solid (her ruling, 13 September).
 * - `plain` — no look at all: a card or a row that is a link draws itself.
 *
 * **`cover`: a row that is one link** (UIG-33, Katerina 28 September). The link
 * stretches an invisible layer over the nearest box the app has given
 * `relative` (a row, a table row), so a click anywhere on it opens the link, and
 * the keyboard ring goes round that whole box rather than round the words. The
 * row stays the app's own: its size, its fill, its hover. A second link inside
 * the row stays clickable when it comes after the covering link and is
 * `relative` itself, which a `Chip` with an `href` already is. Both apps
 * stretched a link by hand before this, each under a written exception.
 *
 * **Navigation is the app's.** The package cannot know a router, so like
 * `NavItem` it renders a real anchor and passes every anchor prop through: a
 * router app hands in `onClick`, prevents the default and navigates, and the
 * `href` stays a real address for a modified click or a new tab.
 */
export type LinkVariant = 'text' | 'quiet' | 'underlined' | 'plain'

/**
 * The covering layer, and the ring moved onto it: `outline-none` takes the ring
 * off the words, and `outline-style: auto` draws the browser's own ring round the
 * layer, the same ring every other control shows, only the size of the row.
 */
const COVER_CLASSES = 'after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:[outline-style:auto]'

const VARIANT_CLASSES: Record<LinkVariant, string> = {
  text: 'text-text-interactive underline underline-offset-2 hover:opacity-80',
  quiet: 'hover:underline',
  underlined: 'underline underline-offset-2 hover:text-text-primary',
  plain: '',
}

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  href: string
  /** Default `text`. */
  variant?: LinkVariant
  /**
   * Another site, or another app: opens in a new tab, with `noopener
   * noreferrer` so the page it opens cannot reach back into this one.
   */
  external?: boolean
  /**
   * One line, cut with an ellipsis when it does not fit — a title that is a link.
   * Its size and colour still come from the text around it (UIG-9, 17 September).
   */
  truncate?: boolean
  /**
   * The link covers the row it sits in: a click anywhere on the row opens it,
   * and the keyboard ring goes round the whole row. Give the row `relative`.
   */
  cover?: boolean
  children: ReactNode
}

export function Link({ href, variant = 'text', external = false, truncate = false, cover = false, className, children, onClick, ...props }: LinkProps) {
  const inApp = useInAppClick(href, onClick)
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(VARIANT_CLASSES[variant], truncate && 'truncate', cover && COVER_CLASSES, className)}
      {...props}
      onClick={inApp}
    >
      {children}
    </a>
  )
}
