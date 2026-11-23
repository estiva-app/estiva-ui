// @vitest-environment jsdom
/**
 * What the page claims: the heading names the list under it with its count, and says no count while it is not known.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ListSection } from './ListSection'

afterEach(cleanup)

describe('ListSection', () => {
  it('heads its list with its title and count', () => {
    render(
      <ListSection title="Projects" count={3}>
        <p>The list</p>
      </ListSection>,
    )
    const section = screen.getByText('The list').closest('section') as HTMLElement
    expect(section.textContent).toContain('Projects')
    expect(section.textContent).toContain('3')
  })

  it('says no count while the list is read', () => {
    render(
      <ListSection title="Projects">
        <p>Reading</p>
      </ListSection>,
    )
    const section = screen.getByText('Reading').closest('section') as HTMLElement
    expect(section.textContent).toBe('ProjectsReading')
  })
})
