import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCopy, IconDots, IconPencil, IconSquareRounded, IconTrash } from '@tabler/icons-react'
import { Button } from './Button'
import { Divider } from './Divider'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuPanel, MenuRow, MenuSection, MenuSub } from './Menu'
import { SectionLabel } from './SectionLabel'

/**
 * The shell every menu shares: an elevated container, rows, headings — and all
 * of a menu's behaviour, which is Base UI's. **The menu owns its trigger**, so
 * a caller writes no open state, no placement and no dismiss.
 *
 * ↑ ↓ walk the rows and wrap, Home and End jump, typing a row's first letters
 * goes to it, → opens a submenu and ← closes it, Escape closes and gives focus
 * back to the trigger.
 *
 * A live menu portals and places itself against its trigger, so it cannot
 * stand in a docs canvas: **`Items` and `Sections` draw the surface** with
 * `MenuPanel` — which is what a menu *is*, and what `Menu` renders — and every
 * story below them is live (Katerina, D25).
 */
const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  decorators: [(Story) => <div className="flex min-h-[260px] w-full items-start justify-center pt-6"><Story /></div>],
  args: { trigger: <Button variant="outlined">Open the menu</Button>, children: null },
  argTypes: { trigger: { control: false }, children: { control: false }, onOpenChange: { control: false }, actionsRef: { control: false } },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

const icon = (Icon: typeof IconPencil) => <Icon size={16} stroke={1.5} className="text-text-secondary" />

/** The anatomy at rest: rows with a leading icon, a shortcut, and the
 *  destructive colour for the one that deletes. */
export const Items: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="min-w-[180px]">
      <MenuItem label="Rename" leading={icon(IconPencil)} onClick={() => {}} />
      <MenuItem label="Duplicate" leading={icon(IconCopy)} shortcut="Ctrl+D" onClick={() => {}} />
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
    </MenuPanel>
  ),
}

/** Groups under headings, with a divider between them. The divider runs the
 *  width of the rows it separates, not the width of the panel's text. */
export const Sections: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="min-w-[180px]">
      <MenuSection label="Section">
        <MenuItem label="Item one" selected onClick={() => {}} />
        <MenuItem label="Item two" onClick={() => {}} />
      </MenuSection>
      <Divider className="my-1" />
      <MenuSection label="Another section">
        <MenuItem label="Option one" onClick={() => {}} />
        <MenuItem label="Option two" onClick={() => {}} />
      </MenuSection>
    </MenuPanel>
  ),
}

/** A non-interactive line at row geometry — a value, a note. */
export const WithARow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-64">
      <MenuRow>
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">Item one</span>
        <SectionLabel className="text-text-secondary">Label</SectionLabel>
      </MenuRow>
      <Divider className="my-1" />
      <MenuItem label="An action" onClick={() => {}} />
    </MenuPanel>
  ),
}

/**
 * Live. Click the button, then use only the keyboard: ↑ ↓ walk the rows and
 * wrap, Home and End jump, typing "de" goes to Delete, Escape closes and puts
 * focus back on the button.
 *
 * The trigger belongs to the menu, so nothing here keeps open state.
 */
export const FromATrigger: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Menu trigger={<Button variant="outlined">Open the menu</Button>}>
      <MenuItem label="Rename" leading={icon(IconPencil)} onClick={() => {}} />
      <MenuItem label="Duplicate" leading={icon(IconCopy)} shortcut="Ctrl+D" onClick={() => {}} />
      <MenuSub label="Move to…" leading={icon(IconSquareRounded)}>
        <MenuItem label="Item one" onClick={() => {}} />
        <MenuItem label="Item two" onClick={() => {}} />
        <MenuItem label="Item three" onClick={() => {}} />
      </MenuSub>
      <Divider className="my-1" />
      <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
    </Menu>
  ),
}

/** The menu's right edge hangs from the trigger's, for a control at the right
 *  of a bar. */
export const RightAligned: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <div className="flex h-[300px] w-full justify-end p-4">
      <Menu align="right" trigger={<IconButton aria-label="More"><IconDots size={16} stroke={1.5} /></IconButton>}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuItem label="Delete" destructive onClick={() => {}} />
      </Menu>
    </div>
  ),
}

/**
 * **Opens on hover, and closes shortly after the pointer leaves** — no click.
 * The quick-menu cards work this way: the control appears while the pointer is
 * on the card, and the menu it opens dismisses itself when you go.
 *
 * The thing to try: open it and walk down the rows, out to the submenu and
 * back. It must stay open the whole way, including the diagonal from a row to
 * its panel, and close only when you actually leave. All of that is Base UI's
 * `openOnHover` — the shell used to hand-write it and got it wrong in two
 * directions.
 */
export const OpensOnHover: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[420px] items-start gap-3 rounded-lg border border-border-default p-3">
      <span className="min-w-0 flex-1 text-[14px] leading-[140%] text-text-primary">
        A card. Rest the pointer on the control, then walk down the rows and out to the submenu.
      </span>
      <Menu
        align="right"
        openOnHover
        trigger={<IconButton aria-label="More"><IconDots size={16} stroke={1.5} /></IconButton>}
        className="w-[244px] gap-2"
      >
        <MenuSection label="Section">
          <MenuItem label="Duplicate" leading={icon(IconCopy)} onClick={() => {}} />
          <MenuSub label="Move to…" leading={icon(IconSquareRounded)}>
            <MenuItem label="Item one" onClick={() => {}} />
            <MenuItem label="Item two" onClick={() => {}} />
          </MenuSub>
        </MenuSection>
        <Divider className="my-1" />
        <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
      </Menu>
    </div>
  ),
}
