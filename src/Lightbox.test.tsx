// @vitest-environment jsdom
/**
 * What the Lightbox page claims, pinned: it floats over the page on its own
 * scrim, it names itself, Escape closes it, a press on the scrim closes it and
 * a press on the picture does not, and the close button closes it.
 *
 * The behaviours the two hand-built viewers never had are Base UI's, so what
 * is tested here is that this part is wired to them — not Base UI itself.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Lightbox } from './Lightbox'

afterEach(cleanup)

const PICTURE = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E'

describe('Lightbox', () => {
  it('floats over the page: it portals out of its parent, and carries the strong scrim', () => {
    const { container } = render(<Lightbox src={PICTURE} alt="checkout-flow.png" onClose={() => {}} />)
    // Nothing is left where it was written.
    expect(container.firstElementChild).toBeNull()
    const picture = screen.getByAltText('checkout-flow.png')
    expect(document.body.contains(picture)).toBe(true)
    expect(document.querySelector('.bg-scrim-strong')).toBeTruthy()
  })

  it('names itself with the picture, so a reader is told what opened', () => {
    render(<Lightbox src={PICTURE} alt="signup-screen.png" onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'signup-screen.png' })).toBeTruthy()
  })

  it('Escape closes it', async () => {
    const onClose = vi.fn()
    render(<Lightbox src={PICTURE} alt="a.png" onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('the close button closes it', async () => {
    const onClose = vi.fn()
    render(<Lightbox src={PICTURE} alt="a.png" onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('a press on the scrim closes it; a press on the picture does not', async () => {
    const onClose = vi.fn()
    render(<Lightbox src={PICTURE} alt="a.png" onClose={onClose} />)

    await userEvent.click(screen.getByAltText('a.png'))
    expect(onClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('swapping the picture swaps what is on screen — a thumbnail, then the original', () => {
    const { rerender } = render(<Lightbox src={PICTURE} alt="a.png" onClose={() => {}} />)
    expect(screen.getByAltText('a.png').getAttribute('src')).toBe(PICTURE)
    rerender(<Lightbox src="blob:original" alt="a.png" onClose={() => {}} />)
    expect(screen.getByAltText('a.png').getAttribute('src')).toBe('blob:original')
  })
})
