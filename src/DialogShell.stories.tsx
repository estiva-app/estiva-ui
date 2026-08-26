import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { DialogShell } from './DialogShell'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

const meta = {
  title: 'Overlays/DialogShell',
  component: DialogShell,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — render in an iframe on the
    // Docs page so it doesn't escape over the docs content.
    docs: { story: { inline: false, height: '600px' } },
  },
  argTypes: { children: { control: false }, footer: { control: false } },
  args: { title: 'Dialog title', onClose: () => {} },
} satisfies Meta<typeof DialogShell>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The reusable dialog scaffold. A new dialog is just the header title, a body
 * (fields wrapped in `Field`), and a footer of buttons — the portal, backdrop,
 * card, and chrome all come from `DialogShell`.
 */
export const Default: Story = {
  args: {
    bodyClassName: 'flex flex-col gap-6',
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
    children: (
      <>
        <Field label="Title" required>
          <TextInput placeholder="What is this about?" />
        </Field>
        <Field label="Notes">
          <Textarea placeholder="Optional notes…" className="h-[80px]" />
        </Field>
      </>
    ),
  },
}

/** A minimal confirmation dialog — single line of body, two buttons. */
export const Confirmation: Story = {
  args: {
    title: 'Delete this?',
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </>
    ),
    children: <p className="text-body-2 leading-[1.4] text-text-primary">This permanently removes it. It cannot be undone.</p>,
  },
}

/** Open it, then close it with the ✕, the backdrop, or Escape. */
export const OpenAndClose: Story = {
  args: { footer: null, children: null },
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="flex h-screen items-center justify-center">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        {open && (
          <DialogShell
            {...args}
            onClose={() => setOpen(false)}
            footer={
              <>
                <Button variant="muted" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  Confirm
                </Button>
              </>
            }
          >
            <p className="text-body-2 text-text-primary">Escape closes this too.</p>
          </DialogShell>
        )}
      </div>
    )
  },
}
