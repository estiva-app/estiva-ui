// @vitest-environment jsdom
/**
 * What the pages claim after stage 3, pinned.
 *
 * `DialogShell.mdx` said, in as many words, that this component did not trap
 * focus. It does now, and a sentence that changed from "it does not" to "it
 * does" is exactly the kind that needs a test under it — otherwise the page is
 * the only thing holding the claim up.
 *
 * The one that is a *decision* rather than a capability is the last pair:
 * a plain dialog closes when you press outside it, and a `ConfirmDialog` does
 * not (Katerina, D20, 2026-09-07). Both are asserted, because the difference
 * is the whole reason `alert` exists.
 */
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { DialogShell } from './DialogShell'
import { TextInput } from './TextInput'

afterEach(cleanup)

const Shell = ({ onClose }: { onClose: () => void }) => (
  <DialogShell title="Rename topic" onClose={onClose} footer={<Button variant="primary">Save</Button>}>
    <TextInput aria-label="Name" defaultValue="" />
  </DialogShell>
)

describe('DialogShell', () => {
  it('is named by its header', () => {
    render(<Shell onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Rename topic' })).toBeTruthy()
  })

  it('is named by the title even when headerContent replaces the header text', () => {
    // The name used to be spelled with `aria-label` in both branches. Now the
    // header names it when the header is the title, so this is the branch that
    // still needs the label — and the one that would silently go unnamed.
    render(
      <DialogShell title="Members" onClose={() => {}} headerContent={<span>Back · Members · 4</span>}>
        <p>Body</p>
      </DialogShell>,
    )
    expect(screen.getByRole('dialog', { name: 'Members' })).toBeTruthy()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Shell onClose={onClose} />)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('closes on the close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Shell onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('traps focus, which this component could not do before', async () => {
    // Written expecting only that Tab could not reach the page behind the
    // card. Base UI does more than that, and the first version of this test
    // failed on it: the rest of the document is marked "inert" and
    // "aria-hidden", so the button behind is not findable by role at all.
    // Both halves are asserted, because the stronger one is what would go
    // unnoticed if it weakened.
    //
    // The dialog portals to the body, so `container` holds nothing but the
    // page behind it — which makes "focus never enters the page" one check.
    const user = userEvent.setup()
    const { container } = render(
      <>
        <button type="button">Behind the dialog</button>
        <Shell onClose={() => {}} />
      </>,
    )
    const behind = container.querySelector('button')!
    expect(behind.textContent).toBe('Behind the dialog')
    expect(screen.queryByRole('button', { name: 'Behind the dialog' })).toBeNull()

    // Three controls in the card, so five tabs walk past the end of them.
    for (let i = 0; i < 5; i++) {
      await user.tab()
      expect(container.contains(document.activeElement)).toBe(false)
    }
  })

  it('focuses the card, not the ✕', async () => {
    // Base UI's default is the first tabbable element, which here is the close
    // button — so every dialog opened with a ring on its ✕. The screenshot
    // diff caught it as a 28px square, and this is the guard so it cannot come
    // back quietly.
    render(<Shell onClose={() => {}} />)
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })
  })

  it('still lets a field with autoFocus take it', async () => {
    // The two dialogs in Ship rely on this, and pinning the card as the initial
    // focus is exactly the change that could have broken it.
    render(
      <DialogShell title="Rename topic" onClose={() => {}}>
        <TextInput aria-label="Name" autoFocus defaultValue="" />
      </DialogShell>,
    )
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })
  })

  it('returns focus to whatever opened it', async () => {
    const user = userEvent.setup()
    function Opener() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {open && (
            <DialogShell title="Rename topic" onClose={() => setOpen(false)}>
              Body
            </DialogShell>
          )}
        </>
      )
    }
    render(<Opener />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await user.click(opener)
    await screen.findByRole('dialog', { name: 'Rename topic' })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it('closes when you press outside it', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Shell onClose={onClose} />)
    await user.click(document.querySelector('.bg-scrim') as HTMLElement)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

describe('ConfirmDialog', () => {
  const Confirm = ({ onClose }: { onClose: () => void }) => (
    <ConfirmDialog title="Delete project?" confirmLabel="Delete" destructive onConfirm={() => true} onClose={onClose}>
      This cannot be undone.
    </ConfirmDialog>
  )

  it('does NOT close when you press outside it (D20)', async () => {
    // The difference from the dialog above, and the reason `alert` exists: a
    // destructive question is answered, not clicked away.
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Confirm onClose={onClose} />)
    await user.click(document.querySelector('.bg-scrim') as HTMLElement)
    // Give the close a chance to happen before asserting that it did not.
    await new Promise((r) => setTimeout(r, 50))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Delete project?' })).toBeTruthy()
  })

  it('still closes on Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Confirm onClose={onClose} />)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('announces itself as an alert rather than a plain dialog', () => {
    render(<Confirm onClose={() => {}} />)
    expect(screen.getByRole('alertdialog')).toBeTruthy()
  })
})
