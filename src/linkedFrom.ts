/**
 * What a link stands for, built from `@estiva-app/interop`'s projection of the
 * file — the one builder Peek, Ship and Leaf share, so one file draws as one
 * card in every app (5ebf2756; why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/every-app-edits-a-document-with-one-shared-editor.md).
 *
 * The package depends on neither interop nor protocol: {@link LinkedSource} is
 * the part of interop's `ForeignObject` this reads, so any interop version's
 * object fits, and what needs the protocol (where a link opens, a message's
 * words, what an address is before it is read) is the app's, passed in.
 */
import { thingKindOf } from './KindIcon'
import type { LinkState, Linked, LinkedChild, LinkedConversation, LinkedKind, LinkedPerson, LinkedPicker, StatusColour } from './linked'

/** A person as interop names them: a profile, possibly empty. */
export interface LinkedProfile {
  displayName?: string
  picture?: string
}

/** One of interop's resolved slots. */
export interface LinkedSlot {
  value: string
  label?: string
  colour?: string
  isPubkey?: boolean
  field?: string
}

/** One of interop's resolved actions: what the file's own app lets a reader change. */
export interface LinkedAction {
  id: string
  label: string
  control: string
  field?: string
  current?: string
  options?: { value: string; label: string; colour?: string }[]
}

/** The part of interop's `ForeignObject` a link is built from. */
export interface LinkedSource {
  ref: string
  address?: string
  eventId?: string
  kind: number
  widget: string | string[]
  noun?: string
  appName?: string
  slots: Record<string, LinkedSlot | undefined>
  meta: LinkedSlot[]
  children?: LinkedSource[]
  people?: Record<string, LinkedProfile>
  actions: LinkedAction[]
  parentField?: string
  openUrl?: string
  unreachable?: boolean
  archived?: unknown
  /** When it last changed, in seconds (interop 0.64). */
  changedAt?: number
}

/** `T` is the app's own object type (interop's `ForeignObject`), so `hrefOf` takes it as it is. */
export interface LinkedFromOptions<T extends LinkedSource = LinkedSource> {
  /**
   * Where a file opens in this app: the linked file itself (`top`), or one of
   * the rows on its card. Another app's address comes from a manifest anyone
   * may publish, so the app keeps it to https.
   */
  hrefOf: (object: T, top: boolean) => string
  /** A message's words for a one-line preview: marks stripped, references read as words. */
  previewText: (body: string, people: Record<string, LinkedProfile> | undefined) => string
  /** The workspace's people, for the owner picker's options. */
  directory?: Record<string, LinkedProfile>
  /**
   * Changes the file from its card. Without it the values read as words
   * (Decided 16 Oct: any reader may change a file from its card; words only in
   * a preview and for a file that cannot be read). An archived file's read as
   * words whatever is passed: its page is read-only.
   */
  onAct?: (actionId: string, value: string) => void
  /** What was said about it, when the app has read that. */
  conversation?: LinkedConversation
  /**
   * When it last changed, from interop's `changedAt` (in seconds), in the app's words. Without it a card says it the
   * kit's way, alike in every app: "just now", "5m ago", "2h ago", "3d ago", then the date.
   */
  whenOf?: (seconds: number) => string
}

/** How long ago a time in seconds was, as a card says it: "just now", "5m ago", "2h ago", "3d ago", then "12 Oct". */
function agoOf(seconds: number, now = Date.now()): string {
  const gone = Math.max(0, Math.floor(now / 1000 - seconds))
  if (gone < 60) return 'just now'
  if (gone < 3600) return `${Math.floor(gone / 60)}m ago`
  if (gone < 86400) return `${Math.floor(gone / 3600)}h ago`
  if (gone < 7 * 86400) return `${Math.floor(gone / 86400)}d ago`
  const date = new Date(seconds * 1000)
  const year = date.getFullYear() === new Date(now).getFullYear() ? {} : { year: 'numeric' as const }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...year })
}

/** How many of a file's items its card lists: the most recently changed (Miky, 21 Oct). */
const CARD_ROWS = 7

const KIND_PAGE = 30842
const KIND_CHANNEL = 39000

const COLOURS: readonly StatusColour[] = ['neutral', 'blue', 'green', 'muted']

function colourOf(colour: string | undefined): StatusColour | undefined {
  return COLOURS.find((known) => known === colour)
}

/** The icon a file draws by its event kind; a document draws a page. */
function linkedKindOfKind(kind: number): LinkedKind {
  return kind === KIND_PAGE ? 'page' : thingKindOf(kind)
}

/** The manifest's `message` widget, wherever it sits in the fallback chain (§13.3). */
function isMessage(object: LinkedSource): boolean {
  return (Array.isArray(object.widget) ? object.widget : [object.widget]).includes('message')
}

