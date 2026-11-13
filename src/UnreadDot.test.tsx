// @vitest-environment jsdom
/** What the page claims: the dot is marked for tests and photo runs, `data-unread` and its `data-tone`. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { UnreadDot } from './UnreadDot'

afterEach(cleanup)

const slotOf = (container: HTMLElement) => container.firstElementChild as HTMLElement

describe('UnreadDot', () => {
  it('is marked data-unread, and blue by default: data-tone="blue"', () => {
    const slot = slotOf(render(<UnreadDot />).container)
    expect(slot.hasAttribute('data-unread')).toBe(true)
    expect(slot.getAttribute('data-tone')).toBe('blue')
  })

  it('a reaction is still unread, and says so in data-tone="reaction"', () => {
    const slot = slotOf(render(<UnreadDot tone="reaction" />).container)
    expect(slot.hasAttribute('data-unread')).toBe(true)
    expect(slot.getAttribute('data-tone')).toBe('reaction')
  })

  it('a quiet dot, with nothing new, is not marked data-unread nor given a tone, so nothing reads it as unread', () => {
    const slot = slotOf(render(<UnreadDot quiet tone="reaction" />).container)
    expect(slot.hasAttribute('data-unread')).toBe(false)
    expect(slot.hasAttribute('data-tone')).toBe(false)
  })
})
