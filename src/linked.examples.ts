/**
 * Placeholder links for the link widgets' stories and tests: neutral words,
 * every field one of the widgets draws. Not exported from the package.
 */
import type { Linked, LinkedPicker, LinkState, PickerOption } from './linked'

const noop = () => {}

export const STATUS_OPTIONS: PickerOption[] = [
  { value: 'todo', label: 'Todo', colour: 'neutral' },
  { value: 'doing', label: 'In progress', colour: 'blue' },
  { value: 'done', label: 'Done', colour: 'green' },
  { value: 'dropped', label: 'Cancelled', colour: 'muted' },
]

export const PEOPLE: PickerOption[] = [
  { value: 'a', label: 'Person one' },
  { value: 'b', label: 'Person two' },
  { value: 'c', label: 'Person three' },
]

const picker = (value: string | undefined, options: PickerOption[], mayChange = true): LinkedPicker => ({ value, options, onChange: mayChange ? noop : undefined })

const SUMMARY = 'A one-sentence summary of what this is for.'

/** A tracked item: a key, a status and an owner the reader may change, and a conversation. */
// No subtitle: no app sends one (linkedFrom never fills it), and the examples hold only what an app can (Katerina, 29 Oct).
export const ITEM: Linked = {
  id: 'example:item',
  kind: 'issue',
  title: 'Item one, with a title long enough to be cut short',
  href: '#item',
  key: 'ABC-2',
  summary: SUMMARY,
  status: picker('doing', STATUS_OPTIONS),
  owner: picker('a', PEOPLE),
  ownerLabel: 'Owner',
  conversation: { count: 4, href: '#item-conversation' },
}

/** The same item, to a reader who may not change it. */
export const ITEM_READ_ONLY: Linked = { ...ITEM, status: picker('doing', STATUS_OPTIONS, false), owner: picker('a', PEOPLE, false) }

/** The same item with something unread in its conversation, as a member sees it. */
export const ITEM_UNREAD: Linked = { ...ITEM, conversation: { count: 5, href: '#item-conversation', unread: true } }

/** An item with no summary: its card shows the title alone. */
export const ITEM_NO_SUMMARY: Linked = { ...ITEM, id: 'example:item-2', title: 'Item two', key: 'ABC-3', summary: undefined, owner: picker(undefined, PEOPLE) }

/** A group of items: its progress, its owner, and the items inside it. */
export const GROUP: Linked = {
  id: 'example:group',
  kind: 'project',
  title: 'Group one',
  href: '#group',
  summary: SUMMARY,
  status: picker('doing', STATUS_OPTIONS),
  owner: picker('b', PEOPLE),
  ownerLabel: 'Lead',
  done: { done: 2, total: 5 },
  conversation: { count: 2, href: '#group-conversation' },
  children: [
    // The same keys as `ITEM` and `ITEM_NO_SUMMARY`, so a story showing the group beside its items reads as one set.
    { id: 'example:c1', title: 'Item one', href: '#c1', key: 'ABC-2', status: { label: 'Done', colour: 'green' }, owner: { name: 'Person one' } },
    { id: 'example:c2', title: 'Item two', href: '#c2', key: 'ABC-3', status: { label: 'In progress', colour: 'blue' }, owner: { name: 'Person two' } },
    { id: 'example:c3', title: 'Item three', href: '#c3', key: 'ABC-4', status: { label: 'Todo', colour: 'neutral' } },
  ],
}

/** A place people talk: its members, when it last moved, and its newest conversation. */
export const PLACE: Linked = {
  id: 'example:place',
  kind: 'topic',
  title: 'Place one',
  href: '#place',
  summary: SUMMARY,
  members: [{ name: 'Person one' }, { name: 'Person two' }, { name: 'Person three' }],
  updated: '2h ago',
  conversation: { count: 12, href: '#place-conversations', noun: 'conversations' },
  latest: { author: { name: 'Person two' }, body: 'A few words someone wrote, long enough to need a second line before the card cuts them short.', at: '2h ago' },
}

/** A page of text: who wrote it, and when it last changed. */
export const PAGE: Linked = {
  id: 'example:page',
  kind: 'page',
  title: 'Page one',
  href: '#page',
  summary: SUMMARY,
  authors: [{ name: 'Person one' }, { name: 'Person three' }],
  updated: 'Yesterday',
}

/** Words a person wrote, linked as themselves. */
export const SAID: Linked = {
  id: 'example:said',
  kind: 'message',
  title: 'A few words someone wrote',
  href: '#said',
  author: { name: 'Person one' },
  body: 'A few words someone wrote, linked from somewhere else. Long enough to wrap onto a second line.',
  updated: '10:42',
}

export const ready = (linked: Linked): LinkState => ({ state: 'ready', linked })
export const LOADING: LinkState = { state: 'loading', kind: 'issue' }
export const UNAVAILABLE: LinkState = { state: 'unavailable', kind: 'issue', noun: 'Issue', openIn: { app: 'App one', href: '#elsewhere' } }
