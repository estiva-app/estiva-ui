import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCopy, IconHighlight, IconPencil, IconTrash } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { Button } from './Button'
import { Divider } from './Divider'
import { Menu, MenuItem, MenuPanel, MenuRow, MenuSection, MenuSub } from './Menu'
import { SectionLabel } from './SectionLabel'

/**
 * The shell every menu shares — container, rows, headings, and the exits
 * (Escape, a click outside) owned here, never by the caller. Since stage 4
 * it also owns the keyboard: ↑ ↓ walk the rows, Home and End jump, typing a
 * row's first letters jumps to it.
 *
 * A real menu portals to the body and places itself against a trigger, so it
 * cannot stand in the page the way these canvases need. **The canvases draw
 * the surface with `MenuPanel`** — which is what a menu *is*, and what
 * `Menu` itself renders — so the anatomy is visible at a glance;
 * **`FromATrigger` is the live one**, with the placement and the keyboard
 * (Katerina, D25).
 */
const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  decorators: [(Story) => <div className="flex min-h-[240px] w-full items-center justify-center"><Story /></div>],
  args: { onClose: () => {}, children: null },
  argTypes: { position: { control: false }, onClose: { control: false }, children: { control: false }, anchor: { control: false } },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/** Rows with a leading icon, a shortcut, and the destructive colour for the one that deletes. */
export const Items: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="min-w-[180px]">
      <MenuItem label="Rename" leading={<IconPencil size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuItem label="Copy link" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} shortcut="Ctrl+C" onClick={() => {}} />
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
    </MenuPanel>
  ),
}

/** Groups under SectionLabel headings, with a Divider between them; `selected` marks the chosen value. */
export const Sections: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="min-w-[180px]">
      <MenuSection label="Sort by">
        <MenuItem label="Newest first" selected onClick={() => {}} />
        <MenuItem label="Oldest first" onClick={() => {}} />
      </MenuSection>
      <Divider className="my-1" />
      <MenuSection label="Show">
        <MenuItem label="Everything" onClick={() => {}} />
        <MenuItem label="Unread only" onClick={() => {}} />
      </MenuSection>
    </MenuPanel>
  ),
}

/** A non-interactive row at the item's geometry — identity lines, hints. */
export const WithARow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-64">
      <MenuRow>
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">Ana Duarte</span>
        <SectionLabel className="text-text-secondary">Owner</SectionLabel>
      </MenuRow>
      <Divider className="my-1" />
      <MenuItem label="Sign out" onClick={() => {}} />
    </MenuPanel>
  ),
}

/** The row that opens another menu, at rest: the chevron at the right edge is
 *  the whole affordance. Hover it in **FromATrigger** to see the panel. */
export const SubmenuRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="min-w-[180px]">
      <MenuItem label="Rename" leading={<IconPencil size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => {}} />
      <MenuItem label="Mark as Highlight" leading={<IconHighlight size={16} stroke={1.5} className="text-text-secondary" />} submenu />
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive onClick={() => {}} />
    </MenuPanel>
  ),
}

/**
 * The live menu. Click the button, then try the keyboard: ↑ and ↓ walk the
 * rows and wrap, Home and End jump, typing "de" goes to Delete, → opens the
 * submenu and ← closes it, Escape closes the menu and gives focus back.
 *
 * The submenu is hover-timed too — it opens at once and closes 150ms after
 * the pointer leaves, so the diagonal from row to panel survives — and it
 * flips to the left of the row when the right-hand edge is close.
 */
export const FromATrigger: Story = {
  parameters: { controls: { disable: true } },
  render: function Live() {
    const [open, setOpen] = useState(false)
    const anchorRef = useRef<HTMLButtonElement>(null)
    return (
      <>
        <Button ref={anchorRef} variant="outlined" onClick={() => setOpen((v) => !v)}>
          Open the menu
        </Button>
        {open && (
          <Menu anchor={anchorRef.current} onClose={() => setOpen(false)}>
            <MenuItem label="Rename" leading={<IconPencil size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => setOpen(false)} />
            <MenuItem label="Copy link" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} shortcut="Ctrl+C" onClick={() => setOpen(false)} />
            <MenuSub label="Mark as Highlight" leading={<IconHighlight size={16} stroke={1.5} className="text-text-secondary" />}>
              <MenuItem label="Insight" onClick={() => setOpen(false)} />
              <MenuItem label="Concern" onClick={() => setOpen(false)} />
              <MenuItem label="Conclusion" onClick={() => setOpen(false)} />
              <MenuItem label="Question" onClick={() => setOpen(false)} />
              <MenuItem label="Summary" onClick={() => setOpen(false)} />
            </MenuSub>
            <Divider className="my-1" />
            <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => setOpen(false)} />
          </Menu>
        )}
      </>
    )
  },
}

/**
 * No `anchor` and no `position`: the menu hangs from the element it sits in,
 * right-aligned, 4px below it — what `absolute right-0 top-full mt-1` drew.
 * It portals now, so nothing above it in the app can clip or cover it, which
 * the old in-flow mode could not promise: that is exactly how the identity
 * menu ended up under a z-indexed panel header.
 *
 * Two callers use this shape — Ship's message actions and Peek's
 * conversation menu when it has no anchor.
 */
export const InFlow: Story = {
  parameters: { controls: { disable: true } },
  render: function InFlowMenu() {
    const [open, setOpen] = useState(false)
    return (
      <div className="relative">
        <Button variant="outlined" onClick={() => setOpen((v) => !v)}>
          Actions
        </Button>
        {open && (
          <Menu onClose={() => setOpen(false)}>
            <MenuItem label="Rename" onClick={() => setOpen(false)} />
            <MenuItem label="Delete" destructive onClick={() => setOpen(false)} />
          </Menu>
        )}
      </div>
    )
  },
}
