// @vitest-environment jsdom
/**
 * One file, one card, in every app (5ebf2756): what the card built from
 * interop's projection shows — its key, its most recently changed items and
 * how many of all of them are done, pickers for a reader who may change it,
 * words for an archived file and for one whose app shares no control.
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LinkCard } from './LinkCard'
import { LinkChip } from './LinkChip'
import { linkStateFrom, type LinkedFromOptions, type LinkedSource } from './linkedFrom'
import { LinkRow } from './LinkRow'

afterEach(cleanup)

const OWNER = 'a'.repeat(64)
const OTHER = 'b'.repeat(64)
const PEOPLE = { [OWNER]: { displayName: 'Person one' }, [OTHER]: { displayName: 'Person two' } }

const STATUSES = [
  { value: 'todo', label: 'Todo', colour: 'neutral' },
  { value: 'doing', label: 'Doing', colour: 'blue' },
  { value: 'done', label: 'Done', colour: 'green' },
  { value: 'dropped', label: 'Dropped', colour: 'muted' },
]

function item(n: number, status: (typeof STATUSES)[number], changedAt: number): LinkedSource {
  return {
    ref: `2:${OWNER}:item-${n}`,
    address: `2:${OWNER}:item-${n}`,
    kind: 2,
    widget: 'row',
    slots: { title: { value: `Item ${n}`, field: 'title' }, status: { value: status.label, colour: status.colour, field: 'status' } },
    meta: [
      { value: `ABC-${n}`, field: 'ref' },
      { value: OWNER, field: 'assignee', isPubkey: true, label: 'Assignee' },
    ],
    people: PEOPLE,
    actions: [],
    changedAt,
  }
}

const [TODO, DOING, DONE, DROPPED] = STATUSES

/** Nine items: 3 done, 1 dropped. Items 8 and 9 changed in the same second. */
const ITEMS = [
  item(1, DONE, 100),
  item(2, DONE, 200),
  item(3, TODO, 900),
  item(4, DOING, 400),
  item(5, DROPPED, 500),
  item(6, TODO, 600),
  item(7, DONE, 50),
  item(9, TODO, 800),
  item(8, DOING, 800),
]

const GROUP: LinkedSource = {
  ref: `1:${OWNER}:group`,
  address: `1:${OWNER}:group`,
  kind: 1,
  widget: 'card',
  slots: {
    title: { value: 'Group one', field: 'title' },
    subtitle: { value: 'What the group is for.' },
    status: { value: 'Doing', colour: 'blue', field: 'status' },
  },
  meta: [
    { value: 'ABC', field: 'key' },
    { value: OWNER, field: 'lead', isPubkey: true, label: 'Lead' },
  ],
  children: ITEMS,
  people: PEOPLE,
  actions: [
    { id: 'set-status', label: 'Status', control: 'select', field: 'status', current: 'doing', options: STATUSES },
    { id: 'set-lead', label: 'Lead', control: 'pubkey', field: 'lead', current: OWNER },
  ],
}

const options = (more: Partial<LinkedFromOptions> = {}): LinkedFromOptions => ({
  hrefOf: (object, top) => `#${top ? 'top' : 'row'}-${object.address}`,
  previewText: (body) => body.replace(/\*/g, ''),
  directory: PEOPLE,
  ...more,
})

const UNREAD = { kind: 'file' as const, noun: 'File' }

const rowTitles = () =>
  screen
    .getAllByRole('link')
    .map((link) => link.textContent ?? '')
    .filter((text) => /^ABC-\d/.test(text) || /^Item \d/.test(text))

