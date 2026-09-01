import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Avatar } from './Avatar'
import { ChipInput, InputChip, type ChipInputOption } from './ChipInput'

const PEOPLE: ChipInputOption[] = [
  { id: '1', name: 'Ana Duarte', description: 'Design' },
  { id: '2', name: 'Ravi Mehta', description: 'Engineering' },
  { id: '3', name: 'Marta Silva', description: 'Product' },
  { id: '4', name: 'Jonas Weber', description: 'Engineering' },
  { id: '5', name: 'Lea Novak', description: 'Research' },
].map(({ id, name, description }) => ({ id, label: name, description }))

const LABELS: ChipInputOption[] = [
  { id: 'a', label: 'Amber' },
  { id: 'b', label: 'Cobalt' },
  { id: 'c', label: 'Moss' },
  { id: 'd', label: 'Slate' },
]

/** The person flavour: faces in the chips and the rows, from the two leading slots. */
const personLeading = {
  chipLeading: (o: ChipInputOption) => <Avatar size={16} name={o.label} alt={o.label} className="rounded-full" />,
  rowLeading: (o: ChipInputOption) => <Avatar size={32} name={o.label} alt={o.label} />,
}

const meta = {
  title: 'Inputs/ChipInput',
  component: ChipInput,
  parameters: {
    // The suggestion list portals to document.body at fixed coordinates —
    // render docs usage in an iframe so it lands where the field is.
    docs: { story: { inline: false, height: '320px' } },
  },
  args: { value: [], onChange: () => {}, options: PEOPLE },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    options: { control: false },
    chipLeading: { control: false },
    rowLeading: { control: false },
  },
  decorators: [(Story) => <div className="w-96">{Story()}</div>],
} satisfies Meta<typeof ChipInput>

export default meta
type Story = StoryObj<typeof meta>

/** Type a name — suggestions appear only once there is a query. */
export const TypeToSearch: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<ChipInputOption[]>([])
    return <ChipInput {...args} {...personLeading} value={value} onChange={setValue} placeholder="Search people…" />
  },
}

/** Chosen people are chips. Backspace on an empty query removes the last one. */
export const WithChips: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<ChipInputOption[]>([PEOPLE[0], PEOPLE[1]])
    return <ChipInput {...args} {...personLeading} value={value} onChange={setValue} placeholder="Search people…" />
  },
}

/** `excludeIds` keeps someone out of the suggestions — the current user, say. */
export const ExcludingSomeone: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<ChipInputOption[]>([])
    return <ChipInput {...args} {...personLeading} value={value} onChange={setValue} excludeIds={['1']} placeholder="Search people…" />
  },
}

/**
 * Nothing about people: no leading slots, and the chips are plain labels.
 * The same input picks anything multi-select.
 */
export const PlainLabels: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<ChipInputOption[]>([LABELS[0]])
    return <ChipInput {...args} value={value} onChange={setValue} options={LABELS} placeholder="Add a label…" />
  },
}

/** The chip on its own: with a face, with nothing, and display-only (no ✕). */
export const TheChipItself: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-2">
      <InputChip label="Ana Duarte" leading={<Avatar size={16} name="Ana Duarte" alt="Ana Duarte" className="rounded-full" />} onRemove={() => {}} />
      <InputChip label="Amber" onRemove={() => {}} />
      <InputChip label="Display only" />
    </div>
  ),
}
