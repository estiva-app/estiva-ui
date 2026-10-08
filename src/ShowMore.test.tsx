// @vitest-environment jsdom
/**
 * The page's claims: content taller than the limit is cut with "Show more",
 * which opens it and says so; content that fits has no button at all.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
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

  it('opens when focus arrives inside the cut content', async () => {
    contentHeight(300)
    render(<ShowMore maxHeight={96}><input aria-label="Field" /></ShowMore>)
    await userEvent.click(screen.getByRole('textbox', { name: 'Field' }))
    expect(screen.getByRole('button', { name: 'Show less' })).toBeTruthy()
  })

  it('draws content that fits whole, with no button', () => {
    contentHeight(40)
    render(<ShowMore maxHeight={96}><p>Short</p></ShowMore>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Short').parentElement!.style.maxHeight).toBe('')
  })

  it('puts an action level with the toggle, at the right of its row', () => {
    contentHeight(300)
    render(<ShowMore maxHeight={96} action={<Button>Open</Button>}><p>Long</p></ShowMore>)
    const row = screen.getByRole('button', { name: 'Show more' }).parentElement!
    expect(row.contains(screen.getByRole('button', { name: 'Open' }))).toBe(true)
    expect(row.className).toMatch(/justify-between/)
  })

  it('keeps the action when the content fits, with no toggle', () => {
    contentHeight(40)
    render(<ShowMore maxHeight={96} action={<Button>Open</Button>}><p>Short</p></ShowMore>)
    expect(screen.queryByRole('button', { name: /Show/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy()
  })
})
