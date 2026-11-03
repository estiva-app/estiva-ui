import type { Meta, StoryObj } from '@storybook/react-vite'
import { NoAccessNotice } from './NoAccessNotice'

/** Where a link to a file you can't read opens, and its card in a message. */
const meta = {
  title: 'Status & feedback/NoAccessNotice',
  component: NoAccessNotice,
  parameters: { layout: 'padded' },
  args: { what: 'item' },
  decorators: [(Story) => <div className="max-w-xl">{Story()}</div>],
} satisfies Meta<typeof NoAccessNotice>

export default meta
type Story = StoryObj<typeof meta>

/** Where the link opens: the page holds the line alone. */
export const Page: Story = {}

/** Where a message draws the card of what it names: the line, and no title. */
export const InACard: Story = { name: 'In a card', args: { place: 'card' } }
