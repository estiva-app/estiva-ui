import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { Chip } from './Chip'
import { MenuItem } from './Menu'
import { NavItem } from './NavItem'

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

const meta = {
  title: 'Frame/NavItem',
  component: NavItem,
  args: { label: 'Item', href: '#', active: false },
  argTypes: { icon: { control: false } },
  decorators: [(Story) => <div className="flex w-60 flex-col gap-px">{Story()}</div>],
} satisfies Meta<typeof NavItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Active is the selected tab's fill — neutral, text primary. */
export const Active: Story = { args: { active: true } }

/** The count is a muted mono number, and its tooltip says what it counts. */
export const WithIconAndCount: Story = {
  args: { icon: placeholder, count: 18, countLabel: '18 open' },
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the count is muted text, 3.94:1 on --bg-base in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** A zero is not drawn at all — this row's rule (a tab draws its zero; both are deliberate). */
export const ZeroDrawsNothing: Story = {
  args: { icon: placeholder, count: 0, countLabel: '0 open' },
}

/** The label gives way; the count never does. */
export const LongLabelTruncates: Story = {
  args: { label: 'An item whose label runs much longer than the column has room for', count: 7, countLabel: '7 open' },
}

const MENU = (
  <>
    <MenuItem label="Action one" onClick={() => {}} />
    <MenuItem label="Action two" onClick={() => {}} />
  </>
)

/** A row with a menu: point at it (or Tab to it) and a ⋮ takes the count's place; the count comes back when you leave. */
export const WithMenu: Story = {
  args: { icon: placeholder, count: 6, countLabel: '6 open', menu: MENU },
}

/** The active row keeps its fill; the ⋮ sits on it the same way. */
export const WithMenuActive: Story = {
  args: { icon: placeholder, count: 6, countLabel: '6 open', menu: MENU, active: true },
}

/** No count: the ⋮ still appears in the same place, and a long label stops short of it. */
export const WithMenuNoCount: Story = {
  args: { label: 'An item whose label runs much longer than the column has room for', icon: placeholder, menu: MENU },
}

/** A hint shows only while the row is pointed at or focused, left of the count: here a neutral Chip. */
export const WithHint: Story = {
  args: { icon: placeholder, count: 3, countLabel: '3 open', hint: <Chip type="neutral" label="Label" /> },
}

/** A long label gives way to the hint while it shows: it ends with "…" before the chip instead of running under it. */
export const WithHintLongLabel: Story = {
  args: { label: 'An item whose label runs much longer than the column has room for', icon: placeholder, count: 12, countLabel: '12 open', hint: <Chip type="neutral" label="Label" /> },
}

/** Rows under a row: point at it and its icon becomes the arrow that folds them. The row itself stays a link. */
export const WithRowsUnder: Story = {
  args: { icon: placeholder },
  render: (args) => (
    <NavItem {...args}>
      <NavItem href="#" label="Item two" icon={placeholder} />
      <NavItem href="#" label="Item three" icon={placeholder}>
        <NavItem href="#" label="Item four" icon={placeholder} />
      </NavItem>
    </NavItem>
  ),
}

/** Starts folded: point at it, or Tab to its arrow, to open it. */
export const WithRowsUnderClosed: Story = {
  args: { icon: placeholder, defaultOpen: false },
  render: (args) => (
    <NavItem {...args}>
      <NavItem href="#" label="Item two" icon={placeholder} />
    </NavItem>
  ),
}
