// @vitest-environment jsdom
/**
 * What the ConversationPlace page claims, pinned: above a conversation shown
 * away from where it was said, the line says how it is related and where, in
 * the app's words; a place not named yet draws nothing rather than a
 * placeholder; and the row keeps what the app marks it with. Peek's Activity
 * row (TopicActivity), moved.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ConversationPlace } from './ConversationPlace'

afterEach(cleanup)

describe('ConversationPlace', () => {
  it('says how the conversation is related and where it was said, above it', () => {
    render(
      <ConversationPlace relation="Mentioned in" place="Item one">
        <p>The conversation</p>
      </ConversationPlace>,
    )
    const relation = screen.getByText('Mentioned in')
    const place = screen.getByText('Item one')
    const card = screen.getByText('The conversation')
    expect(relation.compareDocumentPosition(place) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(place.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('a place not named yet draws nothing beside the relation, never a placeholder', () => {
    const { container } = render(
      <ConversationPlace relation="On an item">
        <p>The conversation</p>
      </ConversationPlace>,
    )
    expect(screen.getByText('On an item')).toBeTruthy()
    expect(container.textContent).toBe('On an itemThe conversation')
    cleanup()
    const empty = render(<ConversationPlace relation="On an item" place="" />)
    expect(empty.container.textContent).toBe('On an item')
  })

  it('keeps what the app marks the row with, so the app can find it', () => {
    const { container } = render(
      <ConversationPlace relation="Mentioned in" place="Item one" data-relation="mention">
        <p>The conversation</p>
      </ConversationPlace>,
    )
    const row = container.querySelector('[data-relation="mention"]')
    expect(row?.textContent).toBe('Mentioned inItem oneThe conversation')
  })
})
