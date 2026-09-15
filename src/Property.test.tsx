// @vitest-environment jsdom
/**
 * What the Property page claims, pinned: the label is the term, the value is
 * its definition, and the value's wrapper draws no box, so what a caller puts
 * inside lays out as a child of the row.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Property } from './Property'

afterEach(cleanup)

describe('Property', () => {
  it.each(['row', 'stacked'] as const)('%s: a list of one term and its definition', (layout) => {
    const { container } = render(
      <Property label="Status" layout={layout}>
        <span>Done</span>
      </Property>,
    )
    const list = container.firstElementChild!
    expect(list.tagName).toBe('DL')
    expect(Array.from(list.children).map((child) => child.tagName)).toEqual(['DT', 'DD'])
    expect(screen.getByRole('term').textContent).toBe('Status')
    expect(screen.getByRole('definition').textContent).toBe('Done')
  })

  it.each(['row', 'stacked'] as const)('%s: the value wrapper draws no box of its own', (layout) => {
    render(
      <Property label="Status" layout={layout}>
        <span>Done</span>
      </Property>,
    )
    expect(screen.getByRole('definition').className).toBe('contents')
  })

  it('the caller’s className lands on the list', () => {
    const { container } = render(
      <Property label="Status" className="mt-2">
        <span>Done</span>
      </Property>,
    )
    expect(container.firstElementChild!.className).toContain('mt-2')
  })
})
