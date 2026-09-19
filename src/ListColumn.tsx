import type { ReactNode } from 'react'
import { cn } from './cn'
import { ContainerHeader } from './ContainerHeader'
import { ErrorBoundary } from './ErrorBoundary'
import { ScrollArea } from './ScrollArea'

/**
 * The list column of a page: the column beside the page's main area that lists
 * what it can open — 290px wide, a line on its right, its name in a
 * `ContainerHeader`, and a list under it that scrolls.
 *
 * Moved in from Peek as it looks (UIG-14, N9), where five pages drew it by
 * hand and each carried the same numbers: the frame's 290px and its line, and
 * the list's steps — 16px under the header, 12px above the bottom, rows 12px
 * in from each side and 2px apart. The numbers live here now, once. One
 * spacing for every list (Katerina, D5): a list of groups heads each with a
 * `CollapsibleSection` or a `SectionHeader`.
 *
 * It scrolls its rows itself. A list column that did not was the first of the
 * eight mistakes on the page that led to UIG-15: the frame's card clips, so a
 * list that grew past the fold was simply cut off, with nothing to scroll.
 *
 * It keeps a crash inside itself (D1, D3): if its rows, its actions or the row
 * above break, the column keeps its title and shows `ErrorBoundary`'s message
 * in the middle of the room the list had, and the rest of the page keeps working.
 *
 * `collapsed` closes it with the rail, as Peek's did: it narrows to nothing
 * and fades, in 300ms. What opens and closes the rail stays the app's.
 */
export interface ListColumnProps {
  /** The column's name, in its header. A node for a title that is more than words. */
  title: ReactNode
  /** A chevron after the title, as `ContainerHeader` draws it. */
  chevron?: boolean
  /** The column's own actions, at the header's right — a `Toolbar` of `ToolbarButton`s, or one `IconButton`. */
  actions?: ReactNode
  /** A row between the header and the list that stays put while the list scrolls — a field that adds to the list. */
  above?: ReactNode
  /** Closes the column with the rail: it narrows to nothing and fades. */
  collapsed?: boolean
  /** The rows, 2px apart. Groups are headed by a `CollapsibleSection` or a `SectionHeader`. */
  children: ReactNode
  /** Placement only. */
  className?: string
}

function Column({ title, chevron = false, actions, above, collapsed = false, children, className, broken = false }: ListColumnProps & { broken?: boolean }) {
  return (
    <div
      className={cn(
        // `shrink-0`: the column keeps its 290px beside a main area that grows.
        'flex shrink-0 flex-col overflow-hidden border-r border-border-subtle transition-[width,opacity] duration-300 ease-in-out',
        collapsed ? 'w-0 border-r-0 opacity-0' : 'w-[290px] opacity-100',
        className,
      )}
      data-collapsed={collapsed || undefined}
    >
      <ContainerHeader title={title} chevron={chevron} actions={actions} />
      {above}
      {broken ? (
        // The message takes the room the list had and centres itself in it (Katerina, 19 September).
        <div className="flex min-h-0 flex-1 flex-col px-3">{children}</div>
      ) : (
        <ScrollArea className="flex-1" contentClassName="flex flex-col gap-0.5 px-3 pt-4 pb-3">
          {children}
        </ScrollArea>
      )}
    </div>
  )
}

export function ListColumn(props: ListColumnProps) {
  return (
    <ErrorBoundary
      label="list panel"
      frame={(message) => (
        // Only the name comes back with the message: the actions and the row above may be what threw.
        <Column title={props.title} chevron={props.chevron} collapsed={props.collapsed} className={props.className} broken>
          {message}
        </Column>
      )}
    >
      <Column {...props} />
    </ErrorBoundary>
  )
}
