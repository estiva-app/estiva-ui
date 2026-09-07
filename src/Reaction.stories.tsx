import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Reaction } from './Reaction'

const meta = {
  title: 'Components/Reaction',
  component: Reaction,
  args: { emoji: '👍', count: 2, 'aria-label': 'Makes sense, 2', onClick: fn() },
} satisfies Meta<typeof Reaction>

export default meta
type Story = StoryObj<typeof meta>

/** Somebody else's reaction: the inset fill and a hairline, like a neutral Chip. */
export const Default: Story = {}

/**
 * Yours.
 *
 * The state a reaction has and a chip does not — the accent's muted tint and an
 * accent edge, so a glance separates "two people, one of them me" from "two
 * people". `aria-pressed` carries the same fact to assistive tech.
 */
export const Pressed: Story = { args: { pressed: true } }

/** A row of them, as a message carries them. */
export const Row: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-1">
      <Reaction {...args} emoji="👍" count={3} aria-label="Makes sense, 3" pressed />
      <Reaction {...args} emoji="🎉" count={1} aria-label="Congrats, 1" />
      <Reaction {...args} emoji="🚀" count={12} aria-label="Let's go!, 12" />
    </div>
  ),
}

/** A count with two digits, so the pill grows rather than clipping. */
export const WideCount: Story = { args: { count: 128, 'aria-label': 'Makes sense, 128' } }

/** Momentarily unavailable — signing in, or a write already in flight. */
export const Disabled: Story = { args: { disabled: true } }

/**
 * An emoji from outside any curated set.
 *
 * Another client may publish anything, and a reaction a consumer cannot name is
 * still one it must draw rather than hide — so nothing here validates the glyph.
 */
export const UnknownEmoji: Story = { args: { emoji: '🦆', count: 1, 'aria-label': '🦆, 1' } }
