import type { Meta, StoryObj } from '@storybook/react-vite'
import { Column, THREE, TWO, YOU } from './conversation.examples'
import { RepliesRow } from './RepliesRow'

/** The way into a thread. In Signal it shows who replied and the last time; in the other themes, the count. */
const meta = {
  title: 'Conversation/RepliesRow',
  component: RepliesRow,
  parameters: { layout: 'padded' },
  args: { count: 3, faces: [TWO, THREE, YOU], last: '12:02 PM' },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof RepliesRow>

export default meta
type Story = StoryObj<typeof meta>

/** Several replies, with their faces. */
export const Several: Story = {}

/** One reply. */
export const One: Story = { args: { count: 1, faces: [TWO] } }

/** A reply not read yet. */
export const New: Story = { args: { isNew: true } }

/** Several replies not read yet: how many, from `newCount`. */
export const NewSeveral: Story = { name: 'New, how many', args: { newCount: 2 } }

/** A reply not read yet, in an urgent thread. */
export const Urgent: Story = { args: { isNew: true, urgent: true } }

/** A press on it opens the thread. */
export const Opens: Story = { args: { onOpen: () => {} } }

/** Its thread open under it, in one column: the chevron turned down, the row kept marked; a press closes it. */
export const Open: Story = { args: { onOpen: () => {}, open: true } }
