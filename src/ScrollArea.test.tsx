// @vitest-environment jsdom
/**
 * What jsdom can see of the ScrollArea page: the content renders inside the
 * region, and the region is Base UI's. Whether the bar takes width, and when
 * it shows, is measured in Chrome (2026-09-08: the viewport keeps its full
 * width with 40 rows overflowing; the native bar is hidden).
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ScrollArea } from './ScrollArea'

afterEach(cleanup)

describe('ScrollArea', () => {
  it('draws the content inside a viewport of its own', () => {
    const { container } = render(
      <ScrollArea className="h-40">
        <p>Inside</p>
      </ScrollArea>,
    )
    const inside = screen.getByText('Inside')
    expect(container.firstElementChild).not.toBe(inside)
    expect(container.firstElementChild!.contains(inside)).toBe(true)
    expect(container.firstElementChild!.className).toContain('h-40')
  })

  it('takes the viewport classes on the scrolling box, not the region', () => {
    const { container } = render(
      <ScrollArea viewportClassName="p-2">
        <p>Inside</p>
      </ScrollArea>,
    )
    expect(container.firstElementChild!.className).not.toContain('p-2')
    expect(screen.getByText('Inside').parentElement!.className).toContain('p-2')
  })
})
