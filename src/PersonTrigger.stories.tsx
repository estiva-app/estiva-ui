import type { Meta, StoryObj } from '@storybook/react-vite'
import { PersonTrigger } from './PersonTrigger'

/** The person, as the button that opens the account menu. The menu itself stays in the app. */
const meta = {
  title: 'Primitives/PersonTrigger',
  component: PersonTrigger,
  args: { name: 'Ana Duarte', open: false, compact: false },
} satisfies Meta<typeof PersonTrigger>

export default meta
type Story = StoryObj<typeof meta>

/** The row shape — face · name · chevron on a 32px button, Ship's top bar. */
export const Row: Story = {}

/** While what it opens is open, the row holds its hover fill. */
export const RowOpen: Story = {
  args: { open: true },
}

/** The row for someone with no published name. */
export const RowUnnamed: Story = {
  args: { name: undefined, fallback: 'Anonymous' },
}

/** The face alone — Peek's top-bar shape. No chevron, no padding, and no hover fill: the face fills the whole control, so a fill would have nowhere to show. */
export const Compact: Story = {
  args: { compact: true },
}
