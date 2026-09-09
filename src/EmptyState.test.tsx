// @vitest-environment jsdom
/**
 * The two manners the page claims (Katerina, 2026-09-09): `page` draws an
 * icon over the line, `section` draws the line alone. Where each is
 * aligned is a class the page names and Chrome shows; jsdom pins the
 * structure.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

afterEach(cleanup)

describe('EmptyState', () => {
  it('draws an icon over the line for a page, centred', () => {
    const { container } = render(<EmptyState message="Nothing here yet." />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('Nothing here yet.').className).toContain('text-center')
    // In the middle of its box both ways: it takes a flex column's room and centres in it.
    expect(container.firstElementChild!.className).toContain('items-center')
    expect(container.firstElementChild!.className).toContain('justify-center')
    expect(container.firstElementChild!.className).toContain('flex-1')
  })

  it('draws the line alone for a section, and nothing else', () => {
    const { container } = render(<EmptyState scope="section" message="Nothing here yet." />)
    expect(container.querySelector('svg')).toBeNull()
    const line = screen.getByText('Nothing here yet.')
    expect(container.firstElementChild).toBe(line)
    expect(line.tagName).toBe('P')
    expect(line.className).not.toContain('text-center')
  })

  it('keeps the caller icon for a page', () => {
    const { container } = render(<EmptyState icon={<i data-testid="own" />} message="Nothing here yet." />)
    expect(container.querySelector('[data-testid="own"]')).not.toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })
})
