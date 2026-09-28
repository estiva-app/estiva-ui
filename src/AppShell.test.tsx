// @vitest-environment jsdom
/**
 * The frame owns the page's scrollbar (2026-09-09): in the solid manner the
 * page lands inside a ScrollArea's viewport — Base UI's `overflow: scroll`
 * box — so no page can scroll in a native bar. Whether the bar takes width,
 * and whether an inner region still scrolls on its own, is measured in
 * Chrome on Ship's four pages.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
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
