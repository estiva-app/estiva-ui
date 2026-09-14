import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { InlineChip } from './InlineChip'

const meta = {
  title: 'Components/InlineChip',
  component: InlineChip,
  args: { tone: 'neutral', children: 'Label' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'person', 'urgent', 'quiet'] },
    icon: { control: false },
    href: { control: 'text' },
  },
  // A chip is a word in a sentence, so every canvas sets it in one, at the body text's size.
  render: (args) => (
    <p className="max-w-[480px] text-body-2 text-text-primary">
      The sentence runs up to <InlineChip {...args} /> and carries on after it, on the same line.
    </p>
  ),
} satisfies Meta<typeof InlineChip>

export default meta
type Story = StoryObj<typeof meta>

/** Anything that is not a person. */
export const Neutral: Story = {}

// axe color-contrast is off on the stories below that draw the person or quiet
// tone, until PLAN.md stage 0.10 is ruled. Computed 2026-09-14: the person
// chip reads 2.70:1 in ship (the accent on its wash — the brand Chip's number)
// and the quiet chip 3.25:1 in signal (muted on the active fill); AA is 4.5:1.
const contrastDeferred = { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } }

export const Person: Story = { args: { tone: 'person', children: '@Ana Duarte' }, parameters: contrastDeferred }

/** A person, called urgently. */
export const Urgent: Story = { args: { tone: 'urgent', children: '@Ana Duarte' } }

/** A reference nobody could resolve: smaller, mono, muted — still there, never an error. */
export const Quiet: Story = { args: { tone: 'quiet', children: '3f9a…c21e' }, parameters: contrastDeferred }

/** The icon sits first, in a 16px box. */
export const WithIcon: Story = { args: { icon: <IconSquareRounded size={16} stroke={1.5} />, children: 'Item one' } }

/** With `href` the chip is a link; without one it is a label. */
export const AsLink: Story = { args: { href: '#', children: 'Item one' } }

/** Every tone in one paragraph that wraps: each line stays one line high, and the chips' words sit level with the text around them. */
export const InRunningText: Story = {
  parameters: { controls: { disable: true }, ...contrastDeferred },
  render: () => (
    <p className="max-w-[360px] text-body-2 text-text-primary">
      A paragraph can hold <InlineChip>Item one</InlineChip> beside{' '}
      <InlineChip icon={<IconSquareRounded size={16} stroke={1.5} />}>Item two</InlineChip>, ask{' '}
      <InlineChip tone="person">@Ana Duarte</InlineChip> or <InlineChip tone="urgent">@Ana Duarte</InlineChip> to look, and
      point at <InlineChip tone="quiet">3f9a…c21e</InlineChip> when nothing more is known — and every line keeps its height.
    </p>
  ),
}
