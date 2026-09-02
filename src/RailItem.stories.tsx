import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { Rail } from './Rail'
import { RailItem } from './RailItem'

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

const meta = {
  title: 'Frame/RailItem',
  component: RailItem,
  args: { label: 'Item', href: '#', active: false, icon: placeholder },
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
      <RailItem href="#" label="Item" icon={placeholder} active />
      <RailItem href="#" label="Item" icon={placeholder} />
      <RailItem href="#" label="Item" icon={placeholder} />
    </Rail>
  ),
}
