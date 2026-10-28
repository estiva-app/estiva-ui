import { useState, type ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { cn } from '../../src/cn'
import { EmptyState } from '../../src/EmptyState'
import { IconButton } from '../../src/IconButton'
import { SkeletonBar } from '../../src/Skeleton'
import { Box, Collapsed, NoteCard, Thread, ThreadLink, isResolved, useConversation, type Conversation, type ConversationState, type ThreadOpens, type UrgentBar } from './Conversation'
import { nameOf, type Comment } from './fixtures'

/**
 * Where each app places the one conversation. The app gives the comments, the
 * width and where a thread opens; everything inside is the shared piece.
 */

export interface PlaceProps {
  comments: Comment[]
  start?: Partial<ConversationState>
  archived?: boolean
  urgentBar?: UrgentBar
  loading?: boolean
}

/** The comments, top to bottom; a resolved thread folds in place. */
export function List({
  c,
  opens,
  open,
  onOpen,
  archived = false,
  urgentBar,
}: {
  c: Conversation
  opens: ThreadOpens
  /** The thread open in the column beside, when `opens` is `beside`. */
  open?: string
  onOpen?: (id: string) => void
  archived?: boolean
  urgentBar?: UrgentBar
}) {
  return (
    <div className="flex flex-col gap-5">
      {c.comments.map((comment) => {
        const expanded = c.expanded.has(comment.id)
        if (isResolved(comment) && !expanded) return <Collapsed key={comment.id} comment={comment} c={c} archived={archived} onOpen={() => c.toggle(comment.id)} />
        if (opens === 'under' && expanded)
          return <Thread key={comment.id} comment={comment} c={c} archived={archived} urgentBar={urgentBar} threadLink={<ThreadLink comment={comment} open onClick={() => c.toggle(comment.id)} />} />
        return (
          <div key={comment.id} className={cn('-mx-2 rounded-md px-2 py-1', opens === 'beside' && open === comment.id && 'bg-bg-selected')}>
            <NoteCard
              comment={comment}
              c={c}
              archived={archived}
              urgentBar={urgentBar}
              threadLink={<ThreadLink comment={comment} onClick={() => (opens === 'beside' ? onOpen?.(comment.id) : c.toggle(comment.id))} />}
            />
          </div>
        )
      })}
    </div>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      {[220, 300, 180].map((w) => (
        <div key={w} className="flex gap-2">
          <SkeletonBar shape="round" className="h-6 w-6" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonBar className="h-3" style={{ width: 90 }} />
            <SkeletonBar className="h-3" style={{ width: w }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** The list, or loading, or nothing yet, and the box under it. */
function Column({ c, opens, open, onOpen, archived, urgentBar, loading }: { c: Conversation; opens: ThreadOpens; open?: string; onOpen?: (id: string) => void } & Omit<PlaceProps, 'comments' | 'start'>) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? <Loading /> : c.comments.length === 0 ? <EmptyState scope="section" message="Nothing here yet." /> : <List c={c} opens={opens} open={open} onOpen={onOpen} archived={archived} urgentBar={urgentBar} />}
      </div>
      <div className="border-t border-border-subtle p-3">
        <Box label="Write" placeholder="Write…" onSent={(body) => c.add(body)} closed={archived ? 'This is archived, so nothing new can be written here.' : undefined} />
      </div>
    </>
  )
}

function Header({ children }: { children: ReactNode }) {
  return <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-4 text-body-2 font-medium text-text-primary">{children}</div>
}

/** Peek: the comments in the main pane; a thread opens in the 380 px column beside it. */
export function PeekPane({ comments, start, title, ...rest }: PlaceProps & { title: ReactNode }) {
  const c = useConversation(comments, start)
  const [open, setOpen] = useState<string | undefined>(comments.find((x) => x.replies?.length && !isResolved(x))?.id)
  const thread = c.comments.find((x) => x.id === open)
  return (
    <div className="flex h-screen bg-bg-base">
      <section className="flex min-w-0 flex-1 flex-col">
        <Header>{title}</Header>
        <Column c={c} opens="beside" open={open} onOpen={setOpen} {...rest} />
      </section>
      {thread && (
        <aside className="flex w-[380px] shrink-0 flex-col border-l border-border-subtle bg-bg-surface">
          <Header>
            <span className="flex-1">Thread</span>
            {isResolved(thread) && <span className="rounded-full border border-success-outline bg-success-wash px-2 text-caption text-success-default">Resolved</span>}
            <IconButton aria-label="Close" tooltip="Close" onClick={() => setOpen(undefined)}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </Header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <Thread comment={thread} c={c} archived={rest.archived} urgentBar={rest.urgentBar} />
          </div>
        </aside>
      )}
    </div>
  )
}

/** Ship: a page's Activity, up to 768 px; a thread opens under its comment. */
export function ShipActivity({ comments, start, ...rest }: PlaceProps) {
  const c = useConversation(comments, start)
  return (
    <div className="flex h-screen justify-center bg-bg-base">
      <div className="flex w-full max-w-[768px] flex-col">
        <div className="flex flex-col gap-3 px-4 pt-6 pb-4">
          <h1 className="text-h2 text-text-primary">Item one</h1>
          <SkeletonBar className="h-3" style={{ width: '80%' }} />
          <SkeletonBar className="h-3" style={{ width: '60%' }} />
          <h2 className="pt-4 text-body-2 font-medium text-text-secondary">Activity</h2>
        </div>
        <Column c={c} opens="under" {...rest} />
      </div>
    </div>
  )
}

/** Leaf: the 384 px column beside the page; a thread opens under its comment. */
export function LeafColumn({ comments, start, ...rest }: PlaceProps) {
  const c = useConversation(comments, start)
  return (
    <div className="flex h-screen bg-bg-base">
      <article className="flex min-w-0 flex-1 flex-col gap-4 px-10 py-8 text-body-1 text-text-primary">
        <h1 className="text-h1">Page one</h1>
        <p>
          A block of text on the page. A comment can point at{' '}
          <mark className="rounded-sm bg-warning-muted text-text-primary">the words a comment was written on</mark>, and the column shows them on its card.
        </p>
        <SkeletonBar className="h-3" style={{ width: '90%' }} />
        <SkeletonBar className="h-3" style={{ width: '70%' }} />
        <SkeletonBar className="h-3" style={{ width: '85%' }} />
      </article>
      <aside className="flex w-[384px] shrink-0 flex-col border-l border-border-subtle bg-bg-surface">
        <Header>Comments</Header>
        <Column c={c} opens="under" {...rest} />
      </aside>
    </div>
  )
}

/** A phone: the whole width, a thread under its comment, the box at the bottom. */
export function Phone({ comments, start, ...rest }: PlaceProps) {
  const c = useConversation(comments, start)
  return (
    <div className="flex h-screen items-start justify-center bg-bg-wash p-4">
      <div className="flex h-[740px] w-[375px] flex-col overflow-hidden rounded-xl border border-border-default bg-bg-base">
        <Header>Item one</Header>
        <Column c={c} opens="under" {...rest} />
      </div>
    </div>
  )
}

/** One card or thread at a column's width, for the states. */
export function Narrow({ comments, start, width = 384, ...rest }: PlaceProps & { width?: number }) {
  const c = useConversation(comments, start)
  return (
    <div className="flex h-screen flex-col border-r border-border-subtle bg-bg-surface" style={{ width }}>
      <Column c={c} opens="under" {...rest} />
    </div>
  )
}

export const dmTitle = (
  <>
    <Avatar name={nameOf('two')} size={20} />
    {nameOf('two')}
  </>
)
