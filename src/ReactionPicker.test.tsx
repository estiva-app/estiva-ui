// @vitest-environment jsdom
/**
 * What the ReactionPicker page claims, pinned.
 *
 * The two that matter are the two Peek's version got wrong: the row is one Tab
 * stop rather than one per emoji, and every control is named by what the
 * reaction *means* rather than by the glyph.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactionPicker, type ReactionOption } from './ReactionPicker'

afterEach(cleanup)

const OPTIONS: ReactionOption[] = [
  { emoji: '👍', label: 'Agree' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🙏', label: 'Thank you' },
]

const focused = () => document.activeElement?.getAttribute('aria-label')

describe('ReactionPicker', () => {
  it('is a named toolbar of the options it was given', () => {
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    expect(screen.getByRole('toolbar', { name: 'Reactions' })).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  /**
   * Named by the meaning, not the glyph — the same rule `Reaction` enforces,
   * for the same reason: a glyph read aloud is noise and its spoken name
   * differs per screen reader.
   */
  it('names every control by what the reaction means', () => {
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    for (const option of OPTIONS) expect(screen.getByRole('button', { name: option.label })).toBeTruthy()
  })

  it('the emoji itself is hidden from assistive tech', () => {
    const { container } = render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    const glyphs = [...container.querySelectorAll('span')].filter((s) => s.textContent === '👍')
    expect(glyphs.length).toBeGreaterThan(0)
    expect(glyphs.every((s) => s.getAttribute('aria-hidden') === 'true')).toBe(true)
  })

  /** The reason it is a Toolbar. Peek's five emoji were five Tab stops. */
  it('is one Tab stop, not one per emoji', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Before</button>
        <ReactionPicker options={OPTIONS} onSelect={() => {}} />
        <button type="button">After</button>
      </>,
    )
    screen.getByRole('button', { name: 'Before' }).focus()
    await user.tab()
    expect(focused()).toBe('Agree')
    await user.tab()
    expect(document.activeElement?.textContent).toBe('After')
  })

  it('the arrow keys walk it', async () => {
    const user = userEvent.setup()
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    screen.getByRole('button', { name: 'Agree' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('Celebrate')
  })

  it('choosing one reports the emoji, which is what the app stores', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ReactionPicker options={OPTIONS} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Celebrate' }))
    expect(onSelect).toHaveBeenCalledWith('🎉')
  })

  it('and from the keyboard too', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ReactionPicker options={OPTIONS} onSelect={onSelect} />)
    screen.getByRole('button', { name: 'Agree' }).focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('👍')
  })

  /**
   * It asks; it does not report. Which reactions are yours is `Reaction`'s
   * state, in the row on the card — a picker that also carried it would be
   * two components wearing one name (Katerina, 2026-09-08).
   */
  it('says nothing about which are already yours', () => {
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    expect(screen.getAllByRole('button').every((b) => !b.hasAttribute('aria-pressed'))).toBe(true)
  })

  it('takes a name of its own, for a page with more than one', () => {
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} aria-label="React to this reply" />)
    expect(screen.getByRole('toolbar', { name: 'React to this reply' })).toBeTruthy()
  })

  /** It floats, so it carries the elevated box — the one `MenuPanel` draws. */
  it('draws the box, and drops it on request', () => {
    const withBox = render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    const panel = withBox.container.firstElementChild as HTMLElement
    expect(panel.className).toContain('bg-bg-elevated')
    expect(panel.querySelector('[role="toolbar"]')).toBeTruthy()
    withBox.unmount()

    // Inside a Popover, which draws that box already: two boxes inside each
    // other is the tell.
    const bare = render(<ReactionPicker options={OPTIONS} onSelect={() => {}} surface={false} />)
    expect((bare.container.firstElementChild as HTMLElement).getAttribute('role')).toBe('toolbar')
  })
})
