import type { ReactNode, Ref, UIEventHandler } from 'react'
import { cn } from './cn'
import { ContainerHeader } from './ContainerHeader'
import { ErrorBoundary } from './ErrorBoundary'
import { ScrollArea } from './ScrollArea'

/**
 * A panel of a page: its name in a `ContainerHeader`, a body under it that
 * scrolls whenever it is taller than the room it has, and, when there is one,
 * a row fixed at the bottom that never scrolls — a reply box.
 *
 * Made so that scrolling comes from the package, not from each app remembering
 * it (Katerina, 26 September 2026). The apps built their panels from the
 * package's header and a box of their own, and a box without a `ScrollArea`
 * simply cut off what did not fit: Peek's widget panel on a Ship file lost the
 * end of a long description and the status control under it, with no bar and
 * nothing to scroll. Here the body is always a `ScrollArea`, so the bar shows
 * as soon as there is more, and an empty panel or a short one has none.
 *
 * It takes the room its column gives it (`flex-1 min-h-0`), never its content's
 * height, so the body is what scrolls, not the page. Two panels in one column
 * share it; a `max-h-*` in `className` caps one of them.
 *
 * It keeps a crash inside itself, as ListColumn does: if its body, its actions
 * or its footer break, the panel keeps its title and shows `ErrorBoundary`'s
 * message in the room the body had.
 */
export interface PanelProps {
  /** The panel's name, in its header. A node for a title that is more than words. */
  title: ReactNode
  /** A chevron after the title, as `ContainerHeader` draws it. */
  chevron?: boolean
  /** The panel's own actions, at the header's right — a `Toolbar` of `ToolbarButton`s, or one `IconButton`. */
  actions?: ReactNode
  /** The body. It scrolls when it is taller than the panel. */
  children: ReactNode
  /** A row fixed under the body that never scrolls — a reply box. */
  footer?: ReactNode
  /** The body's own box: its padding, gap and layout — `px-4 pt-3 pb-4`, `flex flex-col gap-2`. */
  bodyClassName?: string
  /** The body's scrolling box, for a panel that reads or drives its scroll: a thread that opens at its newest reply. */
  bodyRef?: Ref<HTMLDivElement>
  /** Fires as the body scrolls. */
  onBodyScroll?: UIEventHandler<HTMLDivElement>
  /** Placement only: a cap such as `max-h-[60%]` when it shares a column. */
  className?: string
}

function Frame({ title, chevron = false, actions, children, footer, bodyClassName, bodyRef, onBodyScroll, className, broken = false }: PanelProps & { broken?: boolean }) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <ContainerHeader title={title} chevron={chevron} actions={actions} />
      {broken ? (
        // The message takes the room the body had and centres itself in it.
        <div className="flex min-h-0 flex-1 flex-col px-4">{children}</div>
      ) : (
        <ScrollArea className="min-h-0 flex-1" contentClassName={bodyClassName} viewportRef={bodyRef} onScroll={onBodyScroll}>
          {children}
        </ScrollArea>
      )}
      {!broken && footer && <div className="shrink-0">{footer}</div>}
    </div>
  )
}

export function Panel(props: PanelProps) {
  return (
    <ErrorBoundary
      label="panel"
      frame={(message) => (
        // Only the name comes back with the message: the actions and the footer may be what threw.
        <Frame title={props.title} chevron={props.chevron} className={props.className} broken>
          {message}
        </Frame>
      )}
    >
      <Frame {...props} />
    </ErrorBoundary>
  )
}
