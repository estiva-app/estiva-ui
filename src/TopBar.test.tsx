// @vitest-environment jsdom
/**
 * The bar's own search field, pinned: given `onSearch` it draws a button with
 * the words and the shortcut, a click and Ctrl+K or Cmd+K anywhere call it,
 * a `search` of the caller's own still takes the centre, and without either
 * the bar draws nothing there and leaves the keys alone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { TopBar } from './TopBar'

afterEach(cleanup)

const press = (init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  window.dispatchEvent(event)
  return event
}

describe('TopBar search', () => {
  it('draws a search field that opens the search', async () => {
    const onSearch = vi.fn()
    render(<TopBar onSearch={onSearch} searchPlaceholder="Search Peek..." />)
    const field = screen.getByRole('button', { name: /Search Peek\.\.\./ })
    expect(field.textContent).toMatch(/Ctrl\+K|Cmd\+K/)
    await userEvent.click(field)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('says "Search…" when given no words', () => {
    render(<TopBar onSearch={() => {}} />)
    expect(screen.getByRole('button', { name: /Search…/ })).toBeTruthy()
  })

  it.each([
    ['Ctrl+K', { ctrlKey: true, key: 'k' }],
    ['Cmd+K', { metaKey: true, key: 'k' }],
    ['Ctrl+Shift+K', { ctrlKey: true, shiftKey: true, key: 'K' }],
  ])('opens the search on %s anywhere', (_name, init) => {
    const onSearch = vi.fn()
    render(<TopBar onSearch={onSearch} />)
    const event = press(init)
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('calls the latest handler', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<TopBar onSearch={first} />)
    rerender(<TopBar onSearch={second} />)
    press({ ctrlKey: true, key: 'k' })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('leaves K alone without a modifier, and the keys alone without onSearch', () => {
    const onSearch = vi.fn()
    const { unmount } = render(<TopBar onSearch={onSearch} />)
    press({ key: 'k' })
    expect(onSearch).not.toHaveBeenCalled()
    unmount()
    render(<TopBar />)
    expect(press({ ctrlKey: true, key: 'k' }).defaultPrevented).toBe(false)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('stops listening once it is gone', () => {
    const onSearch = vi.fn()
    const { unmount } = render(<TopBar onSearch={onSearch} />)
    unmount()
    press({ ctrlKey: true, key: 'k' })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it("draws the caller's own centre instead, and still answers the keys", () => {
    const onSearch = vi.fn()
    render(<TopBar onSearch={onSearch} search={<span>own</span>} />)
    expect(screen.getByText('own')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    press({ ctrlKey: true, key: 'k' })
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('reaches the bar through AppShell', async () => {
    const onSearch = vi.fn()
    render(
      <AppShell variant="floating" nav={<nav />} onSearch={onSearch} searchPlaceholder="Search Peek...">
        <p>page</p>
      </AppShell>,
    )
    await userEvent.click(screen.getByRole('button', { name: /Search Peek\.\.\./ }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })
})
