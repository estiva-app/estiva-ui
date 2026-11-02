import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { ConversationCard, ReplyCard } from './ConversationCard'
import { ConversationLayout, type ConversationItem } from './ConversationLayout'
import { ONE, SHORT, SOME, THREE, TWO, WORDS, WriteBox, YOU, useReactions } from './conversation.examples'
import { ArchivedNotice } from './ArchivedNotice'
import { Panel } from './Panel'
import { ReactionHorizon } from './ReactionHorizon'
import { QuotedLine } from './QuotedLine'
import { SkeletonBar } from './Skeleton'
import { useSeenOnScreen } from './seenOnScreen'
import { Thread } from './Thread'

/**
 * Where the cards sit. Two columns: the comments fill the page and an open thread stands beside them. One column:
 * the comments are the 384px column beside the page, and a thread opens under its comment. Live: open a thread.
 */
const meta = {
  title: 'Conversation/ConversationLayout',
  component: ConversationLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-screen bg-bg-base">{Story()}</div>],
} satisfies Meta<typeof ConversationLayout>

export default meta
type Story = StoryObj

const COMMENTS = [
  { id: 'c1', author: ONE, time: '11:08 AM', words: WORDS, replies: 2, quoted: 'the words this comment is on' },
  { id: 'c2', author: TWO, time: '11:30 AM', words: 'A second comment, with nobody answering it yet.', replies: 0 },
  { id: 'c3', author: THREE, time: '12:15 PM', words: 'A third comment, resolved.', replies: 1, resolved: { by: 'You', note: 'Done.' } },
]

/** A comment whose words were deleted from the page since: only where the groups are shown. */
const GONE = { id: 'c4', author: TWO, time: '12:40 PM', words: 'A comment on words that were deleted since.', replies: 0, quoted: 'words since deleted from the page', resolved: undefined }

function Replies() {
  const one = useReactions(SOME)
  return (
    <>
      <ReplyCard author={TWO} time="11:40 AM" reactions={one}>
        {SHORT}
      </ReplyCard>
      <ReplyCard author={YOU} time="11:52 AM" own onDelete={() => {}}>
        Your own reply, under the first.
      </ReplyCard>
    </>
  )
}

/** The cards, each opening its thread, in either layout. */
function useItems(place: 'beside' | 'under', open: string | undefined, setOpen: (id: string | undefined) => void, quoted: boolean, apart = false): ConversationItem[] {
  const reacting = useReactions(SOME)
  const [resolved, setResolved] = useState<Record<string, { by: string; note?: string } | undefined>>(() => Object.fromEntries(COMMENTS.map((c) => [c.id, c.resolved])))
  // Opening is the layout's: a press anywhere on a card, its replies row or Reply; the app keeps `open` (onOpenChange).
  const comments = apart ? [...COMMENTS, GONE] : COMMENTS
  return comments.map((c) => ({
    id: c.id,
    resolved: apart && !!resolved[c.id],
    gone: apart && c.id === GONE.id,
    card: (
      <ConversationCard
        author={c.author}
        time={c.time}
        about={quoted && c.quoted ? <QuotedLine words={c.quoted} state={c.id === GONE.id ? 'gone' : 'here'} /> : undefined}
        reactions={reacting}
        resolved={resolved[c.id]}
        onResolve={(note) => setResolved((r) => ({ ...r, [c.id]: { by: 'You', note: note || undefined } }))}
        onReopen={() => setResolved((r) => ({ ...r, [c.id]: undefined }))}
        replies={c.replies ? { count: c.replies, faces: [TWO, YOU], last: '11:52 AM' } : undefined}
      >
        {c.words}
      </ConversationCard>
    ),
    thread:
      place === 'beside' ? (
        <Thread start={{ author: c.author, time: c.time, words: c.words }} onClose={() => setOpen(undefined)} box={<WriteBox />}>
          {c.replies ? <Replies /> : undefined}
        </Thread>
      ) : (
        <Thread place="under" box={<WriteBox />}>
          {c.replies ? <Replies /> : undefined}
        </Thread>
      ),
  }))
}

