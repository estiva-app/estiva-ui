// @vitest-environment jsdom
/**
 * Move a file to another team, under another file, or both (FOL-45): Peek's
 * MoveDialog, moved into the kit (C11, 2 November) with Peek's tests, and
 * what Leaf's and Ship's moves need beside them. A team that could not be
 * read is said as the section's empty line with its Try again (B8).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveDialog, type MoveChoice, type MoveDialogProps, type MovePlace } from './MoveDialog'

afterEach(cleanup)

const HQ = { id: 'hq', name: 'Estiva HQ' }
const STEER = { id: 'steer', name: 'Steer' }
const TOP: MovePlace = { id: '', path: [] }
const BRIEF: MovePlace = { id: '30840:a:brief', path: ['Brief'] }
const LIVE: MovePlace = { id: '30850:a:live', path: ['A live project'] }

const Fixture = (props: Partial<MoveDialogProps>) => (
  <MoveDialog
    title="Notes"
    description="Everyone who can read it now still can."
    from="hq"
    folders={[HQ, STEER]}
    places={[]}
    placesIn={vi.fn(async () => [])}
    onMove={vi.fn(async () => true)}
    onClose={() => {}}
    {...props}
  />
)

const optionsOf = async (name: string) => {
  await userEvent.click(screen.getByRole('combobox', { name }))
  // The chosen option's check reads as a mark in jsdom; the label is the rest.
  return (await screen.findAllByRole('option')).map((option) => option.textContent?.replace('✔️', ''))
}

const pick = async (name: string, option: string) => {
  await userEvent.click(screen.getByRole('combobox', { name }))
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('MoveDialog (FOL-45, Peek’s tests)', () => {
  it('opens on the team the file is in, with only real moves there', async () => {
    render(<Fixture places={[BRIEF]} />)
    expect(await optionsOf('Put it under')).toEqual(['Brief'])
  })

  it('reads another team when it is picked, and moves to its top by default', async () => {
    const placesIn = vi.fn(async () => [TOP, BRIEF])
    const onMove = vi.fn(async () => true)
    render(<Fixture startAtTop placesIn={placesIn} onMove={onMove} />)
    await pick('Team', 'Steer')
    expect(placesIn).toHaveBeenCalledWith('steer')
    expect(await optionsOf('Put it under')).toEqual(['The top of Steer', 'Brief'])
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith({ folder: 'steer', parent: '' }))
  })

  it('asks a file that nests under nothing only for the team, never offers the one it is in, and waits for a pick', async () => {
    const onMove = vi.fn(async () => true)
    render(<Fixture places={undefined} placesIn={undefined} onMove={onMove} />)
    expect(screen.queryByRole('combobox', { name: 'Put it under' })).toBeNull()
    // Nothing preselected: a Move pressed straight away would be a move nobody chose.
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
    expect(await optionsOf('Team')).toEqual(['Steer'])
    await userEvent.click(await screen.findByRole('option', { name: 'Steer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith({ folder: 'steer' }))
  })

  it('never picks a parent for a file whose parent is one kind: Move waits until the person does', async () => {
    const onMove = vi.fn(async () => true)
    render(<Fixture placesIn={async () => [LIVE]} onMove={onMove} />)
    await pick('Team', 'Steer')
    await screen.findByRole('combobox', { name: 'Put it under' })
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Put it under' }).hasAttribute('data-disabled')).toBe(false))
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
    await pick('Put it under', 'A live project')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith({ folder: 'steer', parent: LIVE.id }))
  })

  it('says so when the picked team has nowhere to put it, and does not move', async () => {
    render(<Fixture placesIn={async () => []} />)
    await pick('Team', 'Steer')
    expect(await screen.findByText('There is nowhere in Steer to put it.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('says a team that could not be read, and reads it again on Try again', async () => {
    const placesIn = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce([TOP])
    render(<Fixture placesIn={placesIn} />)
    await pick('Team', 'Steer')
    expect(await screen.findByText('Steer could not be read.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await optionsOf('Put it under')).toEqual(['The top of Steer'])
  })
})

describe('MoveDialog, the kit’s', () => {
  it('says a team that could not be read as the empty line beside it does, with its Try again (B8)', async () => {
    render(<Fixture placesIn={async () => Promise.reject(new Error('down'))} />)
    await pick('Team', 'Steer')
    const line = await screen.findByText('Steer could not be read.')
    const empty = screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Steer could not be read.')
    expect(empty).toBe(line)
    // The section's empty line: caption and muted, as "There is nowhere in … to put it." is.
    expect(line.className.split(' ')).toEqual(expect.arrayContaining(['text-caption', 'text-text-muted']))
    expect(line.nextElementSibling).toBe(screen.getByRole('button', { name: 'Try again' }))
  })

  it('reads two picks of one team once', async () => {
    const placesIn = vi.fn(() => new Promise<MovePlace[]>(() => {}))
    render(<Fixture placesIn={placesIn} />)
    await pick('Team', 'Steer')
    await pick('Team', 'Estiva HQ')
    await pick('Team', 'Steer')
    expect(placesIn).toHaveBeenCalledTimes(1)
  })

  it('reads the team it opens on when its places were not handed in', async () => {
    const placesIn = vi.fn(async () => [TOP])
    render(<Fixture places={undefined} placesIn={placesIn} startAtTop />)
    await waitFor(() => expect(placesIn).toHaveBeenCalledWith('hq'))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(false))
  })

  it('without startAtTop, chooses no place even when the top is first: Move waits (Leaf’s)', async () => {
    render(<Fixture places={[TOP, BRIEF]} />)
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
    expect(await optionsOf('Put it under')).toEqual(['The top of Estiva HQ', 'Brief'])
  })

  it('names the empty place with topLabel when the top is not a place: “under none of these”', async () => {
    render(<Fixture places={[TOP, LIVE]} topLabel="None — under none of these" />)
    expect(await optionsOf('Put it under')).toEqual(['None — under none of these', 'A live project'])
  })

  it('while the teams are still read, says so in the list, and does not say there is nowhere to go (Leaf’s)', () => {
    render(<Fixture folders={undefined} />)
    expect(screen.queryByText('There is no other team it can be moved to.')).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Team' }).textContent).toContain('Reading…')
  })

  it('says there is no other team when none is offered', () => {
    render(<Fixture folders={[HQ]} places={undefined} placesIn={undefined} />)
    expect(screen.getByText('There is no other team it can be moved to.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('takes another app’s words, and opens on the team it is given (Ship’s Move to team)', async () => {
    const onMove = vi.fn(async () => true)
    render(
      <Fixture
        heading="Move to team"
        folderLabel="Destination team"
        description="Only the team it is listed in changes."
        places={undefined}
        placesIn={undefined}
        startIn="steer"
        onMove={onMove}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Move to team' })).toBeTruthy()
    expect(screen.getByText('Only the team it is listed in changes.')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Destination team' }).textContent).toContain('Steer')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith({ folder: 'steer' }))
  })

  it('says no other team in the app’s words', () => {
    render(<Fixture folders={[HQ]} placesIn={undefined} noFolder="There is no other team it can be moved to." />)
    expect(screen.getByText('There is no other team it can be moved to.')).toBeTruthy()
  })

  it('stays open when the move is refused, and closes when it went through', async () => {
    const onClose = vi.fn()
    const { unmount } = render(<Fixture places={[BRIEF]} onMove={async () => false} onClose={onClose} />)
    await pick('Put it under', 'Brief')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move' })).toBeTruthy())
    expect(onClose).not.toHaveBeenCalled()
    unmount()
    render(<Fixture places={[BRIEF]} onClose={onClose} />)
    await pick('Put it under', 'Brief')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('says it is moving, and both buttons wait', async () => {
    render(<Fixture places={[BRIEF]} onMove={() => new Promise<boolean>(() => {})} />)
    await pick('Put it under', 'Brief')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    expect((screen.getByRole('button', { name: 'Moving…' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('MoveDialog, a file not listed in exactly one team (`from` empty; Ship’s move, 2 November)', () => {
  const THIRD = { id: 'third', name: 'Third' }
  const flat = { places: undefined, placesIn: undefined, from: '' }

  it('holds no team back: listed in two after a move that half-worked, or in none, every team is offered', async () => {
    render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} />)
    expect(await optionsOf('Team')).toEqual(['Estiva HQ', 'Steer', 'Third'])
  })

  it('chooses nothing for the person even so: Move waits for a pick, or it opens on startIn', async () => {
    render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} />)
    expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} startIn="third" />)
    expect(screen.getByRole('combobox', { name: 'Team' }).textContent).toContain('Third')
  })

  it('stays open on a refusal, and Move again is the retry, to the same team', async () => {
    const onMove = vi.fn(async () => false)
    render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} onMove={onMove} />)
    await pick('Team', 'Steer')
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledTimes(1))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(false))
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledTimes(2))
    expect(onMove).toHaveBeenLastCalledWith({ folder: 'steer' })
  })

  it('asks the box only for the teams that name it, ticked as it opened, and says what it answered', async () => {
    const onMove = vi.fn(async () => true)
    const check = { label: (folder: string) => (folder === 'steer' ? 'Keep it a space in Steer' : undefined), checked: true }
    render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} check={check} onMove={onMove} />)
    await pick('Team', 'Third')
    expect(screen.queryByRole('checkbox')).toBeNull()
    await pick('Team', 'Steer')
    const box = screen.getByRole('checkbox', { name: 'Keep it a space in Steer' })
    expect(box.getAttribute('aria-checked')).toBe('true')
    await userEvent.click(box)
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith({ folder: 'steer', checked: false }))
  })

  it('a team that does not ask the box moves with no answer for it, even after another team showed it ticked', async () => {
    const onMove = vi.fn(async (_choice: MoveChoice) => true)
    const check = { label: (folder: string) => (folder === 'steer' ? 'Keep it a space in Steer' : undefined), checked: true }
    render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} check={check} onMove={onMove} />)
    await pick('Team', 'Steer')
    expect(screen.getByRole('checkbox', { name: 'Keep it a space in Steer' }).getAttribute('aria-checked')).toBe('true')
    await pick('Team', 'Third')
    expect(screen.queryByRole('checkbox')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledTimes(1))
    expect(onMove.mock.calls[0][0]).toEqual({ folder: 'third' })
    expect(onMove.mock.calls[0][0]).not.toHaveProperty('checked')
  })

  it('a file that nests sends the box’s answer with the place it goes under', async () => {
    const onMove = vi.fn(async () => true)
    const check = { label: (folder: string) => (folder === 'steer' ? 'Keep it a space in Steer' : undefined), checked: true }
    render(<Fixture startAtTop placesIn={vi.fn(async () => [TOP])} check={check} onMove={onMove} />)
    await pick('Team', 'Steer')
    expect(screen.getByRole('checkbox', { name: 'Keep it a space in Steer' }).getAttribute('aria-checked')).toBe('true')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Move' }) as HTMLButtonElement).disabled).toBe(false))
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith({ folder: 'steer', parent: '', checked: true }))
  })

  it('listed in one again (`from` named), the one it is in is held back once more', async () => {
    const { rerender } = render(<Fixture {...flat} folders={[HQ, STEER, THIRD]} />)
    rerender(<Fixture {...flat} from="hq" folders={[HQ, STEER, THIRD]} />)
    expect(await optionsOf('Team')).toEqual(['Steer', 'Third'])
  })
})
