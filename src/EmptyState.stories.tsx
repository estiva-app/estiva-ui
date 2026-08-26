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

/** The default icon with the caller's words. */
export const Default: Story = {}
export const LongerMessage: Story = { args: { message: 'No topics yet. Start one from any conversation.' } }
export const CustomIcon: Story = { args: { icon: <IconLock size={16} stroke={1.5} />, message: 'Nothing you can read here yet.' } }
