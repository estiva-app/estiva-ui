import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Menus & windows/ConfirmDialog',
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

/** Before a comment is deleted: its replies stay. The question a `ConversationCard` asks. */
export const DeleteAComment: Story = {
  name: 'Delete a comment',
  args: { title: 'Delete this comment?', confirmLabel: 'Delete comment', children: 'Its 2 replies stay.' },
}

/** A delete that was refused: the question stays, and the error line under its words says why (`refused`; Leaf's, 3 November). */
export const DeleteRefused: Story = {
  name: 'Delete refused',
  args: { title: 'Delete this comment?', confirmLabel: 'Delete comment', children: 'Its reply stays.', refused: 'Could not delete it. Try again.' },
}

/** Before a reply is deleted. The question a `ReplyCard` asks. */
export const DeleteAReply: Story = {
  name: 'Delete a reply',
  args: { title: 'Delete this reply?', confirmLabel: 'Delete reply', children: 'It goes from the thread for everyone.' },
}

const ARCHIVE_INSTEAD = {
  label: 'Archive instead',
  sentence: 'To take it out of every list and keep it readable, archive it instead.',
  onClick: () => {},
}

/** A third, safer answer under the words: archive it rather than lose it. The question it opens takes this one's place. */
export const WithAnAlternative: Story = {
  name: 'With an alternative',
  args: {
    title: 'Delete?',
    confirmLabel: 'Delete',
    children: 'It goes from every list for everyone, and cannot be brought back.',
    alternative: ARCHIVE_INSTEAD,
  },
}

/** Delete pressed and still running: all three answers wait, the safer one too. */
export const AlternativeWaits: Story = {
  name: 'Alternative waits while it deletes',
  args: { ...WithAnAlternative.args, onConfirm: () => new Promise<void>(() => {}) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Delete' }))
  },
}
