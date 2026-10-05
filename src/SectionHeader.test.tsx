// @vitest-environment jsdom
/**
 * The page's claims: with `chevron` the title is a button that toggles by
 * click and by key and says its state; an action beside it acts without
 * toggling; without `chevron` there is no button to find.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuItem } from './Menu'
import { SectionHeader } from './SectionHeader'
import { UnreadDot } from './UnreadDot'

afterEach(cleanup)

describe('SectionHeader', () => {
  it('with a chevron the title is a button that toggles, by click and by key', async () => {
    const onToggle = vi.fn()
    render(<SectionHeader title="Section" chevron isExpanded onToggle={onToggle} />)
    const title = screen.getByRole('button', { name: 'Section' })
    expect(title.getAttribute('aria-expanded')).toBe('true')
    await userEvent.click(title)
    title.focus()
    await userEvent.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('fills under the pointer when it does something, and hover="none" keeps it still', () => {
    const actions = [{ icon: <i />, tooltip: 'Add', onClick: () => {} }]
    const lit = render(<SectionHeader title="Section" actions={actions} />)
    expect((lit.container.firstElementChild as HTMLElement).className).toContain('hover:bg-bg-hover')
    cleanup()
    const still = render(<SectionHeader title="Section" actions={actions} hover="none" />)
    expect((still.container.firstElementChild as HTMLElement).className).not.toContain('hover:bg-bg-hover')
  })

  it('an action beside the title acts, and never toggles', async () => {
    const onToggle = vi.fn()
    const add = vi.fn()
    render(<SectionHeader title="Section" chevron onToggle={onToggle} actions={[{ icon: <i />, tooltip: 'Add', onClick: add }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(add).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('without a chevron there is no button', () => {
    render(<SectionHeader title="Section" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Section')).not.toBeNull()
  })
})

/**
 * The trailing slot (0.12.2, ADOPTION B23). Peek's Screener header carries its
 * count as a Chip there, and was the last hand-drawn folding header in the app
 * for want of it.
 */
describe('SectionHeader, the trailing slot', () => {
  it('holds a count beside the title, outside the button and outside the hover', () => {
    render(
      <SectionHeader
        title="Section"
        chevron
        trailing={<span data-testid="count">2</span>}
        actions={[{ icon: <span />, tooltip: 'Add', onClick: () => {} }]}
      />,
    )
    const count = screen.getByTestId('count')
    const title = screen.getByRole('button', { name: /section/i })
    // Not part of the toggle: neither its name nor its hit target.
    expect(title.contains(count)).toBe(false)
    expect(title.textContent).toBe('Section')
    // Not part of the hover reveal either — a count is information, not an affordance.
    expect(count.closest('.opacity-0')).toBe(null)
  })

  it('a dot sits in the last button’s place and steps aside for it; a count stays beside the buttons', () => {
    const { container } = render(
      <SectionHeader title="Section" trailing={<UnreadDot />} actions={[{ icon: <span />, tooltip: 'Open', onClick: () => {} }]} menu={<MenuItem label="Rename" />} />,
    )
    const dot = container.querySelector('[data-unread]')!
    // Inside the buttons' box, over the last one — not a slot of its own before them.
    expect(dot.closest('[class~="group/acts"]')).not.toBe(null)
    expect(dot.parentElement!.className).toContain('group-hover:opacity-0')
    expect(screen.getByRole('button', { name: 'More options for Section' })).not.toBeNull()
  })

  it('an icon shows at rest, and folding, the arrow is in its place', () => {
    const { container } = render(<SectionHeader title="Section" chevron icon={<span data-icon />} onToggle={() => {}} />)
    const icon = container.querySelector('[data-icon]')!
    expect(icon.parentElement!.className).toContain('group-hover:opacity-0')
    // The arrow is the icon's sibling, hidden until the pointer comes.
    expect(icon.parentElement!.parentElement!.querySelector('svg')!.getAttribute('class')).toContain('group-hover:opacity-100')
  })

  it('a dot with no buttons sits on their axis all the same', () => {
    const { container } = render(<SectionHeader title="Section" trailing={<UnreadDot />} />)
    expect(container.querySelector('[data-unread]')!.parentElement!.className).toContain('-mr-1')
  })
})
