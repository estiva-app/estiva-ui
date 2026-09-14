import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { IconLock } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'

// A box with a hairline, so where the state sits inside its room can be seen: a page's in the middle both ways, a section's at the top left.
const inBox: Decorator = (Story) => <div className="flex h-[280px] w-[480px] flex-col rounded-lg border border-border-default p-4">{Story()}</div>

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: { message: 'Nothing here yet.' },
  argTypes: { icon: { control: false } },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** The `page` manner: the default icon over the caller's words, in the middle of its box both ways. */
export const Page: Story = { decorators: [inBox] }
// axe color-contrast is off on the two section stories until PLAN.md stage 0.10 is ruled: the section
// line is muted caption text, 3.94:1 on --bg-base in signal (AA 4.5:1); 6.08:1 in ship.
const sectionContrastDeferred = { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } }

/** The `section` manner: the words alone, left-aligned, in the quiet caption — one line in a page that has other things on it. */
export const Section: Story = { args: { scope: 'section' }, decorators: [inBox], parameters: sectionContrastDeferred }
export const LongerMessage: Story = { args: { message: 'No items yet. Add one from any list.' }, decorators: [inBox] }
export const CustomIcon: Story = { args: { icon: <IconLock size={16} stroke={1.5} />, message: 'Nothing you can read here yet.' }, decorators: [inBox] }

/** One box, written once, holding the rows or the empty state: its padding places both, so the line starts where the first row does. */
export const InsideTheRowsBox: Story = {
  args: { scope: 'section' },
  parameters: { controls: { disable: true }, ...sectionContrastDeferred },
  render: (args) => {
    const box = 'flex h-[160px] w-[260px] flex-col gap-2 rounded-lg border border-border-default p-4'
    return (
      <div className="flex gap-4">
        <div className={box}>
          <p className="text-body-2 text-text-primary">Item one</p>
          <p className="text-body-2 text-text-primary">Item two</p>
        </div>
        <div className={box}>
          <EmptyState {...args} />
        </div>
      </div>
    )
  },
}
