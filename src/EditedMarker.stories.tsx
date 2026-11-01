import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditedMarker } from './EditedMarker'
import { MetaText } from './MetaText'

/** "(edited)" beside a time. Point at it for when. */
const meta = {
  title: 'Conversation/EditedMarker',
  component: EditedMarker,
  parameters: { layout: 'padded' },
  args: { edited: 'Edited 11:20 AM' },
} satisfies Meta<typeof EditedMarker>

export default meta
type Story = StoryObj<typeof meta>

/** Beside a time, as a card draws it. */
export const Edited: Story = {
  render: (args) => (
    <span className="flex items-center gap-2">
      <MetaText>11:08 AM</MetaText>
      <EditedMarker {...args} />
    </span>
  ),
}
