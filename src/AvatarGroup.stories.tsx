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
