import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'

/** A hairline in `border-subtle`, inset 12px each side — or standing up between two columns. */
const meta = {
  title: 'Primitives/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

/** Between two blocks on the surface. */
export const Default: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-border-default bg-bg-surface py-3">
      <p className="px-3 pb-2 text-body-2 text-text-primary">Above the divider</p>
      <Divider />
      <p className="px-3 pt-2 text-body-2 text-text-primary">Below the divider</p>
    </div>
  ),
}

/** Inside a menu — on the elevated surface, full width (`mx-0`). */
export const InAMenu: Story = {
  render: () => (
    <div className="w-72 rounded-lg border border-border-default bg-bg-elevated p-2 text-body-2 text-text-primary shadow-lg">
      <div className="px-2 py-1.5">First action</div>
      <Divider className="mx-0 my-2" />
      <div className="px-2 py-1.5">Second action</div>
    </div>
  ),
}

/** Standing between two columns, the height of its row. Ship's addition. */
export const Vertical: Story = {
  render: () => (
    <div className="flex h-40 w-96 gap-6 text-body-2 text-text-primary">
      <div className="flex-1">Content</div>
      <Divider orientation="vertical" />
      <div className="w-32">Rail</div>
    </div>
  ),
}
