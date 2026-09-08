import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArrowBackUp, IconArrowForwardUp, IconBold, IconItalic, IconLink, IconSquareRounded, IconUnderline } from '@tabler/icons-react'
import { useState } from 'react'
import { IconButton } from './IconButton'
import { MenuPanel } from './Menu'
import { Toolbar, ToolbarButton, ToolbarInput, ToolbarSeparator } from './Toolbar'

/**
 * A strip of controls that behaves as **one** control: Tab in, arrow keys
 * along, Tab out.
 *
 * The thing to try on every canvas here is the keyboard. Tab to the strip and
 * press → a few times: the focus moves inside it and Tab leaves it entirely.
 * The row beside `Loose` is the same buttons without the toolbar — Tab through
 * that one and count.
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

/**
 * **The difference, side by side.** Both rows draw the same four buttons. The
 * top one is a `Toolbar` and is one Tab stop; the bottom one is a `div` and is
 * four. Tab from the field and count the stops before you reach the last line.
 */
export const AgainstALooseRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[420px] flex-col gap-4">
      <input aria-label="Start here" placeholder="Start here, then Tab" className="rounded-lg border border-border-default bg-bg-inset px-3 py-2 text-body-2 text-text-primary" />
      <div className="flex flex-col gap-1">
        <span className="text-caption text-text-secondary">A Toolbar — one stop</span>
        <Toolbar aria-label="One stop">
          <ToolbarButton aria-label="Item one" tooltip="Item one">{icon}</ToolbarButton>
          <ToolbarButton aria-label="Item two" tooltip="Item two">{icon}</ToolbarButton>
          <ToolbarButton aria-label="Item three" tooltip="Item three">{icon}</ToolbarButton>
          <ToolbarButton aria-label="Item four" tooltip="Item four">{icon}</ToolbarButton>
        </Toolbar>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-caption text-text-secondary">A plain row — four stops</span>
        <div className="flex items-center gap-1">
          <IconButton aria-label="Item one" tooltip="Item one">{icon}</IconButton>
          <IconButton aria-label="Item two" tooltip="Item two">{icon}</IconButton>
          <IconButton aria-label="Item three" tooltip="Item three">{icon}</IconButton>
          <IconButton aria-label="Item four" tooltip="Item four">{icon}</IconButton>
        </div>
      </div>
      <span className="text-body-2 text-text-primary">The line after them.</span>
    </div>
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
      <MenuPanel className="w-auto p-1">
        <Toolbar aria-label="Link">
          <ToolbarButton aria-label="Link" tooltip="Link">
            <IconLink size={16} stroke={1.5} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" aria-label="Link address" className="h-7 w-48" />
        </Toolbar>
      </MenuPanel>
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
