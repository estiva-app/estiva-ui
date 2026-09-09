import { useState, type ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { cn } from './cn'
import { SectionHeader, type SectionAction } from './SectionHeader'

/**
 * A section that opens and closes: a `SectionHeader` whose title is the
 * toggle, and the rows under it, sliding shut and open (Katerina,
 * 2026-09-09, for the sidebars of both apps). On Base UI's `Collapsible`
 * (D6): the state, the title button's `aria-expanded` and `aria-controls`,
 * Enter and Space, the panel's height for the slide, and `hiddenUntilFound`
 * — the browser's find-in-page can find a row inside a closed section and
 * open it, because the rows stay in the DOM while closed.
 *
 * Three ways to hold the state, from least to most work for the caller:
 *
 * - none: `defaultOpen` (open unless told otherwise), kept while mounted;
 * - `storageKey`: the same, and this browser remembers it under that key
 *   across reloads — one prop for a sidebar that stays how you left it;
 * - `open` + `onOpenChange`: the caller owns it.
 *
 * A closed section stays closed whatever is selected inside it (her
 * ruling, 2026-09-09) — the reader closed it.
 */
export interface CollapsibleSectionProps {
  title: string
  /** Open unless told otherwise. */
  defaultOpen?: boolean
  /** The caller owns the state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Remember open or closed in this browser, under this key. The app prefixes it. */
  storageKey?: string
  /** Beside the title, revealed on hover or focus — `SectionHeader`'s. */
  actions?: SectionAction[]
  showActions?: 'hover' | 'always'
  /** The rows. */
  children: ReactNode
  /** On the section's box: `mt-2` between groups, `shrink-0` in a scrolling column. */
  className?: string
  /** On the box the rows sit in: the gap between them. */
  contentClassName?: string
}

const OPEN = 'open'
const CLOSED = 'closed'

function readStored(key: string | undefined): boolean | undefined {
  if (!key) return undefined
  try {
    const value = window.localStorage.getItem(key)
    return value === OPEN ? true : value === CLOSED ? false : undefined
  } catch {
    return undefined
  }
}

function writeStored(key: string | undefined, open: boolean) {
  if (!key) return
  try {
    window.localStorage.setItem(key, open ? OPEN : CLOSED)
  } catch {
    // A browser that blocks storage still gets a working section; it forgets.
  }
}

export function CollapsibleSection({ title, defaultOpen = true, open: openProp, onOpenChange, storageKey, actions, showActions, children, className, contentClassName }: CollapsibleSectionProps) {
  const [openState, setOpenState] = useState(() => readStored(storageKey) ?? defaultOpen)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    writeStored(storageKey, next)
    onOpenChange?.(next)
  }
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn('flex flex-col', className)}>
      <SectionHeader title={title} chevron isExpanded={open} actions={actions} showActions={showActions} className="shrink-0" render={<Collapsible.Trigger />} />
      {/* The slide: Base UI measures the panel and writes its height to a
          variable — `auto` again once the slide ends, so rows that arrive
          later are not clipped — and the panel is 0 high on its opening frame
          and its closing frame. The Tooltip's idiom (D26): the data attributes
          are Base UI's, the transition is ours, and none under
          prefers-reduced-motion. */}
      <Collapsible.Panel
        hiddenUntilFound
        className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-150 ease-out motion-reduce:transition-none data-[starting-style]:h-0 data-[ending-style]:h-0"
      >
        <div className={cn('flex flex-col', contentClassName)}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
