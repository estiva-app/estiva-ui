// @vitest-environment jsdom
/**
 * What the PreviewCard page claims, pinned.
 *
 * Split out of `Popover.test.tsx` on 2026-09-08: the two arrived in one
 * commit and shared a file, and every other component in this package is
 * tested beside itself. Placement is Floating UI's and is measured in a
 * browser — jsdom lays nothing out — so what is here is the behaviour.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewCard } from './PreviewCard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

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

  it('onOpenChange hears a hover open once and the close once, not on each render while it is open', () => {
    vi.useFakeTimers()
    const heard: boolean[] = []
    const { rerender } = render(
      <PreviewCard content={<span>The rest of it</span>} onOpenChange={(open) => heard.push(open)}>
        <span>A row</span>
      </PreviewCard>,
    )
    // The trigger is the wrapper, and Base UI listens there for the mouse arriving and leaving. Fired by hand, because
    // user-event waits on a clock this test fakes.
    const trigger = screen.getByText('A row').parentElement as HTMLElement
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.mouseEnter(trigger)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByText('The rest of it')).toBeTruthy()
    rerender(
      <PreviewCard content={<span>The rest of it, again</span>} onOpenChange={(open) => heard.push(open)}>
        <span>A row</span>
      </PreviewCard>,
    )
    expect(heard).toEqual([true])
    fireEvent.mouseLeave(trigger)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByText('The rest of it, again')).toBeNull()
    expect(heard).toEqual([true, false])
  })

  it('onOpenChange hears a card opened by keyboard focus on what the trigger holds', () => {
    vi.useFakeTimers()
    const heard: boolean[] = []
    render(
      <PreviewCard content={<span>The rest of it</span>} onOpenChange={(open) => heard.push(open)}>
        <a href="#one">A row</a>
      </PreviewCard>,
    )
    act(() => screen.getByRole('link', { name: 'A row' }).focus())
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByText('The rest of it')).toBeTruthy()
    expect(heard).toEqual([true])
  })

  it('onOpenChange hears one open when the card opened by the pointer is then focused into', () => {
    vi.useFakeTimers()
    const heard: boolean[] = []
    render(
      <PreviewCard content={<span>The rest of it</span>} onOpenChange={(open) => heard.push(open)}>
        <a href="#one">A row</a>
      </PreviewCard>,
    )
    const link = screen.getByRole('link', { name: 'A row' })
    const trigger = link.parentElement as HTMLElement
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.mouseEnter(trigger)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    act(() => link.focus())
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByText('The rest of it')).toBeTruthy()
    expect(heard).toEqual([true])
  })

  it('with openOnTap, onOpenChange hears each tap: open, then closed', () => {
    const heard: boolean[] = []
    render(
      <PreviewCard content={<span>The rest of it</span>} openOnTap onOpenChange={(open) => heard.push(open)}>
        <button type="button">A dot</button>
      </PreviewCard>,
    )
    const dot = screen.getByRole('button', { name: 'A dot' })
    fireEvent.click(dot)
    fireEvent.click(dot)
    expect(heard).toEqual([true, false])
  })

  it('with openOnTap, a tap on a touch screen opens the card and a second tap closes it', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard content={<span>The rest of it</span>} openOnTap>
        <span>A dot</span>
      </PreviewCard>,
    )
    const dot = screen.getByText('A dot')
    await user.pointer({ keys: '[TouchA]', target: dot })
    expect(await screen.findByText('The rest of it')).toBeTruthy()
    await user.pointer({ keys: '[TouchA]', target: dot })
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('with openOnTap on a button, a tap that closes the card stays closed: focus from the tap does not reopen it a moment later', async () => {
    vi.useFakeTimers()
    render(
      <PreviewCard content={<span>The rest of it</span>} openOnTap>
        <button type="button">A dot</button>
      </PreviewCard>,
    )
    const dot = screen.getByRole('button', { name: 'A dot' })
    // A finger's tap on a button, in the order a phone sends it: the press and the lift, then the mouse events made
    // from them, focus on the button and the click. Fired by hand, because user-event waits on a clock this test fakes.
    const tap = () => {
      fireEvent.pointerDown(dot, { pointerType: 'touch' })
      fireEvent.pointerUp(dot, { pointerType: 'touch' })
      fireEvent.mouseDown(dot)
      act(() => dot.focus())
      fireEvent.mouseUp(dot)
      fireEvent.click(dot)
    }
    tap()
    expect(screen.getByText('The rest of it')).toBeTruthy()
    tap()
    expect(screen.queryByText('The rest of it')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('with openOnTap, a click with no press before it (a screen reader double-tap) opens the card, and another closes it', async () => {
    render(
      <PreviewCard content={<span>The rest of it</span>} openOnTap>
        <button type="button">A dot</button>
      </PreviewCard>,
    )
    const dot = screen.getByRole('button', { name: 'A dot' })
    fireEvent.click(dot)
    expect(screen.queryByText('The rest of it')).not.toBeNull()
    fireEvent.click(dot)
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('without openOnTap, a tap on a touch screen opens nothing, so a row tapped opens the row', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard content={<span>The rest of it</span>}>
        <span>A row</span>
      </PreviewCard>,
    )
    await user.pointer({ keys: '[TouchA]', target: screen.getByText('A row') })
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