/** A page beside the column, in placeholders. */
function Page() {
  return (
    <Panel title="Item one">
      <div className="flex max-w-3xl flex-col gap-3 px-12 pt-10">
        <SkeletonBar className="h-6 w-1/2" />
        <SkeletonBar className="h-3 w-[90%]" />
        <SkeletonBar className="h-3 w-[70%]" />
        <SkeletonBar className="h-3 w-[85%]" />
      </div>
    </Panel>
  )
}

/** Two columns: the comments fill the page; the open thread stands beside them. */
export const TwoColumns: Story = {
  name: 'Two columns',
  render: function Render() {
    const [open, setOpen] = useState<string | undefined>('c1')
    return <ConversationLayout threads="beside" items={useItems('beside', open, setOpen, false)} open={open} onOpenChange={setOpen} box={<WriteBox label="Comment" />} />
  },
}

/**
 * Two columns with the page's own panel: while no thread is open, the 384px column holds it (Peek's Overview); a
 * thread opened takes its place, and closing it brings the panel back. Each thread is drawn only while it is open.
 */
export const TwoColumnsAside: Story = {
  name: 'Two columns, with a panel',
  render: function Render() {
    const [open, setOpen] = useState<string | undefined>(undefined)
    const items = useItems('beside', open, setOpen, false).map((item) => {
      const thread = item.thread as ReactNode
      return { ...item, thread: () => thread }
    })
    return (
      <ConversationLayout
        threads="beside"
        items={items}
        open={open}
        onOpenChange={setOpen}
        aside={<Page />}
        box={<WriteBox label="Comment" />}
      />
    )
  },
}

/**
 * Two columns, as Peek's file page and DMs: each day's comments under a line naming it, which stays at the top while
 * its stretch scrolls; the reactions note under the comments. Few comments sit on the box, as a chat does.
 */
export const TwoColumnsDays: Story = {
  name: 'Two columns, days',
  render: () => {
    const card = (who: typeof ONE, time: string, words: string) => (
      <ConversationCard author={who} time={time}>
        {words}
      </ConversationCard>
    )
    const items: ConversationItem[] = [
      { id: 'd1', day: 'Monday', card: card(ONE, '9:14 AM', WORDS) },
      { id: 'd2', day: 'Monday', card: card(TWO, '9:40 AM', 'A second comment that Monday.') },
      { id: 'd3', day: 'Today', card: card(ONE, '8:02 AM', 'The first comment today.') },
      { id: 'd4', day: 'Today', card: card(TWO, '10:21 AM', 'A second comment today.') },
    ]
    return <ConversationLayout threads="beside" items={items} below={<ReactionHorizon limit={100} omitted={3} />} box={<WriteBox label="Comment" />} />
  },
}

/**
 * Two columns, a long conversation: it opens at the newest comment; scrolled up, it stays where the reader is while
 * comments arrive; at the bottom, it follows them. Write one: it goes down to it as it is drawn, scrolled up or not.
 * Its place is remembered by `rememberAs`: open another story and come back, and it is where it was left.
 */
export const TwoColumnsLong: Story = {
  name: 'Two columns, long',
  render: function Render() {
    const [said, setSaid] = useState<{ who: typeof ONE; words: string }[]>(() =>
      Array.from({ length: 14 }, (_, i) => ({ who: [ONE, TWO, THREE][i % 3], words: i % 4 === 0 ? WORDS : `Comment ${i + 1} of a long conversation.` })),
    )
    const items: ConversationItem[] = said.map((c, i) => ({
      id: `l${i}`,
      day: i < 7 ? 'Monday' : 'Today',
      card: (
        <ConversationCard author={c.who} time={`${8 + (i % 7)}:${i % 2 ? '30' : '05'} AM`}>
          {c.words}
        </ConversationCard>
      ),
    }))
    return (
      <ConversationLayout
        threads="beside"
        rememberAs="story-long"
        items={items}
        box={<WriteBox label="Comment" onSend={(words) => setSaid((now) => [...now, { who: YOU, words: words || 'Your comment.' }])} />}
      />
    )
  },
}

