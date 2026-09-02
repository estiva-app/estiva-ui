import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
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
}

/** A zero is not drawn at all — this row's rule (a tab draws its zero; both are deliberate). */
export const ZeroDrawsNothing: Story = {
  args: { icon: placeholder, count: 0, countLabel: '0 open' },
}

/** The label gives way; the count never does. */
export const LongLabelTruncates: Story = {
  args: { label: 'An item whose label runs much longer than the column has room for', count: 7, countLabel: '7 open' },
}
