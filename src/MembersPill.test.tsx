// @vitest-environment jsdom
/**
 * The pill: up to three faces and the number; it opens the list, is disabled with nothing to open, and read-only it is
 * nothing to press at all, in its own look (Katerina, 17 November).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MembersPill } from './MembersPill'

afterEach(cleanup)

const people = [{ name: 'Ana Duarte' }, { name: 'Ben Okafor' }, { name: 'Chloé Martin' }]

describe('MembersPill', () => {
  it('opens the list when pressed', async () => {
    const onClick = vi.fn()
    render(<MembersPill members={people} count={9} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: '9 members' }))
    expect(onClick).toHaveBeenCalled()
  })

  // "Clicking on the pill should not show the members list. And we need to use the estiva ui component" (Katerina, 17 November).
  it('read-only, it says who is in it and is nothing to press, in the pill’s own look, not greyed', () => {
    render(<MembersPill members={people} count={9} readOnly />)
    expect(screen.queryByRole('button')).toBeNull()
    const pill = screen.getByRole('img', { name: '9 members' })
    expect(pill.textContent).toContain('9')
    const classes = pill.className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['h-8', 'border', 'border-border-default', 'text-text-primary']))
    expect(classes).not.toContain('bg-bg-disabled')
  })

  it('read-only with nobody in it draws nothing', () => {
    const { container } = render(<MembersPill members={[]} readOnly />)
    expect(container.firstChild).toBeNull()
  })
})
