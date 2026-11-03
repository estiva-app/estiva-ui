import type { Meta, StoryObj } from '@storybook/react-vite'
import { NoAccessNotice } from './NoAccessNotice'

/** Where a link to a file you can't read opens. */
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
