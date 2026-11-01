// @vitest-environment jsdom
/**
 * What the layout owns, pinned (Katerina, 31 October): a press anywhere on a card opens its thread, and in one column
 * a second press closes it; the replies row says it is open; a comment with no replies opens to its box; and the
 * comment is never redrawn as it opens and closes, so it cannot blink or move.
 */
import { useContext, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ConversationCard } from './ConversationCard'
import { ConversationLayout, type ConversationItem } from './ConversationLayout'
import { Thread } from './Thread'
import { caretOnOpen } from './threadCard'

afterEach(cleanup)

const ONE = { name: 'Person one' }

function items(threads: 'beside' | 'under'): ConversationItem[] {
  const thread = (words: string) =>
    threads === 'under' ? (
      <Thread place="under" box={<p>Box of {words}</p>}>
        {words === 'With replies' ? <p>A reply</p> : undefined}
      </Thread>
    ) : (
      <Thread start={{ author: ONE, time: '11:08 AM', words }} box={<p>Box of {words}</p>}>
        {words === 'With replies' ? <p>A reply</p> : undefined}
      </Thread>
    )
  return [
    {
      id: 'a',
      card: (
        <ConversationCard author={ONE} time="11:08 AM" replies={{ count: 1 }}>
          With replies
        </ConversationCard>
      ),
      thread: thread('With replies'),
    },
    {
      id: 'b',
      card: (
        <ConversationCard author={ONE} time="11:30 AM">
          No replies yet
        </ConversationCard>
      ),
      thread: thread('No replies yet'),
    },
  ]
}

/** The app keeps `open`, as it does in every app; the layout asks with onOpenChange. */
function Layout({ threads, start, asked }: { threads: 'beside' | 'under'; start?: string; asked?: (id: string | undefined) => void }) {
  const [open, setOpen] = useState<string | undefined>(start)
  return (
    <ConversationLayout
      threads={threads}
      items={items(threads)}
      open={open}
      onOpenChange={(id) => {
        asked?.(id)
        setOpen(id)
      }}
    />
  )
}

