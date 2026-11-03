// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResolveDialog } from './ResolveDialog'

afterEach(cleanup)

describe('ResolveDialog', () => {
  it('resolves with the note written', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<ResolveDialog onResolve={onResolve} onCancel={() => {}} />)
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByRole('textbox'), 'Going with the first one')
    await user.click(within(dialog).getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledWith('Going with the first one')
  })

  it('resolves with no note: the note is optional', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<ResolveDialog onResolve={onResolve} onCancel={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledWith('')
  })

  it('resolves with Ctrl+Enter from the note, where Enter is a new line', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<ResolveDialog onResolve={onResolve} onCancel={() => {}} />)
    const note = screen.getByRole('textbox')
    await user.type(note, 'First line{Enter}second')
    expect(onResolve).not.toHaveBeenCalled()
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onResolve).toHaveBeenCalledWith('First line\nsecond')
  })

  it('Cancel resolves nothing', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    const onCancel = vi.fn()
    render(<ResolveDialog onResolve={onResolve} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onResolve).not.toHaveBeenCalled()
  })

  it('Cancel waits while it resolves, as in every form dialog', async () => {
    const user = userEvent.setup()
    render(<ResolveDialog onResolve={() => new Promise<void>(() => {})} onCancel={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Resolve' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('closes itself once a resolve is not refused, and stays when it is', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const { unmount } = render(<ResolveDialog onResolve={async () => false} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    await vi.waitFor(() => expect((screen.getByRole('button', { name: 'Resolve' }) as HTMLButtonElement).disabled).toBe(false))
    expect(onCancel).not.toHaveBeenCalled()
    unmount()
    render(<ResolveDialog onResolve={async () => true} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalledOnce())
  })

  it('says why the last resolve was refused, under the note', () => {
    render(<ResolveDialog onResolve={() => false} onCancel={() => {}} refused="The file is archived" />)
    expect(screen.getByText(/The file is archived/)).toBeTruthy()
  })

  // Found in Leaf's adoption (3 November): the refusal marked the note invalid, and the form then sent nothing.
  it('after a refusal, Resolve tries again, with the note as written', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn(() => false)
    render(<ResolveDialog onResolve={onResolve} onCancel={() => {}} refused="The relay is busy. Try again." />)
    await user.type(screen.getByRole('textbox'), 'Done')
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    await vi.waitFor(() => expect(onResolve).toHaveBeenCalledWith('Done'))
    expect(screen.getByRole('alert').textContent).toBe('The relay is busy. Try again.')
  })
})
