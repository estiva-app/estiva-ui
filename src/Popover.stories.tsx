import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconBold, IconItalic, IconLink } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { MenuPanel } from './Menu'
import { Popover } from './Popover'
import { TextInput } from './TextInput'

/**
 * A floating panel from a trigger — the menu's surface, with none of a menu's
 * semantics. Reach for it when the panel holds *content*: a field, a row of
 * controls, a small form. Reach for **Menu** when it holds a list of actions.
 *
 * Like a menu it portals and places itself, so the canvas draws the surface
 * with `MenuPanel` and everything below it is live (Katerina, D25).
 */
const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  decorators: [(Story) => <div className="flex min-h-[260px] w-full items-start justify-center pt-6"><Story /></div>],
  args: { children: null },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    anchor: { control: false },
    onOpenChange: { control: false },
    actionsRef: { control: false },
    finalFocus: { control: false },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

/** The surface, at rest: whatever the caller puts in it. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[280px] gap-2">
      <span className="text-body-2-strong text-text-primary">A small form</span>
      <TextInput value="Item one" onChange={() => {}} aria-label="Name" />
      <div className="flex justify-end gap-2">
        <Button size="small">Cancel</Button>
        <Button size="small" variant="primary">
          Save
        </Button>
      </div>
    </MenuPanel>
  ),
}

/**
 * Live. Click the button: focus lands in the field, Tab walks the contents in
 * order because they are contents and not menu items, and Escape closes and
 * gives focus back to the button.
 *
 * The Cancel and Save buttons are not menu items, so choosing one does not
 * close the panel by itself — that is what `actionsRef` is for.
 */
export const FromATrigger: Story = {
  parameters: { controls: { disable: true } },
  render: function Live() {
    const [name, setName] = useState('Item one')
    const actions = useRef<{ close: () => void; unmount: () => void } | null>(null)
    return (
      <Popover
        trigger={<Button variant="outlined">Rename</Button>}
        actionsRef={actions}
        ariaLabel="Rename this"
        className="w-[280px] gap-2"
      >
        <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <div className="flex justify-end gap-2">
          <Button size="small" onClick={() => actions.current?.close()}>
            Cancel
          </Button>
          <Button size="small" variant="primary" onClick={() => actions.current?.close()}>
            Save
          </Button>
        </div>
      </Popover>
    )
  },
}

/**
 * The shape this component was added for: a row of controls with a text field
 * in it. In a `Menu` the arrow keys and the typeahead would fight the field.
 */
export const AToolbar: Story = {
  parameters: { controls: { disable: true } },
  render: function Toolbar() {
    const [url, setUrl] = useState('')
    return (
      <Popover
        trigger={<Button variant="outlined">Formatting</Button>}
        ariaLabel="Formatting"
        className="w-auto min-w-0 flex-row items-center gap-1 p-1"
      >
        <IconButton aria-label="Bold" tooltip="Bold" tooltipShortcut="Cmd+B">
          <IconBold size={16} stroke={1.5} />
        </IconButton>
        <IconButton aria-label="Italic" tooltip="Italic" tooltipShortcut="Cmd+I">
          <IconItalic size={16} stroke={1.5} />
        </IconButton>
        <IconButton aria-label="Link" tooltip="Link">
          <IconLink size={16} stroke={1.5} />
        </IconButton>
        <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" aria-label="Link address" className="h-7 w-48" />
      </Popover>
    )
  },
}

/**
 * The other mode: **no trigger element at all.** A panel hung from a rect the
 * caller measured — a text selection, which is not a control and cannot be
 * one. It is controlled, because there is nothing for Base UI to watch, and it
 * takes `finalFocus` to say where focus goes when it closes.
 *
 * Select some of the text below.
 */
export const FromASelection: Story = {
  parameters: { controls: { disable: true } },
  render: function Selection() {
    const [rect, setRect] = useState<DOMRect | null>(null)
    const body = useRef<HTMLParagraphElement>(null)
    const read = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !body.current?.contains(selection.anchorNode)) return setRect(null)
      setRect(selection.getRangeAt(0).getBoundingClientRect())
    }
    return (
      <div className="w-[420px]">
        <p ref={body} onMouseUp={read} onKeyUp={read} className="text-[14px] leading-[1.6] text-text-primary">
          Select any part of this sentence with the pointer, and a panel appears
          above the selection rather than beside a button — because a selection
          is not a control and there is no trigger to hang from.
        </p>
        {rect && (
          <Popover
            anchor={rect}
            open
            onOpenChange={(next) => !next && setRect(null)}
            finalFocus={body}
            ariaLabel="Formatting"
            className="w-auto min-w-0 flex-row items-center gap-1 p-1"
          >
            <IconButton aria-label="Bold" tooltip="Bold">
              <IconBold size={16} stroke={1.5} />
            </IconButton>
            <IconButton aria-label="Italic" tooltip="Italic">
              <IconItalic size={16} stroke={1.5} />
            </IconButton>
          </Popover>
        )}
      </div>
    )
  },
}
