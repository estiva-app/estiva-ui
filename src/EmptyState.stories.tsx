import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconLock } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: { message: 'Nothing here yet.' },
  argTypes: { icon: { control: false } },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** The `page` manner: the default icon over the caller's words, centred. */
export const Page: Story = {}
/** The `section` manner: the words alone, left-aligned — one line in a page that has other things on it. */
export const Section: Story = { args: { scope: 'section' } }
export const LongerMessage: Story = { args: { message: 'No items yet. Add one from any list.' } }
export const CustomIcon: Story = { args: { icon: <IconLock size={16} stroke={1.5} />, message: 'Nothing you can read here yet.' } }
