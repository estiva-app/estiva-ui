// @vitest-environment jsdom
/** What the CardUnder page claims, pinned: the ✕ removes the card, by pointer and by keyboard, and only where it is given. */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CardUnder } from './CardUnder'
import { ITEM, ready } from './linked.examples'

afterEach(cleanup)

describe('CardUnder', () => {
  it('draws the card it is given', () => {
    render(<CardUnder link={ready(ITEM)} />)
    expect(screen.getByRole('link', { name: ITEM.title })).toBeTruthy()
  })

  it('removes the card when the ✕ is pressed', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<CardUnder link={ready(ITEM)} onRemove={onRemove} />)
    await user.click(screen.getByRole('button', { name: 'Remove card' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('reaches the ✕ from the keyboard once sent, and removes the card with Enter', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<CardUnder link={ready({ ...ITEM, conversation: undefined, status: undefined, owner: undefined })} onRemove={onRemove} revealOnHover />)
    await user.tab()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove card' }))
    await user.keyboard('{Enter}')
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('has no ✕ for anyone but who wrote it', () => {
    render(<CardUnder link={ready(ITEM)} />)
    expect(screen.queryByRole('button', { name: 'Remove card' })).toBeNull()
  })
})
