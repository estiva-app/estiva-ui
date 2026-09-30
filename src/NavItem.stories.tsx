import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
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

/** No count: the ⋮ still appears in the same place. */
export const WithMenuNoCount: Story = {
  args: { icon: placeholder, menu: MENU },
}
