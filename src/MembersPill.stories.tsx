import type { Meta, StoryObj } from '@storybook/react-vite'
import { MembersPill } from './MembersPill'

const meta = {
  title: 'People/MembersPill',
  component: MembersPill,
  args: {
    members: [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }],
    onClick: () => {},
  },
} satisfies Meta<typeof MembersPill>

export default meta
type Story = StoryObj<typeof meta>

export const TwoMembers: Story = {}

export const One: Story = {
  args: { members: [{ name: 'Ana Duarte' }] },
}

/** Twelve members, three faces: the count says the rest. */
export const Many: Story = {
  args: {
    members: [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }, { name: 'Marta Silva' }],
    count: 12,
  },
}

/** Nothing to open — the pill is disabled, not another element. */
export const Disabled: Story = {
  args: { onClick: undefined },
}

/** `readOnly`: who is in it and nothing to press — the pill's own look, not greyed — in a list's row, which opens its thing (Katerina, 17 November). */
export const ReadOnly: Story = {
  args: { onClick: undefined, readOnly: true },
}

/** No members draws nothing at all. */
export const Empty: Story = {
  args: { members: [] },
}
