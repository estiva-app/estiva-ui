// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ReactionHorizon } from './ReactionHorizon'

afterEach(cleanup)

describe('ReactionHorizon', () => {
  it('says how far back reactions are read, in the kit’s words', () => {
    render(<ReactionHorizon limit={100} omitted={3} />)
    expect(screen.getByText(/the latest 100 comments and replies here\. 3 older ones were not checked\./)).toBeTruthy()
  })

  it('in the app’s own noun: Peek’s messages', () => {
    render(<ReactionHorizon limit={100} omitted={1} noun="messages" />)
    expect(screen.getByText(/the latest 100 messages and replies here\. 1 older one was not checked\./)).toBeTruthy()
  })

  it('draws nothing when every one was checked and the read was whole', () => {
    const { container } = render(<ReactionHorizon limit={100} omitted={0} />)
    expect(container.textContent).toBe('')
  })
})

/**
 * While older comments are still read, the line keeps its room (Peek's PEE-7): the whole read will say it, so the
 * newest comments do not move up when the rest lands under a reader at the bottom. Before, Peek drew a second,
 * invisible line of its own for it.
 */
describe('ReactionHorizon, keeping its room', () => {
  it('holds the room of the one-older line, unseen and unread, while it has nothing to say yet', () => {
    const { container } = render(<ReactionHorizon limit={100} omitted={0} noun="messages" keepRoom />)
    const kept = container.querySelector('p')
    expect(kept).not.toBeNull()
    expect(kept?.getAttribute('aria-hidden')).toBe('true')
    expect(kept?.className).toContain('invisible')
    // The room of the line it will be: Peek's copy said one older one.
    expect(kept?.textContent).toBe('Reactions are shown for the latest 100 messages and replies here. 1 older one was not checked.')
  })

  it('says the line itself once it has something to say', () => {
    const { container } = render(<ReactionHorizon limit={100} omitted={4} keepRoom />)
    expect(container.querySelectorAll('p').length).toBe(1)
    expect(container.querySelector('[aria-hidden]')).toBeNull()
    expect(screen.getByText(/4 older ones were not checked\./)).toBeTruthy()
  })

  it('keeps the room under a cut read’s line too, as Peek drew both', () => {
    const { container } = render(<ReactionHorizon limit={100} omitted={0} cut keepRoom />)
    const lines = container.querySelectorAll('p')
    expect(lines.length).toBe(2)
    expect(lines[0].textContent).toBe('Some reactions may be missing.')
    expect(lines[1].getAttribute('aria-hidden')).toBe('true')
  })
})
