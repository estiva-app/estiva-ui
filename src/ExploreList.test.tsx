// @vitest-environment jsdom
/**
 * What the page claims: the tabs carry their counts; search finds a name by the starts of its words; Join only on a live
 * place you are not in, waiting while it is on its way; an empty tab, no match and a page that did not load each say
 * so in words.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreList, exploreWords, findsByWordStart, type ExploreRow, type ExploreTab } from './ExploreList'

afterEach(cleanup)

const row = (id: string, label: string, more: Partial<ExploreRow> = {}): ExploreRow => ({ id, label, href: `/${id}`, team: 'Team one', active: '2h ago', yours: false, archived: false, ...more })
const mine = row('1', 'Item one', { yours: true })
const other = row('2', 'Item two')
const old = row('3', 'Item three', { archived: true })
const words = exploreWords({ one: 'item', many: 'items', a: 'an' })
const icon = <span aria-hidden />
const lists: Record<ExploreTab, ExploreRow[]> = { all: [mine, other], yours: [mine], others: [other], archived: [old] }

describe('ExploreList', () => {
  it('names each tab with its count, in the words made from what it lists', () => {
    render(<ExploreList words={words} icon={icon} lists={lists} tab="all" onTab={() => {}} onRetry={() => {}} onJoin={() => {}} />)
    expect(screen.getByRole('tab', { name: /All.*2/ })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Your items.*1/ })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Archived.*1/ })).toBeTruthy()
  })

  it('offers Join only on a live place you are not in, and holds it while it is on its way', async () => {
    const onJoin = vi.fn()
    const { rerender } = render(<ExploreList words={words} icon={icon} lists={lists} tab="all" onTab={() => {}} onRetry={() => {}} onJoin={onJoin} />)
    const joins = screen.getAllByRole('button', { name: 'Join' })
    expect(joins).toHaveLength(1)
    await userEvent.click(joins[0]!)
    expect(onJoin).toHaveBeenCalledWith(other)
    rerender(<ExploreList words={words} icon={icon} lists={lists} tab="all" onTab={() => {}} onRetry={() => {}} onJoin={onJoin} joining={new Set(['2'])} />)
    expect((screen.getByRole('button', { name: 'Join' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('finds a name by the starts of its words, in any order, and says when nothing matches', async () => {
    render(<ExploreList words={words} icon={icon} lists={lists} tab="all" onTab={() => {}} onRetry={() => {}} onJoin={() => {}} />)
    await userEvent.type(screen.getByLabelText('Find an item'), 'tw it')
    expect(screen.getByText('Item two')).toBeTruthy()
    expect(screen.queryByText('Item one')).toBeNull()
    await userEvent.clear(screen.getByLabelText('Find an item'))
    await userEvent.type(screen.getByLabelText('Find an item'), 'tem')
    expect(screen.getByText('No item matches “tem”.')).toBeTruthy()
    expect(findsByWordStart('Item two', 'two IT')).toBe(true)
  })

  it('says an empty tab in words, and the first tab’s words when nothing is listed at all', () => {
    const none: Record<ExploreTab, ExploreRow[]> = { all: [], yours: [], others: [], archived: [] }
    render(<ExploreList words={words} icon={icon} lists={none} tab="yours" onTab={() => {}} onRetry={() => {}} onJoin={() => {}} />)
    expect(screen.getByText('No items yet.')).toBeTruthy()
  })

  it('says a page that did not load, with Try again', async () => {
    const onRetry = vi.fn()
    render(<ExploreList words={words} icon={icon} lists="failed" tab="all" onTab={() => {}} onRetry={onRetry} onJoin={() => {}} />)
    expect(screen.getByText('Items didn’t load.')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
