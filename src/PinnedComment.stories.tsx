import type { Meta, StoryObj } from '@storybook/react-vite'
import { Column, ONE, WORDS } from './conversation.examples'
import { PinnedComment } from './PinnedComment'

/** The comment a thread answers, at the top of the replies column. */
const meta = {
  title: 'Conversation/PinnedComment',
  component: PinnedComment,
  parameters: { layout: 'padded' },
  args: { author: ONE, time: 'Today 11:08 AM', words: WORDS },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof PinnedComment>

export default meta
type Story = StoryObj<typeof meta>

/** Who, when, and its first line. */
export const Pinned: Story = {}

/** It was deleted; its replies stay under it. */
export const Deleted: Story = { args: { deleted: true } }
