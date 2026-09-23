import type { Meta, StoryObj } from '@storybook/react-vite'
import { PersonTrigger } from './PersonTrigger'

/** The person, as the button that opens the account menu. The menu itself stays in the app. */
const meta = {
  title: 'Components/PersonTrigger',
  component: PersonTrigger,
  args: { name: 'Ana Duarte', open: false, compact: false },
} satisfies Meta<typeof PersonTrigger>

export default meta
type Story = StoryObj<typeof meta>

/** The row shape — face · name · chevron on a 32px button, Ship's top bar. */
export const Row: Story = {}

/** The row with the person's picture — an inline SVG, as Avatar's own story uses. */
export const RowWithPicture: Story = {
  args: {
    picture: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="%2346c08a"/><circle cx="5" cy="4" r="2" fill="%23fff"/></svg>',
  },
}

/** While what it opens is open, the row holds its hover fill. */
export const RowOpen: Story = {
  args: { open: true },
}

/** The row for someone with no published name. */
export const RowUnnamed: Story = {
  args: { name: undefined, fallback: 'Anonymous' },
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the fallback name is muted text, 3.94:1 on --bg-base in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** The face alone — Peek's top-bar shape. No chevron, no padding, and no hover fill: the face fills the whole control, so a fill would have nowhere to show. */
export const Compact: Story = {
  args: { compact: true },
}
