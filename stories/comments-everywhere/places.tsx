import { useState, type ReactNode } from 'react'
import { IconCircleCheck, IconMessage2 } from '@tabler/icons-react'
import { AttachmentCard } from '../../src/AttachmentCard'
import { Avatar } from '../../src/Avatar'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { Divider } from '../../src/Divider'
import { IconButton } from '../../src/IconButton'
import { Kbd } from '../../src/Kbd'
import { Panel } from '../../src/Panel'
import { Person } from '../../src/Person'
import { Body, CommentBox, type CommentBoxSupply } from './CommentBox'
import { ME, NAME, OTHER_THREAD, type Comment } from './fixtures'
import { ReactionRow, toggled } from './ReactionRow'
import { CLOSED_REASON, CommentActions, boxStartFor, supplyFor, threadFor, useComments, type BoxState } from './parts'

/**
 * The four places the shared box and row are drawn: Leaf's comments column, a
 * Ship issue's conversation, a Peek thread and a Ship project's chat. The
 * cards are each app's own, copied from its `origin/main` (16 Oct); only the
 * box and the reaction row are shared.
 */

export interface PlaceProps {
  state: BoxState
}

type Comments = ReturnType<typeof useComments>

const isClosed = (state: BoxState) => state === 'closedNotice' || state === 'closedGreyed'
const closedLook = (state: BoxState) => (state === 'closedNotice' ? 'notice' : 'greyed') as 'notice' | 'greyed'

/** A sent comment's files, as the card shows them. */
function Files({ comment, className }: { comment: Comment; className?: string }) {
  if (!comment.files?.length) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {comment.files.map((f) => (
        <AttachmentCard key={f.name} name={f.name} size={f.size} contentType={f.contentType} download />
      ))}
    </div>
  )
}

/** One comment's body or, while it is edited, the same box in its edit mode. */
function BodyOrEdit({
  comment,
  c,
  supply,
  size,
  className,
}: {
  comment: Comment
  c: Comments
  supply: CommentBoxSupply
  size?: 'default' | 'small'
  className?: string
}) {
  if (c.editing === comment.id) {
    return (
      <CommentBox
        {...supply}
        placeholder="Edit message"
        edit={{
          body: comment.body,
          onCancel: () => c.setEditing(null),
          onSave: (body) => c.save(comment.id, body),
        }}
        className={className}
      />
    )
  }
  return <Body body={comment.body} supply={supply} size={size} className={className} />
}

const Edited = ({ comment }: { comment: Comment }) => (comment.edited ? <span className="text-caption text-text-muted">(edited)</span> : null)

// ─── Leaf ────────────────────────────────────────────────────────────────

/** A comment in a Leaf card: name and time, the body, then the reaction row (new on Leaf's cards). */
function LeafComment({ comment, c, supply, closed }: { comment: Comment; c: Comments; supply: CommentBoxSupply; closed: boolean }) {
  return (
    <div className="group/comment flex flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 text-body-2-strong text-text-primary">
          <Person name={NAME[comment.by]} />
        </span>
        <span className="whitespace-nowrap text-caption text-text-muted">{comment.when}</span>
        <Edited comment={comment} />
        {!closed && c.editing !== comment.id && (
          <CommentActions
            comment={comment}
            c={c}
            className="-my-1 ml-auto opacity-0 transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100 has-[[data-popup-open]]:opacity-100"
          />
        )}
      </div>
      <BodyOrEdit comment={comment} c={c} supply={supply} size="small" />
      <Files comment={comment} />
      <ReactionRow
        reactions={comment.reactions ?? []}
        onToggle={closed ? undefined : (emoji) => c.react(comment.id, (r) => toggled(r ?? [], emoji))}
        className="pt-1"
      />
    </div>
  )
}

/**
 * Leaf's comments column (`leaf src/comments/CommentsColumn.tsx`): a card per
 * thread, the open one with its reply box, and the new-comment box at the foot
 * with the line that says what it will be on.
 */
