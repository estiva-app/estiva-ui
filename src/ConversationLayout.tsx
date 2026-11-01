import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Card } from './Card'
import { Chip } from './Chip'
import { CollapsibleSection } from './CollapsibleSection'
import { cn } from './cn'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'
import { ScrollArea } from './ScrollArea'
import { SkeletonConversation } from './Skeleton'
import { caretOnOpen, InConversationItem, InThreadCard, LineByLayout, useFaceLine, type ConversationItemState } from './threadCard'

/** One comment in the list, and its thread when it is open. */
export interface ConversationItem {
  id: string
  /** The comment: a `ConversationCard`. */
  card: ReactNode
  /** Its thread: a `Thread` with the same `place` as the layout's `threads`, drawn while it is the open one. Give every comment one, even with no replies yet: a card without one cannot be opened. */
  thread?: ReactNode
  /** Resolved. In one column it waits under "Resolved", closed, at the end; in two columns it stays in its place. */
  resolved?: boolean
  /** What it was on was deleted from the page. In one column it waits under "On deleted blocks", closed, before "Resolved"; a resolved one is under "Resolved". */
  gone?: boolean
}

export interface ConversationLayoutProps {
  /** Where an open thread stands. `beside`, two columns: the comments fill the page, the thread stands in the 384px column beside them. `under`, one column: the comments are the 384px column beside the page, and a thread opens under its comment. */
  threads: 'beside' | 'under'
  items: readonly ConversationItem[]
  /** The id of the comment whose thread is open. */
  open?: string
  /**
   * A comment asks to open or close its thread: a press anywhere on its card, its replies row, or Reply. In one column
   * a second press closes it. The layout draws it open in place, with no jump, and puts the caret in its box; the app
   * keeps `open`. `undefined`: closed.
   */
  onOpenChange?: (id: string | undefined) => void
  /** The box a new comment is written in, under the comments. */
  box?: ReactNode
  /** Above the comments, inside their list: a `ReactionHorizon`, a note. */
  above?: ReactNode
  /** Still reading the comments. */
  loading?: boolean
  /** What an empty conversation says. */
  empty?: string
  /** Two columns: the comments' own header, a `PageHeader`, over their column only, so the thread beside them runs the page's full height (Peek's way). */
  header?: ReactNode
  /** One column: its name, in its header. */
  title?: ReactNode
  /** One column: its header's actions, as a `Panel`'s. */
  actions?: ReactNode
  /** Placement only. */
  className?: string
}

interface ListProps {
  items: readonly ConversationItem[]
  open?: string
  under: boolean
  above?: ReactNode
  loading: boolean
  empty: string
  /** Asked to open or close: `id` is the comment pressed, `next` what is open after; `reply`, asked by Reply. */
  change?: (id: string, next: string | undefined, reply?: boolean) => void
  /** How many times a thread has opened: its box takes the caret each time. */
  caret: number
}

/** The list's own room: placeholders, the empty line, or the comments 8px apart. */
function List({ items, open, under, above, loading, empty, change, caret }: ListProps) {
  if (loading) return <SkeletonConversation />
  if (items.length === 0) return <EmptyState scope="section" message={empty} />
  // How each card opens its thread: only one that has a thread, and only when the app keeps `open`.
  const stateOf = (item: ConversationItem): ConversationItemState | null =>
    change && item.thread
      ? {
          under,
          open: open === item.id,
          toggle: () => change(item.id, under && open === item.id ? undefined : item.id),
          show: () => change(item.id, item.id, true),
        }
      : null
  const draw = (item: ConversationItem) => {
    if (!under) {
      return (
        <div key={item.id} data-conversation-item={item.id} className="flex flex-col">
          <InConversationItem.Provider value={stateOf(item)}>{item.card}</InConversationItem.Provider>
        </div>
      )
    }
    return <UnderItem key={item.id} item={item} isOpen={open === item.id && !!item.thread} state={stateOf(item)} caret={caret} />
  }
  if (!under) {
    return (
      <>
        {above}
        {items.map(draw)}
      </>
    )
  }
  // One column: the comments on a deleted part, then the resolved ones, each closed under its name at the end, with
  // how many (Leaf's column; Katerina, 1 November: kept for every one-column app). A group opens by itself for the
  // thread open in it, as one opened from a link.
  const resolved = items.filter((item) => item.resolved)
  const gone = items.filter((item) => item.gone && !item.resolved)
  const group = (title: string, list: readonly ConversationItem[]) =>
    list.length > 0 && (
      <CollapsibleSection
        title={title}
        trailing={<Chip type="neutral" label={String(list.length)} />}
        defaultOpen={false}
        openFor={list.some((item) => item.id === open) ? open : undefined}
        className="shrink-0"
        contentClassName="flex flex-col gap-2"
      >
        {list.map(draw)}
      </CollapsibleSection>
    )
  return (
    <>
      {above}
      {items.filter((item) => !item.resolved && !item.gone).map(draw)}
      {group('On deleted blocks', gone)}
      {group('Resolved', resolved)}
    </>
  )
}

