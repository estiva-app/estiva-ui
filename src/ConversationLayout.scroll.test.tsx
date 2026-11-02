// @vitest-environment jsdom
/**
 * Where a conversation scrolls (C1 of the audit of 2 November): Peek's own, moved into ConversationLayout and Thread so
 * every app's conversation reads the same. Two columns open at the newest comment, come back to where the reader left
 * them (by the name the app gives, `rememberAs`), follow what arrives only while the reader is at the bottom, and go
 * down to the reader's own comment as it is sent. A thread opens at its newest reply and goes to each new one. jsdom
 * has no layout: every box here says the same heights, and only the scrolling box's offset is read.
 */
import { useContext, type ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ConversationCard, ReplyCard } from './ConversationCard'
import { ConversationLayout, type ConversationItem } from './ConversationLayout'
import { isNearBottom, NEAR_BOTTOM_PX, places, sendsInLayout, useLeftAt } from './conversationScroll'
import { Thread } from './Thread'

const ONE = { name: 'Person one' }

/** What every box says of its heights, as a test sets them. */
const heights = { scroll: 1000, client: 400 }
const props = ['scrollHeight', 'clientHeight'] as const
const kept = props.map((p) => [p, Object.getOwnPropertyDescriptor(HTMLElement.prototype, p)] as const)
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => heights.scroll })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => heights.client })
})
afterAll(() => {
  for (const [p, d] of kept) if (d) Object.defineProperty(HTMLElement.prototype, p, d)
})
beforeEach(() => {
  heights.scroll = 1000
  heights.client = 400
})
afterEach(cleanup)

const card = (id: string) => ({
  id,
  card: (
    <ConversationCard author={ONE} time="11:08 AM">
      {`Comment ${id}`}
    </ConversationCard>
  ),
})
const many = (n: number): ConversationItem[] => Array.from({ length: n }, (_, i) => card(`c${i}`))

/** The comments' scrolling box, as the layout lends it. */
function Layout({ items, loading = false, rememberAs, box, boxRef }: { items: ConversationItem[]; loading?: boolean; rememberAs?: string; box?: ReactNode; boxRef: { current: HTMLDivElement | null } }) {
  return <ConversationLayout threads="beside" items={items} loading={loading} rememberAs={rememberAs} box={box} bodyRef={boxRef} />
}

/** The reader scrolls the box to `top`. */
function scrollTo(el: HTMLElement, top: number) {
  el.scrollTop = top
  fireEvent.scroll(el)
}

describe('isNearBottom (Peek’s scroll policy, ported)', () => {
  const el = (scrollHeight: number, scrollTop: number, clientHeight: number) => ({ scrollHeight, scrollTop, clientHeight }) as HTMLElement

  it('is true when pinned to the bottom', () => {
    expect(isNearBottom(el(1000, 600, 400))).toBe(true)
  })

  it('is false once you have scrolled up to read', () => {
    expect(isNearBottom(el(1000, 200, 400))).toBe(false)
  })

  it('tolerates the sub-pixel gap a strict check would trip on', () => {
    expect(isNearBottom(el(1000.4, 599.7, 400))).toBe(true)
  })

  it('holds exactly at the threshold, and lets go one pixel past it', () => {
    expect(isNearBottom(el(1000, 600 - NEAR_BOTTOM_PX, 400))).toBe(true)
    expect(isNearBottom(el(1000, 600 - NEAR_BOTTOM_PX - 1, 400))).toBe(false)
  })

  it('is true when there is nothing to scroll', () => {
    expect(isNearBottom(el(400, 0, 400))).toBe(true)
  })
})

