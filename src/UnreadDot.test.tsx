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
})
