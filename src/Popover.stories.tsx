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
 * controls, a form. Reach for **Menu** when it holds a list of actions.
 *
 * Like a real menu it portals and places itself against its trigger, so the
 * canvases draw the surface with `MenuPanel` and **`FromATrigger`** and
 * **`AToolbar`** are the live ones (Katerina, D25).
 */
const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  decorators: [(Story) => <div className="flex min-h-[220px] w-full items-center justify-center"><Story /></div>],
  args: { onClose: () => {}, children: null },
  argTypes: { onClose: { control: false }, children: { control: false }, anchor: { control: false }, position: { control: false }, trigger: { control: false } },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

/** The surface, at rest: whatever the caller puts in it. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[280px] gap-2">
      <span className="text-body-2-strong text-text-primary">Rename this</span>
      <TextInput value="Weekly review" onChange={() => {}} aria-label="Name" />
      <div className="flex justify-end gap-2">
        <Button size="small">Cancel</Button>
        <Button size="small" variant="primary">
          Save
        </Button>
      </div>
    </MenuPanel>
  ),
}

/** Live: click the button. Escape and a press outside close it; Tab walks the
 *  contents in order, because they are contents and not menu items. */
export const FromATrigger: Story = {
  parameters: { controls: { disable: true } },
  render: function Live() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('Weekly review')
    const ref = useRef<HTMLButtonElement>(null)
    return (
      <>
        <Button ref={ref} variant="outlined" onClick={() => setOpen((v) => !v)}>
          Rename
        </Button>
        {open && (
          <Popover anchor={ref.current} onClose={() => setOpen(false)} ariaLabel="Rename this" className="w-[280px] gap-2">
            <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
            <div className="flex justify-end gap-2">
              <Button size="small" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="small" variant="primary" onClick={() => setOpen(false)}>
                Save
              </Button>
            </div>
          </Popover>
        )}
      </>
    )
  },
}

/**
 * The shape this component was added for: a row of controls with a text field
 * in it — an editor's selection toolbar. In a `Menu` the arrow keys and the
 * typeahead would fight the field.
 */
export const AToolbar: Story = {
  parameters: { controls: { disable: true } },
  render: function Toolbar() {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState('')
    const ref = useRef<HTMLButtonElement>(null)
    return (
      <>
        <Button ref={ref} variant="outlined" onClick={() => setOpen((v) => !v)}>
          Selection
        </Button>
        {open && (
          <Popover
            anchor={ref.current}
            onClose={() => setOpen(false)}
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
        )}
      </>
    )
  },
}
