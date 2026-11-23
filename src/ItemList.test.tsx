// @vitest-environment jsdom
/**
 * What the page claims: every row has the same four cells; a fact given is drawn, one the kind has not (`null`) is an
 * empty cell, one not read yet (left out) is the dash; a status is its words; a place with nobody in it says 0; rows
 * under a row fold.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemList, type ItemListRow } from './ItemList'

afterEach(cleanup)

const icon = <span aria-hidden />
const cellsOf = (name: string) => within(screen.getByText(name).closest('[role=row]') as HTMLElement).getAllByRole('cell').map((cell) => cell.textContent)

describe('ItemList', () => {
  it('heads nothing on screen and gives every row Status, People, Progress and When', () => {
    render(<ItemList aria-label="Group one" rows={[{ id: '1', label: 'Item one', icon, href: '/one', status: { label: 'In Progress', colour: 'blue' }, people: null, progress: null, when: 'Ana, 1h ago' }]} />)
    expect(screen.getByRole('table', { name: 'Group one' })).toBeTruthy()
    expect(cellsOf('Item one')).toEqual(['Item one', 'In Progress', '', '', 'Ana, 1h ago'])
  })

  // Ship's lists of several kinds keep one set of columns (18 November): a fact a kind has not is nothing, one not read is a dash.
  it('draws an empty cell for a fact its kind has not and the dash for one not read yet', () => {
    const rows: ItemListRow[] = [{ id: '1', label: 'Item one', icon, status: null, progress: null }]
    render(<ItemList aria-label="Group one" rows={rows} />)
    expect(cellsOf('Item one')).toEqual(['Item one', '', '–', '', '–'])
  })

  it('says 0 for a place nobody is in, and draws the members pill for one people are in', () => {
    render(
      <ItemList
        aria-label="Group one"
        rows={[
          { id: '1', label: 'Item one', icon, people: { members: { faces: [], count: 0 } } },
          { id: '2', label: 'Item two', icon, people: { members: { faces: [{ name: 'Ana Duarte' }], count: 4 } } },
        ]}
      />,
    )
    expect(cellsOf('Item one')[2]).toBe('0')
    expect(cellsOf('Item two')[2]).toContain('4')
  })

  it('folds the rows under a row, shut until its arrow is pressed', async () => {
    render(<ItemList aria-label="Group one" rows={[{ id: '1', label: 'Item one', icon, href: '/one', rows: [{ id: '2', label: 'Item two', icon, href: '/two' }] }]} />)
    expect(screen.queryByRole('link', { name: 'Item two' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Show what is under Item one' }))
    expect(screen.getByRole('link', { name: 'Item two' })).toBeTruthy()
  })

  it("opens another app's file in a new tab", () => {
    render(<ItemList aria-label="Group one" rows={[{ id: '1', label: 'Item one', icon, href: 'https://elsewhere.example/one', external: true }]} />)
    expect(screen.getByRole('link', { name: 'Item one' }).getAttribute('target')).toBe('_blank')
  })
})
