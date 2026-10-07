import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { cn } from './cn'

/**
 * Long content cut at a height behind a fade, with "Show more" under it
 * (Katerina, 7 October: a long description on a side panel pushed what was
 * under it out of sight).
 *
 * Content no taller than `maxHeight` is drawn whole, with no fade and no
 * button: the cut is for what would not fit, never a look. The height is
 * measured, and measured again whenever the content changes size, so an
 * edit that makes it long or short brings the button or takes it away.
 *
 * The fade ends in the surface the content sits on, which only the caller
 * knows: `fadeClassName`, a `from-` background token.
 *
 * Focus arriving inside the cut content opens it: a field or a link there,
 * reached by Tab or a click, is never worked on out of sight.
 */
export interface ShowMoreProps {
  children: ReactNode
  /** The height to cut at, in px. Default 96: about seven lines of caption text. */
  maxHeight?: number
  /** The surface under the content, as a gradient start: `from-bg-surface` (default), `from-bg-inset` inside an inset card. */
  fadeClassName?: string
  className?: string
}

export function ShowMore({ children, maxHeight = 96, fadeClassName = 'from-bg-surface', className }: ShowMoreProps) {
  const box = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setOverflows(el.scrollHeight > maxHeight + 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [maxHeight])

  const cut = overflows && !open
  return (
    <div className={cn('flex flex-col items-start', className)}>
      <div ref={box} className={cn('relative w-full', cut && 'overflow-hidden')} style={cut ? { maxHeight } : undefined} onFocus={cut ? () => setOpen(true) : undefined}>
        {children}
        {cut && <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent', fadeClassName)} />}
      </div>
      {overflows && (
        // `-ml-1.5`: the small button's own 6px inset, so its words start where the content's do.
        <Button variant="muted" size="small" className="-ml-1.5 mt-1" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  )
}
