// @vitest-environment jsdom
/** What the AttachedCard page claims, pinned: the ✕ removes the card, by pointer and by keyboard, and only where it is given. */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AttachedCard } from './AttachedCard'
import { inTheBox } from './linked'
import { ITEM, ready } from './linked.examples'

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
    expect(screen.getByText('comments')).toBeTruthy()
  })

  it('has no ✕ for anyone but who wrote it', () => {
    render(<AttachedCard link={ready(ITEM)} />)
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })
})
