import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Overlays/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — render in an iframe on the
    // Docs page so it doesn't escape over the docs content.
    docs: { story: { inline: false, height: '400px' } },
  },
  argTypes: { children: { control: false }, onConfirm: { control: false } },
  args: {
    title: 'Delete this?',
    confirmLabel: 'Delete',
    destructive: true,
    onConfirm: () => {},
    onClose: () => {},
    children: 'This permanently removes it. It cannot be undone.',
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Destructive: Story = {}

/** A confirmation that isn't a loss — the confirm button stays primary. */
export const NonDestructive: Story = {
  args: {
    title: 'Hand this over?',
    confirmLabel: 'Hand over',
    destructive: false,
    children: 'They become the owner. You keep reading rights.',
  },
}

/**
 * An action that resolves `false` keeps the dialog open — the caller has
 * shown why, and closing over an unexplained failure would lose the moment
 * to read it. Confirm here refuses forever; Cancel is the way out.
 */
export const RefusalKeepsItOpen: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [open, setOpen] = useState(true)
    return (
      <div className="flex h-screen items-center justify-center">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        {open && (
          <ConfirmDialog {...args} onConfirm={() => false} onClose={() => setOpen(false)}>
            Confirm resolves false, so the dialog stays. Cancel closes it.
          </ConfirmDialog>
        )}
      </div>
    )
  },
}