describe('ConversationLayout, one column', () => {
  it('opens a thread from a press anywhere on its card, and closes it with a second', () => {
    const asked = vi.fn()
    render(<Layout threads="under" asked={asked} />)
    fireEvent.click(screen.getByText('With replies'))
    expect(asked).toHaveBeenLastCalledWith('a')
    expect(screen.getByText('A reply')).toBeTruthy()
    fireEvent.click(screen.getByText('With replies'))
    expect(asked).toHaveBeenLastCalledWith(undefined)
    expect(screen.queryByText('A reply')).toBeNull()
  })

  it('says on the replies row that the thread is open, and the row closes it once, not twice', () => {
    render(<Layout threads="under" start="a" />)
    const row = screen.getByRole('button', { name: '1 reply, close the thread' })
    expect(row.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(row)
    expect(screen.queryByText('A reply')).toBeNull()
    expect(screen.getByRole('button', { name: '1 reply, open the thread' }).getAttribute('aria-expanded')).toBe('false')
  })

  it('opens a comment with no replies to its box', () => {
    render(<Layout threads="under" />)
    fireEvent.click(screen.getByText('No replies yet'))
    expect(screen.getByText('Box of No replies yet')).toBeTruthy()
  })

  it('never redraws the comment as its thread opens and closes: the same element, in the same card', () => {
    render(<Layout threads="under" />)
    const words = screen.getByText('With replies')
    const item = words.closest('[data-conversation-item]')
    fireEvent.click(words)
    expect(screen.getByText('With replies')).toBe(words)
    expect(words.closest('[data-conversation-item]')).toBe(item)
    expect(item?.hasAttribute('data-open')).toBe(true)
    fireEvent.click(words)
    expect(screen.getByText('With replies')).toBe(words)
    expect(item?.hasAttribute('data-open')).toBe(false)
  })

  it('opens only one thread: a press on another closes the first', () => {
    render(<Layout threads="under" start="a" />)
    fireEvent.click(screen.getByText('No replies yet'))
    expect(screen.queryByText('A reply')).toBeNull()
    expect(screen.getByText('Box of No replies yet')).toBeTruthy()
  })
})

describe('ConversationLayout, one column, its groups', () => {
  const grouped = (): ConversationItem[] => [
    { id: 'a', card: <ConversationCard author={ONE} time="11:08 AM">Still open</ConversationCard>, thread: <Thread place="under" /> },
    { id: 'b', resolved: true, card: <ConversationCard author={ONE} time="11:30 AM" resolved={{ by: 'Person two' }}>Done with</ConversationCard>, thread: <Thread place="under" /> },
    { id: 'c', gone: true, card: <ConversationCard author={ONE} time="11:40 AM">On deleted words</ConversationCard>, thread: <Thread place="under" /> },
    { id: 'd', gone: true, resolved: true, card: <ConversationCard author={ONE} time="11:50 AM" resolved={{ by: 'Person two' }}>Both</ConversationCard>, thread: <Thread place="under" /> },
  ]

  it('puts the resolved and those on a deleted part closed under their names at the end, with how many; resolved wins', () => {
    render(<ConversationLayout threads="under" items={grouped()} />)
    const deleted = screen.getByRole('button', { name: /^On deleted blocks/ })
    const resolved = screen.getByRole('button', { name: /^Resolved/ })
    expect(deleted.getAttribute('aria-expanded')).toBe('false')
    expect(resolved.getAttribute('aria-expanded')).toBe('false')
    // How many, beside each name: 1 after "On deleted blocks", 2 after "Resolved".
    const after = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    const one = screen.getByText('1')
    const two = screen.getByText('2')
    expect(after(deleted, one) && after(one, resolved) && after(resolved, two)).toBe(true)
    expect(screen.getByText('Still open').closest('[hidden]')).toBeNull()
    for (const words of ['Done with', 'On deleted words', 'Both']) expect(screen.getByText(words).closest('[hidden]')).not.toBeNull()
    // In this order: the open ones, then the deleted, then the resolved.
    const [open, onDeleted, done] = ['Still open', 'On deleted words', 'Done with'].map((w) => screen.getByText(w))
    expect(after(open, onDeleted) && after(onDeleted, done)).toBe(true)
  })

  it('opens a group for the thread open in it', () => {
    render(<ConversationLayout threads="under" items={grouped()} open="b" onOpenChange={() => {}} />)
    expect(screen.getByRole('button', { name: /^Resolved/ }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /^On deleted blocks/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('draws no group when nothing is resolved or on a deleted part, and none in two columns', () => {
    render(<ConversationLayout threads="under" items={grouped().slice(0, 1)} />)
    expect(screen.queryByRole('button', { name: /^Resolved/ })).toBeNull()
    cleanup()
    render(<ConversationLayout threads="beside" items={grouped()} />)
    expect(screen.queryByRole('button', { name: /^Resolved/ })).toBeNull()
    expect(screen.getByText('Done with').closest('[hidden]')).toBeNull()
  })
})

/** A box that says how many times it was asked to take the caret. */
function CaretBox() {
  return <p>Caret {useContext(caretOnOpen)}</p>
}

describe('ConversationLayout, Reply on the open comment (the review, 1 November)', () => {
  it('asks the app for nothing, and puts the caret in its box again', () => {
    const asked = vi.fn()
    const items: ConversationItem[] = [
      {
        id: 'a',
        card: (
          <ConversationCard author={ONE} time="11:08 AM">
            Open one
          </ConversationCard>
        ),
        thread: <Thread place="under" box={<CaretBox />} />,
      },
    ]
    render(<ConversationLayout threads="under" items={items} open="a" onOpenChange={asked} />)
    expect(screen.getByText('Caret 0')).toBeTruthy()
    fireEvent.mouseEnter(screen.getByText('Open one'))
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(asked).not.toHaveBeenCalled()
    expect(screen.getByText('Caret 1')).toBeTruthy()
  })
})

describe('ConversationLayout, two columns', () => {
  it('opens a thread beside from a press on its card, and a second press keeps it open', () => {
    const asked = vi.fn()
    render(<Layout threads="beside" asked={asked} />)
    fireEvent.click(screen.getByText('With replies'))
    expect(asked).toHaveBeenLastCalledWith('a')
    expect(screen.getByText('A reply')).toBeTruthy()
    fireEvent.click(screen.getAllByText('With replies')[0])
    expect(asked).toHaveBeenLastCalledWith('a')
  })
})

describe('ConversationLayout, with no onOpenChange', () => {
  it('leaves the cards as the app wired them: a press opens nothing', () => {
    render(<ConversationLayout threads="under" items={items('under')} />)
    fireEvent.click(screen.getByText('With replies'))
    expect(screen.queryByText('A reply')).toBeNull()
  })
})

describe('ConversationLayout, read-only (an archived file)', () => {
  const readOnly = (): ConversationItem[] => [
    {
      id: 'a',
      card: (
        <ConversationCard author={ONE} time="11:08 AM" replies={{ count: 1 }} readOnly>
          With replies
        </ConversationCard>
      ),
      thread: (
        <Thread start={{ author: ONE, time: '11:08 AM', words: 'With replies' }}>
          <p>A reply</p>
        </Thread>
      ),
    },
    {
      id: 'b',
      card: (
        <ConversationCard author={ONE} time="11:30 AM" readOnly>
          No replies yet
        </ConversationCard>
      ),
      thread: <Thread start={{ author: ONE, time: '11:30 AM', words: 'No replies yet' }} />,
    },
  ]

  it('opens a comment with replies to read them, and a comment with none opens nothing (Peek’s way)', () => {
    const asked = vi.fn()
    render(<ConversationLayout threads="beside" items={readOnly()} onOpenChange={asked} />)
    fireEvent.click(screen.getByText('No replies yet'))
    expect(asked).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('With replies'))
    expect(asked).toHaveBeenLastCalledWith('a')
  })
})

describe('ConversationLayout, two columns, what an app with its own list keeps (Peek, 1 November)', () => {
  const card = (words: string) => (
    <ConversationCard author={ONE} time="11:08 AM">
      {words}
    </ConversationCard>
  )
  const dayItems: ConversationItem[] = [
    { id: 'a', card: card('Monday one'), day: 'Monday' },
    { id: 'b', card: card('Monday two'), day: 'Monday', before: <p>New</p> },
    { id: 'c', card: card('Today one'), day: 'Today' },
  ]

  it('names each day once, over its own stretch of comments, the line staying at the top while its stretch scrolls', () => {
    render(<ConversationLayout threads="beside" items={dayItems} />)
    const monday = screen.getByRole('separator', { name: 'Monday' })
    const today = screen.getByRole('separator', { name: 'Today' })
    expect(screen.getAllByRole('separator', { name: 'Monday' }).length).toBe(1)
    expect(monday.className).toContain('sticky')
    // Each line is held by its own day's stretch, so the next day's line pushes it away.
    expect(monday.parentElement?.textContent).toContain('Monday two')
    expect(monday.parentElement?.textContent).not.toContain('Today one')
    expect(today.parentElement?.textContent).toContain('Today one')
  })

  it('draws a comment’s `before` just above it, outside its card', () => {
    render(<ConversationLayout threads="beside" items={dayItems} />)
    const line = screen.getByText('New')
    const item = document.querySelector('[data-conversation-item="b"]')!
    expect(line.nextElementSibling).toBe(item)
  })

  it('gives the app its scrolling box and says when it scrolled', () => {
    const ref = { current: null as HTMLDivElement | null }
    const scrolled = vi.fn()
    render(<ConversationLayout threads="beside" items={dayItems} bodyRef={ref} onBodyScroll={scrolled} />)
    expect(ref.current?.contains(document.querySelector('[data-conversation-item="a"]'))).toBe(true)
    fireEvent.scroll(ref.current!)
    expect(scrolled).toHaveBeenCalled()
  })

  it('sits a short conversation on its box: the room it leaves is above it, under `top`', () => {
    render(<ConversationLayout threads="beside" items={dayItems} top={<p>Archived</p>} below={<p>Reactions note</p>} box={<p>The box</p>} />)
    const top = screen.getByText('Archived').parentElement!
    const room = top.nextElementSibling as HTMLElement
    expect(room.className).toContain('flex-1')
    // The room grows only because the scroll content is at least as tall as the column.
    expect(top.parentElement?.className).toContain('min-h-full')
    expect(room.nextElementSibling?.textContent).toContain('Today one')
    // The note is under the comments, in their list.
    const words = ['Today one', 'Reactions note'].map((w) => screen.getByText(w))
    expect(words[0].compareDocumentPosition(words[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('redraws no comment when older ones arrive at the top, a day of their own above (PEE-7)', () => {
    const later: ConversationItem[] = [
      { id: 'b', card: card('Monday one'), day: 'Monday' },
      { id: 'c', card: card('Today one'), day: 'Today' },
    ]
    const { rerender } = render(<ConversationLayout threads="beside" items={later} />)
    const before = ['b', 'c'].map((id) => document.querySelector(`[data-conversation-item="${id}"]`))
    rerender(<ConversationLayout threads="beside" items={[{ id: 'a', card: card('Sunday one'), day: 'Sunday' }, ...later]} />)
    // The same elements, not equal ones: a redrawn card would lose an open menu or dialog.
    ;['b', 'c'].forEach((id, i) => expect(document.querySelector(`[data-conversation-item="${id}"]`)).toBe(before[i]))
  })

  it('draws nothing for a `top` of false, and no `below` while reading', () => {
    const { container } = render(<ConversationLayout threads="beside" items={dayItems} top={false} />)
    expect(container.querySelector('.pt-4.px-4')).toBeNull()
    cleanup()
    render(<ConversationLayout threads="beside" items={[]} loading below={<p>Reactions note</p>} />)
    expect(screen.queryByText('Reactions note')).toBeNull()
  })

  it('keeps its name with the message when the column throws, and the thread beside it stays', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Throws(): never {
      throw new Error('a card that throws')
    }
    render(
      <ConversationLayout
        threads="beside"
        title="A DM with Person one"
        items={[{ id: 'x', card: <Throws />, thread: <p>The thread</p> }]}
        open="x"
      />,
    )
    expect(screen.getByText('A DM with Person one')).toBeTruthy()
    expect(screen.getByText('The thread')).toBeTruthy()
    quiet.mockRestore()
  })

  it('says an empty conversation in the app’s own words, or nothing', () => {
    render(<ConversationLayout threads="beside" items={[]} empty={<p>The relay could not be reached.</p>} />)
    expect(screen.getByText('The relay could not be reached.')).toBeTruthy()
    cleanup()
    render(<ConversationLayout threads="beside" items={[]} empty={null} />)
    expect(screen.queryByText('No comments yet.')).toBeNull()
  })
})

/**
 * The right column holds what the page shows beside its comments when no thread is open (B1 of the audit of 2 November):
 * Peek's Overview, which Peek drew in a 380px column of its own, with the thread put in it by hand. Now the layout's
 * 384px column holds both.
 */
describe('ConversationLayout, two columns, the right column', () => {
  const column = () => document.querySelector('.border-l') as HTMLElement | null

  it('shows the app’s aside while no thread is open, and the thread in its place while one is', () => {
    function Page() {
      const [open, setOpen] = useState<string | undefined>()
      return <ConversationLayout threads="beside" items={items('beside')} open={open} onOpenChange={setOpen} aside={<p>The overview</p>} />
    }
    render(<Page />)
    expect(column()?.textContent).toBe('The overview')
    expect(column()?.className).toContain('w-[384px]')
    fireEvent.click(screen.getByText('With replies'))
    expect(screen.queryByText('The overview')).toBeNull()
    expect(column()?.textContent).toContain('A reply')
  })

  it('a thread the app draws only while it is open (a function) opens from its card, and is drawn only then', () => {
    const drawn = vi.fn((words: string) => <Thread start={{ author: ONE, time: '11:08 AM', words }}><p>Replies to {words}</p></Thread>)
    function Page() {
      const [open, setOpen] = useState<string | undefined>()
      const list: ConversationItem[] = ['First', 'Second'].map((words) => ({
        id: words,
        card: <ConversationCard author={ONE} time="11:08 AM">{words}</ConversationCard>,
        thread: () => drawn(words),
      }))
      return <ConversationLayout threads="beside" items={list} open={open} onOpenChange={setOpen} />
    }
    render(<Page />)
    expect(drawn).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Second'))
    expect(screen.getByText('Replies to Second')).toBeTruthy()
    expect(drawn.mock.calls.every(([words]) => words === 'Second')).toBe(true)
  })

  it('keeps the comments when what is in the column throws: the column says so in its place', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Throws(): never {
      throw new Error('an aside that throws')
    }
    render(<ConversationLayout threads="beside" items={items('beside')} aside={<Throws />} />)
    expect(screen.getByText('With replies')).toBeTruthy()
    expect(column()?.textContent).toContain('Something went wrong in the thread panel.')
    quiet.mockRestore()
  })

  it('draws no column with no aside and no thread open', () => {
    render(<ConversationLayout threads="beside" items={items('beside')} />)
    expect(column()).toBeNull()
  })
})
