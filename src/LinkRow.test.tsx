// @vitest-environment jsdom
/** What the LinkRow page claims, pinned: where the row and its count lead, and when the count shows. */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ITEM, ITEM_UNREAD, LOADING, PLACE, ready, UNAVAILABLE } from './linked.examples'
import { LinkRow } from './LinkRow'

afterEach(cleanup)

describe('LinkRow', () => {
  it('opens what it links from the whole row', () => {
    render(<LinkRow link={ready(ITEM)} preview={false} />)
    expect(screen.getByRole('link', { name: ITEM.title }).getAttribute('href')).toBe('#item')
  })

  it('keeps to one line: the count shows only when something in it is unread', () => {
    const { rerender } = render(<LinkRow link={ready(ITEM)} preview={false} />)
    expect(screen.queryByRole('link', { name: /open the conversation/ })).toBeNull()
    rerender(<LinkRow link={ready(ITEM_UNREAD)} preview={false} />)
    expect(screen.getByRole('link', { name: /unread — open the conversation/ }).getAttribute('href')).toBe('#item-conversation')
  })

  it('always shows the count where conversations are what it holds', () => {
    render(<LinkRow link={ready(PLACE)} preview={false} />)
    expect(screen.getByRole('link', { name: /conversations — open the conversation/ })).toBeTruthy()
  })

  it('while it loads, is busy and leads nowhere yet', () => {
    const { container } = render(<LinkRow link={LOADING} />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('says it is not available in one line', () => {
    render(<LinkRow link={UNAVAILABLE} />)
    expect(screen.getByText('Item — not available.')).toBeTruthy()
  })
})
