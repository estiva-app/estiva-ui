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

  it('resolved: the check by the time, who and the note above its replies, nothing of it hidden, and still opens its thread on a press', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" resolved={{ by: 'Person two', note: 'Done.' }} reactions={{ reactions: [{ emoji: '👍', by: ['a'] }], options: [], nameOf: (id) => id }} onClick={onClick}>
        Words
      </ConversationCard>,
    )
    // "✓ Resolved" by the time, and "Person two → Done." above its replies, with no "resolved"; its words and its reactions
    // stay (Katerina, 1 November: nothing folds).
    expect(screen.getByText('Resolved')).toBeTruthy()
    expect(screen.getByText('Person two')).toBeTruthy()
    expect(screen.getByText('Done.')).toBeTruthy()
    expect(screen.queryByText(/Person two resolved/)).toBeNull()
    expect(screen.getByRole('button', { name: /👍/ })).toBeTruthy()
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

describe('ConversationCard, by the keyboard (Peek’s review, 1 November)', () => {
  it('a card that opens on a press is a Tab stop: reaching it shows the strip, and Enter opens it', async () => {
    const user = userEvent.setup()
    const opened = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onClick={opened} onReply={() => {}}>
        A comment with nothing focusable in it
      </ConversationCard>,
    )
    await user.tab()
    const card = document.activeElement as HTMLElement
    expect(card.textContent).toContain('A comment with nothing focusable in it')
    expect(screen.getByRole('button', { name: 'Reply' })).toBeTruthy()
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(opened).toHaveBeenCalledOnce()
    fireEvent.keyDown(card, { key: ' ' })
    expect(opened).toHaveBeenCalledTimes(2)
  })

  it('a key in a link inside it is the link’s, not a press on the card', () => {
    const opened = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onClick={opened}>
        <a href="#somewhere">a link</a>
      </ConversationCard>,
    )
    fireEvent.keyDown(screen.getByRole('link', { name: 'a link' }), { key: 'Enter' })
    expect(opened).not.toHaveBeenCalled()
  })

  it('a card with nothing to open is no Tab stop', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM" readOnly>
        Nothing to open
      </ConversationCard>,
    )
    expect(container.querySelector('[tabindex="0"]')).toBeNull()
  })
})

/**
 * The exact time on hover (B10, the audit of 2 November): Peek's words for it, the whole date and the time
 * (`toLocaleString`, `dateStyle: 'long'`, `timeStyle: 'short'`), on every comment and reply, as Peek's rows of another
 * app's comments always said it and as PageHeader's time does. Before, only those rows did, by hand.
 */
describe('ConversationCard and ReplyCard, the exact time', () => {
  const AT = Date.UTC(2026, 10, 2, 11, 8)
  const exact = new Date(AT).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })

  it('a comment’s time says the exact date and time under the pointer, and is a time the page can read', async () => {
    const user = userEvent.setup()
    render(
      <ConversationCard author={ONE} time="11:08 AM" at={AT}>
        Words
      </ConversationCard>,
    )
    const time = screen.getByText('11:08 AM')
    expect(time.tagName).toBe('TIME')
    expect(time.getAttribute('datetime')).toBe(new Date(AT).toISOString())
    await user.hover(time)
    expect((await screen.findByRole('tooltip')).textContent).toBe(exact)
  })

  it('a reply’s too', async () => {
    const user = userEvent.setup()
    render(
      <ReplyCard author={ONE} time="11:08 AM" at={AT}>
        Words
      </ReplyCard>,
    )
    await user.hover(screen.getByText('11:08 AM'))
    expect((await screen.findByRole('tooltip')).textContent).toBe(exact)
  })

  it('a time that is a link says the exact time, then where the link goes', async () => {
    const user = userEvent.setup()
    render(
      <ReplyCard author={ONE} time="11:08 AM" at={AT} timeHref="#reply" timeLabel="Link to this one">
        Words
      </ReplyCard>,
    )
    await user.hover(screen.getByRole('link', { name: '11:08 AM' }))
    expect((await screen.findByRole('tooltip')).textContent).toBe(`${exact} · Link to this one`)
  })

  it('with no moment, the time is the app’s words alone, as before', async () => {
    const user = userEvent.setup()
    render(
      <ConversationCard author={ONE} time="11:08 AM">
        Words
      </ConversationCard>,
    )
    await user.hover(screen.getByText('11:08 AM'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
