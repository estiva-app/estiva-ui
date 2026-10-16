import type { Meta, StoryObj } from '@storybook/react-vite'
import { LeafColumn } from './places'
import { story } from './states'

/**
 * The shared comment box and reaction row in Leaf's comments column, 384px
 * wide. Every story is live: write, open a list, send, react, edit your own.
 * Write "refuse" in a comment to see a refusal.
 */
const meta = {
  title: 'Comments everywhere/Leaf column',
  component: LeafColumn,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, iframeHeight: 780 } },
  },
} satisfies Meta<typeof LeafColumn>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = story('empty', 'Empty')
/** Write in a card's reply, open the other card, come back: the words are still there. */
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
export const ClosedNotice: Story = story('closedNotice', 'Read-only: a line in place of the box')
export const ClosedGreyed: Story = story('closedGreyed', 'Read-only: the box greyed')
export const NoReactions: Story = story('noReactions', 'No reactions')
export const ManyReactions: Story = story('manyReactions', 'A reaction from many people')
/** Leaf's column has one width, 384px; here it is squeezed to 320px, chips in the cards and a file uploading in the box. */
export const Narrow: Story = {
  name: 'Narrow (320px)',
  args: { state: 'uploading', width: 320 },
}
