// @vitest-environment jsdom
/** What the LinkRow page claims, pinned: where the row and its count lead, and when the count shows. */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DELETED, ITEM, ITEM_UNREAD, LOADING, PLACE, ready, SAID, UNAVAILABLE } from './linked.examples'
import { LinkRow } from './LinkRow'

afterEach(cleanup)

describe('LinkRow', () => {
  it('opens what it links from the whole row', () => {
    render(<LinkRow link={ready(ITEM)} preview={false} />)
    expect(screen.getByRole('link', { name: ITEM.title }).getAttribute('href')).toBe('#item')
  })

  it('shows its comment count on every row, and says when something in it is unread', () => {
    const { rerender } = render(<LinkRow link={ready(ITEM)} preview={false} />)
    expect(screen.getByRole('link', { name: /comments — open the conversation/ }).getAttribute('href')).toBe('#item-conversation')
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
    expect(screen.getByText('Issue not available')).toBeTruthy()
  })

  it('says its count whole, one comment or several, never the figure run into the noun', () => {
    const { rerender } = render(<LinkRow link={ready({ ...ITEM, conversation: { count: 1, href: '#c' } })} preview={false} />)
    expect(screen.getByRole('link', { name: '1 comment — open the conversation' })).toBeTruthy()
    rerender(<LinkRow link={ready({ ...ITEM, conversation: { count: 3, href: '#c' } })} preview={false} />)
    expect(screen.getByRole('link', { name: '3 comments — open the conversation' })).toBeTruthy()
    rerender(<LinkRow link={ready({ ...ITEM, conversation: { count: 1, href: '#c', noun: 'conversations' } })} preview={false} />)
    expect(screen.getByRole('link', { name: '1 conversation — open the conversation' })).toBeTruthy()
  })

  it('draws a file with no address to open as words, its title and its count no links', () => {
    const { container } = render(<LinkRow link={ready({ ...ITEM, href: '', conversation: { count: 3, href: '' } })} preview={false} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(container.querySelector('a')).toBeNull()
    expect(screen.getByText(ITEM.title)).toBeTruthy()
    expect(screen.getByText('3 comments')).toBeTruthy()
  })

  it('says it was deleted, apart from not available, with no way out', () => {
    render(<LinkRow link={DELETED} />)
    expect(screen.getByText('Issue deleted')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('draws a person’s words on one line: the face, the name, the words cut to fit, the time', () => {
    render(<LinkRow link={ready(SAID)} preview={false} />)
    const name = screen.getByRole('link', { name: SAID.author!.name })
    const line = name.parentElement!.parentElement!
    expect(line.textContent).toBe(`${SAID.author!.name}${SAID.body}${SAID.updated}`)
  })
})
