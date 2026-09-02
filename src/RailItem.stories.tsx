import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconHome, IconInbox, IconUsers } from '@tabler/icons-react'
import { Rail } from './Rail'
import { RailItem } from './RailItem'

const meta = {
  title: 'Frame/RailItem',
  component: RailItem,
  args: { label: 'Home', href: '#', active: false, icon: <IconHome size={16} stroke={1.5} /> },
  argTypes: { icon: { control: false } },
  decorators: [(Story) => <div className="w-16">{Story()}</div>],
} satisfies Meta<typeof RailItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Active fills the tile — and some themes give the icon their interactive colour. */
export const Active: Story = { args: { active: true } }

/** Three tiles standing in the Rail shell, one current. */
export const InTheRail: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Rail>
      <RailItem href="#" label="Home" icon={<IconHome size={16} stroke={1.5} />} active />
      <RailItem href="#" label="Inbox" icon={<IconInbox size={16} stroke={1.5} />} />
      <RailItem href="#" label="People" icon={<IconUsers size={16} stroke={1.5} />} />
    </Rail>
  ),
}
