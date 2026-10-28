import type { MentionPerson } from '../../src/ComposerTriggers'
import type { LinkState } from '../../src/linked'
import { ITEM, PAGE, UNAVAILABLE, ready } from '../../src/linked.examples'
import type { ReactionCount } from '../../src/ReactionRow'
import type { ReactionOption } from '../../src/ReactionPicker'

/**
 * Placeholder data for the one conversation: people are "Person one" to
 * "Person three", and every comment's words say what the conversation does
 * with it, so a reader learns the component from its own canvas.
 */

export const ME = 'one'

export const PEOPLE: MentionPerson[] = ['one', 'two', 'three'].map((n, i) => ({ id: n, name: `Person ${n}`, pubkey: String(i + 1).repeat(64) }))

export const nameOf = (id: string) => PEOPLE.find((p) => p.id === id)?.name ?? 'Someone'

export const OPTIONS: ReactionOption[] = [
  { emoji: '👍', label: 'Agree' },
  { emoji: '👀', label: 'Looking' },
  { emoji: '✅', label: 'Done' },
  { emoji: '🎉', label: 'Congrats' },
]

/** One piece of a comment's words. */
export type Run =
  | { text: string }
  | { person: string }
  | { urgent: string }

/** A line of a comment: words, or a link alone on its line. */
export type Line = Run[] | { link: LinkState } | { web: { title: string; host: string } }

/** The words a comment on part of a page quoted, and what became of them. */
export interface Quote {
  words: string
  now: 'present' | 'reworded' | 'gone'
}

/** Who resolved or reopened a thread, with the note. The newest counts. */
export interface Resolution {
  resolved: boolean
  by: string
  at: string
  note?: string
}

export interface Comment {
  id: string
  by: string
  at: string
  lines: Line[]
  edited?: string
  deleted?: boolean
  quote?: Quote
  reactions?: ReactionCount[]
  replies?: Comment[]
  /** Every resolve and reopen, oldest first: the last one is the thread's state. */
  resolutions?: Resolution[]
}

const words = (text: string): Line => [{ text }]

export const REPLY_ONE: Comment = {
  id: 'r1',
  by: 'two',
  at: '10:48',
  lines: [words('A reply sits in the thread, under the comment it answers.')],
  reactions: [{ emoji: '👍', by: ['one'] }],
}

export const REPLY_TWO: Comment = {
  id: 'r2',
  by: 'one',
  at: '10:52',
  lines: [words('Replies take the same card as the comment, a size smaller.')],
}

export const FIRST: Comment = {
  id: 'c1',
  by: 'one',
  at: '10:42',
  lines: [
    [{ text: 'A comment, with ' }, { person: 'two' }, { text: ' named in it. Its thread opens where each app puts it.' }],
    { link: ready(ITEM) },
  ],
  edited: '10:44',
  reactions: [
    { emoji: '👍', by: ['two', 'three'] },
    { emoji: '👀', by: ['one'] },
  ],
  replies: [REPLY_ONE, REPLY_TWO],
}

export const SECOND: Comment = {
  id: 'c2',
  by: 'two',
  at: '11:05',
  lines: [words('A resolved thread folds to its first line, who resolved it and the note, in the place it was said.')],
  replies: [{ id: 'r3', by: 'one', at: '11:08', lines: [words('A reply before it was resolved.')] }],
  resolutions: [{ resolved: true, by: 'one', at: '11:09', note: 'The second option, as agreed.' }],
}

/** A resolution note a few sentences long, with a second paragraph: it folds to three lines in the list and reads whole in the thread. */
export const LONG_NOTE =
  'The second option, as agreed: the line stays where it was said, and the note says what was settled in words anyone outside the thread understands. ' +
  'The first option goes to the list of things to look at later.\n' +
  'Anyone who may comment can reopen it, and the newest line counts.'

export const THIRD: Comment = {
  id: 'c3',
  by: 'three',
  at: '11:20',
  deleted: true,
  lines: [],
  replies: [{ id: 'r4', by: 'two', at: '11:24', lines: [words('A reply stays under a deleted comment. The thread takes no new ones.')] }],
}

export const FOURTH: Comment = {
  id: 'c4',
  by: 'two',
  at: '11:31',
  lines: [[{ urgent: 'one' }, { text: ' an urgent mention marks the comment with a bar down its edge.' }]],
}

export const ON_WORDS: Comment = {
  id: 'c5',
  by: 'three',
  at: '11:40',
  quote: { words: 'the words a comment was written on', now: 'present' },
  lines: [words('A comment on part of a page shows the words it quoted.')],
}

export const CONVERSATION: Comment[] = [FIRST, SECOND, THIRD, FOURTH]

export const WITH_QUOTES: Comment[] = [ON_WORDS, FIRST, SECOND, THIRD]

export const LINKS: Comment = {
  id: 'c6',
  by: 'one',
  at: '12:02',
  lines: [words('A link alone on its line is a row, the same in every app:'), { link: ready(PAGE) }, { web: { title: 'Example page title', host: 'example.com' } }, { link: UNAVAILABLE }],
}
