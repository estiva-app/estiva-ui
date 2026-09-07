// @vitest-environment jsdom
/**
 * The buttons carry a ref, and a Base UI part can therefore *be* one.
 *
 * `Button` and `IconButton` typed their props as `ButtonHTMLAttributes`, which
 * has no `ref`. React 19 hands `ref` to a function component as an ordinary
 * prop, so it was already riding in on the spread and reaching the element —
 * the type was the only thing stopping a caller. These tests pin both halves:
 * that the ref lands, and that composition through `render` works, which is
 * the shape all of stage 4 is built from (`Menu.Trigger`, `Dialog.Close`).
 */
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from '@base-ui/react/dialog'
import { IconSquareRounded } from '@tabler/icons-react'
import { Button } from './Button'
import { IconButton } from './IconButton'

afterEach(cleanup)

describe('the buttons take a ref', () => {
  it('Button: the ref is the button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Label</Button>)
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Label' }))
    expect(ref.current?.tagName).toBe('BUTTON')
  })

  it('IconButton: the ref is the button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <IconButton ref={ref} aria-label="Item">
        <IconSquareRounded size={16} stroke={1.5} />
      </IconButton>,
    )
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Item' }))
  })
})

describe('a Base UI part can be one of our buttons', () => {
  it('Dialog.Close renders as an IconButton and closes the dialog', async () => {
    // This is the loose end stage 3 left: `DialogShell`'s ✕ called `onClose`
    // by hand because `Close` as a render target needs exactly this.
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Dialog.Root open onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Popup aria-label="A dialog">
            <Dialog.Close
              render={
                <IconButton aria-label="Close">
                  <IconSquareRounded size={16} stroke={1.5} />
                </IconButton>
              }
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    )
    const close = screen.getByRole('button', { name: 'Close' })
    // Still our button: the class list survives composition.
    expect(close.className).toContain('rounded-lg')
    await user.click(close)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange.mock.calls[0][0]).toBe(false)
    // Base UI says *why* it closed, which is what a hand-wired onClick cannot.
    expect((onOpenChange.mock.calls[0][1] as { reason?: string })?.reason).toBe('close-press')
  })

  it('Dialog.Close renders as an IconButton THAT CARRIES A TOOLTIP', async () => {
    /*
     * The half stage 3 could not close. With the hand-written tooltip an
     * IconButton with a `tooltip` returned `WithTooltip`'s wrapper `<div>` as
     * its root, so `Close` composed onto the wrapper and the ✕ was never the
     * part. On Base UI's Tooltip the trigger IS the button, so it is.
     */
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Dialog.Root open onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Popup aria-label="A dialog">
            <Dialog.Close
              render={
                <IconButton aria-label="Close" tooltip="Close">
                  <IconSquareRounded size={16} stroke={1.5} />
                </IconButton>
              }
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    )
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.tagName).toBe('BUTTON')
    expect(close.className).toContain('rounded-lg')
    await user.click(close)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect((onOpenChange.mock.calls[0][1] as { reason?: string })?.reason).toBe('close-press')
  })
  it('Dialog.Trigger renders as a Button and opens the dialog', async () => {
    const user = userEvent.setup()
    render(
      <Dialog.Root>
        <Dialog.Trigger render={<Button variant="primary">Open</Button>} />
        <Dialog.Portal>
          <Dialog.Popup aria-label="A dialog">Body</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect(trigger.className).toContain('bg-accent-primary')
    await user.click(trigger)
    expect(await screen.findByRole('dialog', { name: 'A dialog' })).toBeTruthy()
  })
})
