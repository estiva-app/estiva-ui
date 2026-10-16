import type { JSONContent } from '@tiptap/react'
import type { CaptionedItem, MentionPerson, ReferenceSection } from '../../src/ComposerTriggers'

/**
 * Invented data for the comments-everywhere concept: the same four people as
 * the text-comments concept, the five reactions every app offers today, and
 * what each app's `[` lists.
 */

export const PEOPLE: MentionPerson[] = [
  {
    id: 'ana',
    name: 'Ana Duarte',
    description: 'Design',
    pubkey: 'a'.repeat(64),
  },
  {
    id: 'ravi',
    name: 'Ravi Mehta',
    description: 'Engineering',
    pubkey: 'b'.repeat(64),
  },
  {
    id: 'mia',
    name: 'Mia Chen',
    description: 'Operations',
    pubkey: 'c'.repeat(64),
  },
  { id: 'me', name: 'Sam Porter', description: 'You', pubkey: 'd'.repeat(64) },
]

export const NAME: Record<string, string> = Object.fromEntries(PEOPLE.map((p) => [p.id, p.name]))

/** Who is signed in: Edit and Delete are offered on this person's comments only. */
export const ME = 'me'

/** The five reactions Peek and Ship offer (`REACTION_EMOJI` in @estiva-app/conversation). */
export const REACTIONS = [
  { emoji: '👍', label: 'Makes sense' },
  { emoji: '💯', label: 'Agree' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '🚀', label: "Let's go!" },
  { emoji: '🎉', label: 'Congrats' },
]

/** One reaction, and everyone who chose it. */
export interface ReactionCount {
  emoji: string
  by: string[]
}

export const MANY_REACTIONS: ReactionCount[] = [
  { emoji: '👍', by: ['ana', 'ravi', 'mia', 'me'] },
  { emoji: '🎉', by: ['ana', 'mia'] },
  { emoji: '🙏', by: ['ravi'] },
]

const ref = (id: string, label: string, snippet: string, description?: string, summary?: string): CaptionedItem => ({
  id,
  label,
  snippet,
  uri: `nostr:${id}`,
  description,
  summary,
})

const MESSAGES = [
  ref('m1', 'Ana Duarte', 'Should we name the teams here, or keep it general?', 'In this thread'),
  ref('m2', 'Ravi Mehta', 'General. I am putting the names in the checklist instead.', 'In this thread'),
  ref('m3', 'Mia Chen', 'The press notes are ready for a first read.', 'On this page'),
]

const FILES = [
  ref('f1', 'Launch plan', 'Launch plan', 'Document', 'What we promise, who we start with, and how far along the work is.'),
  ref('f2', 'Set up a new team in one sitting', 'Set up a new team in one sitting', 'Issue · In progress', 'The first-run steps a new team goes through.'),
  ref('f3', 'Press notes', 'Press notes', 'Document', 'What we say on launch day.'),
  ref('f4', 'Launch week', 'Launch week', 'Topic'),
]

const narrow = (items: CaptionedItem[], query: string) => items.filter((item) => `${item.label} ${item.snippet}`.toLowerCase().includes(query.toLowerCase()))

/** What `[` lists in every app today: Messages, then Files. */
export const referenceSections = (query: string): ReferenceSection[] => [
  { label: 'Messages', items: narrow(MESSAGES, query).slice(0, 3) },
  { label: 'Files', items: narrow(FILES, query).slice(0, 4) },
]

// Bodies, as the box holds them.

const text = (t: string, marks?: JSONContent['marks']): JSONContent => ({
  type: 'text',
  text: t,
  ...(marks ? { marks } : {}),
})
const mention = (id: string): JSONContent => ({
  type: 'mention',
  attrs: { id, label: NAME[id] },
})
const reference = (item: CaptionedItem): JSONContent => ({
  type: 'captionedReference',
  attrs: {
    id: item.id,
    label: item.label,
    snippet: item.snippet,
    uri: item.uri,
  },
})
export const doc = (...paragraphs: JSONContent[][]): JSONContent => ({
  type: 'doc',
  content: paragraphs.map((content) => ({ type: 'paragraph', content })),
})

/** A draft half written: what "typing" starts with. */
export const DRAFT = doc([text('I think the checklist is the right place, but ')])

/** A comment with a mention, a reference and a bold word: what "editing" opens. */
export const WITH_CHIPS = doc([
  mention('ravi'),
  text(' the names are now in '),
  reference(FILES[1]),
  text(', '),
  text('all four', [{ type: 'bold' }]),
  text(' of them.'),
])

/** What "refused" puts back. */
export const REFUSED = doc([text('Moving the press notes to Thursday, '), mention('mia'), text(' can you check the room?')])

/** What "sending" holds. */
export const SENDING = doc([text('Agreed, the checklist it is.')])

/** A comment as a card draws it. */
export interface Comment {
  id: string
  by: string
  when: string
  body: JSONContent
  edited?: boolean
  reactions?: ReactionCount[]
  files?: { name: string; size: number; contentType: string }[]
}

export const THREAD: Comment[] = [
  {
    id: 'c1',
    by: 'ana',
    when: '2h',
    body: doc([text('Should we name the teams here, or keep it general?')]),
  },
  {
    id: 'c2',
    by: 'ravi',
    when: '1h',
    body: doc([text('General. I am putting the names in '), reference(FILES[1]), text(' instead.')]),
  },
  {
    id: 'c3',
    by: 'me',
    when: '40m',
    body: WITH_CHIPS,
    edited: true,
  },
]

/** A second thread, so a draft can be left in one and found again. */
export const OTHER_THREAD: Comment[] = [
  {
    id: 'o1',
    by: 'mia',
    when: '50m',
    body: doc([text('Still true after the reshuffle?')]),
  },
  { id: 'o2', by: 'ravi', when: '20m', body: doc([text('Yes, still mine.')]) },
]
