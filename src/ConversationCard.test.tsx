// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationCard, ReplyCard } from './ConversationCard'
import { PinnedComment } from './PinnedComment'

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

  // SPEC §6.5's "not returned" (Miky, 6 November): never said to be deleted, and closed as a deleted one is.
  it('says a comment that was not read can’t be shown, never that it was deleted, and offers nothing on it', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" unseen own onDelete={() => {}} onReply={() => {}} onResolve={() => {}} replies={{ count: 1 }}>
        Words
      </ConversationCard>,
    )
    expect(screen.getByText('This comment can’t be shown.')).toBeTruthy()
    expect(screen.queryByText('This comment was deleted.')).toBeNull()
    expect(screen.queryByText('Words')).toBeNull()
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
    expect(screen.queryByRole('button', { name: /resolve/i })).toBeNull()
    expect(screen.getByText('1 reply')).toBeTruthy()
  })

  // Leaf's column kept it, and now every app does (Katerina, 3 November): the replies still talk about that place.
  it('a deleted comment still says what it was on, above "This comment was deleted."', () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" deleted about={<p>On the paragraph</p>} replies={{ count: 1 }}>
        Words
      </ConversationCard>,
    )
    const place = screen.getByText('On the paragraph')
    expect(place.compareDocumentPosition(screen.getByText('This comment was deleted.')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('a delete the app refused keeps the question open and says why (Leaf’s, Katerina, 3 November)', async () => {
    const user = userEvent.setup()
    function Refusing() {
      const [refused, setRefused] = useState<string>()
      const refuse = () => {
        setRefused('Could not delete it. Try again.')
        return false
      }
      return (
        <ConversationCard author={ONE} time="11:08 AM" own onDelete={refuse} deleteRefused={refused}>
          Words
        </ConversationCard>
      )
    }
    render(<Refusing />)
    await point(user, 'Words')
    press('More actions')
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    const question = await screen.findByRole('alertdialog')
    expect(within(question).queryByRole('alert')).toBeNull()
    await user.click(within(question).getByRole('button', { name: 'Delete comment' }))
    expect((await within(question).findByRole('alert')).textContent).toBe('Could not delete it. Try again.')
    expect(screen.getByRole('alertdialog')).toBe(question)
  })
})

