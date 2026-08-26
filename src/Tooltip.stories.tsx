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
