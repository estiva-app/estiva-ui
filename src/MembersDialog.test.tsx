// @vitest-environment jsdom
/** What the MembersDialog page claims, pinned. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MembersDialog } from './MembersDialog'
import { MembersPill } from './MembersPill'

afterEach(cleanup)

const members = [
  { id: 'me', name: 'You' },
  { id: 'ana', name: 'Ana Duarte', caption: 'Assignee' },
]

describe('MembersDialog', () => {
  it('lists every member with their caption, and counts them in the title', async () => {
    render(<MembersDialog members={members} onClose={() => {}} />)
    const dialog = await screen.findByRole('dialog', { name: /Members/ })
    expect(dialog.textContent).toContain('Ana Duarte')
    expect(dialog.textContent).toContain('Assignee')
    expect(dialog.textContent).toContain('2')
  })

  it('offers no Join, Leave or Add when none is given', async () => {
    render(<MembersDialog members={members} onClose={() => {}} />)
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: /^(Join|Leave|Add members)$/ })).toBeNull()
  })

  it('says Join to a non-member and Leave to a member, and calls onToggle once', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const { rerender } = render(<MembersDialog members={members} self={{ action: 'join', onToggle }} onClose={() => {}} />)
    await user.click(await screen.findByRole('button', { name: 'Join' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    rerender(<MembersDialog members={members} self={{ action: 'leave', onToggle }} onClose={() => {}} />)
    expect(await screen.findByRole('button', { name: 'Leave' })).toBeTruthy()
  })

  it('goes to the add layer and back, and Invite waits for a choice', async () => {
    const user = userEvent.setup()
    render(<MembersDialog members={members} candidates={[{ id: 'ravi', label: 'Ravi Mehta' }]} onAdd={() => {}} onClose={() => {}} />)
    await user.click(await screen.findByRole('button', { name: 'Add members' }))
    expect((await screen.findByRole('button', { name: 'Invite' })).hasAttribute('disabled')).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Back to members' }))
    expect(await screen.findByRole('button', { name: 'Add members' })).toBeTruthy()
  })

  it('stays on the add layer when onAdd returns false', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn(() => false)
    render(<MembersDialog members={members} candidates={[{ id: 'ravi', label: 'Ravi Mehta' }]} onAdd={onAdd} initialView="add" onClose={() => {}} />)
    await user.type(await screen.findByRole('combobox'), 'Ravi')
    await user.click(await screen.findByRole('option', { name: /Ravi Mehta/ }))
    await user.click(screen.getByRole('button', { name: 'Invite' }))
    expect(onAdd).toHaveBeenCalledWith([{ id: 'ravi', label: 'Ravi Mehta' }])
    expect(screen.getByRole('button', { name: 'Invite' })).toBeTruthy()
  })
})

describe('MembersPill', () => {
  it('names the total, and draws nothing for none', () => {
    const { container, rerender } = render(<MembersPill members={[{ name: 'Ana Duarte' }]} count={4} onClick={() => {}} />)
    expect(screen.getByRole('button', { name: '4 members' })).toBeTruthy()
    rerender(<MembersPill members={[]} />)
    expect(container.textContent).toBe('')
  })
})
