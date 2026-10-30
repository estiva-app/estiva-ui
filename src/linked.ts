/**
 * What a link stands for, as the link widgets draw it (LinkChip, LinkRow,
 * LinkCard, LinkPreview, AttachedCard). The app builds it from its own lookup —
 * every Estiva app from `@estiva-app/interop`'s projection — and hands it in
 * whole: the words, the addresses, and the changes the reader may make. The
 * widgets look nothing up, and keep nothing but what a reader does to them.
 *
 * The shape follows the prototype Miky approved (Widgets 2, 15 Oct; why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-link-on-words-counts-toward-the-card.md).
 */
import { createContext } from 'react'
import type { ThingKind } from './KindIcon'

/**
 * Inside a box being written in (CommentBox): a card or a part there sits on a
 * file's fill, `elevated`, as the files beside it do, and a card's values read
 * as words, not pickers, until it is sent (Katerina, 29 Oct). False anywhere else.
 */
export const inTheBox = createContext(false)

/** What a link stands for, by its icon. `page` draws a page of text. */
export type LinkedKind = ThingKind | 'page'

/** The colours a status draws in, as an app's manifest names them. */
export type StatusColour = 'neutral' | 'blue' | 'green' | 'muted'

/** One value of a status, as the reader sees it. */
export interface LinkedStatus {
  label: string
  colour: StatusColour
}

/** A person, by the name the app shows and, when it has one, their picture. */
export interface LinkedPerson {
  name: string
  picture?: string
}

/** One choice a picker offers. */
export interface PickerOption {
  value: string
  label: string
  /** A status's colour: the option draws its shape. */
  colour?: StatusColour
  /** A person's picture: the option draws their face. */
  picture?: string
}

/**
 * A value the reader may be able to change from the card: a status, or who
 * owns it. With `onChange` it is a picker; without it, the reader may not
 * change it, and it reads as words in the same place.
 */
export interface LinkedPicker {
  /** The chosen option's `value`; `undefined` is nobody, for an owner. */
  value: string | undefined
  options: PickerOption[]
  onChange?: (value: string) => void
}

/** The count of what was said about it, and where that is read. */
export interface LinkedConversation {
  count: number
  /** Opens the conversation, at the first unread when there is one. */
  href: string
  /**
   * The reader has something unread there. Only a member of it has unread
   * (SPEC §11.8; why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/membership-replaces-following.md),
   * so the app passes `true` only for one.
   */
  unread?: boolean
}

/** One item listed inside a card, such as a group's members, each opening on its own. */
export interface LinkedChild {
  id: string
  title: string
  href: string
  key?: string
  status: LinkedStatus
  owner?: LinkedPerson
}

/** Everything a link's widgets may draw about what it stands for. Only `id`, `kind`, `title` and `href` are always there. */
export interface Linked {
  /** Its address. Two `Linked` with the same `id` are the same thing (identity by value, not by object). */
  id: string
  kind: LinkedKind
  title: string
  /** Opens it. An address in this app goes through `AppProvider`'s `navigate`. */
  href: string
  /** What the reader calls it, quietly before the title: "ABC-2". */
  key?: string
  /**
   * What it is, in a word, from its app's description of its files: "Issue", "Project", "Topic", "Document"; the app's
   * name when its type has none (record a-file-is-labelled-by-its-type-not-its-app; `linkedFrom` does both). Absent,
   * the kind's own word.
   */
  noun?: string
  /** Archived: its row and card say "Archived" in the line under the title, and its values read as words. */
  archived?: boolean
  /** The line under a card's title: what it is in. Drawn after the key. */
  subtitle?: string
  /** Its short summary, a sentence or two. Without one a card shows the title alone. */
  summary?: string
  /** Its status: each option carries its `colour`. */
  status?: LinkedPicker
  /** Who owns it, by the word the app uses (`ownerLabel`: "Assignee", "Lead"). */
  owner?: LinkedPicker
  ownerLabel?: string
  /** What was said about it. `noun` names it for a screen reader: "comments" by default. */
  conversation?: LinkedConversation & { noun?: string }
  /** Items inside it, drawn as rows in its card. */
  children?: LinkedChild[]
  /** How far along it is, drawn as a ring. */
  done?: { done: number; total: number }
  /** Who is in it, as faces. */
  members?: LinkedPerson[]
  /** Who wrote it, as faces. */
  authors?: LinkedPerson[]
  /** When it last changed, in the app's words: "2h ago". */
  updated?: string
  /** The newest thing said in it, drawn only when the reader may read it. */
  latest?: { author: LinkedPerson; body: string; at: string }
  /** Words a person wrote, linked as themselves: drawn with `author`'s face, not an icon. */
  body?: string
  author?: LinkedPerson
}

