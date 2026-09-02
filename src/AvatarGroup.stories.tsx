import type { Meta, StoryObj } from '@storybook/react-vite'
import { AvatarGroup } from './AvatarGroup'

const meta = {
  title: 'Primitives/AvatarGroup',
  component: AvatarGroup,
  args: {
    members: [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }, { name: 'Marta Silva' }],
  },
} satisfies Meta<typeof AvatarGroup>

export default meta
type Story = StoryObj<typeof meta>

export const ThreeMembers: Story = {}
export const TwoMembers: Story = {
  args: { members: [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }] },
}
export const One: Story = {
  args: { members: [{ name: 'Ana Duarte' }] },
}

/** Five members, three faces — the stack never grows past three. */
export const OverflowShowsThree: Story = {
  args: {
    members: [
      { name: 'Ana Duarte' },
      { name: 'Ravi Mehta' },
      { name: 'Marta Silva' },
      { name: 'Jonas Weber' },
      { name: 'Lea Novak' },
    ],
  },
}

/**
 * Inside a members pill with the total count — the shape a conversation
 * header draws over the stack. The pill is the caller's; this is the group
 * doing its job in one.
 */
export const InMembersPill: Story = {
  args: {
    members: [
      { name: 'Ana Duarte' },
      { name: 'Ravi Mehta' },
      { name: 'Marta Silva' },
      { name: 'Jonas Weber' },
    ],
  },
  render: (args) => (
    <div className="bg-bg-elevated border border-border-default rounded-sm flex gap-2 items-center pl-[2px] pr-2 py-[2px] w-fit">
      <AvatarGroup {...args} />
      <span className="text-caption text-text-secondary">{args.members.length}</span>
    </div>
  ),
}
