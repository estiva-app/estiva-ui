// @vitest-environment jsdom
/**
 * What the Menu page claims, pinned.
 *
 * The shell had no component test — only `Menu.fit.test.ts`, which tested the
 * pure geometry rather than the menu. Placement is Floating UI's now and is
 * measured in a browser (jsdom lays nothing out); what is testable here is the
 * behaviour, and stage 4 is where most of it started existing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { Menu, MenuItem, MenuPanel, MenuSection, MenuSub } from './Menu'

afterEach(cleanup)

/**
 * A trigger and the menu it opens, the way every caller builds one — closed
 * until the trigger is pressed, which is also what puts the trigger element in
 * the ref the menu anchors to.
 */
function Opened({ onClose = () => {}, ...rest }: { onClose?: () => void } & Partial<React.ComponentProps<typeof Menu>>) {
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button ref={ref} type="button" onClick={() => setOpen((v) => !v)}>
        Trigger
      </button>
      {open && (
        <Menu
          anchor={ref.current}
          onClose={() => {
            setOpen(false)
            onClose()
          }}
          {...rest}
        >
          <MenuItem label="Rename" onClick={() => {}} />
          <MenuItem label="Copy link" onClick={() => {}} />
          <MenuItem label="Delete" destructive onClick={() => {}} />
        </Menu>
      )}
    </>
  )
}

describe('Menu', () => {
  it('is a menu of menuitems, and each row is still a button', async () => {
    const user = userEvent.setup()
    render(<Opened />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const menu = await screen.findByRole('menu')
    expect(menu).toBeTruthy()
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(3)
    // `render` keeps the <button> the design was drawn with; the part would
    // otherwise draw a <div>.
    expect(items.every((i) => i.tagName === 'BUTTON')).toBe(true)
  })

  it('portals: the menu is not inside the element that rendered it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Opened />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const menu = await screen.findByRole('menu')
    expect(container.contains(menu)).toBe(false)
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Opened onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on a press outside', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <>
        <Opened onClose={onClose} />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(onClose).toHaveBeenCalled()
  })

  /**
   * The caller's own trigger is not "outside". Without this the press closes
   * the menu and the caller's `onClick` reopens it in the same gesture — the
   * flicker the old shell avoided with `onMouseDown` / `stopPropagation`,
   * which no longer helps because Base UI dismisses on a captured
   * `pointerdown`.
   */
  it('a press on the anchor closes it once, and does not reopen it', async () => {
    const user = userEvent.setup()
    render(<Opened />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('choosing a row runs its handler', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    const ref = { current: null }
    render(
      <Menu anchor={ref.current} onClose={() => {}}>
        <MenuItem label="Rename" onClick={onPick} />
      </Menu>,
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('a section is a labelled group, so its rows are announced together', async () => {
    render(
      <Menu anchor={null} onClose={() => {}}>
        <MenuSection label="Sort by">
          <MenuItem label="Newest first" onClick={() => {}} />
          <MenuItem label="Oldest first" onClick={() => {}} />
        </MenuSection>
      </Menu>,
    )
    const group = await screen.findByRole('group')
    expect(group.textContent).toContain('Sort by')
    expect(group.querySelectorAll('[role="menuitem"]')).toHaveLength(2)
  })

  it('a submenu row says it opens one, and is not one of the parent menu items twice', async () => {
    render(
      <Menu anchor={null} onClose={() => {}}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuSub label="Mark as Highlight">
          <MenuItem label="Insight" onClick={() => {}} />
        </MenuSub>
      </Menu>,
    )
    await screen.findByRole('menu')
    const sub = screen.getByRole('menuitem', { name: 'Mark as Highlight' })
    expect(sub.getAttribute('aria-haspopup')).toBe('menu')
    expect(sub.getAttribute('aria-expanded')).toBe('false')
    expect(sub.tagName).toBe('BUTTON')
  })
})

/**
 * The rows outside a menu. Peek's `@`, `/` and `[` pickers and its compose
 * menu draw the surface without the behaviour, because the editor's suggestion
 * plugin already owns the keyboard — so `MenuItem` and `MenuSection` have to
 * work with no `Menu` above them, exactly as they always have.
 */
describe('rows on a bare MenuPanel', () => {
  it('MenuItem is still a menuitem button, with no menu around it', () => {
    render(
      <MenuPanel>
        <MenuItem label="Heading" shortcut="#" onClick={() => {}} />
      </MenuPanel>,
    )
    const item = screen.getByRole('menuitem', { name: /Heading/ })
    expect(item.tagName).toBe('BUTTON')
  })

  it('its onClick still runs', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <MenuPanel>
        <MenuItem label="Heading" onClick={onPick} />
      </MenuPanel>,
    )
    await user.click(screen.getByRole('menuitem', { name: 'Heading' }))
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('MenuSection draws its heading and its rows, and is not a group', () => {
    render(
      <MenuPanel>
        <MenuSection label="Format">
          <MenuItem label="Heading" onClick={() => {}} />
        </MenuSection>
      </MenuPanel>,
    )
    expect(screen.getByText('Format')).toBeTruthy()
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
    expect(screen.queryByRole('group')).toBeNull()
  })
})
