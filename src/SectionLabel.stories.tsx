import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionLabel } from './SectionLabel'

/** Every section title renders through this span — a style change is one edit. Under Signal it becomes the mono uppercase micro-label. */
const meta = {
  title: 'Primitives/SectionLabel',
  component: SectionLabel,
  args: { children: 'Starred' },
} satisfies Meta<typeof SectionLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Where it lives: heading a group of rows. */
export const HeadingAList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[240px] flex-col gap-1">
      <div className="flex h-8 items-center px-2">
        <SectionLabel>Recent</SectionLabel>
      </div>
      {['Quarterly plan', 'Reading list', 'Archive'].map((row) => (
        <div key={row} className="rounded-lg px-2 py-1.5 text-body-2 text-text-primary hover:bg-bg-hover">
          {row}
        </div>
      ))}
    </div>
  ),
}

/** `tone="secondary"`: a heading inside a menu or a list of results labels the rows, it is not one of them. */
export const Secondary: Story = { args: { tone: 'secondary', children: 'Section' } }

/** `tone="muted"`: a label that marks a place in a list rather than heading it, a date between messages. */
export const Muted: Story = { args: { tone: 'muted', children: 'Yesterday' } }

/** `truncate`: a long label in a narrow row ends in an ellipsis instead of spilling. */
export const Truncated: Story = {
  args: { truncate: true, children: 'Promoted to a topic whose title is far longer than its row' },
  render: (args) => (
    <div className="flex w-48">
      <SectionLabel {...args} />
    </div>
  ),
}
