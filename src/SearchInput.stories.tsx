import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchInput } from './SearchInput'

/** An inset field whose border strengthens on focus; under Signal the shortcut becomes the mono kbd chip. */
const meta = {
  title: 'Inputs/SearchInput',
  component: SearchInput,
  decorators: [(Story) => <div className="w-[290px]"><Story /></div>],
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The keyboard hint at the right edge. */
export const WithShortcut: Story = {
  args: { shortcut: '⌘ K' },
}

/** The default placeholder says only "Search…" — the app names what is searched. */
export const OwnPlaceholder: Story = {
  args: { placeholder: 'Search documents…', shortcut: '⌘ K' },
}
