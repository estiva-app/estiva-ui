// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useShortcut } from './shortcuts'

afterEach(cleanup)

const press = (init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  window.dispatchEvent(event)
  return event
}

describe('useShortcut', () => {
  it.each([
    ['Ctrl+O', { ctrlKey: true, key: 'o' }],
    ['Cmd+O', { metaKey: true, key: 'o' }],
    ['Ctrl+O with Caps Lock', { ctrlKey: true, key: 'O' }],
  ])('runs on %s and keeps the browser from opening a file', (_name, init) => {
    const onPress = vi.fn()
    renderHook(() => useShortcut('Mod-O', onPress))
    const event = press(init)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it.each([
    ['O alone', { key: 'o' }],
    ['Ctrl+P', { ctrlKey: true, key: 'p' }],
  ])('leaves %s to the page', (_name, init) => {
    const onPress = vi.fn()
    renderHook(() => useShortcut('Mod-O', onPress))
    expect(press(init).defaultPrevented).toBe(false)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('needs the Shift it names, and leaves one it does not name to the browser', () => {
    const named = vi.fn()
    const plain = vi.fn()
    renderHook(() => useShortcut('Mod-Shift-O', named))
    renderHook(() => useShortcut('Mod-O', plain))
    press({ ctrlKey: true, key: 'o' })
    expect(named).not.toHaveBeenCalled()
    expect(plain).toHaveBeenCalledTimes(1)
    press({ ctrlKey: true, shiftKey: true, key: 'O' })
    expect(named).toHaveBeenCalledTimes(1)
    expect(plain).toHaveBeenCalledTimes(1)
  })

  it('runs once for a held key, not for each repeat', () => {
    const onPress = vi.fn()
    renderHook(() => useShortcut('Mod-O', onPress))
    press({ ctrlKey: true, key: 'o' })
    press({ ctrlKey: true, key: 'o', repeat: true })
    press({ ctrlKey: true, key: 'o', repeat: true })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('leaves a press something on the page already took', () => {
    const onPress = vi.fn()
    renderHook(() => useShortcut('Mod-O', onPress))
    const taken = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'o' })
    taken.preventDefault()
    window.dispatchEvent(taken)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('takes a minus as the key', () => {
    const onPress = vi.fn()
    renderHook(() => useShortcut('Mod--', onPress))
    press({ ctrlKey: true, key: '-' })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does nothing, and leaves the key to the browser, while off', () => {
    const onPress = vi.fn()
    renderHook(() => useShortcut('Mod-O', onPress, false))
    expect(press({ ctrlKey: true, key: 'o' }).defaultPrevented).toBe(false)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('stops listening once its caller leaves the screen', () => {
    const onPress = vi.fn()
    const { unmount } = renderHook(() => useShortcut('Mod-O', onPress))
    unmount()
    expect(press({ ctrlKey: true, key: 'o' }).defaultPrevented).toBe(false)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('runs the latest handler', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ run }) => useShortcut('Mod-O', run), { initialProps: { run: first } })
    rerender({ run: second })
    press({ ctrlKey: true, key: 'o' })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
