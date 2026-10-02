// @vitest-environment jsdom
/**
 * What the page claims: every level is drawn from the one list; only the
 * group holding the current row starts open, and the current row is active;
 * a click reaches onSelect with its node; loading and empty say so.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavTree, type NavTreeGroup } from './NavTree'

afterEach(cleanup)

const GROUPS: NavTreeGroup[] = [
  { id: 'g1', title: 'Group one', nodes: [{ id: 'a', label: 'Item a', href: '#a' }] },
  {
    id: 'g2',
    title: 'Group two',
    nodes: [{ id: 'b', label: 'Item b', href: '#b', children: [{ id: 'c', label: 'Item c', href: '#c', children: [{ id: 'd', label: 'Item d', href: '#d' }] }] }],
  },
]

const hidden = (text: string) => screen.getByText(text).closest('[hidden]') !== null

describe('NavTree', () => {
  it('draws every level, and opens only the group holding the current row', () => {
    render(<NavTree groups={GROUPS} selected="d" emptyMessage="Nothing here yet." />)
    expect(hidden('Item a')).toBe(true)
    expect(hidden('Item d')).toBe(false)
    expect(screen.getByRole('link', { name: 'Item d' }).getAttribute('aria-current')).toBe('page')
  })

  it('a click reaches onSelect with the node it was on', async () => {
    const onSelect = vi.fn((_node, event: { preventDefault: () => void }) => event.preventDefault())
    render(<NavTree groups={GROUPS} selected="b" onSelect={onSelect} emptyMessage="Nothing here yet." />)
    await userEvent.click(screen.getByRole('link', { name: 'Item c' }))
    expect(onSelect.mock.calls[0][0].id).toBe('c')
  })

  it('draws the quiet label when given one', () => {
    render(<NavTree title="Groups" groups={GROUPS} emptyMessage="Nothing here yet." />)
    expect(screen.getByText('Groups')).not.toBeNull()
  })

  it('says it is empty in the caller’s words', () => {
    render(<NavTree groups={[]} emptyMessage="Nothing here yet." />)
    expect(screen.getByText('Nothing here yet.')).not.toBeNull()
  })

  it('draws no rows while loading', () => {
    render(<NavTree groups={null} emptyMessage="Nothing here yet." />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})

describe('NavTree read as it opens', () => {
  it('a group being read draws no rows; a group’s message is said in their place', () => {
    render(
      <NavTree
        groups={[
          { id: 'a', title: 'Group a', defaultOpen: true, nodes: null },
          { id: 'b', title: 'Group b', defaultOpen: true, nodes: [], message: 'Nothing in this yet.' },
        ]}
        emptyMessage="Nothing here yet."
      />,
    )
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText('Nothing in this yet.')).not.toBeNull()
  })

  it('a row with hasChildren has its arrow, and says when it opens', async () => {
    const onOpenChange = vi.fn()
    render(
      <NavTree
        groups={[{ id: 'a', title: 'Group a', defaultOpen: true, nodes: [{ id: 'x', label: 'Item x', href: '#x', hasChildren: true, defaultOpen: false, onOpenChange }] }]}
        emptyMessage="Nothing here yet."
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Show what is under Item x/ }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('the label’s and a group’s actions are drawn', () => {
    render(
      <NavTree
        title="Groups"
        titleActions={[{ icon: <span />, tooltip: 'New', onClick: () => {} }]}
        groups={[{ id: 'a', title: 'Group a', nodes: [], actions: [{ icon: <span />, tooltip: 'Open', onClick: () => {} }] }]}
        emptyMessage="Nothing here yet."
      />,
    )
    expect(screen.getByRole('button', { name: 'New' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Open' })).not.toBeNull()
  })

  it('onIntent: the keyboard reaching a group says so at once', () => {
    const onIntent = vi.fn()
    render(<NavTree groups={[{ id: 'a', title: 'Group a', nodes: [], onIntent }]} emptyMessage="Nothing here yet." />)
    screen.getByRole('button', { name: 'Group a' }).focus()
    expect(onIntent).toHaveBeenCalled()
  })
})
