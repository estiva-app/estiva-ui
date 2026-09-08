import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconBold, IconItalic, IconLink } from '@tabler/icons-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { Button } from './Button'
import { MenuPanel } from './Menu'
import { Popover } from './Popover'
import { TextInput } from './TextInput'
import { Toolbar, ToolbarButton, ToolbarInput, ToolbarSeparator } from './Toolbar'

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
 * The shape this component was added for: a `Toolbar` with a text field in
 * it. In a `Menu` the arrow keys and the typeahead would fight the field.
 *
 * It opens **above** its trigger, as a panel holding a toolbar does — the
 * strip acts on what is under it.
 */
export const AToolbar: Story = {
  parameters: { controls: { disable: true } },
  render: function FormattingStrip() {
    const [url, setUrl] = useState('')
    return (
      <Popover
        trigger={<Button variant="outlined">Formatting</Button>}
        ariaLabel="Formatting"
        /* Above the trigger, like every panel that holds a toolbar: a strip of
           controls acts on what is under it, so it stands over that rather
           than on top of it. `side` is the *preference* — Base UI flips it
           when there is no room, which is the reason the placement is its job
           and not ours. */
        side="top"
        className="w-auto min-w-0 p-1"
      >
        {/* The strip is a `Toolbar`, so the whole row is ONE Tab stop and the
            arrow keys walk it — four stops before, one after. */}
        <Toolbar aria-label="Formatting" surface={false}>
          <ToolbarButton aria-label="Bold" tooltip="Bold" tooltipShortcut="Cmd+B">
            <IconBold size={16} stroke={1.5} />
          </ToolbarButton>
          <ToolbarButton aria-label="Italic" tooltip="Italic" tooltipShortcut="Cmd+I">
            <IconItalic size={16} stroke={1.5} />
          </ToolbarButton>
          <ToolbarButton aria-label="Link" tooltip="Link">
            <IconLink size={16} stroke={1.5} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" aria-label="Link address" className="h-7 w-48" />
        </Toolbar>
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
    /*
     * Escape must not reopen what it just closed, and it did — measured
     * 2026-09-08: the keydown closes the panel, `finalFocus` puts focus back
     * on this paragraph, and the same key's KEYUP then lands here and re-reads
     * a selection that is still perfectly alive. The panel reopened in the
     * same gesture, so Escape looked as if it did nothing at all.
     *
     * A real editor's selection toolbar has exactly this shape, so the guard
     * belongs in the example rather than in a footnote.
     */
    const readOnKey = (event: KeyboardEvent<HTMLParagraphElement>) => {
      if (event.key === 'Escape') return
      read()
    }
    return (
      <div className="w-[420px]">
        {/* `tabIndex={-1}`: `finalFocus` needs something that can take focus,
            and a paragraph cannot until it is told it may. An editor already
            can, which is the real case; `-1` gives this one the same property
            without adding a Tab stop. Without it focus is left on the document
            body when the panel closes — measured. */}
        <p ref={body} tabIndex={-1} onMouseUp={read} onKeyUp={readOnKey} className="text-[14px] leading-[1.6] text-text-primary outline-none">
          Select any part of this sentence with the pointer, and a panel appears
          above the selection rather than beside a button — because a selection
          is not a control and there is no trigger to hang from.
        </p>
        {/* Always rendered, `open` toggled — never `{rect && <Popover…>}`.
            Mounting the panel only while it is open takes Base UI's own state
            machine away with it, and the exits go with it: measured, Escape
            closed the panel and a fresh selection sometimes failed to reopen
            it, both intermittently. Rendered once and told when to open, both
            are exact every time. */}
        <Popover
          anchor={rect}
          open={rect !== null}
          onOpenChange={(next) => !next && setRect(null)}
          finalFocus={body}
          /* Above the selection, not below it (Katerina, 2026-09-08): below,
             the panel covers the line after the selection — and that is the
             line that tells you what you have just selected. Base UI flips it
             when the top has no room. */
          side="top"
          ariaLabel="Formatting"
          className="w-auto min-w-0 p-1"
        >
          <Toolbar aria-label="Formatting" surface={false}>
            <ToolbarButton aria-label="Bold" tooltip="Bold">
              <IconBold size={16} stroke={1.5} />
            </ToolbarButton>
            <ToolbarButton aria-label="Italic" tooltip="Italic">
              <IconItalic size={16} stroke={1.5} />
            </ToolbarButton>
          </Toolbar>
        </Popover>
      </div>
    )
  },
}

/**
 * **The side is a preference, not a promise.** This one asks for the top in a
 * row pinned to the top of the screen, so there is no room above it and Base
 * UI puts it below. Deciding that is the whole reason the placement is not
 * ours to compute.
 */
export const FlippedForRoom: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <div className="flex h-[260px] w-full items-start justify-center pt-2">
      <Popover trigger={<Button variant="outlined">Asks for the top</Button>} side="top" ariaLabel="A panel" className="w-[240px]">
        <span className="text-body-2 text-text-primary">No room above, so it is below.</span>
      </Popover>
    </div>
  ),
}