describe('ConversationLayout, two columns, where it scrolls', () => {
  it('opens at the newest comment, once the comments are read', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Layout items={[]} loading boxRef={box} />)
    expect(box.current!.scrollTop).toBe(0)
    rerender(<Layout items={many(8)} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1000)
  })

  it('follows a new comment while the reader is at the bottom, and not once they scrolled up to read', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Layout items={many(8)} boxRef={box} />)
    heights.scroll = 1200
    rerender(<Layout items={many(9)} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1200)
    scrollTo(box.current!, 300)
    heights.scroll = 1400
    rerender(<Layout items={many(10)} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(300)
  })

  it('comes back to where it was left, by the name the app gave it', () => {
    const box = { current: null as HTMLDivElement | null }
    const { unmount } = render(<Layout items={many(8)} rememberAs="left-up" boxRef={box} />)
    scrollTo(box.current!, 250)
    unmount()
    render(<Layout items={many(8)} rememberAs="left-up" boxRef={box} />)
    expect(box.current!.scrollTop).toBe(250)
  })

  it('comes back to the newest when it was left at the bottom, with what arrived meanwhile in view', () => {
    const box = { current: null as HTMLDivElement | null }
    const { unmount } = render(<Layout items={many(8)} rememberAs="left-down" boxRef={box} />)
    unmount()
    heights.scroll = 1300
    render(<Layout items={many(10)} rememberAs="left-down" boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1300)
  })

  it('opens another conversation at its newest, and the first where it was left, in one layout', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Layout items={many(8)} rememberAs="one" boxRef={box} />)
    scrollTo(box.current!, 200)
    rerender(<Layout items={many(5)} rememberAs="two" boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1000)
    rerender(<Layout items={many(8)} rememberAs="one" boxRef={box} />)
    expect(box.current!.scrollTop).toBe(200)
  })

  it('comes back to where it was left after another conversation that was still being read', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Layout items={many(8)} rememberAs="before-a-read" boxRef={box} />)
    scrollTo(box.current!, 200)
    rerender(<Layout items={[]} loading rememberAs="being-read" boxRef={box} />)
    // The placeholders are shorter: the browser pulls the offset in, and says so.
    scrollTo(box.current!, 0)
    rerender(<Layout items={many(8)} rememberAs="before-a-read" boxRef={box} />)
    expect(box.current!.scrollTop).toBe(200)
  })

  it('read again under the same name, lands where the reader left it, not where the placeholders pulled it', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Layout items={many(8)} rememberAs="read-again" boxRef={box} />)
    scrollTo(box.current!, 200)
    rerender(<Layout items={[]} loading rememberAs="read-again" boxRef={box} />)
    scrollTo(box.current!, 0)
    rerender(<Layout items={many(8)} rememberAs="read-again" boxRef={box} />)
    expect(box.current!.scrollTop).toBe(200)
  })

  it('without a name, opens at the newest each time it is drawn', () => {
    const box = { current: null as HTMLDivElement | null }
    const { unmount } = render(<Layout items={many(8)} boxRef={box} />)
    scrollTo(box.current!, 250)
    unmount()
    render(<Layout items={many(8)} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1000)
  })

  it('goes down to the reader’s own comment as it is sent, scrolled up or not; a refusal leaves them where they are', () => {
    let sends: { sending: () => void; refused: () => void } | null = null
    function Box() {
      sends = useContext(sendsInLayout)
      return <p>The box</p>
    }
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Layout items={many(8)} box={<Box />} boxRef={box} />)
    expect(sends).not.toBeNull()
    scrollTo(box.current!, 300)
    act(() => sends!.sending())
    heights.scroll = 1200
    rerender(<Layout items={many(9)} box={<Box />} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1200)
    // Scrolled up again; a send that was refused: where the reader is decides what follows next.
    scrollTo(box.current!, 300)
    act(() => sends!.sending())
    act(() => sends!.refused())
    heights.scroll = 1400
    rerender(<Layout items={many(10)} box={<Box />} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(300)
  })

  it('one column keeps where the reader is: it opens at the top, and follows nothing', () => {
    const box = { current: null as HTMLDivElement | null }
    function Under({ n }: { n: number }) {
      return <ConversationLayout threads="under" items={many(n)} bodyRef={box} />
    }
    const { rerender } = render(<Under n={8} />)
    expect(box.current!.scrollTop).toBe(0)
    heights.scroll = 1200
    rerender(<Under n={9} />)
    expect(box.current!.scrollTop).toBe(0)
  })
})

