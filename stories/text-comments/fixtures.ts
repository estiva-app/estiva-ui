import type { CommentAnchor } from '../../src/CommentHighlights'

/**
 * Invented data for the text-comments concept: the document from Katerina's
 * Leaf prototype (Launch plan), grown by three paragraphs so a comment can run
 * across them, and a thread in each of §13.6's states.
 */

export const PEOPLE = {
  ana: 'Ana Duarte',
  ravi: 'Ravi Mehta',
  mia: 'Mia Chen',
  me: 'Sam Porter',
} as const

export type PersonId = keyof typeof PEOPLE

const text = (t: string) => ({ type: 'text', text: t })
const p = (blockId: string, t: string) => ({ type: 'paragraph', attrs: { blockId }, content: [text(t)] })
const h = (blockId: string, level: 1 | 2, t: string) => ({ type: 'heading', attrs: { level, blockId }, content: [text(t)] })
const li = (blockId: string, t: string) => ({ type: 'listItem', attrs: { blockId }, content: [{ type: 'paragraph', content: [text(t)] }] })

/** The page as the editor opens it. "Aims" was renamed "Goals" after Ana's comment on it. */
export const DOCUMENT = {
  type: 'doc',
  content: [
    p('lp-1', 'This page is where the launch lives: what we promise, who we start with, and how far along the work is.'),
    h('lp-2', 1, 'Goals'),
    { type: 'bulletList', attrs: { blockId: 'lp-3' }, content: [li('lp-3a', 'Every new team is set up in one sitting.'), li('lp-3b', 'No one has to ask where a document lives.'), li('lp-3c', 'The first week feels calm, not busy.')] },
    p('lp-4', 'We start with the teams who asked first, and grow from what they tell us.'),
    p('lp-4b', 'The first month is for listening: one call a week with each team, and notes in the same place every time.'),
    p('lp-4c', 'After that, we decide together which teams come next, and how many at once.'),
    h('lp-5', 1, 'Who does what'),
    p('lp-6', 'Pricing questions go to Mia, and Ravi owns the press notes. The day-one list is in the checklist.'),
    h('lp-7', 2, 'Open questions'),
    p('lp-8', 'Do we invite by link from the start, or only by name? A link is quicker; a name is safer.'),
    p('lp-9', 'Can a team bring its old documents with it, or does it start empty?'),
  ],
}

export interface Comment {
  id: string
  by: PersonId
  when: string
  text: string
}

/** A thread: where it is (absent: the whole document) and what was said. */
export interface Thread {
  id: string
  anchor?: Omit<CommentAnchor, 'id'>
  comments: Comment[]
  resolved?: boolean
}

export const THREADS: Thread[] = [
  {
    id: 'words',
    anchor: { blocks: ['lp-4'], quote: { start: 'the teams who asked first' } },
    comments: [
      { id: 'c1', by: 'ana', when: '2h', text: 'Should we name the teams here, or keep it general?' },
      { id: 'c2', by: 'ravi', when: '1h', text: 'General. I am putting the names in the checklist instead.' },
    ],
  },
  {
    id: 'blocks',
    anchor: { blocks: ['lp-4b', 'lp-4c'] },
    comments: [{ id: 'c3', by: 'ravi', when: '50m', text: 'These two paragraphs say the same thing twice. One is enough?' }],
  },
  {
    id: 'press',
    anchor: { blocks: ['lp-6'], quote: { start: 'owns the press notes' } },
    comments: [
      { id: 'c4', by: 'mia', when: '40m', text: 'Still true after the reshuffle?' },
      { id: 'c5', by: 'ravi', when: '20m', text: 'Yes, still mine.' },
    ],
  },
  {
    id: 'passage',
    anchor: { blocks: ['lp-8', 'lp-9'], quote: { start: 'A link is quicker; a name is safer.', end: 'Can a team bring its old documents with it' } },
    comments: [{ id: 'c6', by: 'mia', when: '15m', text: 'Both of these depend on who signs up first. Can we decide them together on Friday?' }],
  },
  {
    id: 'reworded',
    anchor: { blocks: ['lp-2'], quote: { start: 'Aims' } },
    comments: [{ id: 'c7', by: 'ana', when: '3 days ago', text: 'Rename this to Goals?' }],
  },
  {
    id: 'deleted',
    anchor: { blocks: ['lp-gone'], quote: { start: 'We launch in two waves' } },
    comments: [{ id: 'c8', by: 'mia', when: '2 days ago', text: 'Two waves feels slow. Why not one?' }],
  },
  {
    id: 'document',
    comments: [{ id: 'c9', by: 'mia', when: 'Yesterday', text: 'Draft reads well. I will add the pricing part tomorrow.' }],
  },
  {
    id: 'resolved',
    anchor: { blocks: ['lp-1'], quote: { start: 'where the launch lives' } },
    comments: [{ id: 'c10', by: 'ravi', when: '3 days ago', text: 'Typo in the second line.' }],
    resolved: true,
  },
]
