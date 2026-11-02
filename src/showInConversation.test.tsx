// @vitest-environment jsdom
/**
 * A link to a comment or a reply lands on it (Peek's INT-3, INT-8, moved into the kit for every app, C3 of the audit
 * of 2 November): it is scrolled to the middle of the view and flashed, so the click delivers the comment and not a
 * place near it; one not drawn yet is waited for, a while; one never drawn says so. Peek's own tests, ported, and what
 * the kit adds: an id on every reply it draws.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ReplyCard } from './ConversationCard'
import { ConversationCard } from './ConversationCard'
import { ConversationLayout } from './ConversationLayout'
import { showInConversation, showInConversationWhenDrawn } from './showInConversation'
import { Thread } from './Thread'

let scrollIntoView: ReturnType<typeof vi.fn>
const marked = (selector: string) => document.querySelector(selector)?.getAttribute('data-shown') ?? null

beforeEach(() => {
  vi.useFakeTimers()
  scrollIntoView = vi.fn()
  Element.prototype.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView']
  document.body.innerHTML = `
    <div data-reply-id="r1">first</div>
    <div data-reply-id="r2">second</div>
  `
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('showInConversation', () => {
  it('scrolls the reply into the middle of the view', () => {
    // Centred rather than to the top: the replies around it are what makes it checkable.
    expect(showInConversation('r2')).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('marks the reply it arrived at', () => {
    showInConversation('r1')
    expect(marked('[data-reply-id="r1"]')).toBe('true')
  })

  it('clears the mark, because it marks an arrival and not a state', () => {
    showInConversation('r1')
    vi.advanceTimersByTime(2000)
    expect(marked('[data-reply-id="r1"]')).toBeNull()
  })

  it('does not clear a mark a later show has claimed', () => {
    // Two links pressed in quick succession: the first one's timer must not unmark the second one's arrival.
    showInConversation('r1')
    vi.advanceTimersByTime(1000)
    showInConversation('r1')
    vi.advanceTimersByTime(1000)
    expect(marked('[data-reply-id="r1"]')).toBe('true')
  })

  it('reports false for one that is not drawn', () => {
    // A thread reads its newest first: a reply can sit above what is drawn, and the caller must be able to tell.
    expect(showInConversation('r99')).toBe(false)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does not break on an id with quotes in it', () => {
    document.body.innerHTML = `<div data-reply-id='a"b'>odd</div>`
    expect(showInConversation('a"b')).toBe(true)
  })

  it('finds a thread’s pinned comment, and a comment in the list only when asked to, the thread’s first', () => {
    document.body.innerHTML = `<div data-conversation-item="c1">in the list</div><div data-thread-start="c1">pinned</div><div data-conversation-item="c2">only in the list</div>`
    expect(showInConversation('c2')).toBe(false)
    expect(showInConversation('c1')).toBe(true)
    expect(marked('[data-thread-start="c1"]')).toBe('true')
    expect(marked('[data-conversation-item="c1"]')).toBeNull()
    expect(showInConversation('c2', { comments: true })).toBe(true)
    expect(marked('[data-conversation-item="c2"]')).toBe('true')
  })
})

describe('showInConversationWhenDrawn (INT-8)', () => {
  it('shows at once when it is already there', async () => {
    await expect(showInConversationWhenDrawn('r1')).resolves.toBe(true)
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('waits for a thread that is still being drawn', async () => {
    const pending = showInConversationWhenDrawn('r-late')
    document.body.insertAdjacentHTML('beforeend', '<div data-reply-id="r-late">late</div>')
    await vi.advanceTimersByTimeAsync(100)
    await expect(pending).resolves.toBe(true)
  })

  it('gives up rather than waiting forever: 3 seconds, or as long as asked', async () => {
    const pending = showInConversationWhenDrawn('r-never', { wait: 500 })
    await vi.advanceTimersByTimeAsync(600)
    await expect(pending).resolves.toBe(false)
    expect(scrollIntoView).not.toHaveBeenCalled()
    const longer = showInConversationWhenDrawn('r-never')
    let answer: boolean | undefined
    void longer.then((a) => (answer = a))
    await vi.advanceTimersByTimeAsync(2900)
    expect(answer).toBeUndefined()
    await vi.advanceTimersByTimeAsync(200)
    expect(answer).toBe(false)
  })

  it('a newer show stops an older wait: the reader’s last link is the one that lands', async () => {
    // A link to one not drawn yet, then a link to one that is: the first, drawn later, must not take the view back.
    const first = showInConversationWhenDrawn('r-late')
    expect(showInConversation('r1')).toBe(true)
    document.body.insertAdjacentHTML('beforeend', '<div data-reply-id="r-late">late</div>')
    await vi.advanceTimersByTimeAsync(100)
    await expect(first).resolves.toBe(false)
    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(marked('[data-reply-id="r-late"]')).toBeNull()
    // And a newer wait stops an older one the same way.
    const older = showInConversationWhenDrawn('r-older')
    const newer = showInConversationWhenDrawn('r-newer')
    document.body.insertAdjacentHTML('beforeend', '<div data-reply-id="r-older">older</div><div data-reply-id="r-newer">newer</div>')
    await vi.advanceTimersByTimeAsync(100)
    await expect(older).resolves.toBe(false)
    await expect(newer).resolves.toBe(true)
    expect(marked('[data-reply-id="r-older"]')).toBeNull()
    expect(marked('[data-reply-id="r-newer"]')).toBe('true')
  })

  it('marks the one it eventually lands on', async () => {
    const pending = showInConversationWhenDrawn('r-late')
    document.body.insertAdjacentHTML('beforeend', '<div data-reply-id="r-late">late</div>')
    await vi.advanceTimersByTimeAsync(100)
    await pending
    expect(marked('[data-reply-id="r-late"]')).toBe('true')
  })
})

describe('what the kit draws carries its id', () => {
  const ONE = { name: 'Person one' }

  it('a reply carries its id on its card, with nothing round it of the app’s', () => {
    document.body.innerHTML = ''
    render(
      <Thread start={{ id: 'c1', author: ONE, time: '11:08 AM', words: 'The comment' }}>
        <ReplyCard id="r1" author={ONE} time="11:30 AM">
          A reply
        </ReplyCard>
      </Thread>,
    )
    const card = document.querySelector('[data-reply-id="r1"]')
    expect(card?.textContent).toContain('A reply')
    expect(showInConversation('r1')).toBe(true)
    expect(card?.getAttribute('data-shown')).toBe('true')
    expect(showInConversation('c1')).toBe(true)
  })

  it('a comment in the list is shown when asked to, in either layout', () => {
    for (const threads of ['beside', 'under'] as const) {
      document.body.innerHTML = ''
      render(<ConversationLayout threads={threads} items={[{ id: 'c9', card: <ConversationCard author={ONE} time="11:08 AM">A comment</ConversationCard> }]} />)
      expect(showInConversation('c9', { comments: true })).toBe(true)
      expect(document.querySelector('[data-conversation-item="c9"]')?.getAttribute('data-shown')).toBe('true')
      cleanup()
    }
  })
})