describe('useLeftAt: when the reader left a conversation, for its "New" line', () => {
  function LeftAt({ at, boxRef, items }: { at: string; boxRef: { current: HTMLDivElement | null }; items: ConversationItem[] }) {
    const left = useLeftAt(at)
    return (
      <>
        <output data-testid="left">{left === null ? 'none' : String(left)}</output>
        <Layout items={items} rememberAs={at} boxRef={boxRef} />
      </>
    )
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_800_000_000_000)
  })
  afterEach(() => vi.useRealTimers())

  it('says when it was left away from the newest, taken once as it opens; none when it was left at the bottom or never opened', () => {
    const box = { current: null as HTMLDivElement | null }
    const first = render(<LeftAt at="read-up" items={many(8)} boxRef={box} />)
    expect(screen.getByTestId('left').textContent).toBe('none')
    scrollTo(box.current!, 200)
    vi.setSystemTime(1_800_000_060_000)
    first.unmount()
    vi.setSystemTime(1_800_000_120_000)
    const back = render(<LeftAt at="read-up" items={many(9)} boxRef={box} />)
    expect(screen.getByTestId('left').textContent).toBe('1800000060000')
    // Later scrolling moves the record, not the line.
    scrollTo(box.current!, 1000)
    back.rerender(<LeftAt at="read-up" items={many(9)} boxRef={box} />)
    expect(screen.getByTestId('left').textContent).toBe('1800000060000')
    back.unmount()
    render(<LeftAt at="read-up" items={many(9)} boxRef={box} />)
    expect(screen.getByTestId('left').textContent).toBe('none')
  })

  it('takes it again on the next visit when nothing was shown between, not the last visit’s', () => {
    function Left({ at }: { at: string | null }) {
      const left = useLeftAt(at)
      return <output data-testid="left">{left === null ? 'none' : String(left)}</output>
    }
    places.set('between', { atBottom: false, offset: 10, leftAt: 111 })
    const page = render(<Left at="between" />)
    expect(screen.getByTestId('left').textContent).toBe('111')
    page.rerender(<Left at={null} />)
    expect(screen.getByTestId('left').textContent).toBe('none')
    // Meanwhile the reader read it to the newest and left it there.
    places.set('between', { atBottom: true, offset: 900, leftAt: 222 })
    page.rerender(<Left at="between" />)
    expect(screen.getByTestId('left').textContent).toBe('none')
  })
})

describe('Thread, beside: where it scrolls', () => {
  const START = { id: 't1', author: ONE, time: '11:08 AM', words: 'The comment' }
  function Replies({ n, start = START, boxRef }: { n: number; start?: typeof START; boxRef: { current: HTMLDivElement | null } }) {
    return (
      <Thread start={start} bodyRef={boxRef}>
        {Array.from({ length: n }, (_, i) => (
          <ReplyCard key={i} id={`r${i}`} author={ONE} time="11:30 AM">
            {`Reply ${i}`}
          </ReplyCard>
        ))}
        {/* Not a reply: an app's own line among them (Peek's resolve history) takes it nowhere. */}
        <p>A line of the app’s</p>
      </Thread>
    )
  }

  it('opens at its newest reply', () => {
    const box = { current: null as HTMLDivElement | null }
    render(<Replies n={4} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1000)
  })

  it('goes to each new reply, wherever the reader is in it', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Replies n={4} boxRef={box} />)
    scrollTo(box.current!, 100)
    heights.scroll = 1200
    rerender(<Replies n={5} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1200)
  })

  it('stays where the reader is when nothing new is a reply', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Replies n={4} boxRef={box} />)
    scrollTo(box.current!, 100)
    heights.scroll = 1200
    rerender(<Replies n={4} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(100)
  })

  it('opens another thread at its newest reply, as many replies as it has', () => {
    const box = { current: null as HTMLDivElement | null }
    const { rerender } = render(<Replies n={4} boxRef={box} />)
    scrollTo(box.current!, 100)
    rerender(<Replies n={4} start={{ ...START, id: 't2' }} boxRef={box} />)
    expect(box.current!.scrollTop).toBe(1000)
  })
})
