import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EditableText } from './EditableText'

const meta = {
  title: 'Inputs/EditableText',
  component: EditableText,
  args: {
    value: 'Team charter',
    placeholder: 'Add a title',
    label: 'Title',
    onCommit: () => true as boolean,
    className: 'text-[16px] leading-[1.4] font-medium',
  },
  argTypes: { onCommit: { control: false } },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof EditableText>

export default meta
type Story = StoryObj<typeof meta>

/** Click the text: it becomes a field. Enter commits, Escape cancels, blur commits. */
export const Title: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <EditableText
        {...args}
        value={value}
        onCommit={(next) => {
          setValue(next)
          return true
        }}
      />
    )
  },
}

/** Shift+Enter is a new line; Enter still commits. */
export const Multiline: Story = {
  args: {
    value: 'A longer piece of text.\nIt keeps its lines.',
    placeholder: 'Add a description',
    label: 'Description',
    multiline: true,
    className: 'text-[14px] leading-[1.4]',
  },
}

/** Empty shows the placeholder, muted — still clickable. */
export const Empty: Story = { args: { value: '' } }

/** For a reader who cannot write: the value alone, no edit affordance. */
export const ReadOnly: Story = { args: { readOnly: true } }

/**
 * A commit that resolves `false` keeps the field open with the text in it —
 * an edit is never silently lost. Try committing anything here.
 */
export const RefusedCommit: Story = {
  args: { onCommit: () => false },
}
