import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { AT, Column, ONE, WORDS } from './conversation.examples'
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

/** With its moment, `at`: the time says the exact date and time under the pointer. The story points at it. */
export const ExactTime: Story = {
  name: 'Exact time',
  args: { at: AT },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByText('Today 11:08 AM'))
  },
}

/** It was deleted; its replies stay under it. */
export const Deleted: Story = { args: { deleted: true } }