/** What a file is called, by its noun or its app: "Topic", "Estiva Ship". */
function nounOf(object: { noun?: string; appName?: string }): string | undefined {
  if (object.noun) return object.noun.charAt(0).toUpperCase() + object.noun.slice(1)
  return object.appName
}

function titleOf(object: LinkedSource): string {
  const title = object.slots.title
  if (title?.isPubkey) return object.people?.[title.value]?.displayName ?? '—'
  return title?.value || nounOf(object) || 'Untitled'
}

function idOf(object: LinkedSource): string {
  return object.address ?? object.eventId ?? object.ref
}

/** What the reader calls it, quietly before the title: an issue's ref ("WBD-5"), a project's key ("WBD"). */
function keyOf(object: LinkedSource): string | undefined {
  return object.meta.find((slot) => (slot.field === 'ref' || slot.field === 'key') && !slot.isPubkey && slot.value)?.value
}

/** The person a file names in its owner's place (its assignee, its lead). */
function ownerSlotOf(object: LinkedSource): LinkedSlot | undefined {
  return object.meta.find((slot) => slot.isPubkey && slot.value && slot.field !== object.slots.title?.field)
}

/**
 * The items its card lists. A project's are its 7 most recently changed
 * issues, newest first and the same 7 in every app (a tie goes to the
 * address); a Folder's are its files in the Folder's own order (Miky, 16 Oct,
 * ship#310). Interop has already left out what is archived.
 */
function listedOf(object: LinkedSource): LinkedSource[] {
  const children = object.children ?? []
  if (object.kind === KIND_CHANNEL) return children
  // An interop before 0.64 says nothing of when an item changed: its own order, rather than the addresses'.
  if (children.some((child) => child.changedAt === undefined)) return children.slice(0, CARD_ROWS)
  return [...children]
    .sort((a, b) => (b.changedAt ?? 0) - (a.changedAt ?? 0) || (idOf(a) < idOf(b) ? -1 : idOf(a) > idOf(b) ? 1 : 0))
    .slice(0, CARD_ROWS)
}

function childrenOf<T extends LinkedSource>(object: T, options: LinkedFromOptions<T>): LinkedChild[] | undefined {
  // An object's children are objects of its own type: interop's are `ForeignObject`s.
  const listed = listedOf(object) as T[]
  if (!listed.length) return undefined
  return listed.map((child) => {
    const status = child.slots.status
    const owner = ownerSlotOf(child)
    const person = owner ? child.people?.[owner.value] : undefined
    const key = keyOf(child)
    return {
      id: idOf(child),
      title: titleOf(child),
      href: options.hrefOf(child, false),
      ...(key ? { key } : {}),
      status: { label: status?.value ?? nounOf(child) ?? 'File', colour: colourOf(status?.colour) ?? 'muted' },
      ...(person?.displayName ? { owner: { name: person.displayName, ...(person.picture ? { picture: person.picture } : {}) } } : {}),
    }
  })
}

/**
 * How far along it is, when every item has a status: the green ones over all
 * of them, listed or not. A cancelled issue is muted, so it counts in the total
 * and not as done (Miky, 21 Oct).
 */
function doneOf(object: LinkedSource): { done: number; total: number } | undefined {
  const children = object.children
  if (!children?.length || children.some((child) => !child.slots.status)) return undefined
  return { done: children.filter((child) => child.slots.status?.colour === 'green').length, total: children.length }
}

function statusOf(object: LinkedSource, onAct: LinkedFromOptions['onAct']): LinkedPicker | undefined {
  const { slots } = object
  const action = object.actions.find((one) => one.control === 'select' && one.field && one.field === slots.status?.field)
  if (action) {
    return {
      value: action.current,
      options: (action.options ?? []).map((option) => ({ value: option.value, label: option.label, colour: colourOf(option.colour) })),
      ...(onAct ? { onChange: (value: string) => onAct(action.id, value) } : {}),
    }
  }
  if (!slots.status) return undefined
  return { value: slots.status.value, options: [{ value: slots.status.value, label: slots.status.value, colour: colourOf(slots.status.colour) }] }
}

