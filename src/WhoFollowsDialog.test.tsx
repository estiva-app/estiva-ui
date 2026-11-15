// @vitest-environment jsdom
/** What the WhoFollowsDialog page claims about your own Join or Leave, pinned. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhoFollowsDialog } from './WhoFollowsDialog'

afterEach(cleanup)

const all = [{ id: 'ana', name: 'Ana Duarte' }]
const important = [
  { id: 'ravi', name: 'Ravi Mehta' },
  { id: 'me', name: 'You' },
]

describe('WhoFollowsDialog, your own Join or Leave', () => {
  it('offers no Join or Leave when no self is given', async () => {
    render(<WhoFollowsDialog title="Widgets" all={all} important={important} onClose={() => {}} />)
    await screen.findByText('Ana Duarte')
    expect(screen.queryByRole('button', { name: /^(Join|Leave)$/ })).toBeNull()
  })

  it('puts Leave on your own row, first in its group, and calls onToggle once', async () => {
    const onToggle = vi.fn()
    render(<WhoFollowsDialog title="Widgets" all={all} important={important} self={{ action: 'leave', id: 'me', onToggle }} onClose={() => {}} />)
    const leave = await screen.findByRole('button', { name: 'Leave' })
    const names = screen.getAllByText(/^(Ana Duarte|Ravi Mehta|You)$/).map((el) => el.textContent)
    expect(names).toEqual(['Ana Duarte', 'You', 'Ravi Mehta'])
    expect(leave.parentElement?.textContent).toContain('You')
    await userEvent.setup().click(leave)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('puts Join on top when you are not in it', async () => {
    const onToggle = vi.fn()
    render(<WhoFollowsDialog title="Widgets" all={all} important={[important[0]]} self={{ action: 'join', id: 'me', onToggle }} onClose={() => {}} />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Join' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
