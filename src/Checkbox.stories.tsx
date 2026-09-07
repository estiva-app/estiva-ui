import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { useState } from 'react'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  // `onChange` makes it the control; without one it is the picture of a
  // state (the "inside a row" story), and these stories are about the control.
  args: { checked: false, 'aria-label': 'Example', onChange: fn() },
  argTypes: { onChange: { control: false } },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}
export const Checked: Story = { args: { checked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledChecked: Story = { args: { checked: true, disabled: true } }

/** Controlled, as always — the parent owns the state. */
export const Toggles: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [checked, setChecked] = useState(false)
    return <Checkbox checked={checked} onChange={setChecked} aria-label="Toggle me" />
  },
}

/**
 * Inside a clickable row the row owns the toggle: the checkbox gets no
 * `onChange`, draws the state, and is hidden from assistive technology, so
 * the whole row is one control. The row says the state itself — here
 * `aria-pressed`, on an option in a list `aria-selected`.
 */
export const InsideARow: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [checked, setChecked] = useState(true)
    return (
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => setChecked((v) => !v)}
        className="flex w-64 items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-hover"
      >
        <Checkbox checked={checked} />
        <span className="text-body-2 text-text-primary">The row is the control</span>
      </button>
    )
  },
}