describe('a refused reaction (ONE-4)', () => {
  const OPTIONS = [{ emoji: '👍', label: 'Makes sense' }]
  const row = (onToggle: (emoji: string) => Promise<{ accepted: true } | { accepted: false; reason: unknown }>) => ({
    reactions: [{ emoji: '👍', by: ['a', 'b'] }],
    options: OPTIONS,
    nameOf: () => 'Someone',
    onToggle,
  })
  const settle = () => act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })

  it('says why in plain words under the reactions, never the relay’s', async () => {
    render(
      <ConversationCard author={ONE} time="11:08 AM" reactions={row(async () => ({ accepted: false, reason: 'invalid: reaction target event not found' }))}>
        Words
      </ConversationCard>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Makes sense, 2' }))
    await settle()
    expect(screen.getByText('Not reacted: this message was deleted, or you can no longer write here.')).toBeTruthy()
    expect(screen.queryByText(/invalid:/)).toBeNull()
  })

  it('is gone on the next reaction, and a reply’s works the same', async () => {
    const answers: ((a: { accepted: true } | { accepted: false; reason: unknown }) => void)[] = []
    const onToggle = () => new Promise<{ accepted: true } | { accepted: false; reason: unknown }>((resolve) => answers.push(resolve))
    render(
      <ReplyCard author={ONE} time="11:40 AM" reactions={row(onToggle)}>
        A reply
      </ReplyCard>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Makes sense, 2' }))
    answers[0]({ accepted: false, reason: 'rate-limited: slow down' })
    await settle()
    expect(screen.getByText('Not reacted: too many at once, try again in a moment.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Makes sense, 2' }))
    expect(screen.queryByText(/Not reacted/)).toBeNull()
    answers[1]({ accepted: true })
    await settle()
    expect(screen.queryByText(/Not reacted/)).toBeNull()
  })

  it('says only the latest reaction’s answer: an earlier refusal arriving late does not replace it', async () => {
    const answers: ((a: { accepted: true } | { accepted: false; reason: unknown }) => void)[] = []
    const onToggle = () => new Promise<{ accepted: true } | { accepted: false; reason: unknown }>((resolve) => answers.push(resolve))
    render(
      <ConversationCard author={ONE} time="11:08 AM" reactions={row(onToggle)}>
        Words
      </ConversationCard>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Makes sense, 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Makes sense, 2' }))
    answers[1]({ accepted: false, reason: 'rate-limited: slow down' })
    await settle()
    answers[0]({ accepted: false, reason: 'invalid: reaction target event not found' })
    await settle()
    expect(screen.getByText('Not reacted: too many at once, try again in a moment.')).toBeTruthy()
    expect(screen.queryByText(/this message was deleted/)).toBeNull()
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

  it('a delete the app refused says why, as a comment’s does', async () => {
    const user = userEvent.setup()
    render(
      <ReplyCard author={ONE} time="11:40 AM" own onDelete={() => false} deleteRefused="Could not delete it. Try again.">
        A reply
      </ReplyCard>,
    )
    await point(user, 'A reply')
    press('More actions')
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    // Said once its Delete is refused, not as the question opens (Leaf's adoption review, 4 November).
    const question = await screen.findByRole('alertdialog')
    await user.click(within(question).getByRole('button', { name: 'Delete reply' }))
    expect((await within(question).findByRole('alert')).textContent).toBe('Could not delete it. Try again.')
  })
})

/**
 * In Leaf's 360px cards a time in words and "(edited)" ran under the strip, which covered the end of "(edited)" (Leaf's
 * adoption review, 4 November). jsdom draws nothing, so the boxes are given: the strip from x 232, the head's words to
 * x 367, the last part of them ending at `end`.
 */
describe('the head keeps clear of the strip', () => {
  function placed(end: number) {
    return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const box = (left: number, right: number) => ({ left, right, x: left, y: 0, top: 0, bottom: 20, width: right - left, height: 20, toJSON: () => ({}) }) as DOMRect
      if (this.matches('[data-head]')) return box(25, 367)
      if (this.parentElement?.matches('[data-head]')) return this === this.parentElement.lastElementChild ? box(end - 40, end) : box(25, end - 48)
      if (this.matches('.absolute.right-1.top-1')) return box(232, 372)
      return box(0, 0)
    })
  }
  const head = () => document.querySelector<HTMLElement>('[data-head]')!

  for (const [what, card] of [
    ['a comment', (words: string) => <ConversationCard author={ONE} time="20 minutes ago" edited="Edited 2 minutes ago" onReply={() => {}} onResolve={() => {}}>{words}</ConversationCard>],
    ['a reply', (words: string) => <ReplyCard author={ONE} time="20 minutes ago" edited="Edited 2 minutes ago" own onDelete={() => {}}>{words}</ReplyCard>],
  ] as const) {
    it(`${what}: while the strip shows, the words that reach it fade out 8px before it, and nothing in the head moves`, async () => {
      const user = userEvent.setup()
      const boxes = placed(238.4)
      render(card('Words'))
      const parts = Array.from(head().children, (part) => part.outerHTML)
      expect(head().style.maskImage).toBe('')
      await point(user, 'Words')
      // Transparent from 8px before the strip (x 224, 199px into the head), after a 16px fade.
      expect(head().style.maskImage).toBe('linear-gradient(to right, black 183px, transparent 199px)')
      expect(Array.from(head().children, (part) => part.outerHTML)).toEqual(parts)
      boxes.mockRestore()
    })
  }

  it('words that end before the strip are left as they are', async () => {
    const user = userEvent.setup()
    const boxes = placed(200)
    render(
      <ConversationCard author={ONE} time="11:08 AM" onReply={() => {}}>
        Words
      </ConversationCard>,
    )
    await point(user, 'Words')
    expect(screen.getByRole('button', { name: 'Reply' })).toBeTruthy()
    expect(head().style.maskImage).toBe('')
    boxes.mockRestore()
  })
})

