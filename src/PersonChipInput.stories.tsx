import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { PersonChipInput, type PersonChipOption } from './PersonChipInput'

const PEOPLE: PersonChipOption[] = [
  { id: '1', name: 'Ana Duarte', description: 'Design' },
  { id: '2', name: 'Ravi Mehta', description: 'Engineering' },
  { id: '3', name: 'Marta Silva', description: 'Product' },
  { id: '4', name: 'Jonas Weber', description: 'Engineering' },
  { id: '5', name: 'Lea Novak', description: 'Research' },
]

const meta = {
  title: 'Inputs/PersonChipInput',
  component: PersonChipInput,
  parameters: {
    // The suggestion list portals to document.body at fixed coordinates —
    // render docs usage in an iframe so it lands where the field is.
    docs: { story: { inline: false, height: '320px' } },
  },
  args: { value: [], onChange: () => {}, options: PEOPLE },
  argTypes: { value: { control: false }, onChange: { control: false }, options: { control: false } },
  decorators: [(Story) => <div className="w-96">{Story()}</div>],
} satisfies Meta<typeof PersonChipInput>

export default meta
type Story = StoryObj<typeof meta>

/** Type a name — suggestions appear only once there is a query. */
export const TypeToSearch: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<PersonChipOption[]>([])
    return <PersonChipInput {...args} value={value} onChange={setValue} />
  },
}

/** Chosen people are chips. Backspace on an empty query removes the last one. */
export const WithChips: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<PersonChipOption[]>([PEOPLE[0], PEOPLE[1]])
    return <PersonChipInput {...args} value={value} onChange={setValue} />
  },
}

/** `excludeIds` keeps someone out of the suggestions — the current user, say. */
export const ExcludingSomeone: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState<PersonChipOption[]>([])
    return <PersonChipInput {...args} value={value} onChange={setValue} excludeIds={['1']} />
  },
}
