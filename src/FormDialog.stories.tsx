import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { EmptyState } from './EmptyState'
import { Field } from './Field'
import { FormDialog } from './FormDialog'
import { TextInput } from './TextInput'

/** A dialog that sends a form: the words, the fields, Cancel and the button that sends it. */
const meta = {
  title: 'Menus & windows/FormDialog',
  component: FormDialog,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body: an iframe on the Docs page, so it stays in its frame.
    docs: { story: { inline: false, height: '400px' } },
  },
  argTypes: { children: { control: false }, onSubmit: { control: false }, onClose: { control: false } },
  args: {
    title: 'New team',
    submitLabel: 'Create',
    busyLabel: 'Creating…',
    onSubmit: () => {},
    onClose: () => {},
    children: null,
  },
} satisfies Meta<typeof FormDialog>

export default meta
type Story = StoryObj<typeof meta>

/** One field and the sentence before it. Create waits for a name; Enter in the field sends. */
export const NewFolder: Story = {
  name: 'New team',
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [name, setName] = useState('')
    return (
      <FormDialog {...args} ready={!!name.trim()}>
        <p className="text-body-2 text-text-secondary">A place for files and conversations. Everyone you add to it can read what is in it.</p>
        <Field label="Team name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="What is it for?" autoFocus />
        </Field>
      </FormDialog>
    )
  },
}

/** Sending: the button says so, and the field and both buttons wait for the answer. */
export const Sending: Story = {
  parameters: { controls: { disable: true } },
  args: { onSubmit: () => new Promise<void>(() => {}) },
  render: NewFolder.render,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.type(page.getByRole('textbox', { name: 'Team name' }), 'Steer')
    await userEvent.click(page.getByRole('button', { name: 'Create' }))
  },
}

/** Refused: the answer was `false`, so it stays open with what was typed, and the caller says why. */
export const Refused: Story = {
  parameters: { controls: { disable: true } },
  args: { onSubmit: () => false },
  render: NewFolder.render,
  play: Sending.play,
}

/** Nothing to choose from: a section's empty line where the fields would be, and the button greyed. */
export const NothingToChoose: Story = {
  name: 'Nothing to choose',
  args: { title: 'Move', submitLabel: 'Move', busyLabel: 'Moving…', ready: false, children: <EmptyState scope="section" message="There is no other team it can be moved to." /> },
}

/** A Resolve: the kit's `resolve` look on the sending button, as `ResolveDialog` draws it. */
export const ResolveLook: Story = {
  name: 'Resolve look',
  parameters: { controls: { disable: true } },
  args: { title: 'Resolve', submitLabel: 'Resolve', busyLabel: undefined, submitVariant: 'resolve' },
  render: (args) => {
    const [note, setNote] = useState('')
    return (
      <FormDialog {...args}>
        <Field label="Resolution message (optional)">
          <TextInput value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </FormDialog>
    )
  },
}
