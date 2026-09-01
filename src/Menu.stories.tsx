import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCopy, IconPencil, IconTrash } from '@tabler/icons-react'
import { Divider } from './Divider'
import { Menu, MenuItem, MenuRow, MenuSection } from './Menu'
import { SectionLabel } from './SectionLabel'

/**
 * The shell every menu shares — container, rows, headings, and the two exits
 * (Escape and a click outside) owned here, never by the caller. Stories pin
 * the menu open; in an app it hangs from its trigger or a portal position.
 */
const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  decorators: [(Story) => <div className="relative h-[260px] w-[320px]"><Story /></div>],
  args: { onClose: () => {}, position: { top: 16, right: 16 }, children: null },
  argTypes: { position: { control: false }, onClose: { control: false } },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/** Rows with an icon, a shortcut, and the destructive colour for the one that deletes. */
export const Items: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuItem label="Rename" icon={<IconPencil size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuItem label="Copy link" icon={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} shortcut="⌘ C" onClick={() => {}} />
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive icon={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
    </Menu>
  ),
}

/** Groups under SectionLabel headings, with a Divider between them; `selected` marks the chosen value. */
export const Sections: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuSection label="Sort by">
        <MenuItem label="Newest first" selected onClick={() => {}} />
        <MenuItem label="Oldest first" onClick={() => {}} />
      </MenuSection>
      <Divider className="my-1" />
      <MenuSection label="Show">
        <MenuItem label="Everything" onClick={() => {}} />
        <MenuItem label="Unread only" onClick={() => {}} />
      </MenuSection>
    </Menu>
  ),
}

/** A non-interactive row at the item's geometry — identity lines, hints. */
export const WithARow: Story = {
  render: (args) => (
    <Menu {...args} className="w-64">
      <MenuRow>
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">Ana Duarte</span>
        <SectionLabel className="text-text-secondary">Owner</SectionLabel>
      </MenuRow>
      <Divider className="my-1" />
      <MenuItem label="Sign out" onClick={() => {}} />
    </Menu>
  ),
}
