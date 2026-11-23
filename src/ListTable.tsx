import { createContext, useCallback, useContext, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { IconChevronRight } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Link } from './Link'
import { COLLAPSIBLE_PANEL_CLASSES } from './looks'

/** How wide a column is: `small` 80px (a number, a few faces), `medium` 96px (a date), `large` 112px (a name). */
export type ListTableColumnWidth = 'small' | 'medium' | 'large'

/** Which columns give way first when the list runs short of room: `low` ones, then `high` ones. */
export type ListTableColumnKeep = 'high' | 'low'

/**
 * One column after the name: its heading, how wide it is, and how long it stays when room runs short. A column's
 * fields are not the list's props, so their words are named types, not read by the registry as props' values.
 */
export interface ListTableColumn {
  /** Its heading: "Team", "Members", "Active". */
  label: string
  /** `small` 80px (a number, a few faces), `medium` 96px (a date), `large` 112px (a name). Default `medium`. */
  width?: ListTableColumnWidth
  /**
   * When the list runs short of room, which columns give way: `low` ones first, then `high` ones; the name and the
   * end never do. Default `high`.
   */
  keep?: ListTableColumnKeep
}

export interface ListTableProps {
  /** What the list is, to assistive technology: "Initiatives". */
  'aria-label': string
  /** The first column's heading. Default "Name". */
  nameLabel?: string
  /** The columns after the name, in their order. None: no headings, only the rows — a list with no facts to show. */
  columns: ListTableColumn[]
  /** The rows hold something at their end — a small `Button`, a dot and a ⋮ — and the list keeps 64px for it. */
  end?: boolean
  /**
   * The column headings on screen. Default true. `false` where the heading over the part already names the list and
   * its facts read without a label — a team's page, under "Topics": faces and a number, "Yesterday" (Katerina,
   * 16 November). Assistive technology still reads them, so each cell keeps its heading.
   */
  headings?: boolean
  /** The rows: `ListTableRow`s. */
  children: ReactNode
  /** Placement only. */
  className?: string
}

export interface ListTableRowProps {
  /** Where the row leads. The whole row is the link. */
  href: string
  /** Its name, one line, cut short with an ellipsis. */
  label: string
  /** Under the name, one line, cut short: what it is about. */
  description?: string
  /** 16px, before the name: its kind. */
  icon?: ReactNode
  /**
   * One per column, in the columns' order: words, or a part (`AvatarGroup`, `MetaText`). Absent (`undefined`), a
   * dash: not read yet. An empty string, nothing: a fact this row's kind does not have, so a page listing several kinds
   * keeps one set of columns (Ship's team and initiative pages, 18 November).
   */
  cells: ReactNode[]
  /**
   * Another app's or site's: the row opens in a new tab, with `noopener noreferrer`, as the kit's `Link` `external`
   * does (a Leaf document listed in Ship, Katerina 23 November).
   */
  external?: boolean
  /**
   * Rows under this one: `ListTableRow`s in the same columns, shut until opened. While the row is pointed at or
   * focused its icon turns into the arrow, and only the arrow folds — `NavItem`'s fold; the row itself still opens its
   * thing. The rows sit 24px in, under the tree's line (a document's pages, Katerina 23 November).
   */
  children?: ReactNode
  /** With `children`: open at first. Default shut. */
  defaultOpen?: boolean
  /** With `children`: the caller owns the state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** At the row's end, its own control: a small `Button` (Join), or the row's dot and ⋮. Never covered by the row's link. */
  end?: ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  /** Marks for the app's own tests and photo runs. */
  [data: `data-${string}`]: string | boolean | undefined
}

const WIDTH_PX = { small: 80, medium: 96, large: 112 } as const
const WIDTH_CLASSES = { small: 'w-20', medium: 'w-24', large: 'w-28' } as const
/** The least room the name keeps before a column gives way. */
const NAME_LEAST_PX = 200
const DEFAULT_WIDTH = 'medium'
const sizeOf = (column: ListTableColumn) => column.width ?? DEFAULT_WIDTH
/** The row's 12px either side, the icon and its 12px gap. */
const ROW_FRAME_PX = 24 + 16 + 12
/** Each column's 24px gap before it: room between the facts (Katerina, 17 November: "we need air for them to breathe"). */
const GAP_PX = 24
const END_PX = 64

