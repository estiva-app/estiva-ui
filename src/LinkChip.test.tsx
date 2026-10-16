// @vitest-environment jsdom
/**
 * What the LinkChip and LinkPreview pages claim, pinned: what each state says,
 * where the chip leads, and that a screen that cannot hover gets no preview.
 */
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkChip } from './LinkChip'
import { ITEM, LOADING, ready, SAID, UNAVAILABLE } from './linked.examples'

/** A screen that can hover, or one that cannot (a phone, a tablet). */
function screenThatCanHover(canHover: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(hover: hover)' ? canHover : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** Rest the pointer on the chip past the preview's delay. */
async function hoverChip(name: RegExp) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.hover(screen.getByRole('link', { name }))
  await act(async () => {
    vi.advanceTimersByTime(1000)
  })
}

describe('LinkChip', () => {
  it('leads to what it links, with its key and title', () => {
    render(<LinkChip link={ready(ITEM)} preview={false} />)
    const link = screen.getByRole('link', { name: /ABC-2/ })
    expect(link.getAttribute('href')).toBe('#item')
    expect(link.textContent).toContain(ITEM.title)
  })

  it('says a person’s words after their name', () => {
    render(<LinkChip link={ready(SAID)} preview={false} />)
    expect(screen.getByRole('link').textContent).toContain(`Person one: ${SAID.body}`)
  })

  it('while it loads, is busy and leads nowhere yet', () => {
    const { container } = render(<LinkChip link={LOADING} />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('says “not available” in words, and leads nowhere', () => {
    render(<LinkChip link={UNAVAILABLE} />)
    expect(screen.getByText('Item, not available')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('shows its card, read only, when the pointer rests on it', async () => {
    screenThatCanHover(true)
    render(<LinkChip link={ready(ITEM)} />)
    await hoverChip(/ABC-2/)
    expect(screen.getByText(ITEM.summary!)).toBeTruthy()
    // Read only: the values are words, never pickers, though this reader may change them.
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText('Person one')).toBeTruthy()
  })

  it('shows no card on a screen that cannot hover, where a tap opens it', async () => {
    screenThatCanHover(false)
    render(<LinkChip link={ready(ITEM)} />)
    await hoverChip(/ABC-2/)
    expect(screen.queryByText(ITEM.summary!)).toBeNull()
    expect(screen.getByRole('link', { name: /ABC-2/ }).getAttribute('href')).toBe('#item')
  })
})
