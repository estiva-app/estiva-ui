// @vitest-environment jsdom
/**
 * What the Toast page claims, pinned: three at once with the newest nearest
 * the corner, an announced region, the action closing its own toast, the
 * timers, and the keys.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast, type ToastOptions } from './Toast'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

type Api = ReturnType<typeof useToast>
let api: Api
function Grab() {
  api = useToast()
  return null
}

const mount = () => render(<ToastProvider><Grab /></ToastProvider>)
const show = (opts: ToastOptions) => {
  let id = ''
  act(() => {
    id = api.showToast(opts)
  })
  return id
}
const region = () => screen.getByRole('region', { name: 'Notifications' })
/** The toasts a reader can see: Base UI keeps a limited one in the DOM, hidden. */
const visible = () =>
  within(region())
    .queryAllByRole('dialog')
    .filter((el) => !el.hasAttribute('data-limited'))
    .map((el) => el.textContent)

describe('ToastProvider', () => {
  it('draws the toast in a region a screen reader announces', () => {
    mount()
    show({ label: 'Changes saved' })
    expect(region().getAttribute('aria-live')).toBe('polite')
    expect(within(region()).getByRole('dialog', { name: 'Changes saved' })).toBeTruthy()
  })

  it('a failure is announced at once', () => {
    mount()
    show({ label: 'That did not go through', type: 'error' })
    expect(screen.getByRole('alert').textContent).toContain('That did not go through')
  })

  it('shows three at once, and a fourth hides the oldest until there is room (D7)', () => {
    mount()
    const first = show({ label: 'One', durationMs: 0 })
    show({ label: 'Two', durationMs: 0 })
    show({ label: 'Three', durationMs: 0 })
    expect(visible()).toEqual(['Three', 'Two', 'One'])
    const fourth = show({ label: 'Four', durationMs: 0 })
    expect(visible()).toEqual(['Four', 'Three', 'Two'])
    const oldest = within(region()).getByRole('dialog', { name: 'One', hidden: true })
    expect(oldest.hasAttribute('data-limited')).toBe(true)
    expect(oldest.className).toContain('data-[limited]:hidden')
    act(() => api.dismissToast(fourth))
    expect(visible()).toEqual(['Three', 'Two', 'One'])
    act(() => api.dismissToast(first))
    expect(visible()).toEqual(['Three', 'Two'])
  })

  it('the newest stands nearest the corner: first in the list, and the stack is reversed', () => {
    mount()
    show({ label: 'Older' })
    show({ label: 'Newer' })
    expect(visible()).toEqual(['Newer', 'Older'])
    expect(region().className).toContain('flex-col-reverse')
    expect(region().className).toContain('bottom-4')
    expect(region().className).toContain('left-4')
  })

  it('the action runs onAction and closes its own toast, and no other', async () => {
    mount()
    const onAction = vi.fn()
    show({ label: 'Standing', durationMs: 0 })
    show({ label: 'Item removed', actionLabel: 'Undo', onAction, durationMs: 0 })
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(visible()).toEqual(['Standing'])
  })

  it('an action with a label and no handler is a Dismiss', async () => {
    mount()
    show({ label: 'Something needs knowing', type: 'warning', durationMs: 0, actionLabel: 'Dismiss' })
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(visible()).toEqual([])
  })

  it('closes after 5 seconds by default; durationMs: 0 stays up', () => {
    vi.useFakeTimers()
    mount()
    show({ label: 'Fades' })
    show({ label: 'Stays', durationMs: 0 })
    act(() => vi.advanceTimersByTime(4999))
    expect(visible()).toEqual(['Stays', 'Fades'])
    act(() => vi.advanceTimersByTime(1))
    expect(visible()).toEqual(['Stays'])
  })

  it('dismissToast with an id closes that toast; with none, every toast', () => {
    mount()
    const a = show({ label: 'A', durationMs: 0 })
    show({ label: 'B', durationMs: 0 })
    act(() => api.dismissToast(a))
    expect(visible()).toEqual(['B'])
    show({ label: 'C', durationMs: 0 })
    act(() => api.dismissToast())
    expect(visible()).toEqual([])
  })

  it('F6 moves focus into the toasts; Escape closes the focused one', async () => {
    mount()
    show({ label: 'Changes saved', durationMs: 0 })
    await userEvent.keyboard('{F6}')
    expect(region().contains(document.activeElement)).toBe(true)
    await userEvent.tab()
    const toast = screen.getByRole('dialog', { name: 'Changes saved' })
    expect(document.activeElement).toBe(toast)
    await userEvent.keyboard('{Escape}')
    expect(visible()).toEqual([])
  })

  it('useToast outside a provider throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Grab />)).toThrow('useToast must be used within ToastProvider')
    spy.mockRestore()
  })
})
