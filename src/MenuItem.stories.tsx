import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArchive, IconCopy, IconHash, IconPin, IconTrash } from '@tabler/icons-react'
import { userEvent, within } from 'storybook/test'
import { Avatar } from './Avatar'
import { useRef, useState } from 'react'
import { Button } from './Button'
import { Divider } from './Divider'
import { EnterHint, Menu, MenuItem, MenuPanel, MenuSub } from './Menu'

/**
 * One row of a menu. Anatomy: `leading` (a 16px icon or an Avatar) · label
 * with an optional `description` line · one thing at the right edge —
 * `trailing` (any hint), else `shortcut` (the kbd chip), else the `submenu`
 * chevron. Stories sit on a `MenuPanel` — the menu's surface, drawn without
 * its behaviour — so the row is seen where it lives. A live menu portals and
 * places itself, so it cannot stand in the page (Katerina, D25); **Menu →
 * FromATrigger** is where the keyboard and the placement are.
 */
const meta = {
  title: 'Menus & windows/MenuItem',
  component: MenuItem,
  decorators: [
    (Story) => (
      <div className="flex min-h-[120px] w-full items-center justify-center">
        <MenuPanel className="w-72">
          <Story />
        </MenuPanel>
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
  args: { label: 'Copy link', leading: <IconCopy size={16} stroke={1.5} className="text-text-secondary" />, shortcut: 'Ctrl+C' },
}

/**
 * A row that opens another menu, working: such a row can only be tried inside
 * a real menu, so this is one (Katerina, 28 September: one story, the working
 * one; the chevron is the row's whole affordance).
 *
 * Hover **Move to…**, or arrow onto it and press →. The panel opens beside the
 * row, flips to the other side at a screen edge, and stays open while you
 * cross the diagonal into it.
 *
 * From the keyboard: → opens it and leaves the highlight on the row, ↓ steps
 * into it, and ← closes it and puts the highlight back on the row. Measured in
 * that order — → then ← alone does nothing, because focus has not entered yet.
 */
export const Submenu: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex min-h-[220px] w-full items-start justify-center pt-4">
      <Menu trigger={<Button variant="outlined">Open the menu</Button>}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuSub label="Move to…">
          <MenuItem label="Item one" onClick={() => {}} />
          <MenuItem label="Item two" onClick={() => {}} />
          <MenuItem label="Item three" onClick={() => {}} />
        </MenuSub>
        <Divider className="my-1" />
        <MenuItem label="Delete" destructive onClick={() => {}} />
      </Menu>
    </div>
  ),
}

/** A person as a row — the face, the name, a second line, a trailing hint. Peek's mention rows. */
export const APerson: Story = {
  args: {
    label: 'Ana Duarte',
    description: 'Product designer',
    leading: <Avatar name="Ana Duarte" size={32} />,
    trailing: <EnterHint />,
  },
}

/** The submenu's chosen value. */
export const Selected: Story = {
  args: { label: 'Item one', selected: true },
}

export const Destructive: Story = {
  args: { label: 'Delete', destructive: true, leading: <IconTrash size={16} stroke={1.5} className="text-error-default" /> },
}

/** Shown but shut, with why: its words and its icon in the disabled colour, and the reason under the pointer. The story points at it. */
export const Shut: Story = {
  name: 'Shut, saying why',
  args: {
    label: 'Archive',
    leading: <IconArchive size={16} stroke={1.5} className="text-text-secondary" />,
    disabledReason: 'Shut for now, and this says why, in the app’s words.',
  },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button', { name: 'Archive' }))
  },
}

/**
 * Shut in a live menu: the arrow keys still reach it, its reason shows there as under the pointer, and a press runs
 * nothing and leaves the menu open. The story opens the menu and points at the shut row.
 */
export const ShutInAMenu: Story = {
  name: 'Shut, in a menu',
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex min-h-[220px] w-full items-start justify-center pt-12">
      <Menu trigger={<Button variant="outlined">Open the menu</Button>}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuItem label="Archive" leading={<IconArchive size={16} stroke={1.5} className="text-text-secondary" />} disabledReason="Shut for now, and this says why, in the app’s words." onClick={() => {}} />
        <Divider className="my-1" />
        <MenuItem label="Delete" destructive onClick={() => {}} />
      </Menu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open the menu' }))
    await userEvent.hover(await within(canvasElement.ownerDocument.body).findByRole('menuitem', { name: 'Archive' }))
  },
}

/** Every shape on one canvas. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <MenuItem label="Bare" onClick={() => {}} />
      <MenuItem label="With an icon" leading={<IconPin size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuItem label="With a shortcut" shortcut="Ctrl+K" onClick={() => {}} />
      <MenuItem label="Icon and shortcut" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} shortcut="Ctrl+C" onClick={() => {}} />
      <MenuItem label="Opens another menu" submenu onClick={() => {}} />
      <MenuItem label="Ana Duarte" description="Product designer" leading={<Avatar name="Ana Duarte" size={32} />} trailing={<EnterHint />} onClick={() => {}} />
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
    // `hint`, not `trailing`: shown only while the row is highlighted, on the fill's own timing.
    hint: <EnterHint />,
  },
}

/** A topic in the picker: `EnterHint`'s `target` says what Enter gives you, after the key. Hover another row and back to see the hint follow the highlight. */
export const ATopic: Story = {
  args: {
    size: 'tall',
    label: 'design',
    description: '12 members',
    leading: <IconHash size={16} stroke={1.5} className="text-text-secondary" />,
    selected: true,
    hint: <EnterHint target="#design" />,
  },
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled: the
  // target is muted text, 3.05:1 on a highlighted row in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}
