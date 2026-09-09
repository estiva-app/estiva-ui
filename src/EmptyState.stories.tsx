import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconLock } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: { message: 'Nothing here yet.' },
  argTypes: { icon: { control: false } },
  // A box with a hairline, so where the state sits inside its room can be seen: a page's in the middle both ways, a section's at the top left.
  decorators: [(Story) => <div className="flex h-[280px] w-[480px] flex-col rounded-lg border border-border-default p-4">{Story()}</div>],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** The `page` manner: the default icon over the caller's words, in the middle of its box both ways. */
export const Page: Story = {}
/** The `section` manner: the words alone, left-aligned — one line in a page that has other things on it. */
export const Section: Story = { args: { scope: 'section' } }
export const LongerMessage: Story = { args: { message: 'No items yet. Add one from any list.' } }
export const CustomIcon: Story = { args: { icon: <IconLock size={16} stroke={1.5} />, message: 'Nothing you can read here yet.' } }