describe('a card built from interop’s projection', () => {
  it('lists the 7 most recently changed items, newest first, a tie going to the address', () => {
    render(<LinkCard link={linkStateFrom(GROUP, UNREAD, options())} />)
    const rows = rowTitles().map((text) => text.match(/Item \d/)?.[0])
    expect(rows).toEqual(['Item 3', 'Item 8', 'Item 9', 'Item 6', 'Item 5', 'Item 4', 'Item 2'])
  })

  it('keeps the order it was given when nothing says when an item changed', () => {
    const unknown = ITEMS.map(({ changedAt: _, ...rest }) => rest)
    render(<LinkCard link={linkStateFrom({ ...GROUP, children: unknown }, UNREAD, options())} />)
    const rows = rowTitles().map((text) => text.match(/Item \d/)?.[0])
    expect(rows).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7'])
  })

  it('counts every item in its ring, listed or not, a dropped one in the total and not as done', () => {
    render(<LinkCard link={linkStateFrom(GROUP, UNREAD, options())} />)
    expect(screen.getByText('3/9')).toBeTruthy()
  })

  it('shows its key before its title, in the card and in the chip', () => {
    render(<LinkCard link={linkStateFrom(GROUP, UNREAD, options())} />)
    expect(screen.getByText('ABC')).toBeTruthy()
    cleanup()
    render(<LinkChip link={linkStateFrom(GROUP, UNREAD, options())} />)
    expect(screen.getByText('ABC')).toBeTruthy()
  })

  it('lets a reader who may change it pick a status and a lead, through the app’s own actions', async () => {
    const user = userEvent.setup()
    const onAct = vi.fn()
    render(<LinkCard link={linkStateFrom(GROUP, UNREAD, options({ onAct }))} />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: /Done/ }))
    expect(onAct).toHaveBeenCalledWith('set-status', 'done')
    await user.click(screen.getByRole('combobox', { name: 'Lead' }))
    await user.click(await screen.findByRole('option', { name: /Person two/ }))
    expect(onAct).toHaveBeenCalledWith('set-lead', OTHER)
  })

  it('shows an archived file’s status and lead as words, even to a reader who could change them', () => {
    render(<LinkCard link={linkStateFrom({ ...GROUP, archived: { by: OWNER, at: 1 } }, UNREAD, options({ onAct: vi.fn() }))} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getAllByText('Doing').length).toBeGreaterThan(0)
  })

  it('names the owner as words when the file’s app shares no control for it', () => {
    const card = render(<LinkCard link={linkStateFrom({ ...GROUP, children: [], actions: [] }, UNREAD, options({ onAct: vi.fn() }))} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(within(card.container).getByText('Person one')).toBeTruthy()
  })

  it('opens the file and each row where the app says', () => {
    render(<LinkCard link={linkStateFrom(GROUP, UNREAD, options())} />)
    expect(screen.getByRole('link', { name: /Group one/ }).getAttribute('href')).toBe(`#top-${GROUP.address}`)
    expect(screen.getByRole('link', { name: /Item 3/ }).getAttribute('href')).toBe(`#row-2:${OWNER}:item-3`)
  })
})

// Katerina, 30 Oct: "there are no metadata in the card, no date no person".
describe('when it changed, and who made it', () => {
  const now = Math.floor(Date.now() / 1000)
  const PAGE: LinkedSource = {
    ref: `30842:${OTHER}:page`,
    address: `30842:${OTHER}:page`,
    kind: 30842,
    widget: 'card',
    slots: { title: { value: 'Page one', field: 'title' }, subtitle: { value: 'What the page is for.' } },
    meta: [],
    actions: [],
    changedAt: now - 2 * 3600,
  }

  it('says when it last changed, and who made it, by the key its address is signed by', () => {
    const card = render(<LinkCard link={linkStateFrom(PAGE, UNREAD, options())} />)
    expect(within(card.container).getByText('Updated 2h ago')).toBeTruthy()
    expect(within(card.container).getByText('PT')).toBeTruthy()
  })

  it('says it in the app’s words when the app gives them', () => {
    render(<LinkCard link={linkStateFrom(PAGE, UNREAD, options({ whenOf: () => 'Tuesday' }))} />)
    expect(screen.getByText('Updated Tuesday')).toBeTruthy()
  })

  it('names nobody it cannot name, and a topic, whose key is its relay’s', () => {
    const stranger = { ...PAGE, address: `30842:${'c'.repeat(64)}:page` }
    render(<LinkCard link={linkStateFrom(stranger, UNREAD, options())} />)
    expect(screen.getByText('Updated 2h ago')).toBeTruthy()
    cleanup()
    render(<LinkCard link={linkStateFrom({ ...PAGE, kind: 39000, address: `39000:${OTHER}:topic` }, UNREAD, options())} />)
    expect(screen.getByText('Updated 2h ago')).toBeTruthy()
  })

  it('leaves the person to the owner picker on a file that has one', () => {
    const card = render(<LinkCard link={linkStateFrom({ ...GROUP, children: [] }, UNREAD, options())} />)
    expect(within(card.container).queryByText('PT')).toBeNull()
  })

  it('counts minutes, hours and days, then gives the date', () => {
    const at = (gone: number) => {
      cleanup()
      render(<LinkCard link={linkStateFrom({ ...PAGE, address: undefined, changedAt: now - gone }, UNREAD, options())} />)
      return screen.getByText(/^Updated /).textContent
    }
    expect(at(10)).toBe('Updated just now')
    expect(at(5 * 60)).toBe('Updated 5m ago')
    expect(at(3 * 86400)).toBe('Updated 3d ago')
    expect(at(30 * 86400)).not.toMatch(/ago/)
  })
})

