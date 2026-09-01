import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { cn } from './cn'
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
 */
export interface Crumb {
  label: string
  href?: string
  /** Set the item in the mono face — a ref, an id. */
  mono?: boolean
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
    if (!nav) return
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
        const text = cn(
          'truncate',
          item.mono && 'font-mono text-[12px] leading-[120%]',
          item.muted || (last && item.mono) ? 'text-text-muted' : last ? 'text-text-primary' : 'text-text-secondary',
        )
        const setLabelRef = (el: HTMLElement | null) => {
          labelRefs.current[index] = el
        }
        const crumb = item.href ? (
          <a ref={setLabelRef} href={item.href} className={cn(text, 'hover:text-text-primary')}>
            {item.label}
          </a>
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
