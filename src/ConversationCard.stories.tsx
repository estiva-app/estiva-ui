import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { ConversationCard, type ConversationCardProps } from './ConversationCard'
import { AT, Column, EditBox, Files, LONG, Mentions, ONE, SOME, THREE, TWO, WithBlock, WithCard, WORDS, YOU, useReactions } from './conversation.examples'
import { RichText } from './RichText'
import { MenuItem } from './Menu'
import type { ReactionCount } from './ReactionRow'
import { QuotedLine } from './QuotedLine'

/**
 * One comment, live: point at it for the strip, react, resolve with a note, and on your own edit or delete it.
 */
const meta = {
  title: 'Conversation/ConversationCard',
  component: ConversationCard,
  parameters: { layout: 'padded' },
  args: { author: ONE, time: '11:08 AM', children: WORDS },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof ConversationCard>

export default meta
type Story = StoryObj<typeof meta>

/** Two paragraphs in RichText's own box, as an app's words come. */
const RICH = [
  { type: 'paragraph' as const, inline: [{ text: WORDS, marks: [] }] },
  { type: 'paragraph' as const, inline: [{ text: 'A second paragraph: a resolved comment shows all of it.', marks: [] }] },
]

/** A card that answers: its reactions, resolve, edit and delete change it, as an app's would. */
function Live({ start, resolvedAt, deletable = true, ...props }: ConversationCardProps & { start?: readonly ReactionCount[]; resolvedAt?: { by: string; note?: string }; deletable?: boolean }) {
  const reacting = useReactions(start)
  const [resolved, setResolved] = useState(resolvedAt)
  const [deleted, setDeleted] = useState(props.deleted ?? false)
  return (
    <ConversationCard
      {...props}
      deleted={deleted}
      reactions={props.readOnly ? { ...reacting, onToggle: undefined } : reacting}
      resolved={resolved}
      onResolve={(note) => setResolved({ by: 'You', note: note || undefined })}
      onReopen={() => setResolved(undefined)}
      onDelete={deletable ? () => setDeleted(true) : undefined}
      editor={props.own ? (done) => <EditBox text={typeof props.children === 'string' ? props.children : WORDS} done={done} /> : undefined}
    />
  )
}

/** Someone's comment. */
export const Comment: Story = { render: (args) => <Live {...args} /> }

/** With its moment, `at`: the time says the exact date and time under the pointer. The story points at it. */
export const ExactTime: Story = {
  name: 'Exact time',
  render: (args) => <Live {...args} at={AT} />,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByText('11:08 AM'))
  },
}

/** Yours: Edit and Delete in its ⋯ menu. */
export const Yours: Story = { render: (args) => <Live {...args} author={YOU} own /> }

/** Edited since it was sent: "(edited)", its time on hover. */
export const Edited: Story = { render: (args) => <Live {...args} edited="Edited 11:20 AM" /> }

/** Deleted: its replies stay under it. */
export const Deleted: Story = { render: (args) => <Live {...args} deleted replies={{ count: 2, faces: [TWO, THREE], last: '11:40 AM' }} /> }

/** Pictures and files under the words. */
export const WithFiles: Story = { name: 'Files', render: (args) => <Live {...args} files={<Files />} /> }

/** A card its author attached. */
export const Card: Story = { render: (args) => <Live {...args}><WithCard /></Live> }

/** On a part of the page: the words it is on, under the name and above its words. */
export const OnAPart: Story = { name: 'On a part', render: (args) => <Live {...args} about={<QuotedLine words="the words this comment is on" />} /> }

/** The words changed since: the bar goes grey, and it says so. */
export const PartChanged: Story = { name: 'Part changed', render: (args) => <Live {...args} about={<QuotedLine words="the words this comment was on" state="reworded" />} /> }

/** A block quoted from something else. */
export const QuotedBlock: Story = { name: 'Quoted block', render: (args) => <Live {...args}><WithBlock /></Live> }

