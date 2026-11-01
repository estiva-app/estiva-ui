// @vitest-environment jsdom
/**
 * What the page claims: the title toggles by click and by key and says its
 * state; the rows are hidden, not removed, while closed; a `storageKey` is
 * read on mount and written on change. The slide is Chrome's to show
 * (measured 2026-09-09).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollapsibleSection, useRememberedOpen } from './CollapsibleSection'
import { MenuItem } from './Menu'

afterEach(cleanup)
beforeEach(() => window.localStorage.clear())

const rows = (
  <>
    <a href="#">Item one</a>
    <a href="#">Item two</a>
  </>
)

const title = () => screen.getByRole('button', { name: 'Section' })

describe('CollapsibleSection', () => {
  it('is open by default: the title says so, and the rows are there', () => {
    render(<CollapsibleSection title="Section">{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Item one').closest('[hidden]')).toBeNull()
  })

  it('a click on the title closes it, and the rows are hidden rather than gone', async () => {
    render(<CollapsibleSection title="Section">{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(title().getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Item one').closest('[hidden]')).not.toBeNull()
  })

  it('Enter and Space on the title toggle it', async () => {
    render(<CollapsibleSection title="Section">{rows}</CollapsibleSection>)
    title().focus()
    await userEvent.keyboard('{Enter}')
    expect(title().getAttribute('aria-expanded')).toBe('false')
    await userEvent.keyboard(' ')
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('starts closed with defaultOpen false', () => {
    render(<CollapsibleSection title="Section" defaultOpen={false}>{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('false')
  })

  it('an action beside the title acts without toggling', async () => {
    const add = vi.fn()
    render(
      <CollapsibleSection title="Section" actions={[{ icon: <i />, tooltip: 'Add', onClick: add }]}>
        {rows}
      </CollapsibleSection>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(add).toHaveBeenCalledTimes(1)
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('remembers under storageKey: written on change, read on mount', async () => {
    const { unmount } = render(<CollapsibleSection title="Section" storageKey="test.section">{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(window.localStorage.getItem('test.section')).toBe('closed')
    unmount()
    render(<CollapsibleSection title="Section" storageKey="test.section">{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('false')
  })

  it('the caller can own the state', async () => {
    const onOpenChange = vi.fn()
    render(<CollapsibleSection title="Section" open={false} onOpenChange={onOpenChange}>{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(title().getAttribute('aria-expanded')).toBe('false')
  })
})

/** Opened before its rows are in (0.65.1, OPT-11): the title says open, the panel waits. */
describe('CollapsibleSection, pending', () => {
  it('the title says open and busy while the rows stay shut, then they open', () => {
    const { rerender } = render(<CollapsibleSection title="Section" open pending>{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('true')
    expect(title().getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Item one').closest('[hidden]')).not.toBeNull()
    rerender(<CollapsibleSection title="Section" open>{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('true')
    expect(title().getAttribute('aria-busy')).toBeNull()
    expect(screen.getByText('Item one').closest('[hidden]')).toBeNull()
  })

  it('a click while pending closes it', async () => {
    const onOpenChange = vi.fn()
    render(<CollapsibleSection title="Section" open pending onOpenChange={onOpenChange}>{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('a closed section is not busy, and a click opens it', async () => {
    const onOpenChange = vi.fn()
    render(<CollapsibleSection title="Section" open={false} pending onOpenChange={onOpenChange}>{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('false')
    expect(title().getAttribute('aria-busy')).toBeNull()
    await userEvent.click(title())
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})

/** What it hands its header (0.56.0): the folder's ⋮, the ⋮'s name, and the icon before the title. */
describe('CollapsibleSection, its header', () => {
  it('passes menu and menuLabel on: the ⋮ is named by menuLabel and opens the menu', async () => {
    render(<CollapsibleSection title="Section" menu={<MenuItem label="Rename" />} menuLabel="Section options">{rows}</CollapsibleSection>)
    await userEvent.click(screen.getByRole('button', { name: 'Section options' }))
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).not.toBeNull()
    // The ⋮ acts; it does not fold the section.
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('with menu and no menuLabel, the ⋮ is named for the title', () => {
    render(<CollapsibleSection title="Section" menu={<MenuItem label="Rename" />}>{rows}</CollapsibleSection>)
    expect(screen.getByRole('button', { name: 'More options for Section' })).not.toBeNull()
  })

  it('passes icon on: it is drawn inside the title’s toggle, before the words', () => {
    render(<CollapsibleSection title="Section" icon={<span data-testid="icon" />}>{rows}</CollapsibleSection>)
    const icon = screen.getByTestId('icon')
    expect(title().contains(icon)).toBe(true)
    expect(icon.compareDocumentPosition(screen.getByText('Section')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

/**
 * The fold this browser remembers, for an app that must know it before it
 * draws what is inside (Peek's Folders, FOL-21: a Folder's rows are a read,
 * made only for a Folder that is open). Peek's own `useRememberedOpen`, moved
 * in: its rules and its tests' cases.
 */
describe('useRememberedOpen', () => {
  it('with nothing remembered it is the fallback, and follows it until the person chooses', () => {
    const { result, rerender } = renderHook(({ fallback }) => useRememberedOpen('test.fold', fallback), { initialProps: { fallback: false } })
    expect(result.current[0]).toBe(false)
    rerender({ fallback: true })
    expect(result.current[0]).toBe(true)
    rerender({ fallback: false })
    expect(result.current[0]).toBe(false)
  })

  it('a default is never written down: only a choice is remembered', () => {
    const { rerender } = renderHook(({ fallback }) => useRememberedOpen('test.fold', fallback), { initialProps: { fallback: true } })
    rerender({ fallback: false })
    expect(window.localStorage.getItem('test.fold')).toBeNull()
  })

  it('a choice beats the fallback from then on, and is remembered as a section remembers it', () => {
    const { result, rerender } = renderHook(({ fallback }) => useRememberedOpen('test.fold', fallback), { initialProps: { fallback: true } })
    act(() => result.current[1](false))
    expect(result.current[0]).toBe(false)
    expect(window.localStorage.getItem('test.fold')).toBe('closed')
    rerender({ fallback: true })
    expect(result.current[0]).toBe(false)
    act(() => result.current[1](true))
    expect(window.localStorage.getItem('test.fold')).toBe('open')
  })

  it('what this browser remembers is known on the first draw, whatever the fallback', () => {
    window.localStorage.setItem('test.open', 'open')
    window.localStorage.setItem('test.closed', 'closed')
    const seen: boolean[] = []
    renderHook(() => {
      const [open] = useRememberedOpen('test.open', false)
      const [closed] = useRememberedOpen('test.closed', true)
      seen.push(open, closed)
    })
    expect(seen.slice(0, 2)).toEqual([true, false])
  })

  it('reads what a CollapsibleSection under the same key remembers, and the section reads what it writes', async () => {
    const { unmount } = render(<CollapsibleSection title="Section" storageKey="test.shared">{rows}</CollapsibleSection>)
    await userEvent.click(title())
    unmount()
    const { result } = renderHook(() => useRememberedOpen('test.shared', true))
    expect(result.current[0]).toBe(false)
    act(() => result.current[1](true))
    render(<CollapsibleSection title="Section" storageKey="test.shared" defaultOpen={false}>{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('with no key the choice is kept while mounted, and nothing is written', () => {
    const { result, rerender } = renderHook(({ fallback }) => useRememberedOpen(undefined, fallback), { initialProps: { fallback: false } })
    act(() => result.current[1](true))
    rerender({ fallback: false })
    expect(result.current[0]).toBe(true)
    expect(window.localStorage.length).toBe(0)
  })

  it('a browser that blocks storage still gets a working fold; it forgets', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      const { result } = renderHook(() => useRememberedOpen('test.blocked', true))
      expect(result.current[0]).toBe(true)
      act(() => result.current[1](false))
      expect(result.current[0]).toBe(false)
    } finally {
      get.mockRestore()
      set.mockRestore()
    }
  })
})
