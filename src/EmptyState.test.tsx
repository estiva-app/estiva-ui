// @vitest-environment jsdom
/**
 * The two manners the page claims (Katerina, 2026-09-09): `page` draws an
 * icon over the line, `section` draws the line alone. Where each is
 * aligned is a class the page names and Chrome shows; jsdom pins the
 * structure.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('a section is the quiet line: caption size, muted colour (Katerina, 2026-09-15)', () => {
    render(<EmptyState scope="section" message="Nothing here yet." />)
    const classes = screen.getByText('Nothing here yet.').className.split(' ')
    expect(classes).toContain('text-caption')
    expect(classes).toContain('text-text-muted')
    expect(classes).not.toContain('text-body-2')
    expect(classes).not.toContain('text-text-secondary')
  })

  it('a caller’s placement class does not take the quiet look away', () => {
    render(<EmptyState scope="section" className="py-8" message="Nothing here yet." />)
    const classes = screen.getByText('Nothing here yet.').className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['text-caption', 'text-text-muted', 'py-8']))
  })

  it('a section carries no space of its own, so the box it sits in decides where it starts', () => {
    // Katerina, 2026-09-14: the box is written once and holds the rows or the empty
    // state; the empty state is never padded. So it may carry no padding or margin.
    render(<EmptyState scope="section" message="Nothing here yet." />)
    const classes = screen.getByText('Nothing here yet.').className.split(' ')
    expect(classes.filter((c) => /^-?[pm][xytrbl]?-/.test(c))).toEqual([])
  })

  it('keeps the caller icon for a page', () => {
    const { container } = render(<EmptyState icon={<i data-testid="own" />} message="Nothing here yet." />)
    expect(container.querySelector('[data-testid="own"]')).not.toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('draws its action under the line as the package Button, outlined (Katerina, 2026-09-18)', () => {
    let clicked = 0
    render(<EmptyState message="No topics yet." action={{ label: 'New topic', onClick: () => (clicked += 1) }} />)
    const button = screen.getByRole('button', { name: 'New topic' })
    expect(button.className).toContain('border-border-default')
    expect(button.className).toContain('mt-2')
    // Under the line, in the same column.
    expect(screen.getByText('No topics yet.').nextElementSibling).toBe(button)
    fireEvent.click(button)
    expect(clicked).toBe(1)
  })

  it('a section carries its action at the end of its line, as the package Button, muted (Katerina, 2 November)', () => {
    let clicked = 0
    const { container } = render(
      <EmptyState scope="section" message="Steer could not be read." action={{ label: 'Try again', onClick: () => (clicked += 1) }} />,
    )
    const line = screen.getByText('Steer could not be read.')
    const button = screen.getByRole('button', { name: 'Try again' })
    // The line keeps its quiet look, so a failure reads as the empty line beside it does.
    expect(line.className.split(' ')).toEqual(expect.arrayContaining(['text-caption', 'text-text-muted']))
    // One row: the line, then the button at its end, centred on each other.
    const row = container.firstElementChild!
    expect(row.className.split(' ')).toEqual(expect.arrayContaining(['flex', 'items-center', 'justify-between', 'gap-2']))
    expect(line.parentElement).toBe(row)
    expect(line.nextElementSibling).toBe(button)
    // Muted, the default size: the quiet button a section's line sits beside, not a page's outlined one.
    expect(button.className).not.toContain('border-border-default')
    expect(button.className).toContain('h-8')
    fireEvent.click(button)
    expect(clicked).toBe(1)
  })

  it('a section with an action takes the caller’s placement on its row', () => {
    const { container } = render(<EmptyState scope="section" className="mt-1" message="Steer could not be read." action={{ label: 'Try again', onClick: () => {} }} />)
    expect(container.firstElementChild!.className).toContain('mt-1')
  })
})
