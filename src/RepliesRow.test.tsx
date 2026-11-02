// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RepliesRow } from './RepliesRow'

afterEach(cleanup)

describe('RepliesRow', () => {
  it('says how many, in one or many', () => {
    render(<RepliesRow count={1} />)
    expect(screen.getByText('1 reply')).toBeTruthy()
    cleanup()
    render(<RepliesRow count={3} />)
    expect(screen.getByText('3 replies')).toBeTruthy()
  })

  it('opens the thread with a press, and says whether it opens or closes it', () => {
    const onOpen = vi.fn()
    render(<RepliesRow count={2} onOpen={onOpen} />)
    const row = screen.getByRole('button', { name: '2 replies, open the thread' })
    expect(row.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(row)
    expect(onOpen).toHaveBeenCalledOnce()
    cleanup()
    render(<RepliesRow count={2} onOpen={onOpen} open />)
    expect(screen.getByRole('button', { name: '2 replies, close the thread' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('is no button of its own without onOpen: the card round it opens the thread', () => {
    render(<RepliesRow count={2} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('says "1 new" until it is read', () => {
    render(<RepliesRow count={2} isNew />)
    expect(screen.getByText('1 new')).toBeTruthy()
    cleanup()
    render(<RepliesRow count={2} />)
    expect(screen.queryByText('1 new')).toBeNull()
  })

  it('shows the last reply’s time, and the faces in place of the icon', () => {
    const { container } = render(<RepliesRow count={2} last="11:52 AM" faces={[{ name: 'Person two' }, { name: 'Person three' }]} />)
    expect(screen.getByText('11:52 AM')).toBeTruthy()
    expect(container.querySelectorAll('img, [data-avatar], [aria-label="Person two"]').length).toBeGreaterThan(0)
  })
})

describe('RepliesRow, how many are new (newCount)', () => {
  it('says how many replies are new, not "1 new" whatever the count (Ship: "3 replies, 2 new")', () => {
    render(<RepliesRow count={3} newCount={2} />)
    expect(screen.getByText('2 new')).toBeTruthy()
    expect(screen.queryByText('1 new')).toBeNull()
  })

  it('says nothing new when none is, whatever isNew says', () => {
    render(<RepliesRow count={3} newCount={0} isNew />)
    expect(screen.queryByText(/ new$/)).toBeNull()
  })

  it('says how many are new in the name a press reads, before what the press does', () => {
    render(<RepliesRow count={3} newCount={2} onOpen={() => {}} />)
    expect(screen.getByRole('button', { name: '3 replies, 2 new, open the thread' })).toBeTruthy()
  })

  it('with isNew alone, says "1 new" and keeps its name as it was (Peek passes no count)', () => {
    render(<RepliesRow count={3} isNew onOpen={() => {}} />)
    expect(screen.getByText('1 new')).toBeTruthy()
    expect(screen.getByRole('button', { name: '3 replies, open the thread' })).toBeTruthy()
  })
})
