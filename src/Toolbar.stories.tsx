import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArrowBackUp, IconArrowForwardUp, IconBold, IconItalic, IconLink, IconSquareRounded, IconUnderline } from '@tabler/icons-react'
import { useState } from 'react'
import { IconButton } from './IconButton'
import { Popover } from './Popover'
import { Toolbar, ToolbarButton, ToolbarInput, ToolbarSeparator } from './Toolbar'

/**
 * A strip of controls that behaves as **one** control: Tab in, arrow keys
 * along, Tab out.
 *
 * It draws the elevated box a floating strip needs — the same one a `Menu`
 * draws — so a toolbar over a card, a paragraph or an image is separated from
 * it without the caller drawing anything.
 */
const meta = {
  title: 'Primitives/Toolbar',
  component: Toolbar,
  args: { 'aria-label': 'Formatting', children: null },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

const icon = <IconSquareRounded size={16} stroke={1.5} />

/** Four controls, one Tab stop. */
export const Default: Story = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarButton aria-label="Item one" tooltip="Item one">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item two" tooltip="Item two">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item three" tooltip="Item three">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item four" tooltip="Item four">{icon}</ToolbarButton>
    </Toolbar>
  ),
}

/** Groups, divided. The separator carries the role as well as the hairline. */
export const Grouped: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toolbar aria-label="Formatting">
      <ToolbarButton aria-label="Undo" tooltip="Undo" tooltipShortcut="Cmd+Z">
        <IconArrowBackUp size={16} stroke={1.5} />
      </ToolbarButton>
      <ToolbarButton aria-label="Redo" tooltip="Redo" tooltipShortcut="Cmd+Shift+Z">
        <IconArrowForwardUp size={16} stroke={1.5} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton aria-label="Bold" tooltip="Bold" tooltipShortcut="Cmd+B">
        <IconBold size={16} stroke={1.5} />
      </ToolbarButton>
      <ToolbarButton aria-label="Italic" tooltip="Italic" tooltipShortcut="Cmd+I">
        <IconItalic size={16} stroke={1.5} />
      </ToolbarButton>
      <ToolbarButton aria-label="Underline" tooltip="Underline" tooltipShortcut="Cmd+U">
        <IconUnderline size={16} stroke={1.5} />
      </ToolbarButton>
    </Toolbar>
  ),
}

/**
 * A field in the strip. While it has focus the arrow keys are the caret's —
 * which is what a field is for — and Tab resumes the walk. That is why a field
 * in a toolbar is `ToolbarInput` rather than a `TextInput` dropped in the row.
 */
export const WithAField: Story = {
  parameters: { controls: { disable: true } },
  render: function WithField() {
    const [url, setUrl] = useState('')
    return (
      <Toolbar aria-label="Link">
        <ToolbarButton aria-label="Link" tooltip="Link">
          <IconLink size={16} stroke={1.5} />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" aria-label="Link address" className="h-7 w-48" />
      </Toolbar>
    )
  },
}

/**
 * A control that cannot be used **keeps its place in the walk**. A strip whose
 * controls come and go from the arrow keys as their state changes is a strip
 * you cannot learn — and a `disabledReason` you cannot reach is a reason
 * nobody reads.
 */
export const WithADisabledControl: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toolbar aria-label="Formatting">
      <ToolbarButton aria-label="Item one" tooltip="Item one">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item two" disabledReason="Available once there is a selection">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item three" tooltip="Item three">{icon}</ToolbarButton>
    </Toolbar>
  ),
}

/** Down rather than across: ↑ and ↓ walk it. */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toolbar aria-label="Formatting" orientation="vertical">
      <ToolbarButton aria-label="Item one" tooltip="Item one" tooltipPlacement="bottom">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item two" tooltip="Item two" tooltipPlacement="bottom">{icon}</ToolbarButton>
      <ToolbarButton aria-label="Item three" tooltip="Item three" tooltipPlacement="bottom">{icon}</ToolbarButton>
    </Toolbar>
  ),
}

/**
 * **Inside something that already draws a box** — a `Popover`, a dialog, a
 * card's own panel — the strip drops its own with `surface={false}`. Two
 * boxes inside each other is the tell.
 */
export const OnAnExistingSurface: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Popover
      /* An `IconButton`, not a `ToolbarButton`: the trigger stands outside the
         strip, and a toolbar part outside a `Toolbar` throws. */
      trigger={<IconButton aria-label="Open" tooltip="Open">{icon}</IconButton>}
      ariaLabel="Formatting"
      className="w-auto min-w-0 p-1"
    >
      <Toolbar aria-label="Formatting" surface={false}>
        <ToolbarButton aria-label="Item one" tooltip="Item one">{icon}</ToolbarButton>
        <ToolbarButton aria-label="Item two" tooltip="Item two">{icon}</ToolbarButton>
        <ToolbarButton aria-label="Item three" tooltip="Item three">{icon}</ToolbarButton>
      </Toolbar>
    </Popover>
  ),
}
