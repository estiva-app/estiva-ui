import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref, type UIEvent, type UIEventHandler } from 'react'
import { Card } from './Card'
import { Chip } from './Chip'
import { CollapsibleSection } from './CollapsibleSection'
import { cn } from './cn'
import { ContainerHeader } from './ContainerHeader'
import { anchorIn, cardIn, isNearBottom, places, sendsInLayout, useSteadyScroll } from './conversationScroll'
import { Divider } from './Divider'
import { EmptyState } from './EmptyState'
import { ErrorBoundary } from './ErrorBoundary'
import { Panel } from './Panel'
import { ScrollArea } from './ScrollArea'
import { useWatchSeen, type SeenOnScreen } from './seenOnScreen'
import { SkeletonConversation } from './Skeleton'
import { caretOnOpen, InConversationItem, InThreadCard, LineByLayout, SHOWN_CLASSES, useFaceLine, type ConversationItemState } from './threadCard'

/** One comment in the list, and its thread when it is open. */
export interface ConversationItem {
  id: string
  /** The comment: a `ConversationCard`. */
  card: ReactNode
  /**
   * Its thread: a `Thread` with the same `place` as the layout's `threads`, drawn while it is the open one. Give every
   * comment one, even with no replies yet: a card without one cannot be opened. Or a function that draws it, called
   * only while it is the open one: for an app that builds only the open thread.
   */
  thread?: ReactNode | (() => ReactNode)
  /** Resolved. In one column it waits under "Resolved", closed, at the end; in two columns it stays in its place. */
  resolved?: boolean
  /** What it was on was deleted from the page. In one column it waits under "On deleted blocks", closed, before "Resolved"; a resolved one is under "Resolved". */
  gone?: boolean
  /** Two columns: the day it was written, in the app's words ("Today", "Monday"). Comments of one day are one stretch under a line naming it, which stays at the top while its stretch scrolls under it. */
  day?: string
  /** Two columns: drawn just above it, 8px off, inside its day: the app's "New" line over the first comment not read. */
  before?: ReactNode
}

export interface ConversationLayoutProps {
  /** Where an open thread stands. `beside`, two columns: the comments fill the page, the thread stands in the 384px column beside them. `under`, one column: the comments are the 384px column beside the page, and a thread opens under its comment. */
  threads: 'beside' | 'under'
  items: readonly ConversationItem[]
  /** The id of the comment whose thread is open. */
  open?: string
  /** Two columns: what the 384px column holds while no thread is open, the page's own panel beside its comments (an overview). Nothing: no column. */
  aside?: ReactNode
  /**
   * A comment asks to open or close its thread: a press anywhere on its card, its replies row, or Reply. In one column
   * a second press closes it. The layout draws it open in place, with no jump, and puts the caret in its box; the app
   * keeps `open`. `undefined`: closed.
   */
  onOpenChange?: (id: string | undefined) => void
  /** The box a new comment is written in, under the comments. */
  box?: ReactNode
  /** Above the comments, inside their list: placeholders while older comments are read, a note. */
  above?: ReactNode
  /** Under the comments, inside their list, or under the empty line: a `ReactionHorizon`, or the app's own note. One column: after "Resolved" too, at the column's foot, so with few comments it sits on the box. Not while the comments are read. */
  below?: ReactNode
  /** Two columns: at the top of the column however few the comments are, over the room a short conversation leaves: an `ArchivedNotice`. */
  top?: ReactNode
  /** Still reading the comments. */
  loading?: boolean
  /** What an empty conversation says: words, or the app's own `EmptyState` (a read that failed says so). `null`: nothing. */
  empty?: ReactNode
  /**
   * Two columns: the conversation's own name in the app (its address). Where the reader left it is remembered by it in
   * this tab, and going back to it lands there: at the newest if it was left there, else on the same comment. Without
   * it, it opens at the newest each time it is drawn. `useLeftAt` with the same name says when it was left, for a "New" line.
   */
  rememberAs?: string
  /** Two columns: the comments' scrolling box. Where it scrolls is the layout's: an app reads it, and keeps no place of its own in it. */
  bodyRef?: Ref<HTMLDivElement>
  /** Two columns: the comments' box scrolled. */
  onBodyScroll?: UIEventHandler<HTMLDivElement>
  /** What `useSeenOnScreen` made for this conversation: the layout watches its comments, and says in it which were seen. */
  seen?: SeenOnScreen
  /** Two columns: the comments' own header, a `PageHeader`, over their column only, so the thread beside them runs the page's full height (Peek's way). */
  header?: ReactNode
  /** Its name: one column's, in its header. Two columns, said with the message if the column breaks (the page's own bar is `header`). */
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
  empty: ReactNode
  /** Asked to open or close: `id` is the comment pressed, `next` what is open after; `reply`, asked by Reply. */
  change?: (id: string, next: string | undefined, reply?: boolean) => void
  /** How many times a thread has opened: its box takes the caret each time. */
  caret: number
}

