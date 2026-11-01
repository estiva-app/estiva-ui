// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ConversationMenu } from './ConversationMenu'
import { MenuItem } from './Menu'

afterEach(cleanup)

/** Opens the menu from its own ⋯ button. */
async function open() {
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
  await screen.findByRole('menu')
}

const names = () => screen.getAllByRole('menuitem').map((row) => row.textContent)

describe('ConversationMenu', () => {
  it('offers Resolve, then the app’s rows, then Edit and Delete, the last two apart', async () => {
    const onResolve = vi.fn()
    render(
      <ConversationMenu onResolve={onResolve} onEdit={() => {}} onDelete={() => {}}>
        <MenuItem label="Open work" onClick={() => {}} />
      </ConversationMenu>,
    )
    await open()
    expect(names()).toEqual(['Resolve', 'Open work', 'Edit', 'Delete'])
    expect(screen.getAllByRole('separator').length).toBe(1)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledOnce()
  })

  it('offers Reopen in place of Resolve once resolved', async () => {
    const onReopen = vi.fn()
    render(<ConversationMenu resolved onResolve={() => {}} onReopen={onReopen} />)
    await open()
    expect(names()).toEqual(['Reopen'])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reopen' }))
    expect(onReopen).toHaveBeenCalledOnce()
  })

  it('offers Edit and Delete only when given, with no line before them alone', async () => {
    render(<ConversationMenu onEdit={() => {}} onDelete={() => {}} />)
    await open()
    expect(names()).toEqual(['Edit', 'Delete'])
    expect(screen.queryByRole('separator')).toBeNull()
  })
})
