import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCopy, IconPin, IconTrash } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { EnterHint, Menu, MenuItem } from './Menu'

/**
 * One row of a menu. Anatomy: `leading` (a 16px icon or an Avatar) · label
 * with an optional `description` line · one thing at the right edge —
 * `trailing` (any hint), else `shortcut` (the kbd chip), else the `submenu`
 * chevron. Stories sit inside a pinned-open Menu so the row is seen on the
 * surface it lives on.
 */
const meta = {
  title: 'Overlays/MenuItem',
  component: MenuItem,
  decorators: [
    (Story) => (
      <div className="flex min-h-[120px] w-full items-center justify-center">
        <Menu onClose={() => {}} className="static w-72">
          <Story />
        </Menu>
      </div>
    ),
  ],
  args: { label: 'Rename', onClick: () => {} },
  argTypes: {
    onClick: { control: false },
    leading: { control: false },
    trailing: { control: false },
  },
} satisfies Meta<typeof MenuItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAnIcon: Story = {
  args: { label: 'Pin', leading: <IconPin size={16} stroke={1.5} className="text-text-secondary" /> },
}

export const WithAShortcut: Story = {
  args: { label: 'Copy link', leading: <IconCopy size={16} stroke={1.5} className="text-text-secondary" />, shortcut: '⌘ C' },
}

/** The row opens another menu. */
export const Submenu: Story = {
  args: { label: 'Move to…', submenu: true },
}

/** A person as a row — the face, the name, a second line, a trailing hint. Peek's mention rows. */
export const APerson: Story = {
  args: {
    label: 'Ana Duarte',
    description: 'Product designer',
    leading: <Avatar name="Ana Duarte" size={32} />,
    trailing: <span className="text-[12px] leading-[120%] text-text-muted">↩</span>,
  },
}

/** The submenu's chosen value. */
export const Selected: Story = {
  args: { label: 'Newest first', selected: true },
}

export const Destructive: Story = {
  args: { label: 'Delete', destructive: true, leading: <IconTrash size={16} stroke={1.5} className="text-error-default" /> },
}

/** Every shape on one canvas. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <MenuItem label="Bare" onClick={() => {}} />
      <MenuItem label="With an icon" leading={<IconPin size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuItem label="With a shortcut" shortcut="⌘ K" onClick={() => {}} />
      <MenuItem label="Icon and shortcut" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} shortcut="⌘ C" onClick={() => {}} />
      <MenuItem label="Opens another menu" submenu onClick={() => {}} />
      <MenuItem label="Ana Duarte" description="Product designer" leading={<Avatar name="Ana Duarte" size={32} />} trailing={<span className="text-[12px] leading-[120%] text-text-muted">↩</span>} onClick={() => {}} />
      <MenuItem label="The chosen value" selected onClick={() => {}} />
      <MenuItem label="Destructive" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
      <MenuItem label="A very long label that runs out of room and truncates" onClick={() => {}} />
    </>
  ),
}

/** The tall picker row — 48px, px-3, a 32px face or tile, the description line, and the hint while highlighted. TopicMenu, MentionMenu, the files menu and the launcher all draw this row. */
export const Tall: Story = {
  args: {
    size: 'tall',
    label: 'Ana Duarte',
    description: 'Product designer',
    leading: <Avatar name="Ana Duarte" size={32} />,
    selected: true,
    trailing: <EnterHint />,
  },
}
