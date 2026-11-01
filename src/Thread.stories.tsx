import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { archivedLine } from './archivedLine'
import { Card } from './Card'
import { ConversationCard, ReplyCard } from './ConversationCard'
import { ConversationLayout } from './ConversationLayout'
import { ONE, SHORT, SOME, THREE, TWO, WORDS, WriteBox, YOU, useReactions } from './conversation.examples'
import { MembersPill } from './MembersPill'
import { showInConversation } from './showInConversation'
import { Thread } from './Thread'

/** A comment's replies, with the box to write one: in the right column, or under its comment. */
const meta = {
  title: 'Conversation/Thread',
  component: Thread,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Thread>

export default meta
type Story = StoryObj<typeof meta>

/** The right column: 384px, the height of the page. */
function Side({ children }: { children: ReactNode }) {
  return (
    <Card fill="surface" clip className="flex h-[640px] w-[384px] flex-col">
      {children}
    </Card>
  )
}

const START = { id: 'c1', author: ONE, time: '11:08 AM', words: WORDS }

function Replies({ readOnly = false }: { readOnly?: boolean }) {
  const one = useReactions(SOME)
  const two = useReactions()
  return (
    <>
      <ReplyCard id="r1" author={TWO} time="11:40 AM" reactions={one} readOnly={readOnly}>
        {SHORT}
      </ReplyCard>
      <ReplyCard id="r2" author={THREE} time="11:52 AM" reactions={two} readOnly={readOnly}>
        A second reply, under the first, in the order they were written.
      </ReplyCard>
    </>
  )
}

/** In the right column: the comment pinned at the top, its replies, and the box. */
export const Column: Story = {
  render: () => (
    <Side>
      <Thread start={START} onClose={() => {}} box={<WriteBox />}>
        <Replies />
      </Thread>
    </Side>
  ),
}

/** A link to a reply showed it (`showInConversation`): scrolled to the middle of the column and flashed in the accent's wash, fading. The story shows the second reply. */
export const Shown: Story = {
  name: 'A reply shown',
  render: () => (
    <Side>
      <Thread start={START} onClose={() => {}} box={<WriteBox />}>
        <Replies />
      </Thread>
    </Side>
  ),
  play: () => {
    showInConversation('r2')
  },
}

/** Resolved: "Resolved" at the top. Who resolved it, and the note, are said on the comment, not among the replies. */
export const Resolved: Story = {
  render: () => (
    <Side>
      <Thread start={START} resolved onClose={() => {}} box={<WriteBox />}>
        <Replies />
      </Thread>
    </Side>
  ),
}

/** With the column's own actions before Close: who is in it. */
export const WithMembers: Story = {
  name: 'With members',
  render: () => (
    <Side>
      <Thread start={START} onClose={() => {}} actions={<MembersPill members={[ONE, TWO, THREE]} count={3} />} box={<WriteBox />}>
        <Replies />
      </Thread>
    </Side>
  ),
}

/** Still reading the replies. */
export const Loading: Story = {
  render: () => (
    <Side>
      <Thread start={START} loading onClose={() => {}} box={<WriteBox />} />
    </Side>
  ),
}

/** Nobody has replied yet. */
export const NoReplies: Story = {
  name: 'No replies',
  render: () => (
    <Side>
      <Thread start={START} onClose={() => {}} box={<WriteBox />} />
    </Side>
  ),
}

/** The comment was deleted: its replies stay, and no new one can be written. */
export const StartDeleted: Story = {
  name: 'Comment deleted',
  render: () => (
    <Side>
      <Thread start={{ ...START, deleted: true }} onClose={() => {}} notice={<WriteBox closed="The comment was deleted, so its thread takes no new replies." />}>
        <Replies />
      </Thread>
    </Side>
  ),
}

/** Archived: nothing can be changed. The reactions show but cannot be pressed, and the box says why, in every app's words (`archivedLine`). */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <Side>
      <Thread start={START} onClose={() => {}} notice={<WriteBox closed={archivedLine({})} />}>
        <Replies readOnly />
      </Thread>
    </Side>
  ),
}

/** Under its comment, in one column: one card with the comment, its replies hung from a line, and the box. */
export const Under: Story = {
  render: function Render() {
    const reacting = useReactions()
    return (
      <div className="flex h-[640px]">
        <ConversationLayout
          threads="under"
          open="c1"
          items={[
            {
              id: 'c1',
              card: (
                <ConversationCard author={ONE} time="11:08 AM" reactions={reacting} replies={{ count: 2, faces: [TWO, THREE], last: '11:52 AM' }}>
                  {WORDS}
                </ConversationCard>
              ),
              thread: (
                <Thread place="under" box={<WriteBox />}>
                  <Replies />
                </Thread>
              ),
            },
          ]}
        />
      </div>
    )
  },
}

/** Your reply among them. */
export const WithYours: Story = {
  name: 'With yours',
  render: () => (
    <Side>
      <Thread start={START} onClose={() => {}} box={<WriteBox />}>
        <Replies />
        <ReplyCard author={YOU} time="12:01 PM" own onDelete={() => {}}>
          Your own reply, with Edit and Delete in its menu.
        </ReplyCard>
      </Thread>
    </Side>
  ),
}
