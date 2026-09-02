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
} satisfies Meta<typeof RailItem>

export default meta
type Story = StoryObj<typeof meta>

const tile = [(Story: () => React.ReactNode) => <div className="w-16">{Story()}</div>]

export const Default: Story = { decorators: tile }

/** Active fills the tile — and some themes give the icon their interactive colour. */
export const Active: Story = { args: { active: true }, decorators: tile }

/** The Rail shell as it stands in a frame: on the left, full height, tiles at the top. */
export const InTheRail: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div className="flex h-screen bg-bg-base">
      <Rail>
        <RailItem href="#" label="Item" icon={placeholder} active />
        <RailItem href="#" label="Item" icon={placeholder} />
        <RailItem href="#" label="Item" icon={placeholder} />
      </Rail>
    </div>
  ),
}
