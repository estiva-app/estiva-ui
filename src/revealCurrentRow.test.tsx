// @vitest-environment jsdom
/**
 * What the page claims (Katerina, 17 November): a list shows where the open page lives. Its current row is brought into
 * the column's sight once it is drawn and shown, however late — a row a part inside the tree draws itself once its read
 * lands (a team's Files fold), a plain list column's row (DMs, the Desk) — once per new current row, and never pulled
 * back after the reader scrolls away.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { ListColumn } from './ListColumn'
import { NavItem } from './NavItem'
import { NavTree } from './NavTree'
import { REVEAL_MS } from './revealCurrentRow'

afterEach(cleanup)
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

/**
 * Lays out a 100px column that scrolls 1000px, with every row 32px tall, each `at` px down its list, and the rest at its
 * top. `shut` rows are in a fold that is closed: 0px tall.
 */
function lay(column: HTMLElement, at: Record<string, number>, shut: Set<string> = new Set()) {
  let top = 0
  Object.defineProperty(column, 'scrollHeight', { configurable: true, get: () => 1000 })
  Object.defineProperty(column, 'clientHeight', { configurable: true, get: () => 100 })
  Object.defineProperty(column, 'scrollTop', { configurable: true, get: () => top, set: (next: number) => (top = next) })
  column.style.overflowY = 'auto'
  const box = (y: number, height: number) => ({ top: y, bottom: y + height, height, left: 0, right: 0, width: 0, x: 0, y, toJSON: () => ({}) }) as DOMRect
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this === column) return box(0, 100)
    const label = this.textContent?.trim() ?? ''
    if (shut.has(label)) return box(0, 0)
    return label in at ? box(at[label]! - top, 32) : box(0, 32)
  })
  return { scrolled: () => top, scroll: (to: number) => (top = to), restore: () => rect.mockRestore() }
}

/** Its rows a moment after it is drawn, as a fold that reads them once it opens: the tree is not drawn again for them. */
function LateRows({ open }: { open: string }) {
  const [rows, setRows] = useState<string[] | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setRows(['Project 1', 'Project 2', 'Project 9']), 600)
    return () => clearTimeout(timer)
  }, [])
  return <>{rows?.map((row) => <NavItem key={row} href={`#${row}`} label={row} active={row === open} />)}</>
}

describe('a tree brings its current row into sight', () => {
  it('when a part inside it draws the row late, after its read lands (a team’s Files fold)', async () => {
    const { getByTestId } = render(
      <div data-testid="column">
        <NavTree selected="p9">
          <NavItem href="#team" label="Team" />
          <LateRows open="Project 9" />
        </NavTree>
      </div>,
    )
    const layout = lay(getByTestId('column'), { 'Project 9': 900 })
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(0)
      // The read lands: its rows are drawn, the tree is not.
      await act(async () => vi.advanceTimersByTime(600))
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      // Its bottom edge at the column's: 900 + 32 − 100.
      expect(layout.scrolled()).toBe(832)
    } finally {
      layout.restore()
    }
  })

  it('once: scrolled away from, it is not brought back while it stays the current row', async () => {
    const { getByTestId, rerender } = render(
      <div data-testid="column">
        <NavTree selected="b">
          <NavItem href="#a" label="Item a" />
          <NavItem href="#b" label="Item b" active />
        </NavTree>
      </div>,
    )
    const layout = lay(getByTestId('column'), { 'Item b': 500 })
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(432)
      layout.scroll(0)
      rerender(
        <div data-testid="column">
          <NavTree selected="b">
            <NavItem href="#a" label="Item a (2)" />
            <NavItem href="#b" label="Item b" active />
          </NavTree>
        </div>,
      )
      await act(async () => {})
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(0)
    } finally {
      layout.restore()
    }
  })

  it('a row in a shut fold waits for the fold to open', async () => {
    const shut = new Set(['Item b'])
    const { getByTestId } = render(
      <div data-testid="column">
        <NavTree selected="b">
          <NavItem href="#b" label="Item b" active />
        </NavTree>
      </div>,
    )
    const layout = lay(getByTestId('column'), { 'Item b': 500 }, shut)
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(0)
      // The fold opens: its content is shown, which changes the list.
      shut.clear()
      await act(async () => getByTestId('column').querySelector('a')!.setAttribute('hidden', ''))
      await act(async () => getByTestId('column').querySelector('a')!.removeAttribute('hidden'))
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(432)
    } finally {
      layout.restore()
    }
  })
})

describe('a list column brings its current row into sight (DMs, the Desk)', () => {
  function People({ open }: { open: string }) {
    return (
      <ListColumn title="DMs">
        {Array.from({ length: 30 }, (_, i) => `Person ${i}`).map((name) => (
          <NavItem key={name} href={`#${name}`} label={name} active={name === open} />
        ))}
      </ListColumn>
    )
  }
  const viewport = () => document.querySelector<HTMLElement>('[data-id$="-viewport"]') ?? document.querySelector<HTMLElement>('[style*="overflow"]')!

  it('its open row below the fold, and each new open row after it', async () => {
    const { rerender } = render(<People open="Person 25" />)
    const layout = lay(viewport(), { 'Person 25': 800, 'Person 2': 64 })
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(732)
      // Another opens, above: the column goes up to it.
      rerender(<People open="Person 2" />)
      // What changed in the list is heard first, then the look a moment later.
      await act(async () => {})
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(64)
    } finally {
      layout.restore()
    }
  })

  it('a row already in sight stays put', async () => {
    render(<People open="Person 1" />)
    const layout = lay(viewport(), { 'Person 1': 32 })
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(0)
    } finally {
      layout.restore()
    }
  })
})
