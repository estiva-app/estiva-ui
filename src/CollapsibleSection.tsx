import { useState, type ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { cn } from './cn'
import { SectionHeader, type SectionAction } from './SectionHeader'
import { COLLAPSIBLE_PANEL_CLASSES } from './looks'

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
  /** 16px, before the title; the arrow takes its place on hover — `SectionHeader`'s. */
  icon?: ReactNode
  /** The arrow's size — `SectionHeader`'s: `row`, 16px, a tree's heading. */
  arrow?: 'heading' | 'row'
  /** Beside the title and always visible, before the actions — a count. `SectionHeader`'s. */
  trailing?: ReactNode
  /** Beside the title, revealed on hover or focus — `SectionHeader`'s. */
  actions?: SectionAction[]
  /** Beside the actions, revealed with them: the section's "More options" menu, `MenuItem`s — `SectionHeader`'s. */
  menu?: ReactNode
  /** The ⋮'s accessible name — `SectionHeader`'s. */
  menuLabel?: string
  showActions?: 'hover' | 'always'
  /**
   * `heading` (default): the title is a section heading. `row`: the fold is a
   * row among rows — a folder in a sidebar — and its rows sit indented under
   * its title, past the chevron (`SectionHeader`'s `look`).
   */
  look?: 'heading' | 'row'
  /**
   * With the `heading` look: the rows start under the title, past the
   * chevron — a folder in a sidebar, its files lightly indented under its
   * name (Katerina, 2 October). The `row` look always indents.
   */
  indent?: boolean
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

export function CollapsibleSection({ title, defaultOpen = true, open: openProp, onOpenChange, storageKey, icon, arrow, trailing, actions, menu, menuLabel, showActions, look = 'heading', indent = false, children, className, contentClassName }: CollapsibleSectionProps) {
  const [openState, setOpenState] = useState(() => readStored(storageKey) ?? defaultOpen)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    writeStored(storageKey, next)
    onOpenChange?.(next)
  }
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn('flex flex-col', className)}>
      <SectionHeader title={title} chevron icon={icon} arrow={arrow} isExpanded={open} trailing={trailing} actions={actions} menu={menu} menuLabel={menuLabel} showActions={showActions} look={look} className="shrink-0" render={<Collapsible.Trigger />} />
      {/* The slide: Base UI measures the panel and writes its height to a
          variable — `auto` again once the slide ends, so rows that arrive
          later are not clipped — and the panel is 0 high on its opening frame
          and its closing frame. The Tooltip's idiom (D26): the data attributes
          are Base UI's, the transition is ours, and none under
          prefers-reduced-motion. */}
      <Collapsible.Panel
        hiddenUntilFound
        className={COLLAPSIBLE_PANEL_CLASSES}
      >
        {/* A row's rows start under its title: the 16px chevron and its 8px gap
            (pl-6). An indented heading's: its 12px chevron and 4px gap (pl-4). */}
        {/* With an icon or a row's arrow, past its 16px and the 8px after it (pl-6), as a row's rows. */}
        <div className={cn('flex flex-col', look === 'row' || (indent && (icon != null || arrow === 'row')) ? 'pl-6' : indent && 'pl-4', contentClassName)}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
