import { Fragment, useCallback, useLayoutEffect, useRef, useState, type MouseEventHandler, type ReactNode } from 'react'
import { cn } from './cn'
import { Link } from './Link'
import { WithTooltip } from './Tooltip'

/**
 * A trail: "Documents / Quarterly plan / DOC-12". Ship's Breadcrumb
 * (2026-09-01), which knows nothing about what the places are.
 *
 * An item with an `href` is a link, even when it is last — a page may end its
 * trail on somewhere to go. The last item is where you are when it has none,
 * and may be `mono` (a ref, an id) or plain. The separator is a slash, muted,
 * never read aloud.
 *
 * A crumb that truncates shows its whole label in a tooltip on hover
 * (Katerina, 2026-09-01); one that fits shows nothing extra. Truncation is
 * re-measured when the trail resizes, so the tooltip appears and disappears
 * with the room the trail actually has.
 *
 * A crumb with an `href` is a plain anchor, so in a router app a click on it
 * reloads the page. Such an app passes `onClick` per crumb and navigates in
 * place there — NavItem's rule — and the `href` stays a real address so the
 * link can still be copied or opened in a new tab. Ship's breadcrumbs were
 * the last links reloading the whole app (ADOPTION S15, 2026-09-08).
 */
export interface Crumb {
  label: string
  href?: string
  /** A router app intercepts the click here. Called only on a crumb with an `href`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
  /** Set the item in the mono face — a ref, an id. */
  mono?: boolean
  /**
   * 16px, stroke 1.5, before the label — what kind of place this is, so a
   * container's name is not mistaken for an item's (Katerina, 2026-09-09).
   * Decorative: the label says where you are; the icon says what it is.
   */
  icon?: ReactNode
  /** Quieter — a label that is not a place. */
  muted?: boolean
}

export interface BreadcrumbProps {
  items: Crumb[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const navRef = useRef<HTMLElement>(null)
  const labelRefs = useRef<(HTMLElement | null)[]>([])
  const [truncated, setTruncated] = useState<ReadonlySet<number>>(new Set())

  const measure = useCallback(() => {
    const next = new Set<number>()
    labelRefs.current.forEach((el, index) => {
      if (el && el.scrollWidth > el.clientWidth) next.add(index)
    })
    setTruncated((prev) => (prev.size === next.size && [...next].every((i) => prev.has(i)) ? prev : next))
  }, [])

  useLayoutEffect(() => {
    measure()
    const nav = navRef.current
    // jsdom has neither layout nor ResizeObserver; without this guard a
    // consumer app cannot render a page with a trail in its tests.
    if (!nav || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [measure, items])

  return (
    <nav ref={navRef} aria-label="Breadcrumb" className={cn('flex min-w-0 items-center gap-1.5 text-body-2', className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1
        // The mono size is an arbitrary value (the caption token) because this
        // string goes through cn() and a token size before a colour class is
        // dropped (the tailwind-merge pitfall).
        const tone = item.muted || (last && item.mono) ? 'text-text-muted' : last ? 'text-text-primary' : 'text-text-secondary'
        const text = cn(
          'truncate',
          // A mono crumb is a ref — the identity. It never gives up width to a
          // long name beside it (the LongName story always claimed "the ref
          // stays"; flexbox was squeezing it anyway until this line).
          item.mono && 'shrink-0 font-mono text-caption',
          tone,
        )
        const setLabelRef = (el: HTMLElement | null) => {
          labelRefs.current[index] = el
        }
        const crumb = item.href ? (
          // `plain` adds no look of its own: a crumb keeps the trail's size and
          // tone, and brightens on hover. The package's own Link, so a trail
          // follows whatever a link learns to do (UIG-5). The size and tone are
          // on a box around it, which the link takes them from, rather than
          // pushed into it (UIG-9); the link is still the one element that
          // truncates and is measured.
          <span className={cn('flex min-w-0', item.mono && 'shrink-0 font-mono text-caption', tone, 'hover:text-text-primary')}>
            <Link ref={setLabelRef} variant="plain" truncate href={item.href} onClick={item.onClick}>
              {item.label}
            </Link>
          </span>
        ) : (
          <span ref={setLabelRef} className={text} aria-current={last ? 'page' : undefined}>
            {item.label}
          </span>
        )
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span aria-hidden="true" className="shrink-0 text-text-muted">
                /
              </span>
            )}
            {/* Beside the crumb, not inside it: the crumb stays the one element
                that truncates and is measured, and the trail's own gap — 6px —
                is the distance between an icon and its name everywhere here. */}
            {item.icon && (
              <span aria-hidden="true" className={cn('flex shrink-0', tone)}>
                {item.icon}
              </span>
            )}
            {truncated.has(index) ? (
              // `min-w-0 shrink` undoes the wrapper's own shrink-0 — the crumb
              // must keep truncating inside it, or wrapping it would widen the
              // trail and the tooltip would never be needed again.
              <WithTooltip label={item.label} wrapperClassName="min-w-0 shrink">
                {crumb}
              </WithTooltip>
            ) : (
              crumb
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
