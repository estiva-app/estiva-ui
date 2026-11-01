import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConversationCard } from './ConversationCard'
import { Column, ONE, TWO, WORDS } from './conversation.examples'
import { ConversationPlace } from './ConversationPlace'

/**
 * Where a conversation shown away from its place was said, above its card: how it is related, and the place's name.
 * The words are the app's; these are the ones the specification uses (SPEC §6.4).
 */
const meta = {
  title: 'Conversation/ConversationPlace',
  component: ConversationPlace,
  parameters: { layout: 'padded' },
  args: { relation: 'Mentioned in', place: 'Item one' },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <Column>{Story()}</Column>],
  render: (args) => (
    <ConversationPlace {...args}>
      <ConversationCard author={ONE} time="11:08 AM" readOnly onClick={() => {}}>
        {WORDS}
      </ConversationCard>
    </ConversationPlace>
  ),
} satisfies Meta<typeof ConversationPlace>

export default meta
type Story = StoryObj<typeof meta>

/** Said somewhere else, naming this page: the relation and where it was said. */
export const MentionedIn: Story = {}

/** The conversation of something under this page: another relation, in the app's words. */
export const OnAnItemUnderIt: Story = {
  args: { relation: 'On an item', place: 'Item two' },
  render: (args) => (
    <ConversationPlace {...args}>
      <ConversationCard author={TWO} time="Yesterday" onClick={() => {}}>
        {WORDS}
      </ConversationCard>
    </ConversationPlace>
  ),
}

/** The place's name has not come yet: the relation alone, never a placeholder. */
export const PlaceNotNamedYet: Story = { args: { place: undefined } }

/** A long name is cut to the column. */
export const LongPlace: Story = { args: { place: 'Item one, with a name long enough to be cut short at the column’s edge' } }
