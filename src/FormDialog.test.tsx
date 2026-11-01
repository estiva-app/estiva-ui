// @vitest-environment jsdom
/**
 * A dialog that sends a form: what Peek's Archive, New folder, Move and Start
 * a topic each wired by hand (C10, 2 November), pinned once.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { FormDialog, type FormDialogProps } from './FormDialog'
import { Field } from './Field'
import { TextInput } from './TextInput'

afterEach(cleanup)

function Fixture(props: Partial<FormDialogProps>) {
  const [name, setName] = useState('')
  return (
    <FormDialog title="New folder" submitLabel="Create" busyLabel="Creating…" ready={!!name.trim()} onSubmit={() => {}} onClose={() => {}} {...props}>
      <p>A place for files and conversations.</p>
      <Field label="Folder name">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
    </FormDialog>
  )
}

const pending = () => {
  let release: (value: boolean | void) => void = () => {}
  const promise = new Promise<boolean | void>((resolve) => {
    release = resolve
  })
  return { promise, release: (value?: boolean) => release(value) }
}

describe('FormDialog', () => {
  it('is a dialog named by its title, holding a form, with Cancel and the button that sends it', () => {
    render(<Fixture />)
    const dialog = screen.getByRole('dialog', { name: 'New folder' })
    expect(dialog.querySelector('form')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    const send = screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement
    expect(send.type).toBe('submit')
    expect(send.getAttribute('form')).toBe(dialog.querySelector('form')!.id)
  })

  it('sends from its button and from Enter in a field, once there is enough to send', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => false)
    render(<Fixture onSubmit={onSubmit} />)
    const send = screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    await user.keyboard('{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Folder name' }), 'Steer{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(send.disabled).toBe(false)
    await user.click(send)
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('sends nothing while not ready, not even on Ctrl+Enter', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Fixture ready={false} onSubmit={onSubmit} />)
    await user.type(screen.getByRole('textbox', { name: 'Folder name' }), 'Steer{Control>}{Enter}{/Control}')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('while it sends: the button says so, both buttons wait, and the fields are off', async () => {
    const user = userEvent.setup()
    const sending = pending()
    render(<Fixture onSubmit={() => sending.promise} />)
    await user.type(screen.getByRole('textbox', { name: 'Folder name' }), 'Steer')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const send = screen.getByRole('button', { name: 'Creating…' }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    // Cancel too: nothing can stop a send under way, so a Cancel then would say what is not so.
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('textbox', { name: 'Folder name' }) as HTMLInputElement).disabled).toBe(true)
    sending.release(false)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy())
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps its words on the button while it sends when it has no busy words', async () => {
    const user = userEvent.setup()
    render(<Fixture busyLabel={undefined} submitLabel="Archive topic" ready onSubmit={() => pending().promise} />)
    await user.click(screen.getByRole('button', { name: 'Archive topic' }))
    expect((screen.getByRole('button', { name: 'Archive topic' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('closes when the send went through, and stays open when it was refused', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { unmount } = render(<Fixture ready onSubmit={async () => false} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement).disabled).toBe(false))
    expect(onClose).not.toHaveBeenCalled()
    unmount()
    for (const answer of [true, undefined]) {
      const closed = vi.fn()
      const { unmount: done } = render(<Fixture ready onSubmit={async () => answer} onClose={closed} />)
      await user.click(screen.getByRole('button', { name: 'Create' }))
      await waitFor(() => expect(closed).toHaveBeenCalledOnce())
      done()
    }
  })

  it('a send that throws is a refusal: it stays open, and the buttons come back', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Fixture
        ready
        onSubmit={async () => {
          throw new Error('down')
        }}
        onClose={onClose}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement).disabled).toBe(false))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('sends once, however often it is asked while it sends', async () => {
    const user = userEvent.setup()
    const sending = pending()
    const onSubmit = vi.fn(() => sending.promise)
    render(<Fixture onSubmit={onSubmit} />)
    const field = screen.getByRole('textbox', { name: 'Folder name' })
    await user.type(field, 'Steer')
    await user.keyboard('{Control>}{Enter}{Enter}{/Control}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    sending.release(true)
  })

  it('Cancel closes without sending', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(<Fixture ready onSubmit={onSubmit} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('the send button is primary, or the kit’s Resolve look', () => {
    const { unmount } = render(<Fixture ready />)
    expect(screen.getByRole('button', { name: 'Create' }).className).toContain('bg-accent-primary')
    unmount()
    render(<Fixture ready submitLabel="Resolve" submitVariant="resolve" />)
    const resolve = screen.getByRole('button', { name: 'Resolve' })
    expect(resolve.className).not.toContain('bg-accent-primary')
    expect(resolve.className).toContain('hover:bg-success-muted')
  })
})
