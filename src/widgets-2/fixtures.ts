/**
 * Widgets 2 prototype: the placeholder things every widget on these pages
 * draws. Words are placeholders (stories-and-pages.md); the kinds are named,
 * because telling them apart is what the prototype is for.
 */
import type { ThingKind } from '../KindIcon'

/** The colours a status draws in, as the apps' manifests name them. */
export type StatusColour = 'neutral' | 'blue' | 'green' | 'muted'

export interface Status {
  label: string
  colour: StatusColour
}

/** One thing a link can stand for, with every field any app draws today. */
export interface Thing {
  /** The kinds the prototype covers, one more than KindIcon has: a page. */
  kind: ThingKind | 'page'
  /** The noun a card's corner says. */
  noun: string
  /** The app it opens in. */
  app: string
  title: string
  /** Its key, the way people say it: an issue's "WID-2". */
  key?: string
  /** The line under the title: the project an issue is in, a page's Folder. */
  subtitle?: string
  /** The opening of its description, a page's text, a message's words: what the apps draw today. */
  body?: string
  /**
   * A short summary of the file, one or two sentences (Miky, 15 Oct: detailed
   * shows the summary, not the opening of the long description). No file
   * carries one yet; it is its own project.
   */
  summary?: string
  status?: Status
  assignee?: string
  author?: string
  /** Everyone who wrote a page. */
  authors?: string[]
  comments?: number
  /**
   * The reader has something unread in its conversation: they are a member
   * and it moved since they last read it (SPEC §11.8, membership-replaces-following).
   */
  unread?: boolean
  /** A project's issues, drawn as rows inside its detailed card. */
  children?: { title: string; key: string; status: Status; assignee?: string }[]
  /** A project's progress line. */
  progress?: string
  /** A project's progress as numbers, for the ring. */
  done?: { done: number; total: number }
  /** A topic: how many conversations, who is in it, and its latest one. */
  conversations?: number
  members?: string[]
  latest?: { author: string; body: string; at: string }
  updated?: string
  /** Where it is placed (WID-3): still loading, or not available to this reader. Ready when absent. */
  state?: 'loading' | 'unavailable'
}

const TODO: Status = { label: 'Todo', colour: 'neutral' }
const DOING: Status = { label: 'In progress', colour: 'blue' }
const DONE: Status = { label: 'Done', colour: 'green' }

const PARAGRAPH =
  'A description long enough to need more than one line, so the card has to choose how much of it to show and where to cut it short. The rest is there when you open it.'

const SUMMARY = 'A one-sentence summary of what this is for.'

export const ISSUE: Thing = {
  kind: 'issue',
  noun: 'Issue',
  app: 'Ship',
  title: 'Item one, with a title long enough to be cut short',
  key: 'ABC-2',
  subtitle: 'Group one',
  body: PARAGRAPH,
  summary: SUMMARY,
  status: DOING,
  assignee: 'Person One',
  comments: 4,
  unread: true,
}

export const PROJECT: Thing = {
  kind: 'project',
  noun: 'Project',
  app: 'Ship',
  title: 'Group one',
  body: PARAGRAPH,
  summary: SUMMARY,
  status: DOING,
  assignee: 'Person Two',
  progress: '3 of 8 done',
  done: { done: 3, total: 8 },
  comments: 6,
  children: [
    { title: 'Item one', key: 'ABC-1', status: DONE, assignee: 'Person One' },
    { title: 'Item two', key: 'ABC-2', status: DOING, assignee: 'Person Two' },
    { title: 'Item three', key: 'ABC-3', status: TODO },
  ],
}

export const TOPIC: Thing = {
  kind: 'topic',
  noun: 'Topic',
  app: 'Peek',
  title: 'Place one',
  conversations: 12,
  unread: true,
  members: ['Person One', 'Person Two', 'Person Three'],
  updated: '2h ago',
  latest: { author: 'Person Three', body: 'The latest conversation in the topic, as its first message reads. It may run to a second line before it is cut short.', at: '2h ago' },
}

export const MESSAGE: Thing = {
  kind: 'message',
  noun: 'Message',
  app: 'Peek',
  title: 'Person Two',
  author: 'Person Two',
  body: 'A message of two sentences, written by someone in a conversation. It is the words the link points to.',
  updated: '10:42',
}

export const PAGE: Thing = {
  kind: 'page',
  noun: 'Page',
  app: 'Leaf',
  title: 'Page one',
  subtitle: 'Folder one',
  body: PARAGRAPH,
  summary: SUMMARY,
  author: 'Person One',
  authors: ['Person One', 'Person Two'],
  comments: 2,
  updated: 'Edited yesterday',
}

/** A block of a description: drawn live, as the part it is. */
export const PART = {
  heading: 'Item one',
  noun: 'Issue',
  app: 'Ship',
  blocks: ['Heading of the part', 'A paragraph of the part, as it reads in the description right now.', 'A point in a list', 'Another point'],
}

export const ATTACHMENT = { name: 'picture-one.png', size: 182_400, contentType: 'image/png' }
export const ATTACHMENT_FILE = { name: 'document-one.pdf', size: 1_240_000, contentType: 'application/pdf' }

/** A file the reader cannot read: only its kind and app are known, from its address. */
export const UNREADABLE = { kind: 'issue' as const, noun: 'Issue', app: 'Ship', address: 'naddr1qqjxgdmzxy6r2vfs95cryvmp956x2etp94sns' }

/** A small picture for the attachment, drawn rather than fetched. */
export const PICTURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#8a94a6"/><circle cx="360" cy="90" r="40" fill="#d8dde6"/><path d="M0 300 L170 120 L300 260 L380 190 L480 300 Z" fill="#5d6778"/></svg>',
  )