/** What a card's last line holds: pickers, faces, a line of words, or nothing. */
export type LoadingFooter = 'pickers' | 'people' | 'line' | 'none'

/** The parts of a card known before it loads, so its placeholder takes the card's height. */
export interface LoadingShape {
  subtitle?: boolean
  summary?: boolean
  rows?: number
  latest?: boolean
  ring?: boolean
  footer?: LoadingFooter
}

/**
 * Where a link's lookup stands. `loading` knows the kind from the address, and
 * a shape when the app remembers one; `unavailable` is not the reader's to see
 * ("Issue not available"), or `deleted` ("Issue deleted"), which a reader tells
 * apart by a deletion naming the address (SPEC §13.6.1: deleted is not
 * not-permitted). Written as a URL, it is that URL either way (`url`).
 */
export type LinkState =
  | { state: 'loading'; kind: LinkedKind; shape?: LoadingShape }
  | {
      state: 'unavailable'
      kind: LinkedKind
      /** What it is, in a word: "Item". */
      noun: string
      /** Where it may still open for someone who can: the app that owns it, and its address. */
      openIn?: { app: string; href: string }
      /** Deleted, as a trusted deletion naming its address says (SPEC §13.6.1): "Issue deleted", with no way out. */
      deleted?: boolean
      /**
       * The URL it was written as: drawn as that URL, a plain link, in place of "not available" or "deleted" (SPEC
       * §13.1, C21). Those words are only for a link with no URL to fall back on, a `nostr:` reference.
       */
      url?: string
    }
  | { state: 'ready'; linked: Linked }

/** A picker's chosen option, or none. */
export function chosenOf(picker: LinkedPicker | undefined): PickerOption | undefined {
  return picker?.value === undefined ? undefined : picker.options.find((option) => option.value === picker.value)
}

/** The shape `linked`'s card takes, for its placeholder the next time it loads. */
export function loadingShapeOf(linked: Linked): LoadingShape {
  return {
    subtitle: !!(linked.subtitle || linked.key),
    summary: !!linked.summary,
    rows: linked.children?.length ?? 0,
    latest: !!linked.latest,
    ring: !!linked.done,
    footer: linked.status || linked.owner ? 'pickers' : linked.authors ? 'people' : 'line',
  }
}

/** A card's shape, and the height it drew at in px: the height holds what the shape cannot say, a summary of two lines. */
export type CardShape = LoadingShape & { height?: number }

/**
 * The shape each card last drew at on this device, so its placeholder the next
 * time is the card's own height and nothing around it moves as it loads
 * (Peek's peek#533 and #534, then Ship's copy). One per app, under its own
 * key, in localStorage because the first paint reads it synchronously; the app
 * clears it with the rest of the device's copy at sign-out.
 */
export interface CardShapeMemory {
  /** The shape the card for `id` took the last time this device drew it; before that, `firstDraw`'s for its kind, if any. */
  of: (id: string, kind: LinkedKind) => CardShape | undefined
  /** The shape a card just drew at: `loadingShapeOf(linked)`, and the height it measured. */
  note: (id: string, shape: CardShape) => void
  /** Sign-out. */
  clear: () => void
}

const FOOTERS: readonly LoadingFooter[] = ['pickers', 'people', 'line', 'none']

