// @vitest-environment jsdom
/**
 * What the ConfirmDialog page claims, pinned.
 *
 * It had no test file. Its page makes four behavioural claims — the button's
 * variant follows `destructive`, the buttons wait while the action runs, a
 * refusal keeps the dialog open, and a backdrop press no longer closes it
 * (D20) — and none of them was held by anything.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

afterEach(cleanup)

const Fixture = (props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => (
  <ConfirmDialog title="Delete this?" confirmLabel="Delete" onConfirm={() => {}} onClose={() => {}} {...props}>
    This cannot be undone.
  </ConfirmDialog>
)

describe('ConfirmDialog', () => {
  it('is an alert dialog, named by its title', async () => {
    render(<Fixture />)
    expect(await screen.findByRole('alertdialog', { name: /Delete this\?/ })).toBeTruthy()
  })

  /** D20, Katerina 2026-09-07: a destructive question is answered, not clicked
   *  away. Escape and the ✕ still cancel. */
  it('does not close on a press outside', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} />)
    const dialog = await screen.findByRole('alertdialog')
    await user.click(dialog.ownerDocument.body)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} />)
    await screen.findByRole('alertdialog')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on the ✕, which is the dialog’s own Close part', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} />)
    await user.click(await screen.findByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Cancel closes without confirming', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(<Fixture onClose={onClose} onConfirm={onConfirm} />)
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('confirming runs the action and then closes', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(<Fixture onClose={onClose} onConfirm={onConfirm} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  /** An action that resolves `false` has already said why, through the
   *  caller's banner — so the dialog stays, with the question still on it. */
  it('a refused action keeps it open', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} onConfirm={() => false} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeTruthy()
  })

  it('an action that resolves nothing still closes', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} onConfirm={async () => {}} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  /** While it runs, neither answer can be given again. */
  it('the buttons wait while the action runs', async () => {
    const user = userEvent.setup()
    let release: (value: boolean) => void = () => {}
    const onConfirm = vi.fn(() => new Promise<boolean>((resolve) => { release = resolve }))
    render(<Fixture onConfirm={onConfirm} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    // Plainly disabled, not `aria-disabled`: neither answer carries a reason
    // to give, so the controls are out of reach rather than focusable.
    expect((screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
    release(true)
  })
})
