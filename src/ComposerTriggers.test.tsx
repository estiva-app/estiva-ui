// @vitest-environment jsdom
/**
 * The composer triggers (CON-27, moved from Peek's `mention.tsx` and
 * `slashCommands.tsx`): each opens its list at the caret, and a pick inserts
 * the chip the body is written from.
 */
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  CaptionedReference,
  PersonMention,
  ReferenceTrigger,
  SlashCommands,
  UrgentPersonMention,
  filterPeople,
  filterReferences,
  filterSlashSections,
  formatSection,
  typeTrigger,
  urgentPubkeys,
  type CaptionedItem,
  type MentionPerson,
  type SlashSection,
} from './ComposerTriggers'

const KEY = 'b'.repeat(64)
const PEOPLE: MentionPerson[] = [
  { id: 'ada', name: 'Ada Lovelace', description: 'Engineering', pubkey: KEY },
  { id: 'bea', name: 'Bea', pubkey: null },
  ...['Cy', 'Di', 'Ed', 'Flo', 'Gus'].map((name) => ({ id: name.toLowerCase(), name })),
]
const ITEMS: CaptionedItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: `${i}`.repeat(64),
  label: i === 7 ? 'Bea' : 'Ada',
  snippet: `line ${i}`,
  uri: `nostr:nevent1example${i}`,
  search: `**line** ${i}`,
}))
const APP_SECTION: SlashSection = {
  label: 'Shortcuts',
  commands: [{ key: 'shortcut-@', row: { label: 'Mention', shortcut: '@' }, keywords: ['@', 'Mention a person'], run: typeTrigger('@') }],
}

// An app's own name for the chip, as Peek's `messageMention`.
const Chip = CaptionedReference.extend({ name: 'messageMention' })

let editor: Editor | null = null

function Composer() {
  const made = useEditor({
    extensions: [
      StarterKit,
      PersonMention.configure({ people: () => PEOPLE }),
      UrgentPersonMention.configure({ people: () => PEOPLE }),
      Chip,
      ReferenceTrigger.configure({ items: () => ITEMS, nodeName: 'messageMention', ariaLabel: 'Things', sectionLabel: 'Things' }),
      SlashCommands.configure({ sections: [formatSection(), APP_SECTION] }),
    ],
  })
  editor = made
  return <EditorContent editor={made} />
}

async function type(text: string) {
  await act(async () => {
    editor!.chain().focus().insertContent(text).run()
  })
}

async function press(key: string) {
  await act(async () => {
    editor!.view.someProp('handleKeyDown', (handle) => handle(editor!.view, new KeyboardEvent('keydown', { key })))
  })
}

// The highlighted row also draws its Enter hint; the label is what is compared.
const options = () => within(screen.getByRole('listbox')).getAllByRole('option').map((one) => one.textContent?.replace('↩ Enter', ''))
const nodes = () => {
  const found: { type: string; attrs: Record<string, unknown> }[] = []
  editor!.state.doc.descendants((node) => {
    if (node.isInline && !node.isText) found.push({ type: node.type.name, attrs: node.attrs })
  })
  return found
}

// jsdom lays nothing out, so it has no `scrollIntoView`; the highlighted row calls it.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  editor?.destroy()
  editor = null
  cleanup()
})

