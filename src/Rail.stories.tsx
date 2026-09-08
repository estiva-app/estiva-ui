import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { Rail } from './Rail'
import { RailItem } from './RailItem'

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

/**
 * The 64px strip the icon tiles stand in. It is the container and nothing
 * else: **RailItem** is the tile, and what a rail leads to is the app's.
 *
 * It has no border and no surface of its own — it stands on the app
 * background, so every canvas here is full height against one.
 */
const meta = {
  title: 'Frame/Rail',
  component: Rail,
  parameters: { layout: 'fullscreen' },
  args: { 'aria-label': 'Navigation', children: null },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <div className="flex h-screen bg-bg-base">{Story()}</div>],
} satisfies Meta<typeof Rail>

export default meta
type Story = StoryObj<typeof meta>

/** Three tiles, the first current. */
export const Default: Story = {
  render: (args) => (
    <Rail {...args}>
      <RailItem href="#" label="Item" icon={placeholder} active />
      <RailItem href="#" label="Item" icon={placeholder} />
      <RailItem href="#" label="Item" icon={placeholder} />
    </Rail>
  ),
}

/** One tile, so the strip's own width is visible against nothing else. */
export const OneItem: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Rail>
      <RailItem href="#" label="Item" icon={placeholder} active />
    </Rail>
  ),
}

/**
 * Beside the thing it navigates. The rail draws no edge of its own — the
 * column beside it draws its own, which is what keeps a frame to one hairline.
 */
export const BesideAColumn: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <Rail>
        <RailItem href="#" label="Item" icon={placeholder} active />
        <RailItem href="#" label="Item" icon={placeholder} />
      </Rail>
      <div className="flex-1 border-l border-border-subtle bg-bg-surface p-6">
        <span className="text-body-2 text-text-secondary">The column the rail stands beside.</span>
      </div>
    </>
  ),
}

/**
 * More tiles than the screen is tall. The rail does not scroll on its own —
 * a rail with more entries than fit is a rail with too many entries, and the
 * answer is fewer, not a scrollbar in a 64px strip.
 */
export const ManyItems: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Rail>
      {Array.from({ length: 12 }, (_, i) => (
        <RailItem key={i} href="#" label="Item" icon={placeholder} active={i === 0} />
      ))}
    </Rail>
  ),
}
