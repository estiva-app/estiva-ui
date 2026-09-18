// @vitest-environment jsdom
/**
 * The page's claims: with `chevron` the title is a button that toggles by
 * click and by key and says its state; an action beside it acts without
 * toggling; without `chevron` there is no button to find.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SectionHeader } from './SectionHeader'

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
})
