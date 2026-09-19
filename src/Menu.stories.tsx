import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCopy, IconDots, IconPencil, IconSquareRounded, IconTrash } from '@tabler/icons-react'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuPanel, MenuRow, MenuSection, MenuSeparator, MenuSub } from './Menu'
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
      <MenuSeparator />
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
      <MenuSeparator />
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
        <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">Item one</span>
        <SectionLabel tone="secondary">Label</SectionLabel>
      </MenuRow>
      <MenuSeparator />
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
      <MenuSeparator />
      <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
    </Menu>
  ),
}

/** The menu's right edge hangs from the trigger's, for a control at the right
 *  of a bar. */
export const RightAligned: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    /* `items-start`: a flex row stretches its children by default, and an
       IconButton has no height of its own — without it the 24px square grew to
       the row's 300px and wore a 300px hover fill (measured 24x268 before). */
    <div className="flex h-[300px] w-full items-start justify-end p-4">
      <Menu align="right" trigger={<IconButton aria-label="More" tooltip="More"><IconDots size={16} stroke={1.5} /></IconButton>}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuItem label="Delete" destructive onClick={() => {}} />
      </Menu>
    </div>
  ),
}

/**
 * The shape a card uses: a `⋮` at the end of the row, named by its tooltip,
 * opening a right-aligned menu on **click**.
 *
 * Walk down the rows, out to the submenu and back — it stays open the whole
 * way, including the diagonal from a row to its panel, and closes on Escape,
 * on a press outside, or on a second press of the `⋮`.
 */
export const OnACard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[420px] items-start gap-3 rounded-lg border border-border-default p-3">
      <span className="min-w-0 flex-1 text-body-2 text-text-primary">
        A card. Press the control at the end of the row, then walk down the rows and out to the submenu.
      </span>
      <Menu
        align="right"
        trigger={<IconButton aria-label="More" tooltip="More"><IconDots size={16} stroke={1.5} /></IconButton>}
        className="w-[244px] gap-2"
      >
        <MenuSection label="Section">
          <MenuItem label="Duplicate" leading={icon(IconCopy)} onClick={() => {}} />
          <MenuSub label="Move to…" leading={icon(IconSquareRounded)}>
            <MenuItem label="Item one" onClick={() => {}} />
            <MenuItem label="Item two" onClick={() => {}} />
          </MenuSub>
        </MenuSection>
        <MenuSeparator />
        <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => {}} />
      </Menu>
    </div>
  ),
}
