// @vitest-environment jsdom
/** What the AttachedCard page claims, pinned: the ✕ removes the card, by pointer and by keyboard, and only where it is given. */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AttachedCard } from './AttachedCard'
import { cardShapeMemory, inTheBox, loadingShapeOf } from './linked'
import { ITEM, ITEM_NO_SUMMARY, LOADING, ready } from './linked.examples'

afterEach(cleanup)

describe('AttachedCard', () => {
  it('draws the card it is given', () => {
    render(<AttachedCard link={ready(ITEM)} />)
    expect(screen.getByRole('link', { name: ITEM.title })).toBeTruthy()
  })

  it('removes the card when the ✕ is pressed', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<AttachedCard link={ready(ITEM)} onRemove={onRemove} />)
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('reaches the ✕ from the keyboard, and removes the card with Enter', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<AttachedCard link={ready({ ...ITEM, conversation: undefined, status: undefined, owner: undefined })} onRemove={onRemove} />)
    await user.tab()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove' }))
    await user.keyboard('{Enter}')
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('drawn inside another, as the box wraps the card an app hands it, is one card with one ✕, the outer one', async () => {
    const user = userEvent.setup()
    const outer = vi.fn()
    const inner = vi.fn()
    const { container } = render(
      <AttachedCard onRemove={outer}>
        <AttachedCard link={ready(ITEM)} onRemove={inner} />
      </AttachedCard>,
    )
    expect(container.querySelectorAll('.group\\/card')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(outer).toHaveBeenCalledTimes(1)
    expect(inner).not.toHaveBeenCalled()
  })

  it('in a box being written in, its title and its count are words, not links, so the draft is not left', () => {
    render(
      <inTheBox.Provider value>
        <AttachedCard link={ready(ITEM)} onRemove={() => {}} />
      </inTheBox.Provider>,
    )
    expect(screen.getByText(ITEM.title)).toBeTruthy()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText('4 comments')).toBeTruthy()
  })

  it('has no ✕ for anyone but who wrote it', () => {
    render(<AttachedCard link={ready(ITEM)} />)
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })
})

/*
  A card keeps its height while it loads (C4): given the app's memory (`cardShapeMemory`) and the card's id there, it
  measures the card it draws and, the next time it loads, holds that height and that shape, so the conversation around
  it does not move. Peek's and Ship's `MessageCard` did this by hand, with these timings; their tests, moved.
*/
describe('AttachedCard, remembered', () => {
  let shapes = 0
  const memory = (firstDraw?: Parameters<typeof cardShapeMemory>[1]) => cardShapeMemory(`test.attached-${++shapes}`, firstDraw)
  /** The lines the loading card holds room for, top to bottom: the title, a key line, a summary, the pickers. */
  const placeholderLines = (container: HTMLElement) => container.querySelector('[aria-busy] > *')?.children.length
  const held = (container: HTMLElement) => (container.querySelector('.group\\/card') as HTMLElement).style.minHeight

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    localStorage.clear()
  })

  it('holds room for only a title and its pickers on a first draw, when that is the app’s first shape for the kind', () => {
    const remember = { memory: memory({ firstDraw: { issue: { subtitle: false, summary: false, footer: 'pickers' } } }), id: 'item-1' }
    const { container } = render(<AttachedCard link={LOADING} remember={remember} />)
    expect(placeholderLines(container)).toBe(2)
  })

  it('holds room for what it drew with last time on this device: no summary, where the kind’s usual card has one', () => {
    const remember = { memory: memory(), id: 'item-2' }
    const first = render(<AttachedCard link={ready(ITEM_NO_SUMMARY)} remember={remember} />)
    first.unmount()
    const again = render(<AttachedCard link={LOADING} remember={remember} />)
    expect(placeholderLines(again.container)).toBe(2)
  })

  it('…and the summary it drew with, after a first shape without one', () => {
    const remember = { memory: memory({ firstDraw: { issue: { subtitle: false, summary: false, footer: 'pickers' } } }), id: 'item-8' }
    const first = render(<AttachedCard link={ready(ITEM)} remember={remember} />)
    first.unmount()
    const again = render(<AttachedCard link={LOADING} remember={remember} />)
    expect(placeholderLines(again.container)).toBe(3)
  })

  it('holds the height it drew at last time, which a summary wrapped to two lines needs (17 Oct, 114 → 134 px)', () => {
    const remember = { memory: memory(), id: 'item-3' }
    const measured = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 134 } as DOMRect)
    const first = render(<AttachedCard link={ready(ITEM)} remember={remember} />)
    first.unmount()
    measured.mockRestore()
    const again = render(<AttachedCard link={LOADING} remember={remember} />)
    expect(held(again.container)).toBe('134px')
  })

  it('holds nothing once it has drawn, and nothing without a height to hold', () => {
    const remember = { memory: memory(), id: 'item-4' }
    const { container, rerender } = render(<AttachedCard link={LOADING} remember={remember} />)
    expect(held(container)).toBe('')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 134 } as DOMRect)
    rerender(<AttachedCard link={ready(ITEM)} remember={remember} />)
    expect(held(container)).toBe('')
  })

  it('a card not on screen (a closed panel) measures 0, and keeps the height it last drew at', () => {
    const remember = { memory: memory(), id: 'item-5' }
    remember.memory.note('item-5', { ...loadingShapeOf(ITEM_NO_SUMMARY), height: 134 })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 0 } as DOMRect)
    render(<AttachedCard link={ready(ITEM)} remember={remember} />)
    expect(remember.memory.of('item-5', 'issue')).toEqual({ ...loadingShapeOf(ITEM), height: 134 })
  })

  it('a window being resized notes the new height once it settles, 500ms after the last change, not every frame', () => {
    vi.useFakeTimers()
    let resized: () => void = () => {}
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    const remember = { memory: memory(), id: 'item-6' }
    const measured = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 134 } as DOMRect)
    render(<AttachedCard link={ready(ITEM)} remember={remember} />)
    expect(remember.memory.of('item-6', 'issue')?.height).toBe(134)
    measured.mockReturnValue({ height: 150 } as DOMRect)
    resized()
    vi.advanceTimersByTime(300)
    measured.mockReturnValue({ height: 154 } as DOMRect)
    resized()
    vi.advanceTimersByTime(499)
    expect(remember.memory.of('item-6', 'issue')?.height).toBe(134)
    vi.advanceTimersByTime(1)
    expect(remember.memory.of('item-6', 'issue')?.height).toBe(154)
    vi.unstubAllGlobals()
  })

  it('inside another, as the box wraps the card an app hands it, it still holds its height, and draws one card', () => {
    const remember = { memory: memory(), id: 'item-7' }
    remember.memory.note('item-7', { ...loadingShapeOf(ITEM), height: 134 })
    const { container } = render(
      <AttachedCard onRemove={() => {}}>
        <AttachedCard link={LOADING} remember={remember} />
      </AttachedCard>,
    )
    expect(container.querySelectorAll('.group\\/card')).toHaveLength(1)
    expect([...container.querySelectorAll<HTMLElement>('*')].some((element) => element.style.minHeight === '134px')).toBe(true)
  })
})
