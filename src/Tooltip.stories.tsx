import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArchive, IconPin, IconTrash } from '@tabler/icons-react'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Tooltip, WithTooltip } from './Tooltip'
import { Card } from './Card'

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  args: { label: 'Add to starred' },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** The static tooltip surface. */
export const Default: Story = {}

/** With a key hint — drawn as the `Kbd` chip after the label. */
export const WithShortcut: Story = { args: { label: 'Bold', shortcut: 'Cmd+B' } }

/** With and without, so the difference is one glance. */
export const ShortcutComparison: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <Tooltip label="Comment" />
      <Tooltip label="Bold" shortcut="Cmd+B" />
      <Tooltip label="Heading" shortcut="Ctrl+Alt+1" />
    </div>
  ),
}

/** A label longer than 320px wraps onto more lines, rather than running off the screen. A short one stays one line at 30px. */
export const LongLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <Tooltip label="Comment" />
      <Tooltip label="naddr1qvzqqqr4gupzq9h35qgq6n8ll0xyyv8gurjzjrx9sjwp4hry6ejnlks8cqcmzp6tqyfhwumn8ghj7mmxve3ksctfdch8qatz9uq3wamnwvaz7tmjv4kxz7fwwpexjmtpdshxuet59uq3qamnwvaz7tm99ehx2aqqz9mhxue69uhkummnw3ez6un9d3shjtnwda4k7tnr" />
      <Tooltip label="Item one, with a title long enough that it no longer fits on one line of a tooltip" />
    </div>
  ),
}

/** `inline`: a tooltip on a word inside a sentence. The wrapper is a span, so the paragraph stays valid HTML. Hover the word. */
export const InsideText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="max-w-sm text-body-2 text-text-primary">
      The plan is in{' '}
      <WithTooltip inline label="Item one, with a title long enough that it no longer fits on one line of a tooltip">
        <span className="font-semibold">Item one</span>
      </WithTooltip>
      , and the rest follows.
    </p>
  ),
}

/** Hover the button — WithTooltip portals the tooltip above the trigger. */
export const OnHoverTop: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <WithTooltip label="Add to starred" placement="top">
      <Button variant="outlined">Hover me</Button>
    </WithTooltip>
  ),
}

/** Bottom placement. */
export const OnHoverBottom: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <WithTooltip label="Sort by" placement="bottom">
      <Button variant="outlined">Hover me</Button>
    </WithTooltip>
  ),
}

/** The reason a disabled control gives — wrap the control, not the form around it. */
export const OnADisabledControl: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <WithTooltip label="Available after sign-in">
      <Button variant="primary" disabled>
        Post
      </Button>
    </WithTooltip>
  ),
}


/**
 * A row of controls, which is where the shared delay shows itself: the first
 * tooltip waits 300ms, and while the group stays warm the neighbours open as
 * the pointer arrives — and the pill moves between them without re-animating.
 * An app gets this by mounting one `TooltipProvider` at its root.
 */
export const InAToolbar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card fill="elevated" className="flex items-center gap-1 p-1">
      <IconButton aria-label="Pin" tooltip="Pin">
        <IconPin size={16} stroke={1.5} />
      </IconButton>
      <IconButton aria-label="Archive" tooltip="Archive">
        <IconArchive size={16} stroke={1.5} />
      </IconButton>
      <IconButton aria-label="Delete" tooltip="Delete" tooltipShortcut="Del">
        <IconTrash size={16} stroke={1.5} />
      </IconButton>
    </Card>
  ),
}
