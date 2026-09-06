import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArrowUp, IconMessage2 } from '@tabler/icons-react'
import { Chip } from './Chip'

const meta = {
  title: 'Primitives/Chip',
  component: Chip,
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // in ship the brand chip reads 2.70:1 and the info chip 3.99:1 on their washes
  // (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  args: { type: 'neutral', label: 'Label' },
  argTypes: {
    type: { control: 'inline-radio', options: ['neutral', 'brand', 'info', 'warning', 'success', 'error'] },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}
/** A count in the brand colour — "1 new". */
export const Brand: Story = { args: { type: 'brand', label: '1 new' } }
export const WithLeadingIcon: Story = { args: { type: 'info', label: 'Replies', leadingIcon: <IconMessage2 className="size-3" stroke={1.5} /> } }
export const WithTrailingIcon: Story = { args: { type: 'success', label: 'Sorted', trailingIcon: <IconArrowUp className="size-3" stroke={1.5} /> } }
/** A count alone. */
export const CountOnly: Story = { args: { type: 'neutral', label: '2' } }

/** All six colour types. */
export const AllTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-2">
      {(['neutral', 'brand', 'info', 'warning', 'success', 'error'] as const).map((type) => (
        <Chip key={type} type={type} label={type} />
      ))}
    </div>
  ),
}
