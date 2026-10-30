// @vitest-environment jsdom
/**
 * The frame owns the page's scrollbar (2026-09-09): in the solid manner the
 * page lands inside a ScrollArea's viewport — Base UI's `overflow: scroll`
 * box — so no page can scroll in a native bar. Whether the bar takes width,
 * and whether an inner region still scrolls on its own, is measured in
 * Chrome on Ship's four pages.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell, useSidebarFold, type SidebarFoldOptions } from './AppShell'
import { Sidebar } from './Sidebar'

afterEach(cleanup)

describe('AppShell', () => {
  it('puts the page inside the frame’s scrolling region in the solid manner', () => {
    render(
      <AppShell nav={<nav>Nav</nav>}>
        <p>Page</p>
      </AppShell>,
    )
    const main = screen.getByRole('main')
    const viewport = main.closest('[style*="overflow: scroll"]') as HTMLElement | null
    expect(viewport).not.toBeNull()
    expect(viewport!.contains(screen.getByText('Page'))).toBe(true)
    expect(main.className).not.toContain('overflow-y-auto')
  })

  it('stands the sidebar on the ground and makes the content a panel in the inset manner, and only there', () => {
    const frame = (variant: 'solid' | 'inset') =>
      render(
        <AppShell variant={variant} nav={<Sidebar>Rows</Sidebar>}>
          <p>Page</p>
        </AppShell>,
      )
    const { unmount } = frame('solid')
    expect(screen.getByRole('navigation').className).toContain('border-r')
    expect(screen.getByRole('banner').className).toContain('border-b')
    unmount()
    frame('inset')
    expect(screen.getByRole('navigation').className).not.toMatch(/border-r|bg-bg-surface/)
    expect(screen.getByRole('banner').className).not.toMatch(/border-b|bg-bg-surface/)
    const panel = screen.getByRole('main').closest('.rounded-lg')
    expect(panel?.className).toContain('bg-bg-surface')
    expect(panel?.className).toContain('mr-4')
  })

  it('folds the navigation from the top bar’s menu button and brings it back', async () => {
    function Folding() {
      const [open, setOpen] = useState(true)
      return (
        <AppShell variant="inset" nav={<Sidebar>Rows</Sidebar>} navOpen={open} onNavOpenChange={setOpen}>
          <p>Page</p>
        </AppShell>
      )
    }
    const user = userEvent.setup()
    render(<Folding />)
    await user.click(screen.getByRole('button', { name: 'Hide the sidebar' }))
    // Folded, nothing in it can be reached; it stays mounted, to come back as it was left.
    expect(screen.getByRole('navigation').closest('[inert]')).not.toBeNull()
    expect(screen.getByText('Page')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Show the sidebar' }))
    expect(screen.getByRole('navigation').closest('[inert]')).toBeNull()
    expect(screen.getByRole('navigation').textContent).toBe('Rows')
  })

  it('keeps a menu the caller passes in place of the fold, and folds the floating rail as the sidebar', async () => {
    const { unmount } = render(
      <AppShell variant="inset" menu={<button>Own menu</button>} nav={<Sidebar>Rows</Sidebar>} navOpen onNavOpenChange={() => {}}>
        <p>Page</p>
      </AppShell>,
    )
    expect(screen.getByRole('button', { name: 'Own menu' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /sidebar/ })).toBeNull()
    unmount()
    function Floating() {
      const [open, setOpen] = useState(true)
      return (
        <AppShell variant="floating" nav={<nav>Rail</nav>} navOpen={open} onNavOpenChange={setOpen}>
          <p>Page</p>
        </AppShell>
      )
    }
    render(<Floating />)
    await userEvent.click(screen.getByRole('button', { name: 'Hide the sidebar' }))
    expect(screen.getByRole('navigation').closest('[inert]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Show the sidebar' })).toBeTruthy()
  })

  it('draws no fold when the caller does not keep one', () => {
    render(
      <AppShell variant="inset" nav={<Sidebar>Rows</Sidebar>}>
        <p>Page</p>
      </AppShell>,
    )
    expect(screen.queryByRole('button', { name: /sidebar/ })).toBeNull()
    expect(screen.getByRole('navigation')).toBeTruthy()
  })

  it('leaves the floating manner’s card as it was', () => {
    render(
      <AppShell variant="floating" nav={<nav>Nav</nav>}>
        <p>Page</p>
      </AppShell>,
    )
    const main = screen.getByRole('main')
    expect(main.className).toContain('overflow-hidden')
    expect(main.closest('[style*="overflow: scroll"]')).toBeNull()
  })

  it('carries the Signal canvas on the floating frame, and only there', () => {
    const { container, unmount } = render(
      <AppShell variant="floating" nav={<nav>Nav</nav>}>
        <p>Page</p>
      </AppShell>,
    )
    expect((container.firstElementChild as HTMLElement).className).toContain('signal-canvas')
    unmount()
    const solid = render(
      <AppShell nav={<nav>Nav</nav>}>
        <p>Page</p>
      </AppShell>,
    )
    expect(solid.container.querySelector('.signal-canvas')).toBeNull()
  })
})

/** Folded stays folded on this browser (LED-3, Miky, 28 October; every app's, Katerina, 31 October). */
describe('useSidebarFold', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })
  /** A fresh page load: the fold is read once per load, so each load takes the module again. */
  async function load(how: 'navigate' | 'reload' = 'navigate') {
    vi.resetModules()
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: how }] as unknown as PerformanceEntryList)
    const { useSidebarFold: fresh } = await import('./AppShell')
    return function Shell(options: Partial<SidebarFoldOptions>) {
      const [open, setOpen] = fresh({ storageKey: 'app.sidebarFolded', ...options })
      return (
        <AppShell nav={<nav>Rows</nav>} navOpen={open} onNavOpenChange={setOpen}>
          <p>Page</p>
        </AppShell>
      )
    }
  }
  const folded = () => window.localStorage.setItem('app.sidebarFolded', '1')

  it('keeps the sidebar folded after a reload, until it is shown again', async () => {
    let Shell = await load()
    const first = render(<Shell />)
    await userEvent.click(screen.getByRole('button', { name: 'Hide the sidebar' }))
    first.unmount()
    Shell = await load('reload')
    const reloaded = render(<Shell />)
    await userEvent.click(screen.getByRole('button', { name: 'Show the sidebar' }))
    reloaded.unmount()
    Shell = await load('reload')
    render(<Shell />)
    expect(screen.getByRole('button', { name: 'Hide the sidebar' })).toBeTruthy()
  })

  it('unfolds for a file opened from a link, and stays unfolded on this browser', async () => {
    folded()
    const Shell = await load('navigate')
    render(<Shell isFile={() => true} />)
    expect(screen.getByRole('button', { name: 'Hide the sidebar' })).toBeTruthy()
    expect(window.localStorage.getItem('app.sidebarFolded')).toBeNull()
  })

  it('stays folded on a reload of the file, and on a page that is not a file', async () => {
    folded()
    let Shell = await load('reload')
    const reloaded = render(<Shell isFile={() => true} />)
    expect(screen.getByRole('button', { name: 'Show the sidebar' })).toBeTruthy()
    reloaded.unmount()
    Shell = await load('navigate')
    render(<Shell isFile={() => false} />)
    expect(screen.getByRole('button', { name: 'Show the sidebar' })).toBeTruthy()
  })

  it('stays as it was left when a page draws its frame again, even on a file reached by a link', async () => {
    const Shell = await load('navigate')
    const list = render(<Shell isFile={() => false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Hide the sidebar' }))
    list.unmount()
    render(<Shell isFile={() => true} />)
    expect(screen.getByRole('button', { name: 'Show the sidebar' })).toBeTruthy()
  })

  it('opens folded in a window too narrow for it, whatever was kept, and keeps nothing for it', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(max-width: 1023px)' }))
    const Shell = await load()
    render(<Shell foldWhen="(max-width: 1023px)" />)
    expect(screen.getByRole('button', { name: 'Show the sidebar' })).toBeTruthy()
    expect(window.localStorage.getItem('app.sidebarFolded')).toBeNull()
  })
})