export function LeafColumn({ state, width = 384 }: PlaceProps & { width?: number }) {
  const { start, relay } = boxStartFor(state, false)
  const supply = supplyFor('leaf', relay)
  const c = useComments(threadFor(state, false), state === 'editing')
  const other = useComments(OTHER_THREAD, false)
  const replyOpen = state === 'replying' || state === 'editing'
  const [active, setActive] = useState<'a' | 'b' | null>(replyOpen || state === 'manyReactions' || state === 'noReactions' ? 'a' : null)
  const closed = isClosed(state)
  // The new-comment box carries the state, except while replying or editing.
  const footStart = replyOpen ? undefined : start

  const card = (id: 'a' | 'b', quote: string, cs: Comments) => (
    <Card
      key={id}
      hover="fill"
      quietUntilHover
      selected={active === id}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, [role="button"], [role="menuitem"], [contenteditable="true"]')) return
        setActive(id)
      }}
      className="flex shrink-0 flex-col gap-3 p-3"
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 truncate text-caption text-text-secondary">“{quote}”</p>
        {!closed && (
          <IconButton variant="resolve" tooltip="Resolve" aria-label="Resolve">
            <IconCircleCheck size={16} stroke={1.5} />
          </IconButton>
        )}
      </div>
      {cs.comments.map((comment) => (
        <LeafComment key={comment.id} comment={comment} c={cs} supply={supply} closed={closed} />
      ))}
      {active === id && !closed && cs.editing === null && (
        <CommentBox {...supply} attach placeholder="Reply…" draftKey={`leaf-${id}`} autoFocus={state === 'replying'} onSent={cs.add} onRefused={cs.dropLast} />
      )}
    </Card>
  )

  return (
    <div className="flex h-[760px] bg-bg-surface">
      {/* The page beside the column, only so the column reads where it sits. */}
      <div aria-hidden className="flex min-w-0 flex-1 flex-col gap-4 px-12 pt-10">
        <p className="text-h3 text-text-primary">Launch plan</p>
        <p className="max-w-prose text-body-1 text-text-primary">
          This page is where the launch lives: what we promise, who we start with, and how far along the work is. Every new team is set up in one sitting, and{' '}
          <span className="bg-accent-muted">should we name the teams here</span> or keep it general.
        </p>
        <p className="max-w-prose text-body-1 text-text-primary">
          We start with <span className="bg-accent-muted">the teams who asked first</span>, and grow from what they tell us. Ravi{' '}
          <span className="bg-accent-muted">owns the press notes</span>.
        </p>
      </div>
      <div className="h-full flex-none border-l border-border-default" style={{ width }}>
        <Panel
          title={
            <span className="flex items-center gap-2">
              <span className="truncate text-body-2-strong text-text-primary">Comments</span>
              <Chip type="neutral" label="2" />
            </span>
          }
          bodyClassName="flex flex-col gap-3 p-3"
          footer={
            <div className="flex flex-col gap-2 p-3">
              {!closed && <p className="truncate text-caption text-text-secondary">On “the teams who asked first”</p>}
              <CommentBox
                {...supply}
                attach
                placeholder="Comment on these words…"
                draftKey="leaf-new"
                start={footStart}
                closed={closed ? { reason: CLOSED_REASON.leaf, look: closedLook(state) } : undefined}
                onSent={c.add}
                onRefused={c.dropLast}
              />
            </div>
          }
          className="h-full"
        >
          {card('a', 'should we name the teams here', c)}
          {card('b', 'owns the press notes', other)}
        </Panel>
      </div>
    </div>
  )
}

// ─── Ship ────────────────────────────────────────────────────────────────