/**
 * One comment in one column, and its thread when open. Every comment stands in the same card, open or closed, so
 * opening never rebuilds it (no blink, no jump; Katerina, 31 October). Closed, the card is invisible round it; open, it
 * is the one card round the comment and its thread, the comment's own card quiet inside it (Ship's way), and it draws
 * the line from the comment's face to the last reply as one measured bar (Katerina, 1 November: one straight line).
 */
function UnderItem({ item, isOpen, state, caret }: { item: ConversationItem; isOpen: boolean; state: ConversationItemState | null; caret: number }) {
  const root = useRef<HTMLDivElement>(null)
  const line = useFaceLine(root, isOpen)
  return (
    <Card
      ref={root}
      data-conversation-item={item.id}
      data-open={isOpen || undefined}
      // Open, its edge and no fill, as the comments round it (Katerina, 1 November: no background in Ship); the
      // edge the surface fill had, held by `hovered`.
      fill="none"
      hover="hairline"
      hovered={isOpen}
      quietUntilHover={!isOpen}
      className={cn('relative flex flex-col', isOpen && 'pb-2')}
    >
      <InConversationItem.Provider value={state}>
        <InThreadCard.Provider value={isOpen}>
          <LineByLayout.Provider value>
            {/* Over this card's edge, 1px out each way: the comment keeps its place and width, open or closed. */}
            <div className="-m-px flex flex-col">{item.card}</div>
            {isOpen && <caretOnOpen.Provider value={caret}>{item.thread}</caretOnOpen.Provider>}
          </LineByLayout.Provider>
        </InThreadCard.Provider>
      </InConversationItem.Provider>
      {line && (
        // The face's line, one bar, last so it stands over a hovered card's fill; 19px in, centred under the face.
        // Its top and height come from the measure: where the face and the last reply end are not known ahead.
        <span aria-hidden className="pointer-events-none absolute left-[19px] w-0.5 bg-border-default" style={{ top: line.top, height: line.height }} />
      )}
    </Card>
  )
}

/**
 * Where a conversation's cards sit, in one of two ways every app picks from (where it sits is the app's, the record
 * says). Two columns: the comments fill the page and an open thread stands beside them, 384px. One column: the
 * comments are the 384px column beside the page, and a thread opens under its comment, the two one card. The right column is 384px in
 * every app (Katerina, 31 October). With two columns the thread runs the full height, beside the comments' header.
 */
export function ConversationLayout({ threads, items, open, onOpenChange, box, above, loading = false, empty = 'No comments yet.', header, title = 'Comments', actions, className }: ConversationLayoutProps) {
  // One column: the pressed comment stays where it was on screen. Opening one thread closes the other, and when that
  // one stood above it, everything under it would rise by its height (Katerina, 31 October). Where it was is noted at
  // the press; once the change is drawn, before it is painted, the column scrolls by however far it went.
  const body = useRef<HTMLDivElement>(null)
  const pressed = useRef<{ id: string; top: number } | null>(null)
  const itemAt = (id: string) => body.current?.querySelector<HTMLElement>(`[data-conversation-item="${CSS.escape(id)}"]`) ?? null
  // A thread that opens puts the caret in its box (Katerina, 31 October); the one open when the page is drawn does not.
  const [caret, setCaret] = useState(0)
  const change = onOpenChange
    ? (id: string, next: string | undefined, reply = false) => {
        if (next !== undefined && next === open) {
          // Already open: nothing moves. Reply on it puts the caret in its box again; nothing else is asked of the app.
          if (reply) setCaret((n) => n + 1)
          return
        }
        const item = threads === 'under' ? itemAt(id) : null
        pressed.current = item ? { id, top: item.getBoundingClientRect().top } : null
        onOpenChange(next)
      }
    : undefined
  useLayoutEffect(() => {
    const at = pressed.current
    pressed.current = null
    const item = at && itemAt(at.id)
    if (!at || !item || !body.current) return
    const moved = item.getBoundingClientRect().top - at.top
    if (moved !== 0) body.current.scrollTop += moved
  }, [open])
  const was = useRef(open)
  useEffect(() => {
    if (open !== undefined && open !== was.current) setCaret((n) => n + 1)
    was.current = open
  }, [open])
  if (threads === 'under') {
    return (
      <Panel className={cn('w-[384px] flex-none', className)} title={title} actions={actions} bodyRef={body} bodyClassName="flex flex-col gap-2 p-3" footer={box && <div className="p-3">{box}</div>}>
        <List items={items} open={open} under above={above} loading={loading} empty={empty} change={change} caret={caret} />
      </Panel>
    )
  }
  const opened = items.find((item) => item.id === open)?.thread
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1', className)}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {header}
        <ScrollArea className="min-h-0 flex-1" contentClassName="flex flex-col gap-2 p-4">
          <List items={items} open={open} under={false} above={above} loading={loading} empty={empty} change={change} caret={caret} />
        </ScrollArea>
        {/* Peek's composer room: 12px all round (useFileConversationView's `p-3`), under the list's 16px. */}
        {box && <div className="shrink-0 p-3">{box}</div>}
      </div>
      {opened && (
        <div className="flex w-[384px] shrink-0 flex-col border-l border-border-subtle">
          <caretOnOpen.Provider value={caret}>{opened}</caretOnOpen.Provider>
        </div>
      )}
    </div>
  )
}
