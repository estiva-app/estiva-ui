// @vitest-environment jsdom
/**
 * What the layout owns, pinned (Katerina, 31 October): a press anywhere on a card opens its thread, and in one column
 * a second press closes it; the replies row says it is open; a comment with no replies opens to its box; and the
 * comment is never redrawn as it opens and closes, so it cannot blink or move.
 */
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ConversationCard } from './ConversationCard'
import { ConversationLayout, type ConversationItem } from './ConversationLayout'
import { Thread } from './Thread'

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
