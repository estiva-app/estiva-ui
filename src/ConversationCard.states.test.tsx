// @vitest-environment jsdom
/**
 * What Peek's own card was tested for, and the kit's card now does (Katerina, 1 November: the tests move into the kit
 * before Peek takes its card): who may change it, read-only, an edit the app holds, new and urgent, its files. Peek's
 * wiring keeps its own tests: who the seam says owns a message, the edit box's files and mentions, a refused edit
 * remembered across redraws, the thread's anchors.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationCard, ReplyCard } from './ConversationCard'
import { InThreadCard } from './threadCard'

afterEach(cleanup)

const ONE = { name: 'Person one' }
const REACTED = { reactions: [{ emoji: '👍', by: ['a'] }], options: [], nameOf: (id: string) => id }

/** Pointed at with a plain event, as in ConversationCard.test: user-event's move reads, in jsdom, as leaving. */
function point(words: string) {
  fireEvent.mouseEnter(screen.getByText(words))
}

function editBox(done: () => void) {
  return (
    <button type="button" onClick={done}>
      Save
    </button>
  )
}

/** Whether `b` comes after `a` in the page. */
function after(a: Node, b: Node) {
  return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('who may change it (Peek: ConversationCard.ownership)', () => {
  it('offers Edit and Delete on your own comment', async () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" own editor={editBox} onDelete={() => {}}>
        Words
      </ConversationCard>,
    )
    point('Words')
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeTruthy()
  })

  it('offers Edit and Delete on your own reply', async () => {
    render(
      <ReplyCard author={ONE} time="11:40 AM" own editor={editBox} onDelete={() => {}}>
        A reply
      </ReplyCard>,
    )
    point('A reply')
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeTruthy()
  })

  it('offers neither on someone else’s reply: with nothing else to offer, no ⋯ at all', () => {
    render(
      <ReplyCard author={ONE} time="11:40 AM" editor={editBox} onDelete={() => {}}>
        A reply
      </ReplyCard>,
    )
    point('A reply')
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
  })
})

describe('read-only, an archived page (Peek: ConversationCard.readOnly)', () => {
  it('draws no strip, even on your own comment', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" own readOnly editor={editBox} onDelete={() => {}} onResolve={() => {}} onReply={() => {}}>
        Words
      </ConversationCard>,
    )
    point('Words')
    for (const name of ['More actions', 'Resolve', 'Reply']) expect(screen.queryByRole('button', { name })).toBeNull()
  })

  it('shows its reactions, but they cannot be pressed and there is no way to react', () => {
    const onToggle = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" readOnly reactions={{ ...REACTED, onToggle }}>
        Words
      </ConversationCard>,
    )
    const pill = screen.getByRole('button', { name: /👍/ }) as HTMLButtonElement
    expect(pill.disabled).toBe(true)
    fireEvent.click(pill)
    expect(onToggle).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Add a reaction' })).toBeNull()
  })

  it('a read-only reply: no strip, and its reactions cannot be pressed', () => {
    const onToggle = vi.fn()
    render(
      <ReplyCard author={ONE} time="11:40 AM" own readOnly editor={editBox} onDelete={() => {}} reactions={{ ...REACTED, onToggle }}>
        A reply
      </ReplyCard>,
    )
    point('A reply')
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /👍/ }))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('offers no way to react where nothing writes a reaction, with no onToggle', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" reactions={REACTED}>
        Words
      </ConversationCard>,
    )
    expect((screen.getByRole('button', { name: /👍/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Add a reaction' })).toBeNull()
  })

  it('a deleted comment is read-only: no strip', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" deleted own onDelete={() => {}} onResolve={() => {}} replies={{ count: 1 }}>
        Words
      </ConversationCard>,
    )
    point('This comment was deleted.')
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
  })
})

