import type { Meta, StoryObj } from '@storybook/react-vite'
import { MembersDialog } from './MembersDialog'

const people = [
  { id: 'ana', label: 'Ana Duarte' },
  { id: 'ravi', label: 'Ravi Mehta' },
  { id: 'marta', label: 'Marta Silva' },
  { id: 'jonas', label: 'Jonas Weber' },
]

const meta = {
  title: 'Primitives/MembersDialog',
  component: MembersDialog,
  args: {
    members: [
      { id: 'me', name: 'You', caption: 'Product designer' },
      { id: 'ana', name: 'Ana Duarte', caption: 'Assignee' },
    ],
    self: { action: 'leave', onToggle: () => {} },
    candidates: people,
    onAdd: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof MembersDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A member: Leave and "Add members" on top. */
export const Member: Story = {}

/** Not a member yet: Join on top, and nothing to add until you are in. */
export const NotAMember: Story = {
  args: {
    members: [{ id: 'ana', name: 'Ana Duarte', caption: 'Assignee' }],
    self: { action: 'join', onToggle: () => {} },
    onAdd: undefined,
  },
}

/** Membership still being read: no row on top rather than a wrong one. */
export const Unknown: Story = {
  args: { self: undefined, onAdd: undefined },
}

/** Someone who left but still holds a role, and a line about what membership covers. */
export const WithNote: Story = {
  args: {
    members: [
      { id: 'me', name: 'You' },
      { id: 'ravi', name: 'Ravi Mehta', caption: 'Assignee · not following' },
    ],
    count: 1,
    note: 'Leaving covers this page only; the items inside it still tell you about their comments.',
  },
}

/** More rows than fit: the roster scrolls inside the dialog. */
export const Long: Story = {
  args: {
    members: Array.from({ length: 14 }, (_, i) => ({ id: String(i), name: `Person ${i + 1}`, caption: i % 3 === 0 ? 'Owner' : undefined })),
  },
}

/** Opened straight on the add layer. */
export const AddLayer: Story = {
  args: { initialView: 'add' },
}
