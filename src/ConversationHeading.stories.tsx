import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { ConversationCard } from './ConversationCard'
import { Column, ONE, TWO, WORDS } from './conversation.examples'
import { ConversationHeading } from './ConversationHeading'
import { QuotedLine } from './QuotedLine'

/**
 * Which place a conversation is on, inside its card, when one list mixes several places: the place's icon in the
 * face's column, its name beside it, opening the place.
 */
const meta = {
  title: 'Conversation/ConversationHeading',
  component: ConversationHeading,
  parameters: { layout: 'padded' },
  args: { name: 'Item one', icon: <IconSquareRounded size={16} stroke={1.5} />, onOpen: () => {} },
  argTypes: { icon: { control: false } },
  decorators: [(Story) => <Column>{Story()}</Column>],
  render: (args) => (
    <ConversationCard author={ONE} time="11:08 AM" heading={<ConversationHeading {...args} />} onClick={() => {}}>
      {WORDS}
    </ConversationCard>
  ),
} satisfies Meta<typeof ConversationHeading>

export default meta
type Story = StoryObj<typeof meta>

/** On a card: the place above the author; its name opens the place, the rest of the card opens the thread. */
export const OnACard: Story = {}

/** On a comment about a part of the place: the place, then the author, then the words it is on. */
export const WithWhatItIsOn: Story = {
  render: (args) => (
    <ConversationCard author={TWO} time="Yesterday" heading={<ConversationHeading {...args} />} about={<QuotedLine words="the words this comment is on" />} onClick={() => {}}>
      {WORDS}
    </ConversationCard>
  ),
}

/** A name longer than the column is cut. */
export const LongName: Story = {
  args: { name: 'An item whose name runs on well past the width of the column it sits in' },
}