/** A message as Ship's conversation draws it (`ship src/components/conversations/ThreadList.tsx`). */
function ShipMessage({ comment, c, supply, closed, footer }: { comment: Comment; c: Comments; supply: CommentBoxSupply; closed: boolean; footer?: ReactNode }) {
  return (
    <article className="flex flex-col gap-2">
      <div className="flex min-h-6 items-center gap-2">
        <Avatar name={NAME[comment.by]} size={20} />
        <span className="truncate text-body-2-strong text-text-primary">{NAME[comment.by]}</span>
        <span className="whitespace-nowrap text-caption text-text-muted">{comment.when === 'now' ? 'just now' : `${comment.when} ago`}</span>
        <Edited comment={comment} />
        {!closed && c.editing !== comment.id && <CommentActions comment={comment} c={c} className="ml-auto" />}
      </div>
      <BodyOrEdit comment={comment} c={c} supply={supply} className="break-words" />
      <Files comment={comment} />
      <ReactionRow reactions={comment.reactions ?? []} onToggle={closed ? undefined : (emoji) => c.react(comment.id, (r) => toggled(r ?? [], emoji))} />
      {footer}
    </article>
  )
}

/** The replies button under a thread's first message. */
function RepliesButton({ count, open, onClick }: { count: number; open: boolean; onClick: () => void }) {
  return (
    <div>
      <Button variant="outlined" size="small" onClick={onClick} className={cn(open && 'bg-bg-active text-text-primary')} aria-expanded={open}>
        <IconMessage2 size={14} stroke={1.5} />
        {count}
      </Button>
    </div>
  )
}

/**
 * A Ship conversation: a new-conversation box on top, then each thread as a
 * card, its replies indented, and the reply box under them. An issue's
 * Activity and a project's chat draw the same list.
 */
function ShipConversation({ state, where }: PlaceProps & { where: 'shipIssue' | 'shipChat' }) {
  const { start, relay } = boxStartFor(state, false)
  const supply = supplyFor('ship', relay)
  const c = useComments(threadFor(state, false), state === 'editing')
  const closed = isClosed(state)
  // The new-conversation box takes the trigger states (room for the list below it); the open thread's reply box takes the rest.
  const onTop = ['empty', 'mention', 'urgent', 'reference', 'slash'].includes(state)
  const [open, setOpen] = useState(!onTop)
  const [first, ...replies] = c.comments
  const topStart = onTop ? start : undefined
  const replyStart = topStart ? undefined : start
  const closedProp = closed ? { reason: CLOSED_REASON[where], look: closedLook(state) } : undefined

  return (
    <div className="flex flex-col gap-3">
      <CommentBox
        {...supply}
        attach
        placeholder={
          <>
            <span>Start a conversation or type</span>
            <Kbd>/</Kbd>
            <span>for commands</span>
          </>
        }
        draftKey={`${where}-new`}
        start={topStart}
        closed={closedProp}
      />
      <ol className="flex flex-col gap-3">
        <li>
          <Card fill="surface" className="flex flex-col gap-3 px-4 py-3">
            <ShipMessage
              comment={first}
              c={c}
              supply={supply}
              closed={closed}
              footer={<RepliesButton count={replies.length} open={open} onClick={() => setOpen(!open)} />}
            />
            {open && (
              <>
                <div className="ml-2.5 flex flex-col gap-3 border-l-2 border-border-default pl-3">
                  {replies.map((comment) => (
                    <ShipMessage key={comment.id} comment={comment} c={c} supply={supply} closed={closed} />
                  ))}
                </div>
                {!(closed && closedLook(state) === 'notice') && (
                  <CommentBox
                    {...supply}
                    attach
                    placeholder="Reply…"
                    draftKey={`${where}-reply`}
                    start={replyStart}
                    closed={closedProp}
                    autoFocus={state === 'replying'}
                    onSent={c.add}
                    className="ml-2.5"
                  />
                )}
              </>
            )}
          </Card>
        </li>
      </ol>
    </div>
  )
}

/** A Ship issue's page, cut to its title and its Activity's conversation. */
export function ShipIssue({ state }: PlaceProps) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <p className="text-caption text-text-muted">Launch week · In progress</p>
        <h1 className="text-h3 text-text-primary">Set up a new team in one sitting</h1>
        <p className="text-body-2 text-text-secondary">The first-run steps a new team goes through.</p>
      </div>
      <Divider label="Activity" />
      <ShipConversation state={state} where="shipIssue" />
    </div>
  )
}

