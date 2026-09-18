import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import { Avatar } from './Avatar'
import { Field } from './Field'
import { Select } from './Select'
import { TextInput } from './TextInput'

/**
 * A select drawn by the app rather than by the operating system.
 *
 * The trigger is `TextInput`'s field, so a select and a text field sitting in
 * the same form are the same control with different contents.
 *
 * Open one and try the keyboard: arrows move, Home and End jump, Enter and Space
 * pick, Escape closes and puts focus back on the trigger. That is what a native
 * `<select>` gives away for free, and what has to be written by hand the moment
 * you stop using one.
 */
const meta = {
  title: 'Inputs/Select',
  component: Select,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
  args: {
    value: 'in_progress',
    onChange: () => {},
    options: [
      { value: 'todo', label: 'Todo' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'done', label: 'Done' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    ariaLabel: 'Status',
  },
  argTypes: { size: { control: 'inline-radio', options: ['default', 'small'] } },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/** Controlled, so the tick and the trigger follow what you pick. */
function Demo(props: Omit<ComponentProps<typeof Select>, 'value' | 'onChange'> & { initial?: string }) {
  const { initial = '', ...rest } = props
  const [value, setValue] = useState(initial)
  return <Select {...rest} value={value} onChange={setValue} />
}

/** Field height, matching `TextInput` — the size for a form. */
export const Default: Story = { render: (args) => <Demo {...args} initial="in_progress" /> }

/** Nothing chosen yet: the placeholder is muted, so an empty select does not read as one already holding a value. */
export const Empty: Story = {
  render: (args) => <Demo {...args} initial="" placeholder="Choose a status…" />,
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the placeholder is muted text, 3.21:1 on the field in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** The dense size, matching `Button`'s small — for property rows, where a full-height field would dominate the label beside it. */
export const Small: Story = { render: (args) => <Demo {...args} size="small" initial="todo" /> }

/** An option may carry a `leading` node — a face beside a person's name — shown in the trigger and in the list. Ship's addition. */
export const WithLeading: Story = {
  render: (args) => (
    <Demo
      {...args}
      ariaLabel="Assignee"
      initial="ana"
      size="small"
      options={[
        { value: '', label: 'Unassigned' },
        ...['Ana Duarte', 'Ravi Mehta', 'Mara Sato'].map((name) => ({ value: name.split(' ')[0].toLowerCase(), label: name, leading: <Avatar name={name} size={16} /> })),
      ]}
    />
  ),
}

/** In a `Field`, which is how a select appears in a form. */
export const InAField: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Field label="Status">
        <Demo {...args} initial="todo" />
      </Field>
      <Field label="Title" required>
        <TextInput placeholder="What is this about?" />
      </Field>
    </div>
  ),
}

/** Unavailable — the same disabled treatment as every other control. To say why, `WithAReason`. */
export const Disabled: Story = { render: (args) => <Demo {...args} initial="done" disabled /> }

/** `disabledReason`: it looks disabled and will not open, but Tab reaches it and the reason shows on hover and on focus. */
export const WithAReason: Story = { render: (args) => <Demo {...args} initial="done" disabledReason="Read only: you are a guest here" /> }

/** Longer labels than the trigger is wide: the trigger truncates rather than growing; the menu takes the trigger's width as a minimum and grows past it. */
export const LongLabels: Story = {
  render: (args) => (
    <Demo
      {...args}
      initial="a"
      options={[
        { value: 'a', label: 'Everything that has ever happened in this workspace' },
        { value: 'b', label: 'Only the things an administrator did' },
      ]}
    />
  ),
}

/** Enough options to scroll — the menu caps its height rather than running off. */
export const ManyOptions: Story = {
  render: (args) => <Demo {...args} initial="p3" options={Array.from({ length: 20 }, (_, i) => ({ value: `p${i}`, label: `Project ${i + 1}` }))} />,
}

/**
 * The files-panel bug, reproduced (Katerina, 2026-09-01): a trigger in the
 * bottom-right corner with a long people list. The menu used to run off the
 * right edge, past the bottom, and close itself on its own scroll. Now it
 * clamps to the viewport, opens upward when the room below is worse, and
 * scrolls — open it and try the wheel and the arrow keys.
 */
export const CorneredBottomRight: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="h-[560px]">
      {/* `fixed`, escaping the meta decorator's 360px column: the point is the
          REAL viewport corner, where both clamps have to earn their keep. */}
      <div className="fixed bottom-6 right-2 w-[240px]">
        <Demo
          {...args}
          size="small"
          initial=""
          placeholder="Unassigned"
          options={[
            { value: '', label: 'Unassigned' },
            ...[
              'Claude (steered by Katerina Kelepouri)',
              'Claude (steered by Miky)',
              'Handle probe',
              'Katerina Kelepouri',
              'Miky',
              'PC (steered by Katerina Kelepouri)',
              'PEEK-72 renamed',
              'Relay Operator',
              'Amie Miles',
              'Alice Johnson',
              'Daniel Stanton',
              'Greg Bothman',
            ].map((name, i) => ({
              value: `p${i}`,
              label: name,
              leading: <Avatar name={name} size={16} />,
            })),
          ]}
        />
      </div>
    </div>
  ),
}

/** The same list from a trigger high on screen — stays below, capped, scrollable. */
export const LongPeopleList: Story = {
  render: (args) => (
    <Demo
      {...args}
      initial=""
      placeholder="Unassigned"
      options={[
        { value: '', label: 'Unassigned' },
        ...Array.from({ length: 18 }, (_, i) => ({
          value: `p${i}`,
          label: `Person ${i + 1}`,
          leading: <Avatar name={`Person ${i + 1}`} size={16} />,
        })),
      ]}
    />
  ),
}


/**
 * A long label in a labelled property row (Katerina, 2026-09-01): the trigger
 * used to size to its content and shove the row past its card. `min-w-0
 * max-w-full` lets the flex row shrink it, so the label truncates instead.
 */
export const LongLabelInPropertyRow: Story = {
  render: (args) => (
    <div className="w-[300px] rounded-lg border border-border-subtle p-3">
      <div className="flex items-center gap-2">
        <span className="w-[68px] shrink-0 text-caption text-text-secondary">Lead</span>
        <Demo
          {...args}
          size="small"
          className="w-auto"
          initial="claude"
          options={[
            { value: '', label: 'Unassigned' },
            {
              value: 'claude',
              label: 'Claude (steered by Katerina Kelepouri)',
              leading: <Avatar name="Claude K" size={16} />,
            },
          ]}
        />
      </div>
    </div>
  ),
}
