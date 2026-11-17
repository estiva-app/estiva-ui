// @vitest-environment jsdom
/**
 * What the page claims (Katerina, 17 November): a list shows where the open page lives. Its current row is brought into
 * the column's sight once it is drawn and shown, however late — a row a part inside the tree draws itself once its read
 * lands (a team's Files fold), a plain list column's row (DMs, the Desk) — once per new current row, and never pulled
 * back after the reader scrolls away.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { ListColumn } from './ListColumn'
import { NavItem } from './NavItem'
import { NavTree } from './NavTree'
import { forgetListPlaces, REVEAL_MS } from './revealCurrentRow'

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

/*
  The same column drawn again on another page (Peek's Teams column on a team's page, then on a topic's): it goes back
  to where the reader left it, by the name the app gives it, and a row it already brought into sight is not brought
  back (Katerina, 17 November: "I have scrolled down a little and then click on something and it scrolls up back to
  top"). A new open row still comes into sight.
*/
describe('a list column drawn again goes back to where it was left (rememberAs)', () => {
  afterEach(() => forgetListPlaces())
  function Named({ open, name }: { open: string; name?: string }) {
    return (
      <ListColumn title="DMs" {...(name ? { rememberAs: name } : {})}>
        {Array.from({ length: 30 }, (_, i) => `Person ${i}`).map((person) => (
          <NavItem key={person} href={`#${person}`} label={person} active={person === open} />
        ))}
      </ListColumn>
    )
  }
  const viewport = () => document.querySelector<HTMLElement>('[data-id$="-viewport"]') ?? document.querySelector<HTMLElement>('[style*="overflow"]')!

  /** Draws it, lets it bring its open row into sight, and the reader scrolls to `to`; then it is taken away. */
  async function leaveAt(to: number, open = 'Person 25', name = 'dms') {
    const first = render(<Named open={open} name={name} />)
    const layout = lay(viewport(), { 'Person 25': 800, 'Person 2': 64 })
    await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
    layout.scroll(to)
    fireEvent.scroll(viewport())
    first.unmount()
    layout.restore()
  }

  it('drawn again under the same name, it opens where the reader left it, and does not pull them back to its open row', async () => {
    await leaveAt(300)
    render(<Named open="Person 25" name="dms" />)
    expect(viewport().scrollTop).toBe(300)
    const layout = lay(viewport(), { 'Person 25': 800, 'Person 2': 64 })
    layout.scroll(300)
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(300)
    } finally {
      layout.restore()
    }
  })

  it('a new open row still comes into sight', async () => {
    await leaveAt(300)
    render(<Named open="Person 2" name="dms" />)
    const layout = lay(viewport(), { 'Person 25': 800, 'Person 2': 64 })
    layout.scroll(300)
    try {
      await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
      expect(layout.scrolled()).toBe(64)
    } finally {
      layout.restore()
    }
  })

  it('a new open row is brought into sight at once, even when the place it was left at can no longer be reached', async () => {
    await leaveAt(900)
    // The list is shorter now (a fold that was open is shut): it scrolls no further than 300.
    const tops = new WeakMap<HTMLElement, number>()
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get(this: HTMLElement) {
        return tops.get(this) ?? 0
      },
      set(this: HTMLElement, next: number) {
        tops.set(this, Math.max(0, Math.min(next, 300)))
      },
    })
    try {
      render(<Named open="Person 2" name="dms" />)
      expect(viewport().scrollTop).toBe(300)
      const layout = lay(viewport(), { 'Person 25': 800, 'Person 2': 64 })
      layout.scroll(300)
      try {
        // At the reveal's moment, not once going back gives up (RESTORE_MS).
        await act(async () => vi.advanceTimersByTime(REVEAL_MS + 10))
        expect(layout.scrolled()).toBe(64)
      } finally {
        layout.restore()
      }
    } finally {
      delete (HTMLElement.prototype as { scrollTop?: number }).scrollTop
    }
  })

  it('without a name, or under another, it opens at the top', async () => {
    await leaveAt(300)
    const unnamed = render(<Named open="Person 1" />)
    expect(viewport().scrollTop).toBe(0)
    unnamed.unmount()
    render(<Named open="Person 1" name="desk" />)
    expect(viewport().scrollTop).toBe(0)
  })
})
