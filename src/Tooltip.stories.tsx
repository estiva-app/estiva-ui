import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArchive, IconPin, IconTrash } from '@tabler/icons-react'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Tooltip, WithTooltip } from './Tooltip'

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
    <div className="flex items-center gap-1 rounded-lg border border-border-default bg-bg-elevated p-1">
      <IconButton aria-label="Pin" tooltip="Pin">
        <IconPin size={16} stroke={1.5} />
      </IconButton>
      <IconButton aria-label="Archive" tooltip="Archive">
        <IconArchive size={16} stroke={1.5} />
      </IconButton>
      <IconButton aria-label="Delete" tooltip="Delete" tooltipShortcut="Del">
        <IconTrash size={16} stroke={1.5} />
      </IconButton>
    </div>
  ),
}
