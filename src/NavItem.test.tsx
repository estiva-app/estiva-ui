// @vitest-environment jsdom
/**
 * What the page claims for the rows under a row and the hint: the arrow folds
 * the rows and says so, the rows are hidden rather than gone, the row itself
 * stays a link a click does not fold, and the hint is there to be revealed.
 * The reveal on hover and the slide are Chrome's to show.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavItem } from './NavItem'

afterEach(cleanup)

const arrow = (name: RegExp) => screen.getByRole('button', { name })

describe('NavItem with rows under it', () => {
  const tree = (props: Partial<Parameters<typeof NavItem>[0]> = {}) => (
    <NavItem href="#one" label="Item one" {...props}>
      <NavItem href="#two" label="Item two" />
    </NavItem>
  )

  it('starts open: the arrow says so and names what it folds, and the rows are there', () => {
    render(tree())
    const button = arrow(/Hide what is under Item one/)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(button.getAttribute('aria-controls') ?? '')).not.toBeNull()
    expect(screen.getByText('Item two').closest('[hidden]')).toBeNull()
  })

  it('the arrow folds the rows, hidden rather than gone, and unfolds them', async () => {
    render(tree())
    await userEvent.click(arrow(/Hide what is under Item one/))
    expect(arrow(/Show what is under Item one/).getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Item two').closest('[hidden]')).not.toBeNull()
    await userEvent.click(arrow(/Show what is under Item one/))
    expect(screen.getByText('Item two').closest('[hidden]')).toBeNull()
  })

  it('a click on the row is the link’s, and does not fold it', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(tree({ onClick }))
    await userEvent.click(screen.getByRole('link', { name: 'Item one' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(arrow(/Hide what is under Item one/).getAttribute('aria-expanded')).toBe('true')
  })

  it('starts folded with defaultOpen false, and reports a change through onOpenChange', async () => {
    const onOpenChange = vi.fn()
    render(tree({ defaultOpen: false, onOpenChange }))
    expect(screen.getByText('Item two').closest('[hidden]')).not.toBeNull()
    await userEvent.click(arrow(/Show what is under Item one/))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('Enter on the arrow folds the rows', async () => {
    render(tree())
    arrow(/Hide what is under Item one/).focus()
    await userEvent.keyboard('{Enter}')
    expect(arrow(/Show what is under Item one/).getAttribute('aria-expanded')).toBe('false')
  })

  it('a row with a menu and rows under it: the open rows do not hold the ⋮ open', () => {
    render(tree({ menu: <span>Action</span> }))
    const menu = screen.getByRole('button', { name: 'More options for Item one' }).closest('[data-nav-menu]')
    expect(menu).not.toBeNull()
    expect(menu?.querySelector('[aria-expanded=true]')).toBeNull()
  })
})

describe('NavItem with a hint', () => {
  it('draws the hint inside the row, beside the label', () => {
    render(<NavItem href="#" label="Item one" hint={<span>Label</span>} />)
    expect(screen.getByRole('link', { name: /Item one/ }).textContent).toContain('Label')
  })

  it('without children, a menu or a hint, the row is the bare link', () => {
    const { container } = render(<NavItem href="#" label="Item one" />)
    expect(container.firstElementChild?.tagName).toBe('A')
  })
})

describe('NavItem unread', () => {
  it('draws the dot, and sets the label in medium', () => {
    const { container } = render(<NavItem href="#" label="Item one" unread />)
    expect(container.querySelector('[data-unread]')).not.toBeNull()
    expect(screen.getByText('Item one').className).toContain('font-medium')
  })

  it('urgent draws the badge in the dot’s place', () => {
    const { container } = render(<NavItem href="#" label="Item one" unread urgent />)
    expect(container.querySelector('[data-urgent]')).not.toBeNull()
    expect(container.querySelector('[data-unread]')).toBeNull()
  })

  it('urgent without unread draws nothing', () => {
    const { container } = render(<NavItem href="#" label="Item one" urgent />)
    expect(container.querySelector('[data-urgent], [data-unread]')).toBeNull()
  })

  it('with a menu over the dot, the ⋮ ends where a heading’s ⋮ ends', () => {
    render(<NavItem href="#" label="Item one" unread menu={<span>Action</span>} />)
    const menu = screen.getByRole('button', { name: 'More options for Item one' }).closest('[data-nav-menu]')
    expect(menu?.className).toContain('right-1')
  })

  it('on a screen with no hover the ⋮ always shows, and the count steps aside for it', () => {
    render(<NavItem href="#" label="Item one" count={3} menu={<span>Action</span>} />)
    const menu = screen.getByRole('button', { name: 'More options for Item one' }).closest('[data-nav-menu]')!
    expect(menu.className.split(' ')).toContain('[@media(hover:none)]:opacity-100')
    expect(screen.getByText('3').className.split(' ')).toContain('[@media(hover:none)]:opacity-0')
  })

  it('on a screen with no hover, with nothing at the right, the ⋮’s place is kept so the label stops before it', () => {
    const { container } = render(<NavItem href="#" label="Item one" menu={<span>Action</span>} />)
    expect(container.querySelector('a > [aria-hidden="true"]')!.className.split(' ')).toContain('[@media(hover:none)]:block')
  })

  it('with a count and a menu, the ⋮ lands on the count', () => {
    render(<NavItem href="#" label="Item one" count={3} menu={<span>Action</span>} />)
    const menu = screen.getByRole('button', { name: 'More options for Item one' }).closest('[data-nav-menu]')
    expect(menu?.className).toContain('right-1')
  })
})
