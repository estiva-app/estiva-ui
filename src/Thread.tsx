import { Children, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { IconX } from '@tabler/icons-react'
import { Chip } from './Chip'
import { cn } from './cn'
import { repliesDrawn, useSteadyScroll } from './conversationScroll'
import { Divider } from './Divider'
import { EmptyState } from './EmptyState'
import { IconButton } from './IconButton'
import { Panel } from './Panel'
import { PinnedComment, type PinnedCommentProps } from './PinnedComment'
import { useWatchSeen, type SeenOnScreen } from './seenOnScreen'
import { SkeletonConversation } from './Skeleton'
import { caretOnOpen, LineByLayout, SHOWN_CLASSES } from './threadCard'

/** A thread is placed as it opens, at its newest: the keeper may act from the first change of size. */
const always = () => true

/** The comment a thread answers, pinned at the top of its column. */
export interface ThreadStart extends PinnedCommentProps {
  /** Its id, on the pinned comment as `data-thread-start`, as each comment of a ConversationLayout carries `data-conversation-item`: what an app scrolls to when a link names the comment. */
  id?: string
}

export interface ThreadProps {
  /** `beside`: in the right column, beside the comments, under its own header. `under`: open under its comment, in a one-column conversation: its replies hang from a line, quiet, and the box is under them; ConversationLayout makes the comment and its thread one card. */
  place?: 'beside' | 'under'
  /** The comment it answers, pinned at the top of the column. Under its comment it is not repeated. */
  start?: ThreadStart
  /** Its replies, in time order: `ReplyCard`s, each keyed by its own id. How it was resolved is said on its comment, not among them (Katerina, 1 November). */
  children?: ReactNode
  /** Still reading the replies: placeholders in their place. */
  loading?: boolean
  /** Resolved: "Resolved" at the top of the column, in green. */
  resolved?: boolean
  /** The box a reply is written in: the app's `CommentBox`. */
  box?: ReactNode
  /** Said in place of the box: why no reply can be written (an archived page, a deleted comment). */
  notice?: ReactNode
  /** The column's own actions, before Close: a `MembersPill`, an `IconButton` to where it was first said. */
  actions?: ReactNode
  /** Closes the column. */
  onClose?: () => void
  /** Close's name for a screen reader, in the app's words ("Close thread"). Its tooltip still says "Close". */
  closeLabel?: string
  /** Beside: what an empty thread says, words or the app's own `EmptyState`. `null`: nothing, for an app whose thread stood empty and silent. Under its comment an empty thread is only its box. */
  empty?: ReactNode
  /** The column's name. */
  title?: ReactNode
  /** Beside: the column's scrolling box. Where it scrolls is the thread's: it opens at the newest reply and goes to each new one. */
  bodyRef?: Ref<HTMLDivElement>
  /** What `useSeenOnScreen` made for this thread: it watches its replies (each `ReplyCard`'s `id`), beside or under its comment, and says in it which were seen. */
  seen?: SeenOnScreen
  /** Placement only. */
  className?: string
}

/** Whether there are replies: an app's `replies.map(…)` with none is an empty list, which is not nothing to React but is to the reader. */
const anyIn = (children: ReactNode) => Children.toArray(children).length > 0

function Replies({ children, loading, empty }: { children?: ReactNode; loading: boolean; empty: ReactNode }) {
  if (loading) return <SkeletonConversation />
  if (!anyIn(children)) return typeof empty === 'string' ? <EmptyState scope="section" message={empty} /> : <>{empty}</>
  return <>{children}</>
}

/**
 * A comment's replies, with the box to write one. In the right column (two columns: Peek's file pages), under its
 * own header with the comment pinned at the top, "Replies", and the box fixed at the bottom. Under its comment (one
 * column: Ship's and Leaf's), the replies hung from a line, quiet, and the box under them, all one card with the
 * comment (Ship's way). Peek's replies column, moved with the conversation.
 */
export function Thread({
  place = 'beside',
  start,
  children,
  loading = false,
  resolved = false,
  box,
  notice,
  actions,
  onClose,
  closeLabel = 'Close',
  empty = 'No replies yet.',
  title = 'Replies',
  bodyRef,
  seen,
  className,
}: ThreadProps) {
  const body = useRef<HTMLDivElement>(null)
  // The column's box is the thread's, and lent to the app as `bodyRef`.
  const setBody = useCallback(
    (el: HTMLDivElement | null) => {
      body.current = el
      if (typeof bodyRef === 'function') bodyRef(el)
      else if (bodyRef) bodyRef.current = el
    },
    [bodyRef],
  )
  // A reply is read by being seen in its thread (Peek's PEE-44): each one is watched, beside in the column's box, and
  // under its comment in the thread's own (one column; Ship, 2 November). The app's `bodyRef` stays the column's only.
  const under = useRef<HTMLDivElement>(null)
  useWatchSeen(seen, place === 'under' ? under : body, 'data-reply-id')
  /*
    Beside: it opens at its newest reply, before the paint, so it never shows its top for a frame and then jumps; and
    it goes to the newest each time a reply is added, or another thread is drawn in it (Peek's OPT-9). Each ReplyCard
    counts itself as it is first drawn in it: another thread's replies, keyed by their own ids, are drawn afresh and
    take it to their newest whether or not it has a `start` and however many there are. A reply taken away (a delete)
    is not counted, and the reader stays where they are (Peek's thread went to its bottom then). A line of the app's
    own among them (a resolve history) takes it nowhere.
  */
  const [drawn] = useState(() => ({ added: 0 }))
  const last = useRef<{ added: number; start?: string } | null>(null)
  const steady = useSteadyScroll(body, undefined, always, start?.id, place === 'beside')
  useLayoutEffect(() => {
    const el = body.current
    if (place !== 'beside' || !el) return
    const now = { added: drawn.added, start: start?.id }
    if (last.current && last.current.added === now.added && last.current.start === now.start) return
    last.current = now
    el.scrollTop = el.scrollHeight
    // And it stays there while the replies' cards, chips and pictures fill in (OPT-10).
    steady.rebase()
  })
  const foot = notice ?? box
  // In a ConversationLayout the layout draws the line, from the comment's face to the last reply, as one bar.
  const layoutLine = useContext(LineByLayout)
  if (place === 'under') {
    return (
      <div ref={under} data-thread="under" className={cn('flex flex-col', className)}>
          {(loading || anyIn(children)) && (
            // The replies hang from a line under the comment's face (20px in: its 8px and half its 24px), one step in (Ship's way).
            // 8px from the one card's right edge too, as the box under them: a hovered reply never touches it (Katerina, 31 October).
            // 2px, as the line from the comment's face that runs into it (Katerina, 1 November), and drawn the same way, a
            // filled bar rather than a border: a border snaps to the screen's pixels on its own, and at some zooms the two
            // stood a pixel apart (Katerina: "the line breaks in the middle").
            <div data-thread-replies className="relative ml-[19px] mr-2 flex flex-col gap-1 pl-2.5">
              {!layoutLine && <span aria-hidden className="absolute bottom-0 left-0 top-0 w-0.5 bg-border-default" />}
              <caretOnOpen.Provider value={0}>{loading ? <SkeletonConversation /> : children}</caretOnOpen.Provider>
            </div>
          )}
          {foot && <div className="px-2 pt-2">{foot}</div>}
      </div>
    )
  }
  return (
    <Panel
      className={className}
      bodyRef={setBody}
      bodyClassName="flex flex-col"
      title={title}
      actions={
        <>
          {resolved && <Chip type="success" label="Resolved" />}
          {actions}
          {onClose && (
            <IconButton tooltip="Close" aria-label={closeLabel} onClick={onClose}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          )}
        </>
      }
      footer={foot && <div className="p-3">{foot}</div>}
    >
      {start && (
        <div className={cn('px-4 pb-2 pt-4', SHOWN_CLASSES)} data-thread-start={start.id}>
          <PinnedComment author={start.author} time={start.time} at={start.at} words={start.words} deleted={start.deleted} />
        </div>
      )}
      <Divider look="section" label="Replies" className="px-4 py-2" />
      <div className="flex flex-col gap-2 px-4 pb-4">
        <caretOnOpen.Provider value={0}>
          <repliesDrawn.Provider value={drawn}>
            <Replies loading={loading} empty={empty}>
              {children}
            </Replies>
          </repliesDrawn.Provider>
        </caretOnOpen.Provider>
      </div>
    </Panel>
  )
}
