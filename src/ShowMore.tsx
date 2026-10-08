import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
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
 * knows: `surface`, by name, so no app writes a colour into the part.
 *
 * Focus arriving inside the cut content opens it: a field or a link there,
 * reached by Tab or a click, is never worked on out of sight.
 *
 * `action` is one more small button on the toggle's row, at its right
 * (Katerina, 8 October: Peek's block card puts "Open in Estiva Ship" level with
 * Show more). The row is drawn for it whether or not the content is cut.
 */
export interface ShowMoreProps {
  children: ReactNode
  /** The height to cut at, in px. Default 96: about seven lines of caption text. */
  maxHeight?: number
  /** What the content sits on, for the fade to end in: a panel's `surface` (default), or an inset card's `inset`. */
  surface?: 'surface' | 'inset'
  /** A small muted `Button` with a leading icon, at the right of the toggle's row: the way out to where the content lives. Its words end where the content does. */
  action?: ReactNode
  className?: string
}

const FADE_CLASSES = { surface: 'from-bg-surface', inset: 'from-bg-inset' } as const

export function ShowMore({ children, maxHeight = 96, surface = 'surface', action, className }: ShowMoreProps) {
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
        {cut && <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent', FADE_CLASSES[surface])} />}
      </div>
      {action ? (
        <div className={cn('mt-1 flex w-full items-center gap-2', overflows ? 'justify-between' : 'justify-end')}>
          {overflows && <Toggle open={open} onToggle={() => setOpen((o) => !o)} />}
          {/* `-mr-2`: a small button's 8px right inset beside a leading icon, so its words end where the content's do. */}
          <div className="-mr-2 flex shrink-0">{action}</div>
        </div>
      ) : (
        overflows && <Toggle open={open} onToggle={() => setOpen((o) => !o)} className="mt-1" />
      )}
    </div>
  )
}

/**
 * Outlined, with a chevron that says which way it goes (Katerina, 8 October):
 * the one control of the part, so it has an edge. Its edge starts where the
 * content does.
 */
function Toggle({ open, onToggle, className }: { open: boolean; onToggle: () => void; className?: string }) {
  const Icon = open ? IconChevronUp : IconChevronDown
  return (
    <Button
      variant="outlined"
      size="small"
      leadingIcon={<Icon stroke={1.5} className="size-3.5" />}
      className={className}
      aria-expanded={open}
      onClick={onToggle}
    >
      {open ? 'Show less' : 'Show more'}
    </Button>
  )
}