/** A stored shape read back, only the parts a placeholder draws; anything else stored there is dropped. */
function storedCardShape(value: unknown): CardShape | undefined {
  if (!value || typeof value !== 'object') return undefined
  const { subtitle, summary, rows, latest, ring, footer, height } = value as Record<string, unknown>
  return {
    subtitle: subtitle === true,
    summary: summary === true,
    // A card lists a few of its items; a bad number must not draw a page of bars.
    rows: typeof rows === 'number' && Number.isInteger(rows) ? Math.min(Math.max(rows, 0), 10) : 0,
    latest: latest === true,
    ring: ring === true,
    footer: FOOTERS.find((one) => one === footer) ?? 'line',
    ...(typeof height === 'number' && height > 0 && height < 2000 ? { height: Math.round(height) } : {}),
  }
}

/**
 * The device's memory of the shapes its cards drew at, under the app's own
 * `storageKey`, keeping the newest `limit`. `firstDraw` is a kind's shape for
 * a card this device has not drawn yet, where the kit's own placeholder for
 * the kind is not the app's usual card. Peek's and Ship's `cardShapes`, lifted
 * here for Leaf, the third app to need one.
 */
export function cardShapeMemory(storageKey: string, options: { limit?: number; firstDraw?: Partial<Record<LinkedKind, LoadingShape>> } = {}): CardShapeMemory {
  const { limit = 300, firstDraw = {} } = options
  // Read once per page: a screen of cards asks many times.
  let held: Map<string, CardShape> | undefined
  const shapes = () => {
    if (held) return held
    held = new Map()
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      for (const entry of Array.isArray(stored) ? stored : []) {
        const shape = Array.isArray(entry) && typeof entry[0] === 'string' ? storedCardShape(entry[1]) : undefined
        if (shape) held.set(entry[0] as string, shape)
      }
    } catch {
      held = new Map()
    }
    return held
  }
  return {
    of: (id, kind) => shapes().get(id) ?? firstDraw[kind],
    note: (id, shape) => {
      const current = shapes()
      // Already the card drawn last, as it is now: nothing to move or write.
      if ([...current.keys()].at(-1) === id && JSON.stringify(current.get(id)) === JSON.stringify(shape)) return
      const next = new Map(current)
      // Newest last, so the limit drops the cards drawn longest ago.
      next.delete(id)
      next.set(id, shape)
      held = new Map([...next].slice(-limit))
      try {
        localStorage.setItem(storageKey, JSON.stringify([...held]))
      } catch {
        // Full or blocked storage: the shape is still held for this page.
      }
    },
    clear: () => {
      held = undefined
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Nothing to clear where storage is blocked.
      }
    },
  }
}

/**
 * What this device last found it could not show, kept so the next open draws
 * "not available." from the first paint instead of a card's height that then
 * closes (Peek's OPT-10; Miky, 15 Oct). One per app, under its own key, in
 * localStorage because the first paint reads it synchronously. The app clears
 * it with the rest of the device's copy at sign-out.
 */
export interface UnavailableMemory {
  /** Whether this device last found `id` not available. */
  has: (id: string) => boolean
  /** The lookup's answer: remembered when not available, forgotten when it is. */
  note: (id: string, available: boolean) => void
  /** Sign-out. */
  clear: () => void
}

/** The device's memory of links it could not show, under the app's own `storageKey`, keeping the newest `limit`. */
export function unavailableMemory(storageKey: string, limit = 300): UnavailableMemory {
  // Read once per page: a screen of cards asks many times.
  let held: Set<string> | undefined
  const list = () => {
    if (held) return held
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      held = new Set(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [])
    } catch {
      held = new Set()
    }
    return held
  }
  return {
    has: (id) => list().has(id),
    note: (id, available) => {
      // Re-read before writing: another memory on this key, or another tab's sign-out, may have changed it since.
      held = undefined
      const current = list()
      if (available !== current.has(id)) return
      const next = new Set(current)
      if (available) next.delete(id)
      else next.add(id)
      held = new Set([...next].slice(-limit))
      try {
        localStorage.setItem(storageKey, JSON.stringify([...held]))
      } catch {
        // Full or blocked storage: the next page draws the card as if never seen, which is only the first-open jump.
      }
    },
    clear: () => {
      held = undefined
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Nothing to clear where storage is blocked.
      }
    },
  }
}
