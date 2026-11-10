// @vitest-environment jsdom
/** What the CornerMenu page claims, pinned: the "…" is named for the item, is drawn only with a menu, and its menu shows and changes the look and removes. */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CornerMenu, type CornerMenuOptions } from './CornerMenu'

afterEach(cleanup)

function options(over: Partial<CornerMenuOptions> = {}): CornerMenuOptions {
  return { name: 'Item one', look: 'row', onLook: vi.fn(), onRemove: vi.fn(), ...over }
}

async function openMenu(menu: CornerMenuOptions) {
  const user = userEvent.setup()
  render(
    <CornerMenu menu={menu}>
      <span>Item one</span>
    </CornerMenu>,
  )
  await user.click(screen.getByRole('button', { name: 'More options for Item one' }))
  await screen.findByRole('menu')
  return user
}

describe('CornerMenu', () => {
  it('draws its child and a "…" named for the item', () => {
    render(
      <CornerMenu menu={options()}>
        <span>Item one</span>
      </CornerMenu>,
    )
    expect(screen.getByText('Item one')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'More options for Item one' })).toBeTruthy()
  })

  it('without a menu, where the person cannot arrange the list, draws its child and no "…"', () => {
    render(
      <CornerMenu>
        <span>Item one</span>
      </CornerMenu>,
    )
    expect(screen.getByText('Item one')).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('opens Show as with Row and Card, the look in use checked, then Remove', async () => {
    await openMenu(options({ look: 'card' }))
    expect(screen.getByRole('group', { name: 'Show as' })).toBeTruthy()
    expect(screen.getByRole('menuitemradio', { name: 'Card', checked: true })).toBeTruthy()
    expect(screen.getByRole('menuitemradio', { name: 'Row', checked: false })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toBeTruthy()
  })

  it('choosing Card on a row asks for the card, and closes the menu', async () => {
    const menu = options({ look: 'row' })
    const user = await openMenu(menu)
    await user.click(screen.getByRole('menuitemradio', { name: 'Card' }))
    expect(menu.onLook).toHaveBeenCalledWith('card')
    expect(menu.onLook).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('choosing the look already in use asks for nothing', async () => {
    const menu = options({ look: 'row' })
    const user = await openMenu(menu)
    await user.click(screen.getByRole('menuitemradio', { name: 'Row' }))
    expect(menu.onLook).not.toHaveBeenCalled()
  })

  it('Remove removes the item', async () => {
    const menu = options()
    const user = await openMenu(menu)
    await user.click(screen.getByRole('menuitem', { name: 'Remove' }))
    expect(menu.onRemove).toHaveBeenCalledTimes(1)
    expect(menu.onLook).not.toHaveBeenCalled()
  })

  it('opens from the keyboard: Tab reaches the "…", Enter opens it, Escape closes it', async () => {
    const user = userEvent.setup()
    render(
      <CornerMenu menu={options()}>
        <span>Item one</span>
      </CornerMenu>,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More options for Item one' }))
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menuitem', { name: 'Remove' })).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })
})
