// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchivedNotice } from './ArchivedNotice'

afterEach(cleanup)

describe('ArchivedNotice', () => {
  it('says who archived it and when, the resolution, and offers Unarchive', () => {
    render(<ArchivedNotice by="Person two" when="Today" resolution="Shipped." onUnarchive={() => {}} />)
    expect(screen.getByText('Archived by Person two · Today')).toBeTruthy()
    expect(screen.getByText('Shipped.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Unarchive' })).toBeTruthy()
  })

  it('archived with a project above it, names that project and opens it instead of unarchiving', async () => {
    const open = vi.fn()
    render(<ArchivedNotice by="Person two" when="Today" withWhat="project" withTitle="October release" onUnarchive={() => {}} onOpenParent={open} />)
    expect(screen.getByText('Archived with its project “October release” by Person two · Today')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Unarchive' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Open project' }))
    expect(open).toHaveBeenCalledOnce()
  })

  it('unarchives once while the first press is still being written', async () => {
    let finish = () => {}
    const unarchive = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<ArchivedNotice by="Person two" when="Today" onUnarchive={unarchive} />)
    const button = screen.getByRole('button', { name: 'Unarchive' })
    await userEvent.click(button)
    await userEvent.click(button)
    expect(unarchive).toHaveBeenCalledOnce()
    finish()
    await vi.waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
  })

  it('offers nothing to a reader who cannot restore it', () => {
    render(<ArchivedNotice by="Person two" when="Today" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
