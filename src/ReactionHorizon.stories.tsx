import type { Meta, StoryObj } from '@storybook/react-vite'
import { Column } from './conversation.examples'
import { ReactionHorizon } from './ReactionHorizon'

/** How far back reactions are read. Nothing is drawn when every one was. */
const meta = {
  title: 'Conversation/ReactionHorizon',
  component: ReactionHorizon,
  parameters: { layout: 'padded' },
  args: { limit: 200, omitted: 14 },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof ReactionHorizon>

export default meta
type Story = StoryObj<typeof meta>

/** Older ones were not checked. */
export const Older: Story = {}

/** One older one. */
export const One: Story = { args: { omitted: 1 } }

/** The read was cut short. */
export const Cut: Story = { args: { omitted: 0, cut: true } }

/** Both. */
export const Both: Story = { args: { cut: true } }
