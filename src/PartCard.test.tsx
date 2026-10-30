// @vitest-environment jsdom
/** What the PartCard page claims, pinned: the header opens what it is part of, the blocks draw, and the states say so. */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PartCard } from './PartCard'

afterEach(cleanup)

describe('PartCard', () => {
  it('opens what it is part of from its header, and draws the blocks it is given', () => {
    render(
      <PartCard kind="issue" heading="Item one" partKey="ABC-2" href="#part">
        <p>The blocks</p>
      </PartCard>,
    )
    expect(screen.getByRole('link', { name: 'Item one' }).getAttribute('href')).toBe('#part')
    // The key under the heading, as a card's second line.
    expect(screen.getByText('A part of ABC-2')).toBeTruthy()
    expect(screen.getByText('The blocks')).toBeTruthy()
  })

  it('says a part is not available in words', () => {
    render(<PartCard state="unavailable" kind="issue" noun="Issue" />)
    expect(screen.getByText('A part of this issue not available')).toBeTruthy()
  })

  it('says what became of a part in the SPEC’s words: deleted with its file, its block deleted, or no part to show', () => {
    render(<PartCard state="deleted" kind="issue" noun="Issue" />)
    expect(screen.getByText('A part of this issue deleted')).toBeTruthy()
    cleanup()
    render(<PartCard state="detached" kind="issue" heading="Item one" href="#part" />)
    expect(screen.getByText('This part was deleted')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
    cleanup()
    // What it is part of has no blocks: the words open the whole of it.
    render(<PartCard state="unaddressable" kind="file" heading="Item one" href="#whole" />)
    expect(screen.getByRole('link', { name: "This part can't be shown" }).getAttribute('href')).toBe('#whole')
  })

  it('while it loads, is busy and shows nothing of it', () => {
    const { container } = render(<PartCard state="loading" kind="issue" />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
