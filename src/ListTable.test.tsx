// @vitest-environment jsdom
/**
 * What the page claims: the headings come from `columns` and the cells line up under them; a dash where a cell is not
 * read; the whole row is the link and its end stays its own control; a row's look has no edge.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListTable, ListTableRow } from './ListTable'

afterEach(cleanup)

const columns = [{ label: 'Team', width: 'large' as const }, { label: 'Active', keep: 'low' as const }]

describe('ListTable', () => {
  it('heads its columns, and each row has one cell per heading, a dash where it is not read', () => {
    render(
      <ListTable aria-label="Items" columns={columns}>
        <ListTableRow href="/one" label="Item one" cells={['Group one', undefined]} />
      </ListTable>,
    )
    const table = screen.getByRole('table', { name: 'Items' })
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Name', 'Team', 'Active'])
    const row = screen.getByText('Item one').closest('[role=row]') as HTMLElement
    expect(within(row).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['Item one', 'Group one', '–'])
  })

  it('makes the whole row its link, and its end its own button', async () => {
    const join = vi.fn()
    render(
      <ListTable aria-label="Items" columns={columns} end>
        <ListTableRow href="/one" label="Item one" cells={['Group one', 'Today']} end={<button onClick={join}>Join</button>} data-item="one" />
      </ListTable>,
    )
    const link = screen.getByRole('link', { name: 'Item one' })
    expect(link.getAttribute('href')).toBe('/one')
    await userEvent.click(screen.getByRole('button', { name: 'Join' }))
    expect(join).toHaveBeenCalledOnce()
    const row = link.closest('[role=row]') as HTMLElement
    expect(row.getAttribute('data-item')).toBe('one')
    expect(row.className).toContain('rounded-lg')
    expect(row.className).not.toMatch(/\bborder\b/)
  })

  it('draws no headings when it has no columns, only the rows', () => {
    render(
      <ListTable aria-label="Items" columns={[]}>
        <ListTableRow href="/one" label="Item one" cells={[]} />
      </ListTable>,
    )
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)
    expect(screen.getByRole('link', { name: 'Item one' })).toBeTruthy()
  })

  it('refuses a row outside a list', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ListTableRow href="/one" label="Item one" cells={[]} />)).toThrow(/inside one/)
  })
})
