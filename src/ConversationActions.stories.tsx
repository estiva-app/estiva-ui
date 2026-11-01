import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconDotsVertical } from '@tabler/icons-react'
import { ConversationActions } from './ConversationActions'
import { ConversationMenu } from './ConversationMenu'
import { OPTIONS } from './conversation.examples'
import { ToolbarButton } from './Toolbar'

/** The strip on a comment or a reply while it is pointed at. Each button is drawn only when the card offers it. */
const meta = {
  title: 'Conversation/ConversationActions',
  component: ConversationActions,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="pt-16">{Story()}</div>],
} satisfies Meta<typeof ConversationActions>

export default meta
type Story = StoryObj<typeof meta>

const more = (
  <ConversationMenu
    trigger={
      <ToolbarButton tooltip="More actions" aria-label="More actions">
        <IconDotsVertical size={16} stroke={1.5} />
      </ToolbarButton>
    }
    onResolve={() => {}}
    onEdit={() => {}}
    onDelete={() => {}}
  />
)

/** On a comment: React, Reply, Resolve and ⋯. */
export const Comment: Story = { args: { options: OPTIONS, onReact: () => {}, onReply: () => {}, onResolve: () => {}, more } }

/** On a resolved comment: Reopen in place of Resolve. */
export const Resolved: Story = { args: { options: OPTIONS, onReact: () => {}, onReply: () => {}, resolved: true, onReopen: () => {}, more } }

/** On a reply: React and ⋯. */
export const Reply: Story = { args: { options: OPTIONS, onReact: () => {}, more } }
