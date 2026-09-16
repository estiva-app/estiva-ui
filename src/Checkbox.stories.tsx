import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { useState } from 'react'
import { IconSquareRounded } from '@tabler/icons-react'
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

/** Words beside the box. Clicking them toggles it too, and they name it. */
export const WithLabel: Story = {
  args: { label: 'Label', 'aria-label': undefined },
  render: (args) => {
    const [checked, setChecked] = useState(args.checked)
    return <Checkbox {...args} checked={checked} onChange={setChecked} />
  },
}

/** Disabled with words: only the box shows it; the words keep their colour. */
export const WithLabelDisabled: Story = { args: { label: 'Label', 'aria-label': undefined, disabled: true } }

/**
 * A list you tick several from: each row is the target — a picture, the words,
 * the box at the end — and fills on hover and while checked.
 */
export const Row: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [ticked, setTicked] = useState(new Set(['Item two']))
    const toggle = (item: string) =>
      setTicked((prev) => {
        const next = new Set(prev)
        if (next.has(item)) next.delete(item)
        else next.add(item)
        return next
      })
    return (
      <div className="flex w-80 flex-col gap-0.5">
        {['Item one', 'Item two', 'Item three'].map((item) => (
          <Checkbox
            key={item}
            row
            leading={<IconSquareRounded size={16} stroke={1.5} />}
            label={item}
            checked={ticked.has(item)}
            onChange={() => toggle(item)}
          />
        ))}
      </div>
    )
  },
}

/** A row that cannot be changed: the box shows it, and the row neither fills nor points. */
export const RowDisabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-0.5">
      <Checkbox row disabled leading={<IconSquareRounded size={16} stroke={1.5} />} label="Item one" checked onChange={() => {}} />
      <Checkbox row disabled leading={<IconSquareRounded size={16} stroke={1.5} />} label="Item two" checked={false} onChange={() => {}} />
    </div>
  ),
}

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
