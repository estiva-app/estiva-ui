// @vitest-environment jsdom
/** What the FollowSwitch and WhoFollowsDialog pages claim, pinned. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FollowSwitch } from './FollowSwitch'
import { MembersPill } from './MembersPill'
import { WhoFollowsDialog } from './WhoFollowsDialog'

afterEach(cleanup)

describe('FollowSwitch', () => {
  it('says the level in its name, and hands back the pick', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<FollowSwitch level="important" label="Item one" onChoose={onChoose} />)
    await user.click(screen.getByRole('button', { name: 'You follow it at Important: change how you follow Item one' }))
    await user.click(await screen.findByRole('menuitem', { name: /^All/ }))
    expect(onChoose).toHaveBeenCalledWith('all')
  })

  it('says Not following when there is no level, and hands back off', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<FollowSwitch level="all" label="Item one" onChoose={onChoose} />)
    await user.click(screen.getByRole('button', { name: /change how you follow/ }))
    await user.click(await screen.findByRole('menuitem', { name: /^Not following/ }))
    expect(onChoose).toHaveBeenCalledWith('off')
    cleanup()
    render(<FollowSwitch level={undefined} label="Item one" onChoose={onChoose} />)
    expect(screen.getByRole('button', { name: 'Not following: change how you follow Item one' })).toBeTruthy()
  })

  it('offers Back to the default only with backTo, and hands back default', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    const { rerender } = render(<FollowSwitch level="all" label="Item one" onChoose={onChoose} />)
    await user.click(screen.getByRole('button', { name: /change how you follow/ }))
    await screen.findByRole('menuitem', { name: /^All/ })
    expect(screen.queryByRole('menuitem', { name: /Back to/ })).toBeNull()
    await user.keyboard('{Escape}')
    rerender(<FollowSwitch level="all" label="Item one" onChoose={onChoose} backTo="Group one" />)
    await user.click(screen.getByRole('button', { name: /change how you follow/ }))
    await user.click(await screen.findByRole('menuitem', { name: /Back to Group one’s default/ }))
    expect(onChoose).toHaveBeenCalledWith('default')
  })

  it('cannot be changed without onChoose', () => {
    render(<FollowSwitch level={undefined} label="Item one" />)
    expect(screen.getByRole('button', { name: /Not following/ }).hasAttribute('disabled')).toBe(true)
  })

  it('waits while onChoose runs, so one pick is one change', async () => {
    const user = userEvent.setup()
    let done = () => {}
    const onChoose = vi.fn(() => new Promise<void>((resolve) => (done = resolve)))
    render(<FollowSwitch level="important" label="Item one" onChoose={onChoose} />)
    const button = screen.getByRole('button', { name: /change how you follow/ })
    await user.click(button)
    await user.click(await screen.findByRole('menuitem', { name: /^All/ }))
    expect(button.hasAttribute('disabled')).toBe(true)
    done()
    await vi.waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
    expect(onChoose).toHaveBeenCalledTimes(1)
  })
})

describe('WhoFollowsDialog', () => {
  const all = [{ id: 'ana', name: 'Ana Duarte', caption: 'Chose it' }]
  const important = [{ id: 'ravi', name: 'Ravi Mehta', caption: 'Added by Ana Duarte' }]

  it('lists All then Important with their counts, and Nobody for an empty group', async () => {
    const { rerender } = render(<WhoFollowsDialog title="Item one" all={all} important={important} onClose={() => {}} />)
    const dialog = await screen.findByRole('dialog', { name: 'Who follows Item one' })
    const text = dialog.textContent!
    expect(text.indexOf('All · 1')).toBeLessThan(text.indexOf('Ana Duarte'))
    expect(text.indexOf('Ana Duarte')).toBeLessThan(text.indexOf('Important · 1'))
    expect(text.indexOf('Important · 1')).toBeLessThan(text.indexOf('Ravi Mehta'))
    expect(text).toContain('Added by Ana Duarte')
    rerender(<WhoFollowsDialog title="Item one" all={[]} important={important} onClose={() => {}} />)
    expect((await screen.findByRole('dialog')).textContent).toContain('All · 0Nobody')
  })

  it('offers Add someone only with onAdd, and leaves everyone listed out of the picker', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const candidates = [
      { id: 'ana', label: 'Ana Duarte' },
      { id: 'jonas', label: 'Jonas Weber' },
    ]
    const { rerender } = render(<WhoFollowsDialog title="Item one" all={all} important={important} candidates={candidates} onClose={() => {}} />)
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: 'Add someone' })).toBeNull()
    rerender(<WhoFollowsDialog title="Item one" all={all} important={important} candidates={candidates} onAdd={onAdd} onClose={() => {}} />)
    await user.click(await screen.findByRole('button', { name: 'Add someone' }))
    // Both names hold an "a": only the one not listed is offered.
    await user.type(await screen.findByRole('combobox'), 'a')
    const jonas = await screen.findByRole('option', { name: /Jonas Weber/ })
    expect(screen.queryByRole('option', { name: /Ana Duarte/ })).toBeNull()
    await user.click(jonas)
    await user.click(screen.getByRole('button', { name: 'Invite' }))
    expect(onAdd).toHaveBeenCalledWith([{ id: 'jonas', label: 'Jonas Weber' }])
    expect(await screen.findByRole('dialog', { name: 'Who follows Item one' })).toBeTruthy()
  })

  it('opens on the add layer from a menu, and its back arrow returns to the list', async () => {
    const user = userEvent.setup()
    render(<WhoFollowsDialog title="Item one" all={all} important={important} onAdd={() => {}} initialView="add" onClose={() => {}} />)
    await user.click(await screen.findByRole('button', { name: 'Back to who follows' }))
    expect(await screen.findByRole('dialog', { name: 'Who follows Item one' })).toBeTruthy()
  })
})

describe('MembersPill', () => {
  it('takes its accessible name from label when given', () => {
    render(<MembersPill members={[{ name: 'Ana Duarte' }]} count={2} label="Who follows Item one: 2" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Who follows Item one: 2' })).toBeTruthy()
  })
})
