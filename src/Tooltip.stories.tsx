import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
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