describe('a file the reader cannot read', () => {
  it('is not available, and opens in its app only at an https address', () => {
    const stub: LinkedSource = { ...GROUP, unreachable: true, noun: 'group', appName: 'App one', openUrl: 'https://app.example/x' }
    render(<LinkCard link={linkStateFrom(stub, UNREAD, options())} />)
    expect(screen.getByText(/Group not available/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /App one/ }).getAttribute('href')).toBe('https://app.example/x')
    cleanup()
    render(<LinkCard link={linkStateFrom({ ...stub, openUrl: 'javascript:alert(1)' }, UNREAD, options())} />)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('is named by its app when its type has no name, as the record a-file-is-labelled-by-its-type-not-its-app says', () => {
    render(<LinkCard link={linkStateFrom({ ...GROUP, unreachable: true, appName: 'App one' }, { kind: 'file', noun: 'Record' }, options())} />)
    expect(screen.getByText('App one not available')).toBeTruthy()
  })

  it('reads as the address says while it loads and when nothing came back', () => {
    render(<LinkCard link={linkStateFrom(null, { kind: 'file', noun: 'Record' }, options())} />)
    expect(screen.getByText('Record not available')).toBeTruthy()
  })

  it('says it was deleted when a trusted deletion names it, and offers no way out', () => {
    render(<LinkCard link={linkStateFrom(null, { kind: 'file', noun: 'Record', deleted: true }, options())} />)
    expect(screen.getByText('Record deleted')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('stays the URL it was written as, deleted or not available, in a chip, a row and a card alike', () => {
    const url = 'https://app.example/item/one'
    for (const unread of [{ kind: 'file' as const, noun: 'Record', url }, { kind: 'file' as const, noun: 'Record', url, deleted: true }]) {
      for (const Widget of [LinkChip, LinkRow, LinkCard]) {
        render(<Widget link={linkStateFrom(null, unread, options())} />)
        expect(screen.getByRole('link', { name: url }).getAttribute('href')).toBe(url)
        expect(screen.queryByText(/not available|deleted/)).toBeNull()
        cleanup()
      }
    }
    render(<LinkRow link={linkStateFrom({ ...GROUP, unreachable: true, appName: 'App one' }, { kind: 'file', noun: 'Record', url }, options())} />)
    expect(screen.getByRole('link', { name: url })).toBeTruthy()
  })
})

describe('what it is called, and whether it is archived', () => {
  it('is called by its app when its type has no name, and by its type when it has one', () => {
    const { rerender } = render(<LinkRow link={linkStateFrom({ ...GROUP, appName: 'App one' }, UNREAD, options())} preview={false} />)
    expect(screen.getByText(/^ABC · App one/)).toBeTruthy()
    rerender(<LinkRow link={linkStateFrom({ ...GROUP, noun: 'group', appName: 'App one' }, UNREAD, options())} preview={false} />)
    expect(screen.getByText(/^ABC · Group/)).toBeTruthy()
  })

  it('says "Archived" on its row and its card, its values words', () => {
    const archived = { ...GROUP, noun: 'group', archived: true }
    render(<LinkRow link={linkStateFrom(archived, UNREAD, options())} preview={false} />)
    expect(screen.getByText(/^ABC · Group · Archived/)).toBeTruthy()
    cleanup()
    render(<LinkCard link={linkStateFrom(archived, UNREAD, options({ onAct: () => {} }))} />)
    expect(screen.getByText(/^ABC · Group · Archived/)).toBeTruthy()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})

describe('a message', () => {
  it('is drawn as its author’s words, through the app’s preview', () => {
    const message: LinkedSource = {
      ref: 'e'.repeat(64),
      eventId: 'e'.repeat(64),
      kind: 9,
      widget: ['message', 'card'],
      slots: { title: { value: OTHER, isPubkey: true, field: 'pubkey' }, body: { value: 'Ship it **today**' } },
      meta: [],
      people: PEOPLE,
      actions: [],
    }
    render(<LinkCard link={linkStateFrom(message, UNREAD, options())} />)
    expect(screen.getByText('Person two')).toBeTruthy()
    expect(screen.getByText('Ship it today')).toBeTruthy()
  })
})
