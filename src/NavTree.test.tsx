// @vitest-environment jsdom
/**
 * What the page claims: every level is drawn from the one list; only the
 * group holding the current row starts open, and the current row is active;
 * a click reaches onSelect with its node; loading and empty say so.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuItem } from './Menu'
import { NAV_TREE_PENDING_MS, NavTree, NavTreeSection, type NavTreeGroup } from './NavTree'

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

  it('a group’s menu is a ⋮ named for the group, and opens its items', async () => {
    render(<NavTree groups={[{ id: 'a', title: 'Group a', nodes: [], menu: <MenuItem label="Rename" /> }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'More options for Group a' }))
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).not.toBeNull()
  })

  it('onIntent: the keyboard reaching a group says so at once', () => {
    const onIntent = vi.fn()
    render(<NavTree groups={[{ id: 'a', title: 'Group a', nodes: [], onIntent }]} emptyMessage="Nothing here yet." />)
    screen.getByRole('button', { name: 'Group a' }).focus()
    expect(onIntent).toHaveBeenCalled()
  })
})

describe('NavTree drawn by the app', () => {
  it('draws NavTreeSections given as children, each with its rows, line or skeleton', () => {
    render(
      <NavTree title="Groups">
        <NavTreeSection title="Group a"><a href="#a">Item a</a></NavTreeSection>
        <NavTreeSection title="Group b" message="Nothing in this yet." />
        <NavTreeSection title="Group c" loading />
      </NavTree>,
    )
    expect(screen.getByRole('button', { name: 'Group a' })).not.toBeNull()
    expect(screen.getByText('Item a')).not.toBeNull()
    expect(screen.getByText('Nothing in this yet.')).not.toBeNull()
  })

  it('a pending NavTreeSection says open and busy, its rows shut until it is not (OPT-11)', () => {
    const { rerender } = render(<NavTreeSection title="Group a" open pending><a href="#a">Item a</a></NavTreeSection>)
    const heading = screen.getByRole('button', { name: 'Group a' })
    expect(heading.getAttribute('aria-expanded')).toBe('true')
    expect(heading.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Item a').closest('[hidden]')).not.toBeNull()
    rerender(<NavTreeSection title="Group a" open><a href="#a">Item a</a></NavTreeSection>)
    expect(screen.getByText('Item a').closest('[hidden]')).toBeNull()
  })
})

describe('NavTree marks its groups', () => {
  it('each group box carries data-nav-group with its id', () => {
    const { container } = render(<NavTree groups={[{ id: 'g1', title: 'Group a', nodes: [] }]} emptyMessage="Nothing here yet." />)
    expect(container.querySelector('[data-nav-group="g1"]')).not.toBeNull()
  })
})

/**
 * 4px between groups and none above the first, title or no title. The margin
 * was `mt-1 first:mt-0`, and the quiet title is drawn before the groups, so
 * the first group under a title was never the first child and took the 4px
 * (measured in Chrome: 6px under the title, 2px after).
 */
describe('NavTree spaces its groups', () => {
  it('only a group after a group takes the 4px, so the first sits at the column’s 2px under the title', () => {
    const { container } = render(<NavTree title="Groups" groups={GROUPS} emptyMessage="Nothing here yet." />)
    const boxes = [...container.querySelectorAll<HTMLElement>('[data-nav-group]')]
    for (const box of boxes) {
      const classes = box.className.split(' ')
      expect(classes).toContain('[&+&]:mt-1')
      expect(classes).not.toContain('mt-1')
    }
    // The selector's own terms: the first group follows the title, which is no group.
    expect(boxes[0].previousElementSibling!.className.split(' ')).not.toContain('[&+&]:mt-1')
    expect(boxes[1].previousElementSibling).toBe(boxes[0])
  })
})

describe('NavTree with no groups and no words', () => {
  it('draws no line at all', () => {
    const { container } = render(<NavTree groups={[]} />)
    expect(container.textContent).toBe('')
  })
})

/** Group two's rows start shut here, so a row two levels in is reached only by opening the rows above it. */
const SHUT: NavTreeGroup[] = [
  { id: 'g1', title: 'Group one', nodes: [{ id: 'a', label: 'Item a', href: '#a' }] },
  {
    id: 'g2',
    title: 'Group two',
    nodes: [
      { id: 'b', label: 'Item b', href: '#b', defaultOpen: false, children: [{ id: 'c', label: 'Item c', href: '#c', defaultOpen: false, children: [{ id: 'd', label: 'Item d', href: '#d' }] }] },
      { id: 'e', label: 'Item e', href: '#e' },
    ],
  },
]

