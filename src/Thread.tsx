import { Children, type ReactNode, type Ref } from 'react'
import { IconX } from '@tabler/icons-react'
import { Chip } from './Chip'
import { cn } from './cn'
import { Divider } from './Divider'
import { EmptyState } from './EmptyState'
import { IconButton } from './IconButton'
import { Panel } from './Panel'
import { PinnedComment, type PinnedCommentProps } from './PinnedComment'
import { SkeletonConversation } from './Skeleton'
import { useContext } from 'react'
import { caretOnOpen, LineByLayout } from './threadCard'

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
  /** Its replies, in time order: `ReplyCard`s. How it was resolved is said on its comment, not among them (Katerina, 1 November). */
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
  /** What an empty thread says. `null`: nothing, for an app whose thread stood empty and silent. */
  empty?: string | null
  /** The column's name. */
  title?: ReactNode
  /** The column's scrolling box, for opening at the newest reply. */
  bodyRef?: Ref<HTMLDivElement>
  /** Placement only. */
  className?: string
}

/** Whether there are replies: an app's `replies.map(…)` with none is an empty list, which is not nothing to React but is to the reader. */
const anyIn = (children: ReactNode) => Children.toArray(children).length > 0

function Replies({ children, loading, empty }: { children?: ReactNode; loading: boolean; empty: string | null }) {
  if (loading) return <SkeletonConversation />
  if (!anyIn(children)) return empty === null ? null : <EmptyState scope="section" message={empty} />
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
  className,
}: ThreadProps) {
  const foot = notice ?? box
  // In a ConversationLayout the layout draws the line, from the comment's face to the last reply, as one bar.
  const layoutLine = useContext(LineByLayout)
  if (place === 'under') {
    return (
      <div data-thread="under" className={cn('flex flex-col', className)}>
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
      bodyRef={bodyRef}
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
        <div className="px-4 pb-2 pt-4" data-thread-start={start.id}>
          <PinnedComment author={start.author} time={start.time} words={start.words} deleted={start.deleted} />
        </div>
      )}
      <Divider look="section" label="Replies" className="px-4 py-2" />
      <div className="flex flex-col gap-2 px-4 pb-4">
        <caretOnOpen.Provider value={0}>
          <Replies loading={loading} empty={empty}>
            {children}
          </Replies>
        </caretOnOpen.Provider>
      </div>
    </Panel>
  )
}
