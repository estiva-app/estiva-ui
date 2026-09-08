// @vitest-environment jsdom
/**
 * What the PreviewCard page claims, pinned.
 *
 * Split out of `Popover.test.tsx` on 2026-09-08: the two arrived in one
 * commit and shared a file, and every other component in this package is
 * tested beside itself. Placement is Floating UI's and is measured in a
 * browser — jsdom lays nothing out — so what is here is the behaviour.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewCard } from './PreviewCard'

afterEach(cleanup)

describe('PreviewCard', () => {
  it('renders its trigger, and nothing of its content, until it opens', () => {
    render(
      <PreviewCard content={<span>The rest of it</span>}>
        <span>A row</span>
      </PreviewCard>,
    )
    expect(screen.getByText('A row')).toBeTruthy()
    // `content` is not rendered while closed, so a preview that fetches does
    // not fetch once per row on screen.
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('opens when the pointer rests on the trigger, and closes when it leaves', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard content={<span>The rest of it</span>} delay={0} closeDelay={0}>
        <span>A row</span>
      </PreviewCard>,
    )
    await user.hover(screen.getByText('A row'))
    expect(await screen.findByText('The rest of it')).toBeTruthy()
    await user.unhover(screen.getByText('A row'))
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  /*
   * Not here: "the pointer can move into the card, and it scrolls" — the one
   * claim that separates this from a tooltip.
   *
   * It cannot be tested in jsdom. No stylesheet is loaded there, so the
   * `pointer-events: none` Base UI puts on the positioner is never reset by
   * the popup's own class, and user-event refuses to move the pointer into
   * something it reads as untouchable. Measured in Chrome instead
   * (2026-09-08, the `Scrolling` story): the popup computes
   * `pointer-events: auto`, the card stays open when the pointer moves into
   * it, its 537px of content scrolls inside a 298px box — scrollTop 0 → 200
   * on a wheel — and it closes when the pointer leaves for good.
   */

  /** The page says so in its Keys table, and a card the pointer can enter is
   *  a layer, so it owes the exit every layer owes. */
  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard content={<span>The rest of it</span>} delay={0} closeDelay={0}>
        <span>A row</span>
      </PreviewCard>,
    )
    await user.hover(screen.getByText('A row'))
    await screen.findByText('The rest of it')
    await user.keyboard('{Escape}')
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('the trigger is the wrapper, and the row inside it is untouched', () => {
    const { container } = render(
      <PreviewCard content={<span>x</span>} wrapperClassName="block w-full">
        <div data-testid="row">A row</div>
      </PreviewCard>,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.tagName).toBe('SPAN')
    expect(wrapper.className).toContain('block')
    expect(wrapper.firstElementChild?.getAttribute('data-testid')).toBe('row')
  })
})
