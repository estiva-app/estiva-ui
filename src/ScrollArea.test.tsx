// @vitest-environment jsdom
/**
 * What jsdom can see of the ScrollArea page: the content renders inside the
 * region, and the region is Base UI's. Whether the bar takes width, and when
 * it shows, is measured in Chrome (2026-09-08: the viewport keeps its full
 * width with 40 rows overflowing; the native bar is hidden).
 */
import { createRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('puts each class prop on its own box: the region, the viewport, the content', () => {
    const { container } = render(
      <ScrollArea className="h-40" viewportClassName="max-h-20" contentClassName="p-2">
        <p>Inside</p>
      </ScrollArea>,
    )
    const region = container.firstElementChild!
    const content = screen.getByText('Inside').parentElement!
    const viewport = content.parentElement!
    expect(region.className).toContain('h-40')
    expect(viewport.className).toContain('max-h-20')
    expect(content.className).toContain('p-2')
    expect(viewport.parentElement).toBe(region)
  })

  it('keeps a vertical region no wider than itself, and lets a sideways one grow', () => {
    const v = render(<ScrollArea><p>Inside</p></ScrollArea>)
    expect((screen.getByText('Inside').parentElement as HTMLElement).style.minWidth).toBe('0px')
    cleanup()
    render(<ScrollArea orientation="horizontal"><p>Inside</p></ScrollArea>)
    expect((screen.getByText('Inside').parentElement as HTMLElement).style.minWidth).toBe('fit-content')
    void v
  })
})

describe('ScrollArea and the page behind it', () => {
  // Measured in Chrome (2026-09-09, PLAN Finding 40): with an unconditional
  // `overscroll-contain` the page under a sideways table moved 0px on a
  // wheel down, 446px without it; with these two classes 400px, and the
  // table 0. jsdom cannot scroll; it pins that the contain is per axis and
  // waits for Base UI's overflow attribute rather than being unconditional.
  it('contains the wheel per axis, and only while that axis overflows', () => {
    render(<ScrollArea orientation="horizontal"><p>Inside</p></ScrollArea>)
    const viewport = screen.getByText('Inside').parentElement!.parentElement!
    expect(viewport.className).toContain('data-[has-overflow-x]:overscroll-x-contain')
    expect(viewport.className).toContain('data-[has-overflow-y]:overscroll-y-contain')
    expect(viewport.className).not.toMatch(/(^|\s)overscroll-contain(\s|$)/)
  })
})

/**
 * The viewport is the box a caller reads and drives (0.12.2, ADOPTION B20).
 * A conversation arrives at its newest message and jumps to the bottom on a
 * reply; neither is something the region can do for the caller, and neither is
 * possible without the box.
 */
describe('ScrollArea, the viewport it hands back', () => {
  it('gives the caller the box that scrolls, and reports its scrolling', () => {
    const ref = createRef<HTMLDivElement>()
    let scrolled = 0
    render(
      <ScrollArea className="h-40" viewportRef={ref} onScroll={() => { scrolled += 1 }}>
        <p>Inside</p>
      </ScrollArea>,
    )
    // The box the caller gets is the one the content sits in, not the region.
    expect(ref.current).not.toBe(null)
    expect(ref.current!.contains(screen.getByText('Inside'))).toBe(true)
    expect(ref.current!.className).toContain('overflow')

    fireEvent.scroll(ref.current!)
    expect(scrolled).toBe(1)
  })
})
