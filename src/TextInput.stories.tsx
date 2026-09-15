import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'
import { TextInput } from './TextInput'

const meta = {
  title: 'Inputs/TextInput',
  component: TextInput,
  parameters: { layout: 'padded' },
  args: { placeholder: 'What is this about?' },
  // Inputs stretch to fill their container (as inside a Field).
  decorators: [(Story) => <div className="flex w-[360px] flex-col"><Story /></div>],
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: 'Q3 launch planning' } }
export const Disabled: Story = { args: { defaultValue: 'Read only', disabled: true } }

/** 24px and 12px text — the small `Select`'s size, for a dense row. */
export const Small: Story = { args: { size: 'small', placeholder: 'Label…' } }

function DenseRow() {
  const [first, setFirst] = useState('one')
  const [second, setSecond] = useState('a')
  return (
    <div className="flex items-center gap-1">
      <div className="w-28">
        <Select
          ariaLabel="First"
          size="small"
          value={first}
          onChange={setFirst}
          options={[
            { value: 'one', label: 'Option one' },
            { value: 'two', label: 'Option two' },
          ]}
        />
      </div>
      <div className="w-24">
        <Select
          ariaLabel="Second"
          size="small"
          value={second}
          onChange={setSecond}
          options={[
            { value: 'a', label: 'Item' },
            { value: 'b', label: 'Other item' },
          ]}
        />
      </div>
      <TextInput size="small" aria-label="Value" placeholder="Label…" className="min-w-0 flex-1" />
    </div>
  )
}

/** Beside two small selects, in one row: the three are the same height, and the text sits on one line. */
export const BesideSmallSelects: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DenseRow />,
}
