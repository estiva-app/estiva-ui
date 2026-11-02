// @vitest-environment jsdom
/**
 * The question before archiving a file or a Folder (FOL-46), moved from Peek
 * (C11, 2 November) with Peek's tests, and the app's words passed in: the apps
 * it goes out of, and its last line.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchiveDialog, type ArchiveDialogProps } from './ArchiveDialog'

afterEach(cleanup)

const PEEKS_LINE = 'Nothing is deleted: it waits under Archive, where Unarchive brings everything back as it was.'

const Fixture = (props: Partial<ArchiveDialogProps>) => (
  <ArchiveDialog title="T" what="topic" hides={[]} apps={['Peek', 'Ship']} getBack={PEEKS_LINE} onClose={() => {}} onArchive={async () => true} {...props} />
)

describe('ArchiveDialog', () => {
  it('says what goes with the file, counted, and archives with the resolution typed', async () => {
    const onArchive = vi.fn(async () => true)
    render(<Fixture title="Probe project" what="project" hides={['2 issues']} staysVisible={['1 file also in Steer']} onArchive={onArchive} />)
    expect(screen.getByRole('dialog', { name: 'Archive “Probe project”?' })).toBeTruthy()
    expect(screen.getByText('This hides the project and 2 issues from every list, in Peek and in Ship.')).toBeTruthy()
    expect(screen.getByText('1 file also in Steer stay visible there.')).toBeTruthy()
    await userEvent.type(screen.getByLabelText('Resolution (optional)'), '  Shipped in 0.37.  ')
    await userEvent.click(screen.getByRole('button', { name: 'Archive project' }))
    expect(onArchive).toHaveBeenCalledWith('Shipped in 0.37.')
  })

  it('archives from the resolution with Ctrl+Enter, and closes when it is done', async () => {
    const onArchive = vi.fn(async () => true)
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} onArchive={onArchive} />)
    await userEvent.type(screen.getByLabelText('Resolution (optional)'), 'Merged{Control>}{Enter}{/Control}')
    expect(onArchive).toHaveBeenCalledWith('Merged')
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('stays open when the archive is refused', async () => {
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} onArchive={async () => false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Archive topic' }))
    await vi.waitFor(() => expect((screen.getByRole('button', { name: 'Archive topic' }) as HTMLButtonElement).disabled).toBe(false))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape, even with the cursor in the resolution', async () => {
    const onClose = vi.fn()
    render(<Fixture onClose={onClose} />)
    await userEvent.type(screen.getByLabelText('Resolution (optional)'), 'half a thought{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('hides only the file when nothing is under it', () => {
    render(<Fixture />)
    expect(screen.getByText('This hides the topic from every list, in Peek and in Ship.')).toBeTruthy()
  })

  it('opens before the count is in: says it is counting, and Archive waits for it', async () => {
    const onArchive = vi.fn(async () => true)
    render(<Fixture what="folder" hides={null} onArchive={onArchive} />)
    expect(screen.getByText('Counting what archiving this folder would hide…')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Archive folder' }) as HTMLButtonElement).disabled).toBe(true)
    await userEvent.type(screen.getByLabelText('Resolution (optional)'), 'x{Control>}{Enter}{/Control}')
    expect(onArchive).not.toHaveBeenCalled()
  })

  it('names the apps it goes out of in the order given, and its last line is the app’s', () => {
    const shipsLine = 'Nothing is deleted: a link still opens it, and Unarchive brings everything back as it was.'
    const { unmount } = render(<Fixture what="project" hides={['14 issues']} apps={['Ship', 'Peek']} getBack={shipsLine} />)
    expect(screen.getByText('This hides the project and 14 issues from every list, in Ship and in Peek.')).toBeTruthy()
    expect(screen.getByText(shipsLine)).toBeTruthy()
    unmount()
    const { unmount: next } = render(<Fixture apps={['Leaf']} />)
    expect(screen.getByText('This hides the topic from every list, in Leaf.')).toBeTruthy()
    next()
    render(<Fixture apps={[]} hides={['3 projects', '6 topics']} />)
    expect(screen.getByText('This hides the topic and 3 projects and 6 topics from every list.')).toBeTruthy()
  })

  it('both buttons wait while it archives', async () => {
    render(<Fixture onArchive={() => new Promise<boolean>(() => {})} />)
    await userEvent.click(screen.getByRole('button', { name: 'Archive topic' }))
    expect((screen.getByRole('button', { name: 'Archive topic' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Resolution (optional)') as HTMLTextAreaElement).disabled).toBe(true)
  })
})
