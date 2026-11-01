// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationCard, ReplyCard } from './ConversationCard'

afterEach(cleanup)

const ONE = { name: 'Person one' }

/**
 * The strip shows while the card is pointed at. Pointed at with a plain event: user-event's move onto a button
 * inside the card reads, in jsdom, as leaving it, and the strip went before the press landed (measured; in a
 * browser the same presses work, as the stories show).
 */
async function point(_user: ReturnType<typeof userEvent.setup>, words: string) {
  fireEvent.mouseEnter(screen.getByText(words))
}

/** A press on a button of the strip, with a plain event for the same reason. */
function press(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('ConversationCard', () => {
  it('asks before it deletes your comment, and says its replies stay', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" own onDelete={onDelete} replies={{ count: 2 }}>
        Words
      </ConversationCard>,
    )
    await point(user, 'Words')
    press('More actions')
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
    const question = await screen.findByRole('alertdialog')
    expect(within(question).getByText('Its 2 replies stay.')).toBeTruthy()
    await user.click(within(question).getByRole('button', { name: 'Delete comment' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('offers neither Edit nor Delete on someone else’s comment', async () => {
    const user = userEvent.setup()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onResolve={() => {}} onDelete={() => {}} editor={() => null}>
        Words
      </ConversationCard>,
    )
    await point(user, 'Words')
    press('More actions')
    await screen.findByRole('menuitem', { name: 'Resolve' })
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull()
  })

  it('resolves with the note written in the dialog', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onResolve={onResolve}>
        Words
      </ConversationCard>,
    )
    await point(user, 'Words')
    press('Resolve')
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByRole('textbox'), 'Going with the first one')
    await user.click(within(dialog).getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledWith('Going with the first one')
  })

  it('folds when resolved: the check by the time, who and the note above its replies, its reactions held back, and still opens its thread on a press', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" resolved={{ by: 'Person two', note: 'Done.' }} reactions={{ reactions: [{ emoji: '👍', by: ['a'] }], options: [], nameOf: (id) => id }} onClick={onClick}>
        Words
      </ConversationCard>,
    )
    // Folded (Katerina, 1 November): "✓ Resolved" by the time, and "Person two → Done." above its replies, with no "resolved";
    // closed, its words in one line and its reactions wait.
    expect(screen.getByText('Resolved')).toBeTruthy()
    expect(screen.getByText('Person two')).toBeTruthy()
    expect(screen.getByText('Done.')).toBeTruthy()
    expect(screen.queryByText(/Person two resolved/)).toBeNull()
    expect(screen.queryByRole('button', { name: /👍/ })).toBeNull()
    await user.click(screen.getByText('Words'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('opens its thread on a press anywhere on it, beside its reactions too, but not on a reaction', () => {
    const onClick = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" reactions={{ reactions: [{ emoji: '👍', by: ['a'] }], options: [], nameOf: (id) => id, onToggle: () => {} }} onClick={onClick}>
        Words
      </ConversationCard>,
    )
    const reaction = screen.getByRole('button', { name: /👍/ })
    fireEvent.click(reaction)
    expect(onClick).not.toHaveBeenCalled()
    // The row the reactions stand in, beside them: it stopped every press before (31 October).
    fireEvent.click(reaction.closest('[data-reactions]') ?? reaction.parentElement!.parentElement!)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('opens your box to edit, and closes it when the box is done', async () => {
    const user = userEvent.setup()
    render(
      <ConversationCard
        author={ONE}
        time="11:08 AM"
        own
        editor={(done) => (
          <button type="button" onClick={done}>
            Save
          </button>
        )}
      >
        Words
      </ConversationCard>,
    )
    await point(user, 'Words')
    press('More actions')
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Words')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('says a deleted comment was deleted, and keeps its replies row', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" deleted replies={{ count: 3 }}>
        Words
      </ConversationCard>,
    )
    expect(screen.getByText('This comment was deleted.')).toBeTruthy()
    expect(screen.queryByText('Words')).toBeNull()
    expect(screen.getByText('3 replies')).toBeTruthy()
  })
})

describe('ReplyCard', () => {
  it('asks before it deletes your reply', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <ReplyCard author={ONE} time="11:40 AM" own onDelete={onDelete}>
        A reply
      </ReplyCard>,
    )
    await point(user, 'A reply')
    press('More actions')
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete reply' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
