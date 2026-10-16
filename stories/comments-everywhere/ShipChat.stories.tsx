import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShipChat } from './places'
import { story } from './states'

/**
 * The same box writing a Ship project's chat: no card above it, a draft kept
 * per chat. Every story is live. Write "refuse" in a message to see a refusal.
 */
const meta = {
  title: 'Comments everywhere/Ship project chat',
  component: ShipChat,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ShipChat>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = story('empty', 'Empty')
export const Typing: Story = story('typing', 'Typing, with a draft kept')
export const Replying: Story = story('replying', 'Replying to a message')
export const Mention: Story = story('mention', '@ open')
export const Urgent: Story = story('urgent', '!@ open')
export const Reference: Story = story('reference', '[ open')
export const Slash: Story = story('slash', '/ open')
export const Sending: Story = story('sending', 'Sending')
export const Refused: Story = story('refused', 'Refused, with the text back')
export const Editing: Story = story('editing', 'Editing, with chips')
export const Uploading: Story = story('uploading', 'A file uploading')
export const UploadFailed: Story = story('uploadFailed', 'A file failed')
export const ClosedNotice: Story = story('closedNotice', 'Read-only: a line in place of the box')
export const ClosedGreyed: Story = story('closedGreyed', 'Read-only: the box greyed')
export const NoReactions: Story = story('noReactions', 'No reactions')
export const ManyReactions: Story = story('manyReactions', 'A reaction from many people')
