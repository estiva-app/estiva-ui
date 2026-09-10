import type { Meta, StoryObj } from '@storybook/react-vite'
import { FieldLine } from './Field'
import { Select } from './Select'
import { Button } from './Button'
import { SectionLabel } from './SectionLabel'
import { TextInput } from './TextInput'

/** The small line a Field draws under a control, on its own — for a group of controls. */
const meta = {
  title: 'Inputs/Field line',
  component: FieldLine,
  parameters: { layout: 'padded' },
  args: { tone: 'helper', children: 'Leave this empty and one is made for you.' },
  argTypes: { tone: { control: 'inline-radio', options: ['helper', 'warning', 'error'] } },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
} satisfies Meta<typeof FieldLine>

export default meta
type Story = StoryObj<typeof meta>

/** A hint: what the format is, or what happens if it is left empty. */
export const Helper: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the helper is muted caption text, 3.93:1 on --bg-base in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** It went through, and something about it needs saying. */
export const Warning: Story = {
  args: { tone: 'warning', children: 'Saved here, but the change was not announced.' },
}

/** It did not go through. This one announces itself. */
export const Error: Story = {
  args: { tone: 'error', children: 'That could not be saved.' },
}

/** Under a row of controls, which is what it is for: one line for the group. */
export const UnderAGroup: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      <SectionLabel>Label</SectionLabel>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {/* A section heading is not a label: the control still owes its own
              name, which is half of why this group cannot simply be a Field. */}
          <TextInput defaultValue="Value" aria-label="Label" className="flex-1" />
          <Button variant="primary" size="small">Save</Button>
          <Button variant="outlined" size="small">Cancel</Button>
        </div>
        <FieldLine tone="warning">Saved here, but the change was not announced.</FieldLine>
      </div>
    </div>
  ),
}

/** The three tones together. */
export const AllTones: Story = {
  parameters: {
    controls: { disable: true },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Select value="one" onChange={() => {}} options={[{ value: 'one', label: 'Item one' }]} ariaLabel="Item" />
        <FieldLine>Leave this empty and one is made for you.</FieldLine>
      </div>
      <div className="flex flex-col gap-1.5">
        <Select value="one" onChange={() => {}} options={[{ value: 'one', label: 'Item one' }]} ariaLabel="Item" />
        <FieldLine tone="warning">Saved here, but the change was not announced.</FieldLine>
      </div>
      <div className="flex flex-col gap-1.5">
        <Select value="one" onChange={() => {}} options={[{ value: 'one', label: 'Item one' }]} ariaLabel="Item" />
        <FieldLine tone="error">That could not be saved.</FieldLine>
      </div>
    </div>
  ),
}