describe('an edit the app holds: refused, it opens again (Peek: ConversationCard.refusedEdit)', () => {
  it('opens the box while the app says it is being edited, and tells the app when the box is done', async () => {
    const user = userEvent.setup()
    const onEditingChange = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" own editing onEditingChange={onEditingChange} editor={editBox}>
        Words
      </ConversationCard>,
    )
    expect(screen.queryByText('Words')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onEditingChange).toHaveBeenCalledWith(false)
  })

  it('opens no box on a read-only card, even when the app says it is being edited', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" own readOnly editing editor={editBox}>
        Words
      </ConversationCard>,
    )
    expect(screen.getByText('Words')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('a reply too: its box opens while the app holds it', () => {
    render(
      <ReplyCard author={ONE} time="11:40 AM" own editing editor={editBox}>
        A reply
      </ReplyCard>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })
})

describe('new and urgent (Peek: ConversationCard.urgent, the card’s part)', () => {
  it('new: the dot, and the edge in the accent outline', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM" isNew>
        Words
      </ConversationCard>,
    )
    expect(container.querySelector('[data-unread]')).not.toBeNull()
    expect(container.firstElementChild?.className).toMatch(/\bborder-accent-outline\b/)
  })

  it('urgent: the urgent mark in place of the dot, and the edge in the warning outline', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM" isNew urgent>
        Words
      </ConversationCard>,
    )
    expect(container.querySelector('[data-urgent]')).not.toBeNull()
    expect(container.querySelector('[data-unread]')).toBeNull()
    expect(container.firstElementChild?.className).toMatch(/\bborder-warning-outline\b/)
  })

  it('a new reply under it marks the comment too, and its replies row says "1 new"', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM" replies={{ count: 2, isNew: true }}>
        Words
      </ConversationCard>,
    )
    expect(container.firstElementChild?.className).toMatch(/\bborder-accent-outline\b/)
    expect(screen.getByText('1 new')).toBeTruthy()
  })

  it('replies under it new by count mark the comment too, and its row says how many (Ship, 2 November): "2 new"', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM" replies={{ count: 3, newCount: 2 }}>
        Words
      </ConversationCard>,
    )
    expect(container.firstElementChild?.className).toMatch(/\bborder-accent-outline\b/)
    expect(screen.getByText('2 new')).toBeTruthy()
  })

  it('read, it draws neither mark nor edge', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM">
        Words
      </ConversationCard>,
    )
    expect(container.querySelector('[data-unread], [data-urgent]')).toBeNull()
    expect(container.firstElementChild?.className).not.toMatch(/-outline\b/)
  })

  it('inside a thread drawn as one card, the dot alone says it: the one card is the edge', () => {
    const { container } = render(
      <InThreadCard.Provider value>
        <ConversationCard author={ONE} time="11:08 AM" isNew>
          Words
        </ConversationCard>
      </InThreadCard.Provider>,
    )
    expect(container.querySelector('[data-unread]')).not.toBeNull()
    expect(container.firstElementChild?.className).not.toMatch(/\bborder-accent-outline\b/)
  })

  it('a new reply in a thread keeps its own edge', () => {
    const { container } = render(
      <InThreadCard.Provider value>
        <ReplyCard author={ONE} time="11:40 AM" isNew>
          A reply
        </ReplyCard>
      </InThreadCard.Provider>,
    )
    expect(container.firstElementChild?.className).toMatch(/\bborder-accent-outline\b/)
  })
})

describe('what the review found (1 November)', () => {
  it('says why a resolve was refused, under the note, while the dialog stays', async () => {
    const user = userEvent.setup()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onResolve={() => false} resolveRefused="The file is archived">
        Words
      </ConversationCard>,
    )
    point('Words')
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    expect(dialog.isConnected).toBe(true)
    expect(screen.getByText(/The file is archived/)).toBeTruthy()
  })

  it('a double click picks a word: it is not a second press', () => {
    const onClick = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onClick={onClick}>
        Words
      </ConversationCard>,
    )
    fireEvent.click(screen.getByText('Words'), { detail: 1 })
    fireEvent.click(screen.getByText('Words'), { detail: 2 })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('words picked by a drag are not a press', () => {
    const onClick = vi.fn()
    render(
      <ConversationCard author={ONE} time="11:08 AM" onClick={onClick}>
        Words to pick
      </ConversationCard>,
    )
    const words = screen.getByText('Words to pick')
    const range = document.createRange()
    range.setStart(words.firstChild!, 0)
    range.setEnd(words.firstChild!, 5)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    fireEvent.click(words, { detail: 1 })
    expect(onClick).not.toHaveBeenCalled()
    window.getSelection()!.removeAllRanges()
    fireEvent.click(words, { detail: 1 })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('asks about a direct message as a message (Katerina, 1 November), and about a comment by default', async () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" own onDelete={() => {}} noun="message">
        Words
      </ConversationCard>,
    )
    point('Words')
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(await screen.findByText('Delete this message?')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete message' })).toBeTruthy()
  })
})

describe('an app’s own words (Katerina, 1 November: Peek reads as it did)', () => {
  it('says the app’s words under the delete question, in place of the kit’s, the replies’ line too', async () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" own onDelete={() => {}} replies={{ count: 2 }} deleteNote={<p>The app’s own words about what deleting does, and the replies.</p>}>
        Words
      </ConversationCard>,
    )
    point('Words')
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(await screen.findByText('The app’s own words about what deleting does, and the replies.')).toBeTruthy()
    expect(screen.queryByText('It is deleted for everyone.')).toBeNull()
    expect(screen.queryByText('Its 2 replies stay.')).toBeNull()
  })
})

describe('its files, what it is about, and how it was resolved', () => {
  it('draws its files under the words, and keeps them once resolved: nothing folds (Katerina, 1 November)', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" files={<span>plan.png</span>}>
        Words
      </ConversationCard>,
    )
    expect(after(screen.getByText('Words'), screen.getByText('plan.png'))).toBe(true)
    cleanup()
    render(
      <ConversationCard author={ONE} time="11:08 AM" files={<span>plan.png</span>} resolved={{ by: 'Person two' }}>
        Words
      </ConversationCard>,
    )
    expect(after(screen.getByText('Words'), screen.getByText('plan.png'))).toBe(true)
  })

  it('puts what it is about under the name and above the words (Katerina, 1 November), on a reply too', () => {
    for (const Part of [ConversationCard, ReplyCard]) {
      render(
        <Part author={ONE} time="11:08 AM" about={<span>the quoted words</span>}>
          Words
        </Part>,
      )
      const name = screen.getByText('Person one')
      const about = screen.getByText('the quoted words')
      expect(after(name, about) && after(about, screen.getByText('Words'))).toBe(true)
      cleanup()
    }
  })

  it('resolved with no note: the check by the time, and no line', () => {
    const { container } = render(
      <ConversationCard author={ONE} time="11:08 AM" resolved={{ by: 'Person two' }}>
        Words
      </ConversationCard>,
    )
    expect(screen.getByText('Resolved')).toBeTruthy()
    expect(container.querySelector('[data-resolved="line"]')).toBeNull()
  })
})
