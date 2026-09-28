// @vitest-environment jsdom
/**
 * What the Chip page claims about `href`, pinned: without it the chip is not a
 * link; with it the chip is a real anchor named by its label, keeps its round
 * shape, sits above a covering link (`relative`), and hands the click to a
 * router app through `onClick`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chip } from './Chip'

afterEach(cleanup)

describe('Chip', () => {
  it('is not a link without href', () => {
    render(<Chip label="Group" />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Group').parentElement?.tagName).toBe('DIV')
  })

  it('with href is an anchor named by its label, round, and lifted above a covering link', () => {
    render(<Chip label="Group" href="/groups/one" />)
    const link = screen.getByRole('link', { name: 'Group' })
    expect(link.getAttribute('href')).toBe('/groups/one')
    expect(link.classList.contains('rounded-full')).toBe(true)
    expect(link.classList.contains('relative')).toBe(true)
  })

  it('a router app takes the click through onClick', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(<Chip label="Group" href="/groups/one" onClick={onClick} />)
    await userEvent.click(screen.getByRole('link', { name: 'Group' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
