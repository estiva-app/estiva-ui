import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { Button } from './Button'
import { ConversationMenu } from './ConversationMenu'
import { MenuItem } from './Menu'

/**
 * The ⋯ menu of a comment or a reply. On a card its trigger is the ⋯ on the strip; here, a button, so it can be
 * seen. Each story opens it; on this page, press the button.
 */
const meta = {
  title: 'Conversation/ConversationMenu',
  component: ConversationMenu,
  parameters: { layout: 'padded' },
  args: { trigger: <Button variant="outlined">Open the menu</Button> },
  argTypes: { trigger: { control: false }, children: { control: false }, after: { control: false } },
  decorators: [(Story) => <div className="flex min-h-[220px] items-start pl-[200px] pt-2">{Story()}</div>],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open the menu' }))
  },
} satisfies Meta<typeof ConversationMenu>

export default meta
type Story = StoryObj<typeof meta>

/** On your own: Resolve, then Edit and Delete. */
export const Yours: Story = { args: { onResolve: () => {}, onEdit: () => {}, onDelete: () => {} } }

/** On someone else's: Resolve only. */
export const Theirs: Story = { args: { onResolve: () => {} } }

/** Resolved: Reopen in place of Resolve. */
export const Resolved: Story = { args: { resolved: true, onReopen: () => {}, onEdit: () => {}, onDelete: () => {} } }

/** Your own reply: no Resolve, so Edit and Delete only. */
export const Reply: Story = { args: { onEdit: () => {}, onDelete: () => {} } }

/** The app's own rows, after Resolve and before Edit. */
export const MoreRows: Story = {
  name: 'More rows',
  args: { onResolve: () => {}, onEdit: () => {}, onDelete: () => {}, children: <MenuItem label="Item one" onClick={() => {}} /> },
}

/**
 * In an app's own words, as Peek's menu reads (Katerina, 1 November): a heading over the first rows, the key that
 * resolves from its box beside Resolve, its word for Edit, and a row of its own after Edit. Delete stays apart.
 */
export const InAnAppsWords: Story = {
  name: "In an app's words",
  args: {
    label: 'Heading',
    resolveHint: '->',
    onResolve: () => {},
    onEdit: () => {},
    editLabel: 'Edit message',
    after: <MenuItem label="Item two" onClick={() => {}} />,
    onDelete: () => {},
    children: <MenuItem label="Item one" onClick={() => {}} />,
  },
}
