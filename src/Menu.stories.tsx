import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCopy, IconHighlight, IconPencil, IconTrash } from '@tabler/icons-react'
import { Divider } from './Divider'
import { Menu, MenuItem, MenuRow, MenuSection, MenuSub } from './Menu'
import { SectionLabel } from './SectionLabel'

/**
 * The shell every menu shares — container, rows, headings, and the two exits
 * (Escape and a click outside) owned here, never by the caller. In an app
 * the menu hangs from its trigger or a portal position; stories pin it open
 * in-flow (`className="static"` wins over the anchoring) and centre it, so
 * the docs page shows each one inside its own frame.
 */
const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  decorators: [(Story) => <div className="flex min-h-[240px] w-full items-center justify-center"><Story /></div>],
  args: { onClose: () => {}, children: null, className: 'static' },
  argTypes: { position: { control: false }, onClose: { control: false }, children: { control: false } },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/** Rows with a leading icon, a shortcut, and the destructive colour for the one that deletes. */
export const Items: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuItem label="Rename" leading={<IconPencil size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuItem label="Copy link" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} shortcut="Ctrl+C" onClick={() => {}} />
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
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

/**
 * A row that opens another menu beside it — hover it. The panel portals to
 * the body and fits the viewport: right of the row with room, flipped left
 * at the screen edge, never cut off. Live rather than pinned, because the
 * placement IS the designed behaviour.
 */
export const WithASubmenu: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuItem label="Rename" leading={<IconPencil size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuSub label="Mark as Highlight" leading={<IconHighlight size={16} stroke={1.5} className="text-text-secondary" />}>
        <MenuItem label="Insight" onClick={() => {}} />
        <MenuItem label="Concern" onClick={() => {}} />
        <MenuItem label="Conclusion" onClick={() => {}} />
        <MenuItem label="Question" onClick={() => {}} />
        <MenuItem label="Summary" onClick={() => {}} />
      </MenuSub>
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive onClick={() => {}} />
    </Menu>
  ),
}

/** A non-interactive row at the item's geometry — identity lines, hints. */
export const WithARow: Story = {
  render: (args) => (
    <Menu {...args} className="static w-64">
      <MenuRow>
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">Ana Duarte</span>
        <SectionLabel className="text-text-secondary">Owner</SectionLabel>
      </MenuRow>
      <Divider className="my-1" />
      <MenuItem label="Sign out" onClick={() => {}} />
    </Menu>
  ),
}
