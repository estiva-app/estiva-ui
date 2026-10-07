// @vitest-environment jsdom
/**
 * The page's claims: content taller than the limit is cut with "Show more",
 * which opens it and says so; content that fits has no button at all.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShowMore } from './ShowMore'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** jsdom lays nothing out: every box says it is this tall. */
const contentHeight = (px: number) => vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(px)

describe('ShowMore', () => {
  it('cuts content taller than the limit, and opens it', async () => {
    contentHeight(300)
    render(<ShowMore maxHeight={96}><p>Long</p></ShowMore>)
    const button = screen.getByRole('button', { name: 'Show more' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Long').parentElement!.style.maxHeight).toBe('96px')
    await userEvent.click(button)
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Long').parentElement!.style.maxHeight).toBe('')
  })

  it('draws content that fits whole, with no button', () => {
    contentHeight(40)
    render(<ShowMore maxHeight={96}><p>Short</p></ShowMore>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Short').parentElement!.style.maxHeight).toBe('')
  })
})
