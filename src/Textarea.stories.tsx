import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './Textarea'

const meta = {
  title: 'Inputs/Textarea',
  component: Textarea,
  parameters: { layout: 'padded' },
  args: { placeholder: 'Summarise the outcome or decision…', className: 'h-[109px]' },
  decorators: [(Story) => <div className="flex w-[360px] flex-col"><Story /></div>],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: 'Shipped the fix in build #482; verified with QA on staging.' } }
export const Disabled: Story = { args: { defaultValue: 'Read only', disabled: true } }
