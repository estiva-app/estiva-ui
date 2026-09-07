import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

const meta = {
  title: 'Inputs/Field',
  component: Field,
  parameters: { layout: 'padded' },
  args: { label: 'Title', required: false },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: <TextInput placeholder="What is this about?" /> } }
export const Required: Story = { args: { label: 'Title', required: true, children: <TextInput placeholder="What is this about?" /> } }
export const WithTextarea: Story = {
  args: { label: 'Resolution message (optional)', children: <Textarea placeholder="Summarise the outcome…" className="h-[109px]" /> },
}

/** A hint under the control: what the format is, or what happens if it is left empty. */
export const WithHelper: Story = {
  args: {
    label: 'Label',
    helper: 'Leave this empty and one is made for you.',
    children: <TextInput placeholder="Placeholder" />,
  },
}

/** The error takes the helper's place rather than joining it, and marks the control invalid. */
export const WithError: Story = {
  args: {
    label: 'Label',
    helper: 'Leave this empty and one is made for you.',
    error: 'That is not a valid value.',
    children: <TextInput defaultValue="Not a valid value" />,
  },
}

/** Required, with a helper — the three parts of a field at once. */
export const RequiredWithHelper: Story = {
  args: {
    label: 'Label',
    required: true,
    helper: 'One line, and it can be changed later.',
    children: <TextInput placeholder="Placeholder" />,
  },
}