type Shown = 'all' | 'high' | 'none'
const ListTableContext = createContext<{ columns: ListTableColumn[]; shown: Shown; end: boolean } | null>(null)

const showsColumn = (column: ListTableColumn, shown: Shown) => shown === 'all' || (shown === 'high' && (column.keep ?? 'high') === 'high')

const widthOf = (columns: ListTableColumn[], end: boolean) =>
  ROW_FRAME_PX + NAME_LEAST_PX + columns.reduce((sum, column) => sum + GAP_PX + WIDTH_PX[sizeOf(column)], 0) + (end ? GAP_PX + END_PX : 0)

/**
 * A list of things on a page, under column headings: each row leads to its thing, with its name and what it is about,
 * then a few short facts in columns, then an action at its end. The columns give way to the name by the list's own
 * width, not the window's — `low` ones first, then `high` ones — so a list beside a sidebar keeps its names. The name
 * and what it is about take the room on the left, the facts sit together on the right before the end, 24px apart
 * (Katerina, 17 November: "everything is crammed together on the left … the names/desc at the left and the rest on the
 * right was a more correct way"; from 16 November the name was capped at 384px with the facts beside it). The list
 * takes the whole width it is given, as every page's body does (16 November).
 *
 * Peek's Explore topics, Ship's Topics and Leaf's Explore topics each drew this by hand, class for class, and their
 * columns hid only at the phone's width: in a narrow window the names were cut to two letters (Katerina, 16 November).
 */