describe('NavTree opens onto the current row (Katerina, 30 October)', () => {
  it('a row that becomes current shows: its shut group and the rows above it open', () => {
    const { rerender } = render(<NavTree groups={SHUT} selected="a" />)
    expect(hidden('Item d')).toBe(true)
    rerender(<NavTree groups={SHUT} selected="d" />)
    expect(hidden('Item d')).toBe(false)
    expect(screen.getByRole('link', { name: 'Item d' }).getAttribute('aria-current')).toBe('page')
  })

  it('a group closed by hand opens for a new current row in it, and stays closed while that row stays current', async () => {
    const { rerender } = render(<NavTree groups={SHUT} selected="e" />)
    await userEvent.click(screen.getByRole('button', { name: 'Group two' }))
    expect(hidden('Item e')).toBe(true)
    rerender(<NavTree groups={SHUT} selected="d" />)
    expect(hidden('Item e')).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Group two' }))
    rerender(<NavTree groups={SHUT} selected="d" />)
    expect(hidden('Item e')).toBe(true)
  })

  it('a row current again after another opens its group again', async () => {
    const { rerender } = render(<NavTree groups={SHUT} selected="e" />)
    await userEvent.click(screen.getByRole('button', { name: 'Group two' }))
    rerender(<NavTree groups={SHUT} selected="a" />)
    rerender(<NavTree groups={SHUT} selected="e" />)
    expect(hidden('Item e')).toBe(false)
  })

  it('a group this browser remembers closed opens for a current row in it, and is remembered open', () => {
    window.localStorage.setItem('test.tree.g2', 'closed')
    render(<NavTree groups={SHUT} selected="e" storageKey="test.tree" />)
    expect(hidden('Item e')).toBe(false)
    expect(window.localStorage.getItem('test.tree.g2')).toBe('open')
    window.localStorage.removeItem('test.tree.g2')
  })

  it('a group the caller owns is told to open', () => {
    const onOpenChange = vi.fn()
    render(<NavTree groups={[SHUT[0], { ...SHUT[1], open: false, onOpenChange }]} selected="e" />)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('selectedParent: the row the current one is under opens, so its rows are read, and nothing is marked', () => {
    const onOpenChange = vi.fn()
    const groups: NavTreeGroup[] = [
      SHUT[0],
      { id: 'g2', title: 'Group two', nodes: [{ id: 'p', label: 'Item p', href: '#p', hasChildren: true, open: false, onOpenChange }] },
    ]
    render(<NavTree groups={groups} selected="q" selectedParent="p" />)
    expect(hidden('Item p')).toBe(false)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('link', { name: 'Item p' }).getAttribute('aria-current')).toBeNull()
  })

  it('a NavTreeSection the app draws opens for openFor', () => {
    const { rerender } = render(<NavTreeSection title="Group a" defaultOpen={false}><a href="#a">Item a</a></NavTreeSection>)
    expect(hidden('Item a')).toBe(true)
    rerender(<NavTreeSection title="Group a" defaultOpen={false} openFor="a"><a href="#a">Item a</a></NavTreeSection>)
    expect(hidden('Item a')).toBe(false)
  })
})

/**
 * A group opened while its rows are read waits shut, its arrow turned, and
 * opens once with every row; a read still out after `NAV_TREE_PENDING_MS`
 * opens it on the skeleton after all — a rate-limit retry can take seconds
 * (Peek's Folders, OPT-11: its own timer, moved in, with its tests' cases).
 */
describe('NavTreeSection pending, then loading', () => {
  const skeleton = (container: HTMLElement) => container.querySelector('.animate-skeleton-in')
  const heading = () => screen.getByRole('button', { name: 'Group a' })
  const rows = <a href="#a">Item a</a>

  it('a read still out after NAV_TREE_PENDING_MS opens on the skeleton', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<NavTreeSection title="Group a" open pending>{rows}</NavTreeSection>)
      expect(heading().getAttribute('aria-busy')).toBe('true')
      act(() => vi.advanceTimersByTime(NAV_TREE_PENDING_MS))
      expect(NAV_TREE_PENDING_MS).toBe(2000)
      expect(heading().getAttribute('aria-expanded')).toBe('true')
      expect(heading().getAttribute('aria-busy')).toBeNull()
      expect(skeleton(container)).not.toBeNull()
      expect(skeleton(container)!.closest('[hidden]')).toBeNull()
      expect(screen.queryByText('Item a')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a moment short of it, the group is still shut and busy, with no skeleton', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<NavTreeSection title="Group a" open pending>{rows}</NavTreeSection>)
      act(() => vi.advanceTimersByTime(NAV_TREE_PENDING_MS - 1))
      expect(heading().getAttribute('aria-busy')).toBe('true')
      expect(screen.getByText('Item a').closest('[hidden]')).not.toBeNull()
      expect(skeleton(container)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('rows that land in time open it on the rows; pending again waits the whole time again', () => {
    vi.useFakeTimers()
    try {
      const { container, rerender } = render(<NavTreeSection title="Group a" open pending>{rows}</NavTreeSection>)
      act(() => vi.advanceTimersByTime(NAV_TREE_PENDING_MS / 2))
      rerender(<NavTreeSection title="Group a" open>{rows}</NavTreeSection>)
      expect(screen.getByText('Item a').closest('[hidden]')).toBeNull()
      rerender(<NavTreeSection title="Group a" open pending>{rows}</NavTreeSection>)
      act(() => vi.advanceTimersByTime(NAV_TREE_PENDING_MS - 1))
      expect(heading().getAttribute('aria-busy')).toBe('true')
      expect(skeleton(container)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('rows that land after the skeleton replace it', () => {
    vi.useFakeTimers()
    try {
      const { container, rerender } = render(<NavTreeSection title="Group a" open pending>{rows}</NavTreeSection>)
      act(() => vi.advanceTimersByTime(NAV_TREE_PENDING_MS))
      rerender(<NavTreeSection title="Group a" open>{rows}</NavTreeSection>)
      expect(skeleton(container)).toBeNull()
      expect(screen.getByText('Item a').closest('[hidden]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a group whose rows are in opens at once, never busy', () => {
    render(<NavTreeSection title="Group a" open>{rows}</NavTreeSection>)
    expect(heading().getAttribute('aria-busy')).toBeNull()
    expect(screen.getByText('Item a').closest('[hidden]')).toBeNull()
  })
})

/**
 * A link to a group — a folder's own link — lands on it open and in sight
 * (Katerina, 5 October, Peek's Folders: a notification leading to a shut
 * heading among 160 showed nothing at all). Once per arrival: closed again,
 * it stays closed until a link leads to it again. Peek's own effect, moved in.
 */
describe('NavTree opens onto the group a link led to', () => {
  it('selectedGroup opens its shut group, once per arrival', async () => {
    const { rerender } = render(<NavTree groups={SHUT} />)
    expect(hidden('Item e')).toBe(true)
    rerender(<NavTree groups={SHUT} selectedGroup="g2" />)
    expect(hidden('Item e')).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Group two' }))
    rerender(<NavTree groups={SHUT} selectedGroup="g2" />)
    expect(hidden('Item e')).toBe(true)
    rerender(<NavTree groups={SHUT} />)
    rerender(<NavTree groups={SHUT} selectedGroup="g2" />)
    expect(hidden('Item e')).toBe(false)
  })

  it('a group this browser remembers closed opens for it, and is remembered open, as a click would', () => {
    window.localStorage.setItem('test.tree.g2', 'closed')
    render(<NavTree groups={SHUT} selectedGroup="g2" storageKey="test.tree" />)
    expect(hidden('Item e')).toBe(false)
    expect(window.localStorage.getItem('test.tree.g2')).toBe('open')
    window.localStorage.removeItem('test.tree.g2')
  })

  it('a group a link led to that was open already is remembered open too, as a click would: it stays open when the reader goes on to a row in another group', () => {
    try {
      const OPEN_G2 = [SHUT[0], { ...SHUT[1], defaultOpen: true }]
      const link = render(<NavTree groups={OPEN_G2} selectedGroup="g2" storageKey="test.linked" />)
      expect(hidden('Item e')).toBe(false)
      expect(window.localStorage.getItem('test.linked.g2')).toBe('open')
      link.unmount()
      render(<NavTree groups={SHUT} selected="a" storageKey="test.linked" />)
      expect(hidden('Item e')).toBe(false)
    } finally {
      window.localStorage.removeItem('test.linked.g2')
    }
  })

  it('a group the app draws and holds, open already, is told to open by the link, so the app remembers it as a click', () => {
    const onOpenChange = vi.fn()
    render(
      <NavTree selectedGroup="mine">
        <NavTreeSection id="mine" title="Mine" open onOpenChange={onOpenChange}>
          <a href="#m">Item m</a>
        </NavTreeSection>
        <NavTreeSection id="other" title="Other" open onOpenChange={onOpenChange}>
          <a href="#o">Item o</a>
        </NavTreeSection>
      </NavTree>,
    )
    expect(onOpenChange.mock.calls).toEqual([[true]])
  })

  it('a group open only because its current row is in it is not written down: it closes again once the row goes', () => {
    try {
      const first = render(<NavTree groups={SHUT} selected="e" storageKey="test.passing" />)
      expect(hidden('Item e')).toBe(false)
      expect(window.localStorage.getItem('test.passing.g2')).toBeNull()
      first.unmount()
      render(<NavTree groups={SHUT} selected="a" storageKey="test.passing" />)
      expect(hidden('Item e')).toBe(true)
    } finally {
      window.localStorage.removeItem('test.passing.g2')
    }
  })

  it('marks nothing, and opens no other group', () => {
    render(<NavTree groups={SHUT} selectedGroup="g2" />)
    expect(document.querySelector('[aria-current]')).toBeNull()
    expect(hidden('Item a')).toBe(true)
  })

  describe('and scrolls the column to it', () => {
    /** A 100px column scrolled to its top, and the group's heading 300px down it. */
    function lay(column: HTMLElement, at: number) {
      let top = 0
      Object.defineProperty(column, 'scrollHeight', { configurable: true, get: () => 1000 })
      Object.defineProperty(column, 'clientHeight', { configurable: true, get: () => 100 })
      Object.defineProperty(column, 'scrollTop', { configurable: true, get: () => top, set: (next: number) => (top = next) })
      const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const box = (y: number, height: number) => ({ top: y, bottom: y + height, height, left: 0, right: 0, width: 0, x: 0, y, toJSON: () => ({}) }) as DOMRect
        if (this === column) return box(0, 100)
        if (this.dataset.navGroup === 'far') return box(at - top, 34)
        return box(0, 32)
      })
      return { scrolled: () => top, restore: () => rect.mockRestore() }
    }

    function Column({ group }: { group?: string }) {
      return (
        <div data-testid="column" style={{ overflowY: 'auto' }}>
          <NavTree selectedGroup={group}>
            <NavTreeSection id="near" title="Near"><a href="#n">Item n</a></NavTreeSection>
            <NavTreeSection id="far" title="Far" defaultOpen={false} openFor={group === 'far' ? 'far' : undefined}><a href="#f">Item f</a></NavTreeSection>
          </NavTree>
        </div>
      )
    }

    it('brings the group a link led to into the column, at once', () => {
      const { rerender } = render(<Column />)
      const layout = lay(screen.getByTestId('column'), 300)
      try {
        rerender(<Column group="far" />)
        // Its bottom edge at the column's: 300 + 34 − 100.
        expect(layout.scrolled()).toBe(234)
        expect(hidden('Item f')).toBe(false)
      } finally {
        layout.restore()
      }
    })

    it('a group in sight stays put, and the column is not pulled back to it on a later draw', () => {
      const { rerender } = render(<Column />)
      const layout = lay(screen.getByTestId('column'), 40)
      try {
        rerender(<Column group="far" />)
        expect(layout.scrolled()).toBe(0)
        const column = screen.getByTestId('column')
        column.scrollTop = 500
        rerender(<Column group="far" />)
        expect(layout.scrolled()).toBe(500)
      } finally {
        layout.restore()
      }
    })
  })
})

/** The tree's three lines are the one `EmptyState scope="rows"` an app draws in place of its own rows: the same box, to the class. */
describe('NavTree says its lines as an app does', () => {
  const box = (message: string) => `<div class="px-2 py-1"><p class="text-caption text-text-muted">${message}</p></div>`

  it('a group’s message, a row’s childrenMessage and emptyMessage', () => {
    const { container } = render(
      <NavTree
        groups={[
          { id: 'a', title: 'Group a', nodes: [], message: 'Nothing in this yet.' },
          { id: 'b', title: 'Group b', nodes: [{ id: 'x', label: 'Item x', href: '#x', hasChildren: true, childrenMessage: 'This could not be read.' }] },
        ]}
      />,
    )
    expect(container.innerHTML).toContain(box('Nothing in this yet.'))
    expect(container.innerHTML).toContain(box('This could not be read.'))
    cleanup()
    expect(render(<NavTree groups={[]} emptyMessage="Nothing here yet." />).container.innerHTML).toContain(box('Nothing here yet.'))
  })
})
