// @vitest-environment jsdom
/**
 * What reads a comment or a reply (Katerina, 30 October): being on screen for a moment, not being drawn. Peek's own
 * hook and its tests, moved into the kit (C2 of the audit of 2 November): an app says which conversation or thread it
 * is (`useSeenOnScreen(key)`), hands what it returns to the layout or the thread (`seen`), and reads back what was seen.
 * A stand-in IntersectionObserver says what shows.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { ConversationCard, ReplyCard } from './ConversationCard'
import { ConversationLayout } from './ConversationLayout'
import { useSeenOnScreen } from './seenOnScreen'
import { Thread } from './Thread'

/** The moment a comment must stay on screen: Peek's READ_DWELL_MS. */
const DWELL = 1500
const ONE = { name: 'Person one' }

let observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = []
class FakeObserver {
  targets: Element[] = []
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    observers.push(this)
  }
  observe(target: Element) {
    this.targets.push(target)
  }
  disconnect() {
    this.targets = []
  }
  unobserve() {}
  takeRecords() {
    return []
  }
}

/** Says how much of the comment or reply `id` shows: its share of the card and its height on screen. */
function show(id: string, ratio: number, height = 60 * ratio) {
  const target = document.querySelector(`[data-conversation-item="${id}"], [data-reply-id="${id}"]`)!
  act(() => {
    for (const o of observers) {
      if (!o.targets.includes(target)) continue
      const entry = { target, isIntersecting: ratio > 0, intersectionRatio: ratio, intersectionRect: { height } } as unknown as IntersectionObserverEntry
      o.callback([entry], o as unknown as IntersectionObserver)
    }
  })
}

const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

function Comments({ ids, at = 'conversation' }: { ids: string[]; at?: string | null }) {
  const seen = useSeenOnScreen(at)
  return (
    <>
      <ConversationLayout
        threads="beside"
        seen={seen}
        items={ids.map((id) => ({
          id,
          card: (
            <ConversationCard author={ONE} time="11:08 AM">
              {id}
            </ConversationCard>
          ),
        }))}
      />
      <output data-testid="seen">{[...seen.ids].sort().join(',')}</output>
    </>
  )
}

const seenNow = () => screen.getByTestId('seen').textContent

beforeEach(() => {
  observers = []
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useSeenOnScreen, in a ConversationLayout', () => {
  it('a comment on screen for the dwell is seen; one never shown is not', () => {
    render(<Comments ids={['a', 'b']} />)
    show('a', 1)
    wait(DWELL)
    expect(seenNow()).toBe('a')
  })

  it('scrolling past before the dwell reads nothing', () => {
    render(<Comments ids={['a']} />)
    show('a', 1)
    wait(DWELL - 100)
    show('a', 0)
    wait(DWELL)
    expect(seenNow()).toBe('')
  })

  it('a sliver is not enough; half, or enough of a tall card, is', () => {
    render(<Comments ids={['a', 'b', 'c']} />)
    show('a', 0.2)
    show('b', 0.5)
    show('c', 0.3, 300)
    wait(DWELL)
    expect(seenNow()).toBe('b,c')
  })

  it('a comment drawn later is watched too', () => {
    const { rerender } = render(<Comments ids={['a']} />)
    rerender(<Comments ids={['a', 'b']} />)
    show('b', 1)
    wait(DWELL)
    expect(seenNow()).toBe('b')
  })

  it('a hidden tab reads nothing until it is shown again', () => {
    render(<Comments ids={['a']} />)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    show('a', 1)
    wait(DWELL * 2)
    expect(seenNow()).toBe('')
    hidden.mockReturnValue(false)
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    wait(DWELL)
    expect(seenNow()).toBe('a')
  })

  it('starts again empty for another conversation, and watches nothing while it has none', () => {
    const { rerender } = render(<Comments ids={['a']} />)
    show('a', 1)
    wait(DWELL)
    expect(seenNow()).toBe('a')
    rerender(<Comments ids={['a']} at="another" />)
    expect(seenNow()).toBe('')
    rerender(<Comments ids={['a']} at={null} />)
    show('a', 1)
    wait(DWELL)
    expect(seenNow()).toBe('')
  })
})

describe('useSeenOnScreen, in a Thread', () => {
  function Replies({ ids }: { ids: string[] }) {
    const seen = useSeenOnScreen('thread')
    return (
      <>
        <Thread start={{ author: ONE, time: '11:08 AM', words: 'The comment' }} seen={seen}>
          {ids.map((id) => (
            <ReplyCard key={id} id={id} author={ONE} time="11:30 AM">
              {id}
            </ReplyCard>
          ))}
        </Thread>
        <output data-testid="seen">{[...seen.ids].sort().join(',')}</output>
      </>
    )
  }

  it('a reply on screen for the dwell is seen; one never shown is not', () => {
    render(<Replies ids={['r1', 'r2']} />)
    show('r2', 1)
    wait(DWELL)
    expect(seenNow()).toBe('r2')
  })
})

describe('useSeenOnScreen, where there is no IntersectionObserver (a test’s page)', () => {
  it('everything drawn counts as on screen: the dwell alone decides', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Comments ids={['a', 'b']} />)
    wait(DWELL - 1)
    expect(seenNow()).toBe('')
    wait(1)
    expect(seenNow()).toBe('a,b')
  })
})