describe('@ and !@', () => {
  it('lists the first six people, narrowed by name, and a pick inserts a chip with their key', async () => {
    render(<Composer />)
    await type('@')
    expect(screen.getByRole('listbox', { name: 'People' })).toBeTruthy()
    expect(options()).toHaveLength(6)
    await type('ada')
    expect(options()).toHaveLength(1)
    await press('Enter')
    expect(nodes()).toEqual([{ type: 'mention', attrs: { id: 'ada', label: 'Ada Lovelace', pubkey: KEY } }])
    expect(editor!.getHTML()).toContain('data-mention="true"')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('opens the urgent list on !@, and the document reports whose key it names', async () => {
    render(<Composer />)
    await type('!@')
    expect(screen.getByRole('listbox', { name: 'Urgent mention' })).toBeTruthy()
    await press('Enter')
    expect(nodes()[0]).toEqual({ type: 'urgentMention', attrs: { id: 'ada', label: 'Ada Lovelace', pubkey: KEY } })
    expect(urgentPubkeys(editor!)).toEqual([KEY])
  })

  it('keeps a person with no key, who has nothing to carry urgently', () => {
    expect(filterPeople(PEOPLE, 'BE')).toEqual([PEOPLE[1]])
    expect(filterPeople(PEOPLE, '')).toHaveLength(6)
  })
})

describe('[', () => {
  it('lists the last six references and inserts the app-named chip with its uri', async () => {
    render(<Composer />)
    await type('[')
    expect(screen.getByRole('listbox', { name: 'Things' })).toBeTruthy()
    expect(options()).toEqual(['Ada: line 2', 'Ada: line 3', 'Ada: line 4', 'Ada: line 5', 'Ada: line 6', 'Bea: line 7'])
    await press('Enter')
    expect(nodes()).toEqual([{ type: 'messageMention', attrs: { id: ITEMS[2].id, label: 'Ada', snippet: 'line 2', uri: ITEMS[2].uri } }])
    expect(editor!.getHTML()).toContain('data-message-mention="true"')
  })

  it('draws the app’s sections in order, skips an empty one, and redraws the open list when told', async () => {
    const listeners = new Set<() => void>()
    let late: CaptionedItem[] = []
    const sections = (query: string) => [
      { label: 'Recent', items: ITEMS.slice(0, 2).filter((item) => item.snippet.includes(query)) },
      { label: 'Empty', items: [] },
      { label: 'Found', items: late },
    ]
    function Sectioned() {
      const made = useEditor({
        extensions: [
          StarterKit,
          Chip,
          ReferenceTrigger.configure({
            items: () => [],
            sections,
            subscribe: (listener) => {
              listeners.add(listener)
              return () => listeners.delete(listener)
            },
            nodeName: 'messageMention',
            ariaLabel: 'Things',
            sectionLabel: 'Things',
          }),
        ],
      })
      editor = made
      return <EditorContent editor={made} />
    }
    render(<Sectioned />)
    await type('[')
    expect(options()).toEqual(['Ada: line 0', 'Ada: line 1'])
    expect(screen.getByText('Recent')).toBeTruthy()
    expect(screen.queryByText('Empty')).toBeNull()
    expect(listeners.size).toBe(1)

    // The person arrows to a row, then a late answer lands: their row stays highlighted.
    await press('ArrowDown')
    late = [{ id: 'f'.repeat(64), label: 'Plan', snippet: 'Q3 roadmap', uri: 'nostr:naddr1example', description: 'Planning' }]
    await act(async () => listeners.forEach((listener) => listener()))
    expect(options()).toEqual(['Ada: line 0', 'Ada: line 1', 'Plan: Q3 roadmapPlanning'])
    expect(screen.getByText('Found')).toBeTruthy()
    await press('Enter')
    expect(nodes().map((node) => node.attrs.id)).toEqual([ITEMS[1].id])
    expect(listeners.size).toBe(0)

    // A row that arrived late is picked like any other.
    await type('[')
    await press('ArrowDown')
    await press('ArrowDown')
    await press('Enter')
    expect(nodes()[1]).toEqual({ type: 'messageMention', attrs: { id: 'f'.repeat(64), label: 'Plan', snippet: 'Q3 roadmap', uri: 'nostr:naddr1example' } })

    await type('[')
    expect(listeners.size).toBe(1)
    await press('Escape')
    expect(screen.queryByRole('listbox')).toBeNull()
    // Escape closes the list and stops listening.
    expect(listeners.size).toBe(0)
  })

  it('matches who said it, or the text it searches', () => {
    expect(filterReferences(ITEMS, 'bea').map((item) => item.id)).toEqual([ITEMS[7].id])
    expect(filterReferences(ITEMS, '**line** 3').map((item) => item.id)).toEqual([ITEMS[3].id])
  })
})

describe('a chip through HTML (copy and paste)', () => {
  it('keeps who it names and what it points at, and takes no key or uri from a crafted attribute', async () => {
    render(<Composer />)
    await act(async () => {
      editor!.commands.setContent([
        {
          type: 'paragraph',
          content: [
            { type: 'mention', attrs: { id: 'ada', label: 'Ada Lovelace', pubkey: KEY } },
            { type: 'messageMention', attrs: { id: ITEMS[0].id, label: 'Ada', snippet: 'line 0', uri: ITEMS[0].uri } },
          ],
        },
      ])
    })
    const html = editor!.getHTML()
    await act(async () => {
      editor!.commands.setContent(html)
    })
    expect(nodes()).toEqual([
      { type: 'mention', attrs: { id: 'ada', label: 'Ada Lovelace', pubkey: KEY } },
      { type: 'messageMention', attrs: { id: ITEMS[0].id, label: 'Ada', snippet: 'line 0', uri: ITEMS[0].uri } },
    ])
    await act(async () => {
      editor!.commands.setContent(
        '<p><span data-urgent-mention="true" data-id="x" data-label="Ada" data-pubkey="not-a-key">@Ada</span>' +
          '<span data-message-mention="true" data-id="y" data-label="Ada" data-uri="javascript:alert(1)">Ada</span></p>',
      )
    })
    const [person, reference] = nodes()
    expect([person.type, person.attrs.label, person.attrs.pubkey]).toEqual(['urgentMention', 'Ada', null])
    expect([reference.type, reference.attrs.uri]).toEqual(['messageMention', null])
  })
})

describe('/', () => {
  it('opens Format first, then the app’s sections, and runs the chosen row', async () => {
    render(<Composer />)
    await type('/')
    expect(screen.getByRole('listbox', { name: 'Commands' })).toBeTruthy()
    expect(options()).toEqual(['Text', 'Heading#', 'Subheading##', 'Quote>', 'Code`', 'Bulleted list-', 'Numbered list1.', 'Mention@'])
    await type('head')
    await press('Enter')
    expect(editor!.getJSON().content?.[0]).toEqual({ type: 'heading', attrs: { level: 1 } })
  })

  it('narrows on a label, an id or a keyword, and keeps an emptied section', () => {
    const sections = [formatSection(), APP_SECTION]
    const labels = (q: string) => filterSlashSections(sections, q).map((s) => s.commands.map((c) => c.row.label))
    expect(labels('list')).toEqual([['Bulleted list', 'Numbered list'], []])
    expect(labels('mention a person')).toEqual([[], ['Mention']])
    expect(labels('HEAD')).toEqual([['Heading', 'Subheading'], []])
  })

  it('makes code a block when the app asks for one', async () => {
    render(<Composer />)
    const code = formatSection('block').commands.find((c) => c.key === 'format-code')!
    await act(async () => code.run(editor!))
    expect(editor!.getJSON().content?.[0].type).toBe('codeBlock')
  })
})
