import type { Meta, StoryObj } from '@storybook/react-vite'
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
