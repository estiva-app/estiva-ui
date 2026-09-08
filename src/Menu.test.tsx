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
import { Button } from './Button'
import { Menu, MenuItem, MenuPanel, MenuSection, MenuSub } from './Menu'

afterEach(cleanup)

/** A trigger and the menu it opens — which is now the whole of a caller's
 *  code: no open state, no anchor, no dismiss. */
function Basic({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Menu trigger={<Button variant="outlined">Trigger</Button>} onOpenChange={onOpenChange}>
      <MenuItem label="Rename" onClick={() => {}} />
      <MenuItem label="Duplicate" onClick={() => {}} />
      <MenuItem label="Delete" destructive onClick={() => {}} />
    </Menu>
  )
}

describe('Menu', () => {
  it('opens from its own trigger, and the rows are menu items', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    expect(await screen.findByRole('menu')).toBeTruthy()
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(3)
    // `render` keeps the <button> the design was drawn with; the part would
    // otherwise draw a <div>.
    expect(items.every((i) => i.tagName === 'BUTTON')).toBe(true)
  })

  it('the trigger says whether its menu is open', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(trigger)
    await screen.findByRole('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('portals: the menu is not inside the element that rendered it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Basic />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const menu = await screen.findByRole('menu')
    expect(container.contains(menu)).toBe(false)
  })

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    await user.click(trigger)
    await screen.findByRole('menu')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on a press outside', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Basic />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  /**
   * The trigger is the menu's own, so a press on it toggles. This used to be a
   * trap: the press dismissed the menu and the caller's `onClick` reopened it
   * in the same gesture, and the workaround was `onMouseDown` with
   * `stopPropagation`. There is no caller `onClick` any more.
   */
  it('a second press on the trigger closes it', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    await user.click(trigger)
    await screen.findByRole('menu')
    await user.click(trigger)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('reports opening and closing to a caller that asks', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Basic onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('choosing a row runs its handler and closes the menu', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <Menu trigger={<Button variant="outlined">Trigger</Button>}>
        <MenuItem label="Rename" onClick={onPick} />
      </Menu>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('a section is a labelled group, so its rows are announced together', async () => {
    const user = userEvent.setup()
    render(
      <Menu trigger={<Button variant="outlined">Trigger</Button>}>
        <MenuSection label="Section">
          <MenuItem label="Item one" onClick={() => {}} />
          <MenuItem label="Item two" onClick={() => {}} />
        </MenuSection>
      </Menu>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const group = await screen.findByRole('group')
    expect(group.textContent).toContain('Section')
    expect(group.querySelectorAll('[role="menuitem"]')).toHaveLength(2)
  })

  it('a submenu row says it opens one', async () => {
    const user = userEvent.setup()
    render(
      <Menu trigger={<Button variant="outlined">Trigger</Button>}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuSub label="Move to…">
          <MenuItem label="Item one" onClick={() => {}} />
        </MenuSub>
      </Menu>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    const sub = screen.getByRole('menuitem', { name: 'Move to…' })
    expect(sub.getAttribute('aria-haspopup')).toBe('menu')
    expect(sub.getAttribute('aria-expanded')).toBe('false')
    expect(sub.tagName).toBe('BUTTON')
  })
})

/**
 * The rows outside a menu. Peek's `@`, `/` and `[` pickers and its compose
 * menu draw the surface without the behaviour, because the editor's suggestion
 * plugin already owns the keyboard — so `MenuItem` and `MenuSection` have to
 * work with no `Menu` above them.
 */
describe('rows on a bare MenuPanel', () => {
  /**
   * It is a button, and it does NOT claim to be a menu item. ARIA requires a
   * `menuitem` to sit inside a `menu` or a `menubar`; `MenuPanel` is a `<div>`
   * with no role, so the role used to make an orphan in all four of the Peek
   * files that draw rows this way.
   */
  it('MenuItem is a plain button outside a menu, claiming no menu role', () => {
    render(
      <MenuPanel>
        <MenuItem label="Heading" shortcut="#" onClick={() => {}} />
      </MenuPanel>,
    )
    const item = screen.getByRole('button', { name: /Heading/ })
    expect(item.tagName).toBe('BUTTON')
    expect(item.getAttribute('role')).toBeNull()
    expect(screen.queryByRole('menuitem')).toBeNull()
  })

  it('its onClick still runs', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <MenuPanel>
        <MenuItem label="Heading" onClick={onPick} />
      </MenuPanel>,
    )
    await user.click(screen.getByRole('button', { name: 'Heading' }))
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('MenuSection draws its heading and its rows, and is not a group', () => {
    render(
      <MenuPanel>
        <MenuSection label="Section">
          <MenuItem label="Heading" onClick={() => {}} />
        </MenuSection>
      </MenuPanel>,
    )
    expect(screen.getByText('Section')).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('group')).toBeNull()
  })
})
