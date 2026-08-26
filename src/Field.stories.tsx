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
