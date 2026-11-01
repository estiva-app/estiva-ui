import type { Meta, StoryObj } from '@storybook/react-vite'
import { UnreadDot } from './UnreadDot'
import { UrgentMark } from './UrgentMark'

/** Urgent and new, in the unread dot's 24px slot. */
const meta = {
  title: 'Conversation/UrgentMark',
  component: UrgentMark,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof UrgentMark>

export default meta
type Story = StoryObj<typeof meta>

/** The mark. */
export const Urgent: Story = {}

/** Beside the plain unread dot it stands in for. */
export const BesideTheDot: Story = {
  name: 'Beside the dot',
  render: () => (
    <span className="flex items-center gap-2">
      <UnreadDot />
      <UrgentMark />
    </span>
  ),
}
