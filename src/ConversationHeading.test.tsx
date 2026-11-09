// @vitest-environment jsdom
/**
 * What the ConversationHeading page claims, pinned: in a card's `heading`, the
 * place's name sits above the author's, inside the card; pressing the name opens
 * the place and never the thread; a deleted comment keeps its heading.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationCard } from './ConversationCard'
import { ConversationHeading } from './ConversationHeading'

afterEach(cleanup)

const ICON = <svg data-testid="icon" />

describe('ConversationHeading', () => {
  it('draws the place above the author, inside the card', () => {
    render(
      <ConversationCard author={{ name: 'Person one' }} time="11:08 AM" heading={<ConversationHeading icon={ICON} name="Item one" onOpen={() => {}} />}>
        The words
      </ConversationCard>,
    )
    const place = screen.getByRole('button', { name: 'Item one' })
    const author = screen.getByText('Person one')
    expect(place.compareDocumentPosition(author) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(place.closest('[data-comment-body]')).toBe(author.closest('[data-comment-body]'))
  })

  it('pressing the name opens the place, not the thread', async () => {
    const onOpen = vi.fn()
    const onClick = vi.fn()
    render(
      <ConversationCard author={{ name: 'Person one' }} time="11:08 AM" onClick={onClick} heading={<ConversationHeading icon={ICON} name="Item one" onOpen={onOpen} />}>
        The words
      </ConversationCard>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Item one' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText('The words'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('a link: a plain click goes to the app to route, never to the thread; a modified click goes to the browser', () => {
    const onOpen = vi.fn()
    const onClick = vi.fn()
    render(
      <ConversationCard author={{ name: 'Person one' }} time="11:08 AM" onClick={onClick} heading={<ConversationHeading icon={ICON} name="Item one" href="/item/one" onOpen={onOpen} />}>
        The words
      </ConversationCard>,
    )
    const link = screen.getByRole('link', { name: 'Item one' })
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    link.dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(true)
    expect(onOpen).toHaveBeenCalledTimes(1)
    const newTab = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true })
    link.dispatchEvent(newTab)
    expect(newTab.defaultPrevented).toBe(false)
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('with nothing to open, the name is plain text', () => {
    render(<ConversationHeading icon={ICON} name="Item one" />)
    expect(screen.getByText('Item one')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('a deleted comment keeps where it was said', () => {
    render(
      <ConversationCard author={{ name: 'Person one' }} time="11:08 AM" deleted heading={<ConversationHeading icon={ICON} name="Item one" />}>
        The words
      </ConversationCard>,
    )
    expect(screen.getByText('Item one')).toBeTruthy()
    expect(screen.queryByText('The words')).toBeNull()
  })
})
