import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Card'
import { ShowMore } from './ShowMore'

const LONG = Array.from(
  { length: 6 },
  (_, i) => `Paragraph ${i + 1}. A long description written out in full, the way a real brief is, so that it runs past the height the box allows and needs cutting.`,
).join(' ')

/** Long content cut behind a fade, with "Show more" under it. Short content is drawn whole. */
const meta = {
  title: 'Layout/ShowMore',
  component: ShowMore,
  decorators: [(Story) => <div className="w-[320px]"><Story /></div>],
  args: { children: <p className="text-caption text-text-secondary">{LONG}</p> },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof ShowMore>

export default meta
type Story = StoryObj<typeof meta>

/** Taller than 96px: cut, faded into the surface, "Show more" under it. */
export const Long: Story = {}

/** No taller than the limit: drawn whole, no fade, no button. */
export const Short: Story = {
  args: { children: <p className="text-caption text-text-secondary">One line of description.</p> },
}

/** Inside an inset card: the fade ends in the card's fill, `from-bg-inset`. */
export const InACard: Story = {
  args: { fadeClassName: 'from-bg-inset' },
  render: (args) => (
    <Card fill="inset" className="p-3">
      <p className="text-body-2-strong text-text-primary">Title</p>
      <ShowMore {...args} className="mt-1" />
    </Card>
  ),
}