/**
 * The app keeps the refusal in its own state, as the usage page asks, and is not told when the question closes. Before,
 * the next Delete or Resolve opened already saying the last one's "Could not … Try again.", before anything was pressed
 * (Leaf's adoption review, 4 November).
 */
describe('a refusal is said only in the question it answered', () => {
  const REFUSED = 'Could not do it. Try again.'

  /** An app that sets the refusal when it refuses, and never clears it. */
  function Refusing({ reply = false }: { reply?: boolean }) {
    const [refused, setRefused] = useState<string>()
    const refuse = () => {
      setRefused(REFUSED)
      return false
    }
    return reply ? (
      <ReplyCard author={ONE} time="11:40 AM" own onDelete={refuse} deleteRefused={refused}>
        Words
      </ReplyCard>
    ) : (
      <ConversationCard author={ONE} time="11:08 AM" own onDelete={refuse} deleteRefused={refused} onResolve={refuse} resolveRefused={refused}>
        Words
      </ConversationCard>
    )
  }

  async function askToDelete(user: ReturnType<typeof userEvent.setup>) {
    await point(user, 'Words')
    press('More actions')
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    return screen.findByRole('alertdialog')
  }

  async function askToResolve(user: ReturnType<typeof userEvent.setup>) {
    await point(user, 'Words')
    press('Resolve')
    return screen.findByRole('dialog')
  }

  for (const [what, reply, button] of [
    ['a comment', false, 'Delete comment'],
    ['a reply', true, 'Delete reply'],
  ] as const) {
    it(`deleting ${what}: refused, cancelled and asked again, the new question is clean until it is refused`, async () => {
      const user = userEvent.setup()
      render(<Refusing reply={reply} />)
      let question = await askToDelete(user)
      await user.click(within(question).getByRole('button', { name: button }))
      expect((await within(question).findByRole('alert')).textContent).toBe(REFUSED)
      await user.click(within(question).getByRole('button', { name: 'Cancel' }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

      question = await askToDelete(user)
      expect(within(question).queryByRole('alert')).toBeNull()
      await user.click(within(question).getByRole('button', { name: button }))
      expect((await within(question).findByRole('alert')).textContent).toBe(REFUSED)
    })
  }

  it('resolving: refused, cancelled and asked again, the new dialog is clean until it is refused', async () => {
    const user = userEvent.setup()
    render(<Refusing />)
    let dialog = await askToResolve(user)
    await user.click(within(dialog).getByRole('button', { name: 'Resolve' }))
    expect((await within(dialog).findByRole('alert')).textContent).toBe(REFUSED)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    dialog = await askToResolve(user)
    expect(within(dialog).queryByRole('alert')).toBeNull()
    await user.click(within(dialog).getByRole('button', { name: 'Resolve' }))
    expect((await within(dialog).findByRole('alert')).textContent).toBe(REFUSED)
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

  it('a moment that is not one (not a number, endless) draws the time as with none, and breaks nothing', () => {
    for (const at of [NaN, Infinity]) {
      render(
        <>
          <ConversationCard author={ONE} time="11:08 AM" at={at}>
            A comment
          </ConversationCard>
          <ReplyCard author={ONE} time="11:30 AM" at={at}>
            A reply
          </ReplyCard>
          <PinnedComment author={ONE} time="Today at 11:08 AM" at={at} words="The comment" />
        </>,
      )
      for (const time of ['11:08 AM', '11:30 AM', 'Today at 11:08 AM']) expect(screen.getByText(time).tagName).not.toBe('TIME')
      cleanup()
    }
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