/** An item's thread as it is drawn: the app's element, or what its function draws, asked only while it is open. */
const threadOf = (item: ConversationItem | undefined): ReactNode => (typeof item?.thread === 'function' ? item.thread() : item?.thread)

/** The list's own room: placeholders, the empty line, or the comments 8px apart. */
function List({ items, open, under, above, loading, empty, change, caret }: ListProps) {
  if (loading) return <SkeletonConversation />
  if (items.length === 0) return typeof empty === 'string' ? <EmptyState scope="section" message={empty} /> : <>{empty}</>
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
        <Fragment key={item.id}>
          {item.before}
          <div data-conversation-item={item.id} className={cn('flex flex-col', SHOWN_CLASSES)}>
            <InConversationItem.Provider value={stateOf(item)}>{item.card}</InConversationItem.Provider>
          </div>
        </Fragment>
      )
    }
    return <UnderItem key={item.id} item={item} isOpen={open === item.id && !!item.thread} state={stateOf(item)} caret={caret} />
  }
  if (!under) {
    // Two columns: a day's comments are one stretch under its line, so the line stays at the top only while its own
    // stretch scrolls under it, and the next day's pushes it away (Peek's day lines).
    // Keyed by its day, not its place, so older comments arriving at the top redraw nothing under them; a day that
    // comes back further down (an app's own order) is that day's second stretch.
    const stretches: { key: string; day?: string; items: ConversationItem[] }[] = []
    const seen = new Map<string, number>()
    for (const item of items) {
      const last = stretches[stretches.length - 1]
      if (last && last.day === item.day) {
        last.items.push(item)
        continue
      }
      const name = item.day ?? ''
      const count = (seen.get(name) ?? 0) + 1
      seen.set(name, count)
      stretches.push({ key: `${item.day === undefined ? 'no-day' : `day:${name}`}#${count}`, day: item.day, items: [item] })
    }
    return (
      <>
        {above}
        {stretches.map((stretch) =>
          stretch.day === undefined ? (
            <Fragment key={stretch.key}>{stretch.items.map(draw)}</Fragment>
          ) : (
            <div key={stretch.key} className="flex flex-col gap-2">
              <Divider look="section" label={stretch.day} sticky />
              {stretch.items.map(draw)}
            </div>
          ),
        )}
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
      className={cn('relative flex flex-col', isOpen && 'pb-2', SHOWN_CLASSES)}
    >
      <InConversationItem.Provider value={state}>
        <InThreadCard.Provider value={isOpen}>
          <LineByLayout.Provider value>
            {/* Over this card's edge, 1px out each way: the comment keeps its place and width, open or closed. */}
            <div className="-m-px flex flex-col">{item.card}</div>
            {isOpen && <caretOnOpen.Provider value={caret}>{threadOf(item)}</caretOnOpen.Provider>}
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

/** The place of a conversation with no name: placed once each time it is drawn, and not remembered. */
const FRESH: object = {}

/**
 * Where a conversation's cards sit, in one of two ways every app picks from (where it sits is the app's, the record
 * says). Two columns: the comments fill the page and an open thread stands beside them, 384px. One column: the
 * comments are the 384px column beside the page, and a thread opens under its comment, the two one card. The right column is 384px in
 * every app (Katerina, 31 October). With two columns the thread runs the full height, beside the comments' header.
 */
export function ConversationLayout({
  threads,
  items,
  open,
  aside,
  onOpenChange,
  box,
  above,
  below,
  top,
  loading = false,
  empty = 'No comments yet.',
  header,
  title = 'Comments',
  actions,
  rememberAs,
  bodyRef,
  onBodyScroll,
  seen,
  className,
}: ConversationLayoutProps) {
  const beside = threads === 'beside'
  // One column: the pressed comment stays where it was on screen. Opening one thread closes the other, and when that
  // one stood above it, everything under it would rise by its height (Katerina, 31 October). Where it was is noted at
  // the press; once the change is drawn, before it is painted, the column scrolls by however far it went.
  const body = useRef<HTMLDivElement>(null)
  // The comments' box is the layout's, and lent to the app as `bodyRef`.
  const setBody = useCallback(
    (el: HTMLDivElement | null) => {
      body.current = el
      if (typeof bodyRef === 'function') bodyRef(el)
      else if (bodyRef) bodyRef.current = el
    },
    [bodyRef],
  )
  // A comment is read by being seen (Peek's way, Katerina, 30 October): each one in the list is watched.
  useWatchSeen(seen, body, 'data-conversation-item')
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

  /*
    Two columns: where the comments scroll, Peek's way (C1 of the audit of 2 November). Was the reader at the live edge
    when something arrived? Only then does it follow: a comment that arrives follows only a reader already at the bottom.
  */
  const nearBottom = useRef(true)
  // The conversation placed last: once per name (once per drawing, without one), and once its comments are read;
  // none while they are being read. Where the reader is is recorded only while it is placed.
  const placedFor = useRef<string | object | null>(null)
  const placeKey = rememberAs ?? FRESH
  const scrolled = (event: UIEvent<HTMLDivElement>) => {
    const el = body.current
    if (beside && el) {
      nearBottom.current = isNearBottom(el)
      if (rememberAs && placedFor.current === rememberAs) places.set(rememberAs, { atBottom: nearBottom.current, offset: el.scrollTop, anchor: anchorIn(el), leftAt: Date.now() })
    }
    onBodyScroll?.(event)
  }
  // Opening lands at the newest, before the paint. Going back to one lands where it was left (Peek's OPT-3): at the
  // newest if it was left there, so what arrived meanwhile is in view; else on the comment that was at the top.
  useLayoutEffect(() => {
    if (!beside) return
    if (loading) {
      // Its placeholders stand in its comments' place: once they are read it is placed again, and meanwhile nothing
      // is recorded, so the offset the shorter placeholders pull it to is never taken for where the reader left it.
      placedFor.current = null
      return
    }
    if (placedFor.current === placeKey) return
    const el = body.current
    if (!el) return
    const left = rememberAs ? places.get(rememberAs) : undefined
    if (left && !left.atBottom) {
      // That comment back at the same height, not the same offset: what is above it can change height while the
      // reader is away (a "new reply" mark cleared once read, a reactions line).
      el.scrollTop = left.offset
      const card = left.anchor && cardIn(el, left.anchor.id)
      if (card && left.anchor) el.scrollTop += card.getBoundingClientRect().top - el.getBoundingClientRect().top - left.anchor.top
      nearBottom.current = false
    } else {
      el.scrollTop = el.scrollHeight
      nearBottom.current = true
      if (rememberAs) places.set(rememberAs, { atBottom: true, offset: el.scrollTop, leftAt: Date.now() })
    }
    placedFor.current = placeKey
  }, [beside, placeKey, rememberAs, loading])
  // From there, it stays where the reader is while its cards, chips and pictures fill in (Peek's OPT-10).
  const placed = useCallback(() => placedFor.current === placeKey, [placeKey])
  useSteadyScroll(body, nearBottom, placed, loading, beside)
  // Leaving: the moment it was left is when "New" starts on the way back.
  useEffect(() => {
    if (!beside || !rememberAs) return
    return () => {
      const left = places.get(rememberAs)
      if (left) places.set(rememberAs, { ...left, leftAt: Date.now() })
    }
  }, [beside, rememberAs])
  // A comment arrives: follow only a reader who was watching the live edge.
  useLayoutEffect(() => {
    if (!beside || loading || !nearBottom.current) return
    const el = body.current
    if (el) el.scrollTop = el.scrollHeight
  }, [beside, items.length, loading])
  // The reader's own comment, sent from the box, brings them down to it as it is drawn (Peek's OPT-6); a refusal leaves
  // where they actually are to decide what follows next.
  const [sends] = useState(() => ({
    sending: () => {
      nearBottom.current = true
    },
    refused: () => {
      if (body.current) nearBottom.current = isNearBottom(body.current)
    },
  }))
  if (threads === 'under') {
    return (
      // The body at least the column's height: the comments start at its top, and the note under them (`below`) is pushed
      // to its foot, so with few comments it sits on the box, as a short conversation's last line does in Peek's two
      // columns (Katerina, 2 November); with many it comes after them, and scrolls with them.
      <Panel className={cn('w-[384px] flex-none', className)} title={title} actions={actions} bodyRef={setBody} bodyClassName="flex min-h-full flex-col gap-2 p-3" footer={box && <div className="p-3">{box}</div>}>
        <List items={items} open={open} under above={above} loading={loading} empty={empty} change={change} caret={caret} />
        {!loading && below != null && below !== false && below !== '' && <div className="mt-auto flex flex-col gap-2">{below}</div>}
      </Panel>
    )
  }
  const opened = threadOf(items.find((item) => item.id === open))
  // The column: the open thread, or while none is, the page's own panel (Peek's Overview); neither, no column.
  const side = opened || aside
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1', className)}>
      {/* If the column throws, its name stays with the message, as a Panel's does; the thread beside it stays. */}
      <ErrorBoundary
        label="conversation"
        frame={(message) => (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ContainerHeader title={title} />
            <div className="flex min-h-0 flex-1 flex-col px-4">{message}</div>
          </div>
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {header}
          <ScrollArea className="min-h-0 flex-1" viewportRef={setBody} onScroll={scrolled} contentClassName="flex min-h-full flex-col">
            {top != null && top !== false && top !== '' && <div className="shrink-0 px-4 pt-4">{top}</div>}
            {/* A short conversation sits on its box, as a chat does: the newest comment by the box (Peek's way). */}
            <div className="min-h-0 flex-1" />
            <div className="flex shrink-0 flex-col gap-2 p-4">
              <List items={items} open={open} under={false} above={above} loading={loading} empty={empty} change={change} caret={caret} />
              {!loading && below}
            </div>
          </ScrollArea>
          {/* Peek's composer room: 12px all round (useFileConversationView's `p-3`), under the list's 16px. */}
          {box && (
            <div className="shrink-0 p-3">
              <sendsInLayout.Provider value={sends}>{box}</sendsInLayout.Provider>
            </div>
          )}
        </div>
      </ErrorBoundary>
      {side && (
        // Its own catch, as Peek's column had: a thread or a panel that throws says so in the column, and the comments stay.
        // One catch per thread, and one for the aside: a thread that threw is let go once it is closed or another opens,
        // as Peek's column, drawn only while a thread was open, let it go on closing. Each thread is drawn afresh.
        <div className="flex w-[384px] shrink-0 flex-col overflow-hidden border-l border-border-subtle">
          <ErrorBoundary key={opened ? `thread:${open}` : 'aside'} label="thread panel">
            {opened ? <caretOnOpen.Provider value={caret}>{opened}</caretOnOpen.Provider> : aside}
          </ErrorBoundary>
        </div>
      )}
    </div>
  )
}
