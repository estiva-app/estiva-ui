import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShipIssue } from './places'
import { story } from './states'

/**
 * The shared comment box and reaction row on a Ship issue, under Activity.
 * Every story is live. Write "refuse" in a comment to see a refusal.
 */
const meta = {
  title: 'Comments everywhere/Ship issue',
  component: ShipIssue,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ShipIssue>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = story('empty', 'Empty')
/** Write in the reply box, close the replies with their button and open them again: the words are still there. */
export const Typing: Story = story('typing', 'Typing, with a draft kept')
export const Replying: Story = story('replying', 'Replying to a comment')
export const Mention: Story = story('mention', '@ open')
export const Urgent: Story = story('urgent', '!@ open')
export const Reference: Story = story('reference', '[ open')
export const Slash: Story = story('slash', '/ open')
export const Sending: Story = story('sending', 'Sending')
export const Refused: Story = story('refused', 'Refused, with the text back')
export const Editing: Story = story('editing', 'Editing, with chips')
export const Uploading: Story = story('uploading', 'A file uploading')
export const UploadFailed: Story = story('uploadFailed', 'A file failed')
export const Archived: Story = story('archived', 'Read-only: archived')
export const SignedOut: Story = story('signedOut', 'Read-only: signed out')
export const NoReactions: Story = story('noReactions', 'No reactions')
export const ManyReactions: Story = story('manyReactions', 'A reaction from many people')
