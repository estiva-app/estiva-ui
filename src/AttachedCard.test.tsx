// @vitest-environment jsdom
/** What the AttachedCard page claims, pinned: the ✕ removes the card, by pointer and by keyboard, and only where it is given. */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AttachedCard } from './AttachedCard'
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

  it('has no ✕ for anyone but who wrote it', () => {
    render(<AttachedCard link={ready(ITEM)} />)
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })
})
