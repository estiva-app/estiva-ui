import type { Meta, StoryObj } from '@storybook/react-vite'
import { MetaText } from './MetaText'

/** The small figure beside a name. In Signal the mono micro-type; in the other themes the caption. */
const meta = {
  title: 'Conversation/MetaText',
  component: MetaText,
  parameters: { layout: 'padded' },
  args: { children: '11:08 AM' },
} satisfies Meta<typeof MetaText>

export default meta
type Story = StoryObj<typeof meta>

/** A time. */
export const Time: Story = {}

/** Counts, of open and of resolved. */
export const Counts: Story = {
  render: () => (
    <span className="flex items-center gap-2">
      <MetaText tone="secondary">6 open</MetaText>
      <MetaText tone="success">2 resolved</MetaText>
    </span>
  ),
}

/** The smaller size, beside a small name. */
export const Small: Story = { args: { size: 'chip' } }