/** With reactions: press one to add yours or take it back. */
export const Reactions: Story = { render: (args) => <Live {...args} start={SOME} /> }

/** With replies: the row that opens its thread. */
export const Replies: Story = { render: (args) => <Live {...args} replies={{ count: 3, faces: [TWO, THREE, YOU], last: '12:02 PM' }} onReply={() => {}} onClick={() => {}} /> }

/** Not read yet. */
export const New: Story = { render: (args) => <Live {...args} isNew /> }

/** A reply under it not read yet. */
export const NewReply: Story = { name: 'New reply', render: (args) => <Live {...args} replies={{ count: 2, faces: [TWO, THREE], last: '12:02 PM', isNew: true }} onClick={() => {}} /> }

/** Replies under it not read yet, by count: the row says how many. */
export const NewReplies: Story = { name: 'New replies, how many', render: (args) => <Live {...args} replies={{ count: 3, faces: [TWO, THREE, YOU], last: '12:02 PM', newCount: 2 }} onClick={() => {}} /> }

/** Urgent and not read yet. */
export const Urgent: Story = { render: (args) => <Live {...args} isNew urgent replies={{ count: 1, faces: [TWO], last: '12:02 PM', isNew: true }} /> }

/** A person named in the words, and a link. */
export const WithMentions: Story = { name: 'Mentions', render: (args) => <Live {...args}><Mentions /></Live> }

/** Resolved: "Resolved" by the time, who and the note above its replies; its words, reactions and files all stay. */
export const Resolved: Story = { render: (args) => <Live {...args} start={SOME} resolvedAt={{ by: 'Person two', note: 'Keeping the first one.' }} replies={{ count: 2, faces: [TWO, THREE], last: '12:02 PM' }} /> }

/** Resolved, its words in a box of their own, as the apps draw them (RichText here): all of them shown. */
export const ResolvedInABox: Story = {
  name: 'Resolved, words in a box',
  render: (args) => (
    <Live {...args} resolvedAt={{ by: 'Person two', note: 'Keeping the first one.' }}>
      <RichText blocks={RICH} />
    </Live>
  ),
}

/** Resolved with a long note: the whole note, on its line above the replies. */
export const ResolvedLongNote: Story = { name: 'Resolved, long note', render: (args) => <Live {...args} resolvedAt={{ by: 'Person two', note: 'Agreed, going with the first one, and the second goes to the list of later ideas with its reasons written beside it.' }} /> }

/** The one open beside its thread. */
export const Selected: Story = { render: (args) => <Live {...args} selected replies={{ count: 2, faces: [TWO, THREE], last: '12:02 PM' }} onClick={() => {}} /> }

/** Being edited, in the kit's box. */
export const Editing: Story = { render: (args) => <Live {...args} author={YOU} own editing /> }

/** An edit that was refused: the box opens again, and says why. */
export const EditRefused: Story = {
  name: 'Edit refused',
  render: (args) => <ConversationCard {...args} author={YOU} own editing editor={(done) => <EditBox text={WORDS} done={done} refuse />} />,
}

/** A reaction that was refused: said under the reactions. */
export const ReactionRefused: Story = { name: 'Reaction refused', render: (args) => <Live {...args} start={SOME} reactionRefused="try again in a moment" /> }

/** Nothing can be changed: no strip, reactions only shown. */
export const ReadOnly: Story = { name: 'Read-only', render: (args) => <Live {...args} readOnly start={SOME} replies={{ count: 2, faces: [TWO, THREE], last: '12:02 PM' }} /> }

/** A long comment, at its full height. */
export const Long: Story = { render: (args) => <Live {...args}>{LONG}</Live> }

/** The app's own rows in its ⋯ menu, between Resolve and Edit. */
export const MoreRows: Story = {
  name: 'More rows',
  render: (args) => <Live {...args} author={YOU} own menu={<MenuItem label="Item one" onClick={() => {}} />} />,
}
