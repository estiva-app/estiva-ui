import type { Meta, StoryObj } from '@storybook/react-vite'
import { Chip } from './Chip'
import { Person } from './Person'
import { Property } from './Property'

/** A labelled property — the 68px label column is what lines the values up. */
const meta = {
  title: 'Primitives/Property',
  component: Property,
  decorators: [(Story) => <div className="w-[260px]"><Story /></div>],
  args: { label: 'Status', children: <Chip type="success" label="Done" /> },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof Property>

export default meta
type Story = StoryObj<typeof meta>

export const Row: Story = {}

/** A column of rows — the label column keeps the values aligned. */
export const APanel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Property label="Status">
        <Chip type="success" label="Done" />
      </Property>
      <Property label="Lead">
        <Person name="Ana Duarte" size={16} className="text-[12px] leading-[120%] text-text-primary" />
      </Property>
      <Property label="Updated">
        <span className="text-[12px] leading-[120%] text-text-secondary">2d ago</span>
      </Property>
    </div>
  ),
}

/** Ship's rail layout: the 9px uppercase label above a full-width value. */
export const Stacked: Story = {
  args: {
    label: 'Assignee',
    layout: 'stacked',
    children: <Person name="Ravi Mehta" size={20} className="text-[14px] leading-[140%] text-text-primary" />,
  },
}

/** No value: the em dash, muted — the same mark Person uses for the unnamed. */
export const Empty: Story = {
  args: { label: 'Folder', children: <span className="text-[12px] leading-[120%] text-text-muted">—</span> },
}
