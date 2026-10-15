/**
 * Short summary prototype: the placeholder files every place on these sheets
 * draws, built on the Widgets 2 fixtures so the two prototypes read as one.
 * Words are placeholders (stories-and-pages.md); the kinds are named, because
 * which file a summary belongs to is part of what is being judged.
 */
import { ISSUE, PAGE, PROJECT, TOPIC, type Thing } from '../widgets-2/fixtures'

/** One or two sentences: what a summary is meant to be. */
export const SUMMARY = 'A one-sentence summary of what this is for, written by whoever made it.'

/** Past about 240 characters: what every place has to cut short. */
export const LONG_SUMMARY =
  'A summary that runs well past the length it is meant to keep to, so every place that shows it has to decide where to cut it short: two lines in a row, a card or the picker, and all of it on the file’s own page, where whoever can edit it sees the whole text and can shorten it.'

/** Where a summary is kept to: about 240 characters (Miky, 14 Oct). */
export const LIMIT = 240

/** What the relay said when it refused a save, as the apps word it today. */
export const REFUSAL = 'Too busy right now — try again in 14s.'

/** How a summary arrives on a file in each state the sheets draw. */
export type SummaryState = 'filled' | 'long' | 'empty' | 'loading'

/** Who is looking: someone who can edit the file, or someone who can only read it. */
export type Viewer = 'editor' | 'reader'

export const STATES: { state: SummaryState; label: string }[] = [
  { state: 'filled', label: 'Filled' },
  { state: 'long', label: 'Long, past 240' },
  { state: 'empty', label: 'Empty' },
  { state: 'loading', label: 'Loading' },
]

export function summaryOf(state: SummaryState): string | undefined {
  if (state === 'filled') return SUMMARY
  if (state === 'long') return LONG_SUMMARY
  return undefined
}

/** A file with its summary set for a state. */
export function withSummary(thing: Thing, state: SummaryState): Thing {
  return { ...thing, summary: summaryOf(state) }
}

/** A list's worth of issues: one with a summary, one long, one without. */
export const ISSUES: Thing[] = [
  { ...ISSUE, key: 'ABC-2', title: 'Item one', summary: SUMMARY },
  { ...ISSUE, key: 'ABC-3', title: 'Item two, with a title long enough to be cut short in a narrow column', summary: LONG_SUMMARY, status: { label: 'Todo', colour: 'neutral' }, assignee: 'Person Two', unread: false },
  { ...ISSUE, key: 'ABC-4', title: 'Item three', summary: undefined, status: { label: 'Done', colour: 'green' }, assignee: undefined, unread: false },
]

export const PROJECTS: Thing[] = [
  { ...PROJECT, summary: SUMMARY },
  { ...PROJECT, title: 'Group two', summary: LONG_SUMMARY, assignee: 'Person One' },
  { ...PROJECT, title: 'Group three', summary: undefined, assignee: 'Person Three' },
]

export const TOPICS: Thing[] = [
  { ...TOPIC, summary: SUMMARY },
  { ...TOPIC, title: 'Place two', summary: LONG_SUMMARY, unread: false },
  { ...TOPIC, title: 'Place three', summary: undefined, unread: false },
]

export const PAGES: Thing[] = [
  { ...PAGE, summary: SUMMARY },
  { ...PAGE, title: 'Page two', summary: LONG_SUMMARY, subtitle: 'Folder two' },
  { ...PAGE, title: 'Page three', summary: undefined },
]

export { ISSUE, PAGE, PROJECT, TOPIC, type Thing }
