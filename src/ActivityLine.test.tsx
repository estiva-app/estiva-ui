// @vitest-environment jsdom
/**
 * What the page claims: who, what they did and when on the first line, where and the words under it; a link with an
 * `href`, a button without; the app's `data-*` marks on the row; a menu row's look, with no edge of its own.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityLine } from './ActivityLine'

afterEach(cleanup)

const line = { person: { name: 'Ana Duarte' }, did: 'replied to you', time: '2h', where: 'Group one › Item one', words: 'The words.' }

describe('ActivityLine', () => {
  it('says who, what they did and when, then where and the words, each in its own words', () => {
    render(<ActivityLine {...line} />)
    expect(screen.getByText('Ana Duarte')).toBeTruthy()
    expect(screen.getByText('replied to you')).toBeTruthy()
    expect(screen.getByText('2h')).toBeTruthy()
    expect(screen.getByText('Group one › Item one ·')).toBeTruthy()
    expect(screen.getByText('The words.')).toBeTruthy()
  })

  it('is a link with an href, and carries the app’s marks', () => {
    render(<ActivityLine {...line} href="/somewhere" data-reaction="" data-seen />)
    const row = screen.getByText('replied to you').closest('a')
    expect(row?.getAttribute('href')).toBe('/somewhere')
    expect(row?.hasAttribute('data-reaction')).toBe(true)
    expect(row?.hasAttribute('data-seen')).toBe(true)
  })

  it('is a button without one, and a press reaches onClick', async () => {
    const onClick = vi.fn()
    render(<ActivityLine {...line} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has a menu row’s look: a fill under the pointer, 8px corners, and no edge', () => {
    render(<ActivityLine {...line} />)
    const row = screen.getByRole('button')
    expect(row.className).toContain('hover:bg-bg-hover')
    expect(row.className).toContain('rounded-lg')
    expect(row.className).not.toMatch(/\bborder\b/)
  })
})
