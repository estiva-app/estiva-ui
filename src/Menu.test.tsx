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
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
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
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
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
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
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
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
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

  /**
   * The Keys table, pinned. Every row of it is Base UI's, and none of it
   * existed before stage 4 — which is exactly why it is tested here: a
   * behaviour nobody wrote is a behaviour nobody notices losing.
   *
   * `data-highlighted` is the assertion because it is what the row's fill
   * keys off, so a test that passes and a menu that looks wrong cannot come
   * apart.
   */
  const highlighted = () => screen.getAllByRole('menuitem').find((i) => i.hasAttribute('data-highlighted'))?.textContent

  it('opens from the keyboard with the first row highlighted', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    screen.getByRole('button', { name: 'Trigger' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    expect(highlighted()).toBe('Rename')
  })

  it('the arrow keys walk the rows and wrap at both ends', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    screen.getByRole('button', { name: 'Trigger' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Duplicate')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Delete')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Rename')
    await user.keyboard('{ArrowUp}')
    expect(highlighted()).toBe('Delete')
  })

  it('Home and End jump to the ends', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    screen.getByRole('button', { name: 'Trigger' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    await user.keyboard('{End}')
    expect(highlighted()).toBe('Delete')
    await user.keyboard('{Home}')
    expect(highlighted()).toBe('Rename')
  })

  it('typing a row’s first letters jumps to it', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('menu')
    await user.keyboard('de')
    expect(highlighted()).toBe('Delete')
  })

  it('Enter on the highlighted row activates it and closes the menu', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <Menu trigger={<Button variant="outlined">Trigger</Button>}>
        <MenuItem label="Rename" onClick={onPick} />
        <MenuItem label="Delete" destructive onClick={() => {}} />
      </Menu>,
    )
    screen.getByRole('button', { name: 'Trigger' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  /**
   * → opens the submenu **and takes the highlight into it**; the parent row
   * gives it up. The page said the highlight stayed on the row and ↓ stepped
   * in, which was written from Base UI's documentation rather than from a
   * measurement, and is wrong in a browser and here (2026-09-08).
   */
  it('→ opens a submenu onto its first row, and ← comes back', async () => {
    const user = userEvent.setup()
    render(
      <Menu trigger={<Button variant="outlined">Trigger</Button>}>
        <MenuItem label="Rename" onClick={() => {}} />
        <MenuSub label="Move to…">
          <MenuItem label="Item one" onClick={() => {}} />
          <MenuItem label="Item two" onClick={() => {}} />
        </MenuSub>
      </Menu>,
    )
    screen.getByRole('button', { name: 'Trigger' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Move to…')
    await user.keyboard('{ArrowRight}')
    expect(await screen.findByRole('menuitem', { name: 'Item one' })).toBeTruthy()
    expect(highlighted()).toBe('Item one')
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Item one' })).toBeNull())
    expect(highlighted()).toBe('Move to…')
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

  it('a default row is never shorter than 36px, and a tall one never shorter than 40', () => {
    render(
      <MenuPanel>
        <MenuItem label="Default" onClick={() => {}} />
        <MenuItem size="tall" label="Tall" onClick={() => {}} />
      </MenuPanel>,
    )
    // jsdom computes no layout, so the floor class is what it can assert;
    // the story beside it is what shows the pixels.
    expect(screen.getByRole('button', { name: 'Default' }).className).toContain('min-h-9')
    expect(screen.getByRole('button', { name: 'Tall' }).className).toContain('min-h-10')
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

/** As `Popover`: the padding is the content's, and a caller sets it there
 *  (PLAN Finding 60 — Peek's Later menu asked for `p-1` on `className` and got
 *  12px from 0.12.6 on). */
describe('Menu, padding', () => {
  it('takes a caller’s padding on contentClassName, instead of the 8px', async () => {
    render(
      <Menu trigger={<Button>Open</Button>} contentClassName="p-1">
        <MenuItem label="Item one" onClick={() => {}} />
      </Menu>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const row = await screen.findByRole('menuitem', { name: 'Item one' })
    // The scrolling content is the box that carries the separator rule.
    const content = row.closest('[class*="role=separator"]') as HTMLElement
    const classes = content.className.split(/\s+/)
    expect(classes).toContain('p-1')
    expect(classes).not.toContain('p-2')
  })
})
