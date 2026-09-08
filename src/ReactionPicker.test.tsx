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

  /** Yours is a toggle state, announced as one — the same signal `Reaction`
   *  gives with `aria-pressed`. */
  it('says which are already yours', () => {
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} selected={['👍']} />)
    expect(screen.getByRole('button', { name: 'Agree' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Celebrate' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('takes a name of its own, for a page with more than one', () => {
    render(<ReactionPicker options={OPTIONS} onSelect={() => {}} aria-label="React to this reply" />)
    expect(screen.getByRole('toolbar', { name: 'React to this reply' })).toBeTruthy()
  })

  /** It draws no surface, which is what lets it sit in a Popover, on a card,
   *  or in a larger toolbar. */
  it('draws no panel of its own', () => {
    const { container } = render(<ReactionPicker options={OPTIONS} onSelect={() => {}} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('role')).toBe('toolbar')
    expect(root.className).not.toContain('shadow')
    expect(root.className).not.toContain('bg-bg-elevated')
  })
})
