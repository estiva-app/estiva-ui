// @vitest-environment jsdom
/**
 * What the ProgressBar page claims, pinned: it is a named progressbar carrying
 * its numbers; the fill is the done share of the track, capped at full; an
 * empty set is an empty bar, not a division by zero; each look is its own
 * class list; and the caller's className lands on the outside, for placement.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

afterEach(cleanup)

const classesOf = (el: Element) => el.getAttribute('class')?.split(' ').filter(Boolean) ?? []
const fillOf = (bar: HTMLElement) => bar.firstElementChild!.firstElementChild as HTMLElement

describe('ProgressBar', () => {
  it('is a progressbar named by its label, carrying its numbers', () => {
    render(<ProgressBar value={10} max={14} label="Items done" />)
    const bar = screen.getByRole('progressbar', { name: 'Items done' })
    expect(bar.getAttribute('aria-valuenow')).toBe('10')
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('14')
  })

  it('fills the done share of the track', () => {
    render(<ProgressBar value={7} max={14} label="Items done" />)
    expect(fillOf(screen.getByRole('progressbar')).style.width).toBe('50%')
  })

  it('never fills past full', () => {
    render(<ProgressBar value={20} max={14} label="Items done" />)
    expect(fillOf(screen.getByRole('progressbar')).style.width).toBe('100%')
  })

  it('an empty set is an empty bar, and still says its max is 0', () => {
    render(<ProgressBar value={0} max={0} label="Items done" />)
    const bar = screen.getByRole('progressbar')
    expect(fillOf(bar).style.width).toBe('0%')
    expect(bar.getAttribute('aria-valuemax')).toBe('0')
  })

  it('default is 6px with the success colour; quiet is 3px with the muted one', () => {
    render(
      <>
        <ProgressBar value={1} max={2} label="Default" />
        <ProgressBar value={1} max={2} label="Quiet" variant="quiet" />
      </>,
    )
    const standard = screen.getByRole('progressbar', { name: 'Default' })
    expect(classesOf(standard.firstElementChild!)).toContain('h-1.5')
    expect(classesOf(fillOf(standard))).toContain('bg-success-default')
    const quiet = screen.getByRole('progressbar', { name: 'Quiet' })
    expect(classesOf(quiet.firstElementChild!)).toContain('h-[3px]')
    expect(classesOf(fillOf(quiet))).toContain('bg-success-muted')
  })

  it("the caller's className lands on the outside", () => {
    render(<ProgressBar value={1} max={2} label="Items done" className="flex-1" />)
    expect(classesOf(screen.getByRole('progressbar'))).toContain('flex-1')
  })
})