/** A Ship project's chat: the same conversation, with no issue above it. */
export function ShipChat({ state }: PlaceProps) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 p-8">
      <div className="flex items-center gap-2">
        <h1 className="text-h4 text-text-primary">Launch week</h1>
        <Chip type="neutral" label="Chat" />
      </div>
      <ShipConversation state={state} where="shipChat" />
    </div>
  )
}

// ─── Peek ────────────────────────────────────────────────────────────────

/** A reply as Peek's thread draws it (`peek src/components/ReplyCard.tsx`): the body under the name, 32px in. */
function PeekReply({ comment, c, supply, closed }: { comment: Comment; c: Comments; supply: CommentBoxSupply; closed: boolean }) {
  const [hovered, setHovered] = useState(false)
  const editing = c.editing === comment.id
  return (
    <Card
      fill="surface"
      hover={closed ? 'none' : 'fill'}
      quietUntilHover
      hovered={hovered}
      active={editing}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      <div className="flex w-full flex-col items-start px-2 pt-2">
        <div className="flex w-full min-w-0 items-center gap-2">
          <Avatar name={NAME[comment.by]} size={24} />
          <span className="min-w-0 truncate text-body-2-strong text-text-primary">{NAME[comment.by]}</span>
          <span className="whitespace-nowrap text-caption text-text-muted">{comment.when}</span>
          <Edited comment={comment} />
        </div>
        <BodyOrEdit comment={comment} c={c} supply={supply} className="w-full overflow-hidden break-words pb-2 pl-8 pr-2 pt-1" />
        <Files comment={comment} className="pb-2 pl-8 pr-2" />
        <ReactionRow
          reactions={comment.reactions ?? []}
          onToggle={closed ? undefined : (emoji) => c.react(comment.id, (r) => toggled(r ?? [], emoji))}
          className="pb-2 pl-8 pt-1"
        />
      </div>
      {/* Peek's hover strip (`ConversationQuickMenu`): React, then your own Edit and Delete. */}
      {!editing && !closed && (
        <CommentActions
          comment={comment}
          c={c}
          className={cn('absolute right-1 top-1 rounded-md bg-bg-surface', !hovered && 'opacity-0 focus-within:opacity-100 has-[[data-popup-open]]:opacity-100')}
        />
      )}
    </Card>
  )
}

/**
 * A Peek thread (`peek src/components/ThreadPanel.tsx`): the first message,
 * "Replies", the replies, and the box in the panel's foot. Peek shows a send
 * at once, so "sending" is the reply already in the list.
 */
export function PeekThread({ state }: PlaceProps) {
  const { start, relay } = boxStartFor(state, true)
  const supply = supplyFor('peek', relay)
  const c = useComments(threadFor(state, true), state === 'editing')
  const closed = isClosed(state)
  const [first, ...replies] = c.comments

  return (
    <div className="h-[760px] w-[480px] border-l border-border-default bg-bg-surface">
      <Panel
        title={<span className="text-body-2-strong text-text-primary">Replies</span>}
        bodyClassName="flex flex-col"
        footer={
          <div className="p-3">
            <CommentBox
              {...supply}
              attach
              placeholder="Reply…"
              draftKey="peek-thread"
              start={start}
              closed={closed ? { reason: CLOSED_REASON.peek, look: closedLook(state) } : undefined}
              autoFocus={state === 'replying'}
              onSent={c.add}
              onRefused={c.dropLast}
            />
          </div>
        }
        className="h-full"
      >
        <div className="px-4 pb-2 pt-4">
          <PeekReply comment={first} c={c} supply={supply} closed={closed} />
        </div>
        <Divider label="Replies" className="px-4 py-2" />
        <div className="flex flex-col gap-2 px-4 pb-4">
          {replies.map((comment) => (
            <PeekReply key={comment.id} comment={comment} c={c} supply={supply} closed={closed} />
          ))}
        </div>
      </Panel>
    </div>
  )
}
