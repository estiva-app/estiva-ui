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
})