export function ListTable({ 'aria-label': label, nameLabel = 'Name', columns, end = false, headings = true, children, className }: ListTableProps) {
  const box = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<Shown>('all')
  const measure = useCallback(() => {
    const width = box.current?.getBoundingClientRect().width ?? 0
    // jsdom has no layout: a list it draws shows every column.
    if (width === 0) return
    const high = columns.filter((column) => (column.keep ?? 'high') === 'high')
    setShown(width >= widthOf(columns, end) ? 'all' : width >= widthOf(high, end) ? 'high' : 'none')
  }, [columns, end])
  useLayoutEffect(() => {
    measure()
    const list = box.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [measure])
  return (
    <ListTableContext.Provider value={{ columns, shown, end }}>
      <div ref={box} role="table" aria-label={label} className={cn('flex w-full flex-col gap-2', className)}>
        {/* With no columns there is nothing to head: the part's own heading names the list, and a lone "Name" said nothing (Katerina, 16 November). */}
        {columns.length > 0 && (
          // Hidden, it is out of the flow too: the rows start where the list does, with no gap for it.
          <div role="row" className={cn('flex items-center gap-6 px-3 text-caption text-text-muted', !headings && 'sr-only')}>
            {/* Over the name, past the icon; as wide as the names' cells. */}
            <span role="columnheader" className="min-w-0 flex-1 pl-7">
              {nameLabel}
            </span>
            {columns.map((column) =>
              showsColumn(column, shown) ? (
                <span key={column.label} role="columnheader" className={cn('shrink-0 truncate', WIDTH_CLASSES[sizeOf(column)])}>
                  {column.label}
                </span>
              ) : null,
            )}
            {/* Its name as text only a screen reader reads: a column heading named by aria-label alone counts as empty (axe's empty-table-header, UIG-41). */}
            {end && (
              <span role="columnheader" className="ml-auto w-16 shrink-0">
                <span className="sr-only">Actions</span>
              </span>
            )}
          </div>
        )}
        {/* 2px between rows, as a list column's and a menu's. */}
        <div role="rowgroup" className="flex flex-col gap-0.5">
          {children}
        </div>
      </div>
    </ListTableContext.Provider>
  )
}

/** One row of a `ListTable`: the whole row leads to its thing; its end stays its own control; rows may fold under it. */
export function ListTableRow({ href, label, description, icon, cells, end, onClick, external = false, children, defaultOpen = false, open: openProp, onOpenChange, ...rest }: ListTableRowProps) {
  const table = useContext(ListTableContext)
  const [openState, setOpenState] = useState(defaultOpen)
  const panelId = useId()
  if (!table) throw new Error('ListTableRow is a row of a ListTable: put it inside one.')
  const hasRows = children != null && children !== false
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }
  const row = (
    // A row's look in every list: 8px corners, the fill under the pointer and no edge.
    // 24px between the name and each fact, and before the end (Katerina, 17 November): they touched at 12.
    <div role="row" className="group/row relative flex min-w-0 items-center gap-6 rounded-lg px-3 py-2 hover:bg-bg-hover" {...rest}>
      {/* The name takes the room left, so the facts sit together on the right (Katerina, 17 November). */}
      <span role="cell" className="flex min-w-0 flex-1 items-center gap-3">
        {(icon != null || hasRows) && (
          // With rows under it the slot is kept even with no icon, and the icon gives way to the arrow in its place (NavItem's).
          <span className={cn('flex min-w-4 shrink-0 items-center text-text-secondary', hasRows && 'transition-opacity group-hover/row:opacity-0 group-has-[:focus-visible]/row:opacity-0')}>{icon}</span>
        )}
        {/* 2px between the name and its line, as every two-line row in the kit (LinkCard, LinkRow, PartCard, a tall MenuItem); they touched (Katerina, 16 November). */}
        <Link href={href} variant="plain" cover external={external} className="flex min-w-0 flex-1 flex-col gap-0.5" {...(onClick ? { onClick } : {})}>
          <span className="truncate text-body-2 font-medium text-text-primary">{label}</span>
          {description && <span className="truncate text-caption text-text-secondary">{description}</span>}
        </Link>
        {hasRows && (
          // After the covering link, so the arrow stays its own button. `left-2`: the 24px button's 16px arrow lands where
          // the icon sits (the row's 12px), so the icon turns into the arrow in place, as a NavItem's does.
          <span className="absolute inset-y-0 left-2 flex items-center opacity-0 transition-opacity group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100">
            <IconButton
              tooltip={open ? 'Collapse' : 'Expand'}
              aria-label={open ? `Hide what is under ${label}` : `Show what is under ${label}`}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(!open)}
            >
              <IconChevronRight size={16} stroke={1.5} className={cn('transition-transform duration-150', open && 'rotate-90')} />
            </IconButton>
          </span>
        )}
      </span>
      {table.columns.map((column, i) =>
        showsColumn(column, table.shown) ? (
          // A cell's parts sit 6px apart: faces and their number.
          <span key={column.label} role="cell" className={cn('flex shrink-0 items-center gap-1.5 truncate text-caption text-text-secondary', WIDTH_CLASSES[sizeOf(column)])}>
            {cells[i] ?? '–'}
          </span>
        ) : null,
      )}
      {table.end && (
        // After the covering link and `relative`, so what is here stays its own control.
        // The room the name leaves goes before it: the end keeps the list's right edge. A button's height (24px) in every
        // row, so a row with nothing at its end is as tall as one with its ⋮ (40px; it was 36, Katerina, 16 November).
        <span role="cell" className="relative ml-auto flex h-6 w-16 shrink-0 items-center justify-end gap-1">
          {end}
        </span>
      )}
    </div>
  )
  if (!hasRows) return row
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="flex flex-col">
      {row}
      {/* CollapsibleSection's and NavItem's slide; hidden until found, so the browser's find still opens it. */}
      <Collapsible.Panel id={panelId} hiddenUntilFound className={COLLAPSIBLE_PANEL_CLASSES}>
        {/*
          NavItem's tree line and indent, for this row's 12px: 1px down from the middle of its icon (12px in, 16px wide),
          and the rows past it 24px in, their icons under its name. Only the name gives the room: the facts keep their
          columns, since every row's facts sit at the right.
        */}
        <div role="presentation" className="ml-[19px] mt-0.5 flex flex-col gap-0.5 border-l border-border-default pl-1">
          {children}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
