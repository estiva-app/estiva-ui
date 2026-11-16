import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { cn } from './cn'
import { Link } from './Link'

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
  /** One per column, in the columns' order: words, or a part (`AvatarGroup`, `MetaText`). Absent, a dash: not read yet. */
  cells: ReactNode[]
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
/** Each column's 12px gap before it. */
const GAP_PX = 12
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
 * is at most 384px and the facts sit beside it; the room left goes before the end, which keeps the list's right edge.
 * The list takes the whole width it is given, as every page's body does (Katerina, 16 November).
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
          <div role="row" className={cn('flex items-center gap-3 px-3 text-caption text-text-muted', !headings && 'sr-only')}>
            {/* Over the name, past the icon; as wide as the names' cells. */}
            <span role="columnheader" className="min-w-0 max-w-sm flex-1 pl-7">
              {nameLabel}
            </span>
            {columns.map((column) =>
              showsColumn(column, shown) ? (
                <span key={column.label} role="columnheader" className={cn('shrink-0 truncate', WIDTH_CLASSES[sizeOf(column)])}>
                  {column.label}
                </span>
              ) : null,
            )}
            {end && <span role="columnheader" aria-label="Actions" className="ml-auto w-16 shrink-0" />}
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

/** One row of a `ListTable`: the whole row leads to its thing; its end stays its own control. */
export function ListTableRow({ href, label, description, icon, cells, end, onClick, ...rest }: ListTableRowProps) {
  const table = useContext(ListTableContext)
  if (!table) throw new Error('ListTableRow is a row of a ListTable: put it inside one.')
  return (
    // A row's look in every list: 8px corners, the fill under the pointer and no edge.
    <div role="row" className="relative flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 hover:bg-bg-hover" {...rest}>
      {/* At most 384px: a short name keeps its facts beside it, not across the page (Katerina, 16 November). */}
      <span role="cell" className="flex min-w-0 max-w-sm flex-1 items-center gap-3">
        {icon != null && <span className="flex shrink-0 items-center text-text-secondary">{icon}</span>}
        {/* 2px between the name and its line, as every two-line row in the kit (LinkCard, LinkRow, PartCard, a tall MenuItem); they touched (Katerina, 16 November). */}
        <Link href={href} variant="plain" cover className="flex min-w-0 flex-1 flex-col gap-0.5" {...(onClick ? { onClick } : {})}>
          <span className="truncate text-body-2 font-medium text-text-primary">{label}</span>
          {description && <span className="truncate text-caption text-text-secondary">{description}</span>}
        </Link>
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
}
