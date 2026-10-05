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
import { NavItem } from './NavItem'
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
 * When the buttons show. The pointer and the menu are Chrome's to prove (the
 * stories); what is pinned here is which element each reveal asks.
 */
describe('SectionHeader, the reveal', () => {
  const menu = <MenuItem label="Rename" />
  const actions = [{ icon: <span />, tooltip: 'Add', onClick: () => {} }]

  it('shows the buttons once the title’s toggle has keyboard focus, as a NavItem shows its ⋮ for its link', () => {
    const { container } = render(<SectionHeader title="Section" chevron onToggle={() => {}} actions={actions} menu={menu} />)
    const row = container.firstElementChild as HTMLElement
    const toggle = screen.getByRole('button', { name: 'Section' })
    const buttons = screen.getByRole('button', { name: 'Add' }).parentElement!
    // The row is the group, and it holds the toggle: the reveal asks the row, not the buttons' own box.
    expect(row.className.split(' ')).toContain('group')
    expect(row.contains(toggle)).toBe(true)
    expect(buttons.className.split(' ')).toContain('group-has-[:focus-visible]:opacity-100')
    expect(buttons.className.split(' ')).not.toContain('has-[:focus-visible]:opacity-100')
    // An open menu holds them, asked of their own box: the toggle's aria-expanded must not.
    expect(buttons.className.split(' ')).toContain('has-[[aria-expanded=true]]:opacity-100')
  })

  it('on a screen with no hover the buttons always show, and a dot under them steps aside', () => {
    const { container } = render(<SectionHeader title="Section" trailing={<UnreadDot />} actions={actions} menu={menu} />)
    expect(screen.getByRole('button', { name: 'Add' }).parentElement!.className.split(' ')).toContain('[@media(hover:none)]:opacity-100')
    expect(container.querySelector('[data-unread]')!.parentElement!.className.split(' ')).toContain('[@media(hover:none)]:has-[[data-unread]]:opacity-0')
  })

  it('no reveal answers to any focus (`focus-within`): a clicked row kept its focus and lost its icon and dot (0.56.0)', () => {
    const { container } = render(
      <>
        <SectionHeader title="Section" chevron icon={<span />} onToggle={() => {}} trailing={<UnreadDot />} actions={actions} menu={menu} />
        <NavItem href="#" label="Item one" icon={<span />} count={2} hint={<span>Label</span>} menu={menu}>
          <NavItem href="#" label="Item two" unread menu={menu} />
        </NavItem>
      </>,
    )
    const classes = [...container.querySelectorAll('*')].map((e) => e.getAttribute('class') ?? '').join(' ')
    expect(classes).not.toContain('focus-within')
    // The keyboard's reveal is what replaced it.
    expect(classes).toContain('group-has-[:focus-visible]')
  })

  it('with showActions="always" there is nothing to reveal', () => {
    render(<SectionHeader title="Section" actions={actions} showActions="always" />)
    expect(screen.getByRole('button', { name: 'Add' }).parentElement!.className).not.toContain('opacity-0')
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
    const slot = container.querySelector('[data-unread]')!.parentElement!
    // Over the last button, out of the row's flow — not a slot of its own before them — and gone while they show.
    expect(slot.className.split(' ')).toEqual(expect.arrayContaining(['has-[[data-unread]]:absolute', 'has-[[data-unread]]:right-1', 'has-[[data-unread]]:w-6', 'group-hover:has-[[data-unread]]:opacity-0']))
    expect(slot.matches(':has([data-unread])')).toBe(true)
    expect(screen.getByRole('button', { name: 'More options for Section' })).not.toBeNull()
  })

  it('a dot is found by what it draws, not by its element: one in a wrapper of the app’s own steps aside too', () => {
    render(
      <SectionHeader title="Section" trailing={<span data-testid="wrapped"><UnreadDot /></span>} menu={<MenuItem label="Rename" />} />,
    )
    const slot = screen.getByTestId('wrapped').parentElement!
    expect(slot.matches(':has([data-unread])')).toBe(true)
    expect(slot.className.split(' ')).toContain('has-[[data-unread]]:absolute')
    // A count holds no dot, so the same slot keeps it beside the buttons.
    cleanup()
    render(<SectionHeader title="Section" trailing={<span data-testid="count">2</span>} menu={<MenuItem label="Rename" />} />)
    expect(screen.getByTestId('count').parentElement!.matches(':has([data-unread])')).toBe(false)
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
    expect(container.querySelector('[data-unread]')!.parentElement!.className.split(' ')).toContain('has-[[data-unread]]:-mr-1')
  })
})
