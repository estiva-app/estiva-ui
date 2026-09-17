import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Chip } from './Chip'
import { Person } from './Person'
import { Property } from './Property'
import { Select } from './Select'

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
        <div className="flex text-caption text-text-primary"><Person name="Ana Duarte" size={16} /></div>
      </Property>
      <Property label="Updated">
        <span className="text-caption text-text-secondary">2d ago</span>
      </Property>
    </div>
  ),
}

/** Ship's rail layout: the 9px uppercase label above a full-width value. */
export const Stacked: Story = {
  args: {
    label: 'Assignee',
    layout: 'stacked',
    children: <div className="flex text-body-2 text-text-primary"><Person name="Ravi Mehta" size={20} /></div>,
  },
}

function ControlsDemo() {
  const [status, setStatus] = useState('doing')
  const [owner, setOwner] = useState('ana')
  return (
    <div className="flex flex-col gap-4">
      <Property label="Status" layout="stacked">
        <Select
          ariaLabel="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'todo', label: 'To do' },
            { value: 'doing', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ]}
        />
      </Property>
      <Property label="Owner">
        <Select
          ariaLabel="Owner"
          size="small"
          value={owner}
          onChange={setOwner}
          options={[
            { value: 'ana', label: 'Ana Duarte' },
            { value: 'ravi', label: 'Ravi Mehta' },
          ]}
        />
      </Property>
    </div>
  )
}

/** The property holding a control — a full-width Select under a stacked label (the rail), a small one in a row. */
export const WithControls: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlsDemo />,
}

/** No value: the em dash, muted — the same mark Person uses for the unnamed. */
export const Empty: Story = {
  args: { label: 'Folder', children: <span className="text-caption text-text-muted">—</span> },
}
