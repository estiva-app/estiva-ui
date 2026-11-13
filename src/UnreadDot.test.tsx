// @vitest-environment jsdom
/** What the page claims: the 6px disc in a 24px slot, marked for tests and photo runs. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { UnreadDot } from './UnreadDot'

afterEach(cleanup)

describe('UnreadDot', () => {
  it('is a 24px slot holding a 6px disc, marked data-unread', () => {
    const { container } = render(<UnreadDot />)
    const slot = container.firstElementChild as HTMLElement
    expect(slot.hasAttribute('data-unread')).toBe(true)
    expect(slot.className).toContain('w-6')
    expect((slot.firstElementChild as HTMLElement).className).toContain('w-1.5')
  })

  it('blue by default: the accent fill, and no data-tone', () => {
    const { container } = render(<UnreadDot />)
    const slot = container.firstElementChild as HTMLElement
    expect(slot.hasAttribute('data-tone')).toBe(false)
    expect((slot.firstElementChild as HTMLElement).className).toContain('bg-accent-primary')
  })

  it('an orange dot is still unread, marked data-tone="orange", and filled in the warning colour, not the accent', () => {
    const { container } = render(<UnreadDot tone="orange" />)
    const slot = container.firstElementChild as HTMLElement
    expect(slot.hasAttribute('data-unread')).toBe(true)
    expect(slot.getAttribute('data-tone')).toBe('orange')
    const disc = (slot.firstElementChild as HTMLElement).className
    expect(disc).toContain('bg-warning-default')
    expect(disc).not.toContain('bg-accent-primary')
  })

  it('a quiet dot, with nothing new, is not marked data-unread, so nothing reads it as unread', () => {
    const { container } = render(<UnreadDot quiet />)
    expect((container.firstElementChild as HTMLElement).hasAttribute('data-unread')).toBe(false)
  })
})
