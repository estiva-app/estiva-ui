import type { Meta, StoryObj } from '@storybook/react-vite'
import { SkeletonBar, SkeletonList, SkeletonRow } from './Skeleton'

const meta = {
  title: 'Feedback/Skeleton',
  component: SkeletonList,
} satisfies Meta<typeof SkeletonList>

export default meta
type Story = StoryObj<typeof meta>

/** A list placeholder — reveals after a 150ms delay so fast loads never flash it. */
export const List: Story = { decorators: [(Story) => <div className="w-[266px]"><Story /></div>] }

/** A single row-shaped placeholder. */
export const Row: Story = {
  render: () => (
    <div className="w-[266px]">
      <SkeletonRow barWidth={140} />
    </div>
  ),
}

/** The raw building block — size it per use. */
export const Bar: Story = {
  render: () => (
    <div className="flex w-[266px] flex-col gap-2">
      <SkeletonBar className="h-3.5 w-40" />
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="h-6 w-6" />
    </div>
  ),
}
