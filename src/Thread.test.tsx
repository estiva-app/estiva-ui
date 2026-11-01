// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Thread } from './Thread'

afterEach(cleanup)

const START = { author: { name: 'Person one' }, time: '11:08 AM', words: 'The comment it answers' }

describe('Thread, beside (the right column)', () => {
  it('pins the comment it answers at the top, then "Replies", then the replies, and the box under them', () => {
    render(
      <Thread start={START} box={<p>The box</p>}>
        <p>A reply</p>
      </Thread>,
    )
    const order = ['The comment it answers', 'A reply', 'The box'].map((words) => screen.getByText(words))
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // "Replies" twice: the column's name, and the line between the comment and its replies.
    expect(screen.getAllByText('Replies').length).toBe(2)
  })

  it('says when nobody replied yet, and shows placeholders while reading', () => {
    render(<Thread start={START} />)
    expect(screen.getByText('No replies yet.')).toBeTruthy()
    cleanup()
    render(<Thread start={START} loading />)
    expect(screen.queryByText('No replies yet.')).toBeNull()
  })

  it('closes with its Close button, and says "Resolved" at the top when it is', () => {
    const onClose = vi.fn()
    render(<Thread start={START} resolved onClose={onClose} />)
    expect(screen.getByText('Resolved')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('says why no reply can be written in place of the box', () => {
    render(<Thread start={START} box={<p>The box</p>} notice={<p>This file is archived.</p>} />)
    expect(screen.getByText('This file is archived.')).toBeTruthy()
    expect(screen.queryByText('The box')).toBeNull()
  })
})

describe('Thread, under its comment (one column)', () => {
  it('draws no header, no Close and no pinned comment: its replies, then the box', () => {
    render(
      <Thread place="under" start={START} onClose={() => {}} box={<p>The box</p>}>
        <p>A reply</p>
      </Thread>,
    )
    expect(screen.queryByText('Replies')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(screen.queryByText('The comment it answers')).toBeNull()
    const reply = screen.getByText('A reply')
    expect(reply.compareDocumentPosition(screen.getByText('The box')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('with no replies yet, only the box: no line saying so', () => {
    const { container } = render(<Thread place="under" box={<p>The box</p>} />)
    expect(screen.getByText('The box')).toBeTruthy()
    expect(screen.queryByText('No replies yet.')).toBeNull()
    expect(container.querySelector('[data-thread-replies]')).toBeNull()
  })
})