/**
 * Two columns, read by being seen: each comment new to the reader keeps its dot until it has been on screen a moment
 * (`useSeenOnScreen`, handed to `seen`). Scroll, and the ones that show lose it after 1.5 seconds.
 */
export const TwoColumnsSeen: Story = {
  name: 'Two columns, new until seen',
  render: function Render() {
    const seen = useSeenOnScreen('story')
    const words = [WORDS, 'A second comment.', 'A third comment, further down.', 'A fourth comment.', 'A fifth comment.', 'A sixth comment.', 'The newest comment.']
    const items: ConversationItem[] = words.map((said, i) => ({
      id: `n${i}`,
      card: (
        <ConversationCard author={i % 2 ? TWO : ONE} time={`${9 + i}:00 AM`} isNew={i >= 3 && !seen.ids.has(`n${i}`)}>
          {said}
        </ConversationCard>
      ),
    }))
    return <ConversationLayout threads="beside" seen={seen} items={items} box={<WriteBox label="Comment" />} />
  },
}

/** Two columns, an archived file: its card at the top however few the comments, the box's line saying why nothing can be written. */
export const TwoColumnsArchived: Story = {
  name: 'Two columns, archived',
  render: () => (
    <ConversationLayout
      threads="beside"
      top={<ArchivedNotice by="Person one" when="Monday" resolution="Shipped. What was left moved to the next file." />}
      items={[
        {
          id: 'a1',
          day: 'Monday',
          card: (
            <ConversationCard author={ONE} time="9:14 AM" readOnly>
              {WORDS}
            </ConversationCard>
          ),
        },
      ]}
      box={<WriteBox closed="Archived. Unarchive it to comment." />}
    />
  ),
}

/** One column beside the page: a thread opens under its comment. */
export const OneColumn: Story = {
  name: 'One column',
  render: function Render() {
    const [open, setOpen] = useState<string | undefined>('c1')
    return (
      <>
        <div className="flex min-w-0 flex-1 flex-col">
          <Page />
        </div>
        <div className="flex border-l border-border-subtle">
          <ConversationLayout threads="under" items={useItems('under', open, setOpen, true)} open={open} onOpenChange={setOpen} box={<WriteBox label="Comment" />} />
        </div>
      </>
    )
  },
}

/** One column: the resolved comments and those on a deleted part wait closed under their names at the end. Resolve one: it moves there. */
export const Apart: Story = {
  name: 'One column, resolved and deleted apart',
  render: function Render() {
    const [open, setOpen] = useState<string | undefined>(undefined)
    return (
      <>
        <div className="flex min-w-0 flex-1 flex-col">
          <Page />
        </div>
        <div className="flex border-l border-border-subtle">
          <ConversationLayout threads="under" items={useItems('under', open, setOpen, true, true)} open={open} onOpenChange={setOpen} box={<WriteBox label="Comment" />} />
        </div>
      </>
    )
  },
}

/**
 * One column, a note under the comments (`below`), here a `ReactionHorizon`: after the groups, at the column's foot, so
 * with few comments it sits on the box. The comments stay at the top.
 */
export const OneColumnBelow: Story = {
  name: 'One column, a note under the comments',
  render: function Render() {
    const [open, setOpen] = useState<string | undefined>(undefined)
    return (
      <>
        <div className="flex min-w-0 flex-1 flex-col">
          <Page />
        </div>
        <div className="flex border-l border-border-subtle">
          <ConversationLayout
            threads="under"
            items={useItems('under', open, setOpen, true, true)}
            open={open}
            onOpenChange={setOpen}
            below={<ReactionHorizon limit={100} omitted={3} />}
            box={<WriteBox label="Comment" />}
          />
        </div>
      </>
    )
  },
}

/** Nobody has commented yet. */
export const Empty: Story = {
  render: () => (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <Page />
      </div>
      <div className="flex border-l border-border-subtle">
        <ConversationLayout threads="under" items={[]} box={<WriteBox label="Comment" />} />
      </div>
    </>
  ),
}

/** Still reading the comments. */
export const Loading: Story = {
  render: () => <ConversationLayout threads="beside" items={[]} loading box={<WriteBox label="Comment" />} />,
}
