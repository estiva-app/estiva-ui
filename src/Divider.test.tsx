// @vitest-environment jsdom
/** What the Divider page claims, pinned: the role, and a label that names the line. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Divider } from './Divider'

afterEach(cleanup)

describe('Divider', () => {
  it('is a separator, horizontal by default', () => {
    render(<Divider />)
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('is Base UI’s Separator: the orientation is also a data attribute, for both orientations', () => {
    render(
      <>
        <Divider />
        <Divider orientation="vertical" />
        <Divider label="Today" />
      </>,
    )
    const [horizontal, vertical, labelled] = screen.getAllByRole('separator')
    expect(horizontal.getAttribute('data-orientation')).toBe('horizontal')
    expect(vertical.getAttribute('aria-orientation')).toBe('vertical')
    expect(vertical.getAttribute('data-orientation')).toBe('vertical')
    expect(labelled.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('with a label, the separator is named by it and the words are drawn once', () => {
    render(<Divider label="New since you last read this" tone="warning" />)
    const rule = screen.getByRole('separator', { name: 'New since you last read this' })
    expect(rule.textContent).toBe('New since you last read this')
    expect(rule.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
  })

  it('vertical ignores a label — there is no middle to put it in', () => {
    render(<Divider orientation="vertical" label="Nope" />)
    expect(screen.getByRole('separator').textContent).toBe('')
  })
})
