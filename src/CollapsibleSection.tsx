import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
 * ruling, 2026-09-09) — the reader closed it — until `openFor` names a new
 * current item inside it: opening a file shows where it lives, even in a
 * section closed by hand (Katerina, 30 October). Once per item, so closed
 * again it stays closed until another opens.
 */
export interface CollapsibleSectionProps {
  title: string
  /** Open unless told otherwise. */
  defaultOpen?: boolean
  /** The caller owns the state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Opened, and its rows are not in yet: the title says open — the arrow
   * turned, `aria-expanded`, `aria-busy` — and the panel stays shut until
   * this is false, then slides open once, rows and all. A skeleton the rows
   * then replace moves everything below twice (Peek's Folders, OPT-11). A
   * click while pending closes it, as on an open section. Not for a re-read:
   * on a section already showing its rows it shuts them until it is false.
   */
  pending?: boolean
  /** Remember open or closed in this browser, under this key. The app prefixes it. */
  storageKey?: string
  /**
   * The current item, when it sits in here: the section opens each time this
   * names a new one, as a click would — remembered under `storageKey`, told to
   * `onOpenChange`. Closed again by hand, it stays closed until another item
   * opens. Open already, by its default, it is left as it is: a default is
   * never written down. `NavTree` passes it.
   */
  openFor?: string
  /** 16px, before the title; the arrow takes its place on hover — `SectionHeader`'s. */
  icon?: ReactNode
  /** Beside the title and always visible, before the actions — a count. `SectionHeader`'s. */
  trailing?: ReactNode
  /** Beside the title, revealed while the row is hovered or keyboard-focused — `SectionHeader`'s. */
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

/**
 * `openFor`, for a section and a row with rows under it: open, as a click
 * would, each time it names a new item. An effect, not a render: opening tells
 * the caller (`onOpenChange`), and a parent is never set while a child draws.
 * Gone and back — the item opened, another elsewhere, then it again — is new.
 *
 * Only a shut one is opened: one open by its default stays a default, never
 * written down, so it closes again once the item goes. `link` is different: a
 * link to the section itself (`NavTree`'s `selectedGroup`), each new one
 * opening it as a click would, open already or not — remembered open, told to
 * the caller — so it stays open when the reader goes on elsewhere.
 */
export function useOpenFor(openFor: string | undefined, open: boolean, setOpen: (open: boolean) => void, link?: string) {
  const seen = useRef<string | undefined>(undefined)
  const linked = useRef<string | undefined>(undefined)
  useEffect(() => {
    const newItem = openFor !== seen.current
    const newLink = link !== linked.current
    seen.current = openFor
    linked.current = link
    if (newLink && link !== undefined) setOpen(true)
    else if (newItem && openFor !== undefined && !open) setOpen(true)
    // Only a new item or a new link opens it: the reader's own toggles in between are theirs.
  }, [openFor, link])
}

/**
 * Set by a `NavTreeSection` round its section while `NavTree`'s `selectedGroup`
 * names it: the link that led to it, which opens it and is remembered (`useOpenFor`'s
 * `link`). The kit's wiring between the two, not for an app.
 */
export const sectionLinked = createContext<string | undefined>(undefined)

function readStored(key: string | undefined): boolean | null {
  if (!key) return null
  try {
    const value = window.localStorage.getItem(key)
    return value === OPEN ? true : value === CLOSED ? false : null
  } catch {
    return null
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

/**
 * Open or closed as this browser remembers it under `storageKey`, else `fallback`, for an app that must know before it draws what is inside — a fold whose rows are read only once it is open (Peek's Folders, FOL-21).
 *
 * The same memory as `CollapsibleSection`'s `storageKey`, in the same words,
 * read once when it mounts: hand the pair to a section's `open` and
 * `onOpenChange`. `fallback` decides until the person does, and stays live —
 * a fold can spring open while it holds the current item and close again when
 * it stops — and only a choice is written down, so a default never becomes a
 * memory. No key: the choice is kept while mounted. A browser that blocks
 * storage still gets a working fold; it forgets.
 */
export function useRememberedOpen(storageKey: string | undefined, fallback: boolean): [open: boolean, setOpen: (next: boolean) => void] {
  const [choice, setChoice] = useState<boolean | null>(() => readStored(storageKey))
  const setOpen = (next: boolean) => {
    setChoice(next)
    writeStored(storageKey, next)
  }
  return [choice ?? fallback, setOpen]
}

export function CollapsibleSection({ title, defaultOpen = true, open: openProp, onOpenChange, pending = false, storageKey, openFor, icon, trailing, actions, menu, menuLabel, showActions, look = 'heading', indent = false, children, className, contentClassName }: CollapsibleSectionProps) {
  // The section's default is the one it was drawn with: a later `defaultOpen` does not move it.
  const [initial] = useState(defaultOpen)
  const [openState, remember] = useRememberedOpen(storageKey, initial)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    remember(next)
    onOpenChange?.(next)
  }
  useOpenFor(openFor, open, setOpen, useContext(sectionLinked))
  // Pending, Base UI holds the panel shut and so would open it on a click: the click is the title's, and the title says open.
  // Only a click: find-in-page reaching into the shut panel asks to open it, and it is open.
  const shown = open && !pending
  return (
    <Collapsible.Root open={shown} onOpenChange={(next, details) => setOpen(pending && details.reason === 'trigger-press' ? !open : next)} className={cn('flex flex-col', className)}>
      <SectionHeader title={title} chevron icon={icon} isExpanded={open} trailing={trailing} actions={actions} menu={menu} menuLabel={menuLabel} showActions={showActions} look={look} className="shrink-0" render={<Collapsible.Trigger aria-expanded={open} aria-busy={pending && open ? true : undefined} />} />
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
            (pl-6). An indented heading's: the same — its arrow is a row's now (5 October). */}
        <div className={cn('flex flex-col pt-0.5', (look === 'row' || indent) && 'pl-6', contentClassName)}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
