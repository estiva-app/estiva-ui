import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  args: { checked: false, 'aria-label': 'Example' },
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
 * `onChange` and goes inert, so the whole row is one target rather than two
 * fighting ones.
 */
export const InsideARow: Story = {
  // axe nested-interactive is off here: a checkbox inside a row that is itself a button
  // is two controls in one. The anatomy is settled at the Checkbox port (PLAN.md stage 1).
  parameters: { controls: { disable: true }, a11y: { config: { rules: [{ id: 'nested-interactive', enabled: false }] } } },
  render: () => {
    const [checked, setChecked] = useState(true)
    return (
      <button
        type="button"
        onClick={() => setChecked((v) => !v)}
        className="flex w-64 items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-hover"
      >
        <Checkbox checked={checked} aria-label="Row state" />
        <span className="text-[14px] leading-[1.4] text-text-primary">The row is the control</span>
      </button>
    )
  },
}
