import type { Meta, StoryObj } from '@storybook/react-vite'
import { UnreadDot } from './UnreadDot'

const meta = {
  title: 'Status & feedback/UnreadDot',
  component: UnreadDot,
} satisfies Meta<typeof UnreadDot>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `tone="orange"`: the warning colour, for a second kind of new, such as a reaction to what you wrote. */
export const Orange: Story = { args: { tone: 'orange' } }

/** Nothing new: the ring a dot that is always there draws, so the slot does not empty. */
export const Quiet: Story = { args: { quiet: true } }

/** Beside a line of text, as a list row draws it: the slot keeps the row's height. */
export const InARow: Story = {
  render: (args) => (
    <div className="flex w-64 items-center gap-1 text-body-2 text-text-primary">
      <span className="min-w-0 flex-1 truncate">A row with something new</span>
      <UnreadDot {...args} />
    </div>
  ),
}