function ownerOf(object: LinkedSource, options: Pick<LinkedFromOptions, 'directory'>, onAct: LinkedFromOptions['onAct']): { owner: LinkedPicker; ownerLabel?: string } | undefined {
  const { slots, people } = object
  // Who owns it: the manifest's person control that is neither the title nor the move (FOL-4).
  const action = object.actions.find(
    (one) => one.control === 'pubkey' && one.field && one.field !== slots.title?.field && one.field !== object.parentField,
  )
  if (action) {
    const known = { ...options.directory }
    // The holder stays pickable while the directory loads, or once they have left it: the object names them.
    if (action.current && !known[action.current]) known[action.current] = people?.[action.current] ?? {}
    return {
      owner: {
        value: action.current || undefined,
        options: [
          { value: '', label: 'Unassigned' },
          ...Object.entries(known)
            // The em dash for an unnameable person, never the key (FEE-1).
            .map(([pubkey, profile]) => ({ value: pubkey, label: profile.displayName ?? '—', picture: profile.picture }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ],
        ...(onAct ? { onChange: (value: string) => onAct(action.id, value) } : {}),
      },
      ownerLabel: object.meta.find((slot) => slot.field === action.field)?.label ?? action.label,
    }
  }
  // No owner the reader's app may change: the one the file names, as words.
  const slot = ownerSlotOf(object)
  if (!slot) return undefined
  const person = people?.[slot.value]
  return {
    owner: { value: slot.value, options: [{ value: slot.value, label: person?.displayName ?? '—', ...(person?.picture ? { picture: person.picture } : {}) }] },
    ...(slot.label ? { ownerLabel: slot.label } : {}),
  }
}

/**
 * Who made it, when the app can name them: the key its address is signed by (`kind:pubkey:d`). A topic's is its
 * relay's, which names nobody; a file with no address has no key in it.
 */
function authorOf(object: LinkedSource, directory: LinkedFromOptions['directory']): LinkedPerson | undefined {
  if (object.kind === KIND_CHANNEL || !object.address) return undefined
  const pubkey = object.address.split(':')[1]
  if (!pubkey || !/^[0-9a-f]{64}$/.test(pubkey)) return undefined
  const profile = object.people?.[pubkey] ?? directory?.[pubkey]
  if (!profile?.displayName) return undefined
  return { name: profile.displayName, ...(profile.picture ? { picture: profile.picture } : {}) }
}

/** The file a reference names, as the kit's chip, row and card draw it. */
export function linkedFrom<T extends LinkedSource>(object: T, options: LinkedFromOptions<T>): Linked {
  const { slots, people } = object
  const id = idOf(object)
  const href = options.hrefOf(object, true)
  // When it last changed (Katerina, 30 Oct: "no date no person"). A message's is when it was written.
  const updated = object.changedAt !== undefined ? (options.whenOf ?? agoOf)(object.changedAt) : undefined
  if (isMessage(object) && slots.title?.isPubkey) {
    // A message is titled by its author (RIC-11): drawn with their face, then its opening words.
    const person = people?.[slots.title.value]
    const name = person?.displayName ?? '—'
    const body = slots.body?.value ? options.previewText(slots.body.value, people) : ''
    return {
      id,
      kind: 'message',
      title: name,
      href,
      author: { name, ...(person?.picture ? { picture: person.picture } : {}) },
      ...(body ? { body } : {}),
      ...(updated ? { updated } : {}),
    }
  }
  const onAct = object.archived ? undefined : options.onAct
  const key = keyOf(object)
  const status = statusOf(object, onAct)
  const owner = ownerOf(object, options, onAct)
  const children = childrenOf(object, options)
  const done = doneOf(object)
  // Who made it, when nothing else on it names a person: an issue's owner already does.
  const author = owner ? undefined : authorOf(object, options.directory)
  return {
    id,
    kind: linkedKindOfKind(object.kind),
    title: titleOf(object),
    href,
    ...(key ? { key } : {}),
    ...(object.noun ? { noun: object.noun.charAt(0).toUpperCase() + object.noun.slice(1) } : {}),
    // Interop reads every file kind's summary into its subtitle (SPEC §6.12).
    ...(slots.subtitle?.value ? { summary: slots.subtitle.value } : {}),
    ...(status ? { status } : {}),
    ...(owner ?? {}),
    ...(options.conversation ? { conversation: options.conversation } : {}),
    ...(children ? { children } : {}),
    ...(done ? { done } : {}),
    ...(author ? { authors: [author] } : {}),
    ...(updated ? { updated } : {}),
  }
}

/**
 * Where a reference's read stands, for the kit: `undefined` is still read,
 * `null` an answer of nothing. `unread` is what the app knows from the address
 * alone, for those two. Nothing, and a file the reader may not read, draw
 * alike: "not available." (Miky, 15 Oct).
 */
export function linkStateFrom<T extends LinkedSource>(
  object: T | null | undefined,
  unread: { kind: LinkedKind; noun: string },
  options: LinkedFromOptions<T>,
): LinkState {
  if (object === undefined) return { state: 'loading', kind: unread.kind }
  if (object === null) return { state: 'unavailable', kind: unread.kind, noun: unread.noun }
  if (object.unreachable) {
    const href = object.openUrl && /^https:\/\//i.test(object.openUrl) ? object.openUrl : undefined
    return {
      state: 'unavailable',
      kind: linkedKindOfKind(object.kind),
      noun: (object.noun && nounOf(object)) || unread.noun,
      ...(href ? { openIn: { app: object.appName ?? 'its app', href } } : {}),
    }
  }
  return { state: 'ready', linked: linkedFrom(object, options) }
}
