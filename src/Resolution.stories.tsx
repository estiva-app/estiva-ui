import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConversationCard } from './ConversationCard'
import { Column, ONE, WORDS } from './conversation.examples'
import { ResolutionNote, ResolutionHistory } from './Resolution'

/** Who resolved a thread and the note: the green Chip a resolved comment wears on its top edge (5B), and a line inside the thread. */
const meta = {
  title: 'Conversation/Resolution',
  component: ResolutionNote,
  parameters: { layout: 'padded' },
  args: { by: 'Person two', note: 'Keeping the first one.', at: '12:10 PM' },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof ResolutionNote>

export default meta
type Story = StoryObj<typeof meta>

/** "Resolved by Person two", then the note in white, inside the chip; who, when and the note on hover. */
export const Note: Story = {}

/** Resolved with no note. */
export const NoNote: Story = { name: 'No note', args: { note: undefined } }

/** A long note, cut at the end of the line with an ellipsis, inside the chip; whole on hover. */
export const LongNote: Story = { name: 'Long note', args: { note: 'Agreed, going with the first one, and the second one goes to the list of later ideas with its reasons written down beside it, so nobody has to ask again why it was not picked this time.' } }

/** On the comment: the chip on its top edge, as ConversationCard draws it from `resolved`. Nothing of the comment is hidden. */
export const OnAComment: Story = {
  name: 'On a comment',
  render: (args) => (
    <ConversationCard author={ONE} time="11:08 AM" resolved={{ by: args.by, note: args.note, at: args.at }} onReopen={() => {}}>
      {WORDS}
    </ConversationCard>
  ),
}

/** Inside the thread: the line where it was resolved, among the replies. */
export const InTheThread: Story = {
  name: 'In the thread',
  render: () => <ResolutionHistory events={[{ by: 'Person two', note: 'Agreed, going with the first one.', at: '12:10 PM' }]} />,
}

/** Resolved, opened again, resolved: the whole history, its dots joined. */
export const History: Story = {
  render: () => (
    <ResolutionHistory
      events={[
        { by: 'Person two', note: 'Going with the first one.', at: '12:10 PM' },
        { reopened: true, by: 'Person one', at: '12:30 PM' },
        { by: 'You', at: '1:05 PM' },
      ]}
    />
  ),
}
