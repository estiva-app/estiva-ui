// @vitest-environment jsdom
/**
 * The composer triggers (CON-27, moved from Peek's `mention.tsx` and
 * `slashCommands.tsx`): each opens its list at the caret, and a pick inserts
 * the chip the body is written from.
 */
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
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
import { isSuggestionActive, isSuggestionOpen } from './suggestionPopup'

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
// Nor `getClientRects`, which the editor asks for when it scrolls to the caret, after the call has returned.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  // …and a caret in text is measured through a Range.
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
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

  it('gives each row the icon `iconFor` answers for its uri; a row’s own icon wins, and no answer keeps the list’s', async () => {
    const rows = [
      { ...ITEMS[0], uri: 'nostr:a' },
      { ...ITEMS[1], uri: 'nostr:b', icon: <i data-icon="own" /> },
      { ...ITEMS[2], uri: 'nostr:c' },
    ]
    function Iconed() {
      const made = useEditor({
        extensions: [
          StarterKit,
          Chip,
          ReferenceTrigger.configure({
            items: () => rows,
            nodeName: 'messageMention',
            ariaLabel: 'Things',
            sectionLabel: 'Things',
            icon: <i data-icon="list" />,
            iconFor: (uri) => (uri === 'nostr:a' ? <i data-icon="kind-a" /> : undefined),
          }),
        ],
      })
      editor = made
      return <EditorContent editor={made} />
    }
    render(<Iconed />)
    await type('[')
    const icons = within(screen.getByRole('listbox')).getAllByRole('option').map((row) => row.querySelector('[data-icon]')?.getAttribute('data-icon'))
    expect(icons).toEqual(['kind-a', 'own', 'list'])
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

  it('draws a row’s own icon in place of the list’s, and the chip its `iconFor` answer (7 October)', async () => {
    const own = [
      { id: 'a'.repeat(64), label: 'Plan', snippet: '', uri: 'nostr:naddr1plan', icon: <svg data-icon="row-own" /> },
      { id: 'b'.repeat(64), label: 'Note', snippet: '', uri: 'nostr:naddr1note' },
    ]
    function Kinds() {
      const made = useEditor({
        extensions: [
          StarterKit,
          CaptionedReference.extend({ name: 'messageMention' }).configure({
            icon: <svg data-icon="chip-default" />,
            iconFor: (uri) => (uri === 'nostr:naddr1plan' ? <svg data-icon="chip-own" /> : undefined),
          }),
          ReferenceTrigger.configure({ items: () => own, nodeName: 'messageMention', ariaLabel: 'Things', sectionLabel: 'Things', icon: <svg data-icon="list" /> }),
        ],
      })
      editor = made
      return <EditorContent editor={made} />
    }
    render(<Kinds />)
    await type('[')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(rows[0].querySelector('[data-icon="row-own"]')).not.toBeNull()
    expect(rows[1].querySelector('[data-icon="list"]')).not.toBeNull()
    await press('Enter')
    await type('[')
    await press('ArrowDown')
    await press('Enter')
    const chips = document.querySelectorAll('[data-node-view-wrapper]')
    expect(chips[0].querySelector('[data-icon="chip-own"]')).not.toBeNull()
    expect(chips[1].querySelector('[data-icon="chip-default"]')).not.toBeNull()
  })

  it('matches who said it, or the text it searches', () => {
    expect(filterReferences(ITEMS, 'bea').map((item) => item.id)).toEqual([ITEMS[7].id])
    expect(filterReferences(ITEMS, '**line** 3').map((item) => item.id)).toEqual([ITEMS[3].id])
  })
})

// f586437a (Miky, 2026-10-06): a space keeps the list listening; `]`, Escape, a pick or a new line ends it.
describe('more than one word', () => {
  // The start of a title finds it, and so does a sentence holding it — so only the stop can close the list.
  function Loose() {
    const made = useEditor({
      extensions: [
        StarterKit,
        Chip,
        ReferenceTrigger.configure({
          sections: (query) => [{ label: 'Things', items: ITEMS.filter((item) => item.snippet.startsWith(query) || query.includes(item.snippet)) }],
          nodeName: 'messageMention',
          ariaLabel: 'Things',
          sectionLabel: 'Things',
        }),
      ],
    })
    editor = made
    return <EditorContent editor={made} />
  }

  it('narrows [ across a space, and the pick replaces every word typed', async () => {
    render(<Loose />)
    await type('see [line')
    expect(options()).toHaveLength(8)
    await type(' 3')
    expect(options()).toEqual(['Ada: line 3'])
    await press('Enter')
    expect(nodes()).toEqual([{ type: 'messageMention', attrs: { id: ITEMS[3].id, label: 'Ada', snippet: 'line 3', uri: ITEMS[3].uri } }])
    // Nothing typed after `[` is left behind the chip.
    expect(editor!.getText()).not.toMatch(/\[|line/)
  })

  it('hides the list while nothing matches and draws it again when the words do', async () => {
    render(<Loose />)
    await type('[line 9')
    expect(screen.queryByRole('listbox')).toBeNull()
    await act(async () => {
      editor!.commands.deleteRange({ from: editor!.state.selection.from - 1, to: editor!.state.selection.from })
    })
    await type('3')
    expect(options()).toEqual(['Ada: line 3'])
  })

  it('leaves Enter a new line while no row shows', async () => {
    render(<Loose />)
    await type('[line 9')
    expect(screen.queryByRole('listbox')).toBeNull()
    await press('Enter')
    // No trigger took the key, so the editor's own Enter split the line.
    expect(editor!.state.doc.childCount).toBe(2)
    expect(nodes()).toEqual([])
  })

  it('stops at ], so a bracket in a sentence stays text', async () => {
    render(<Loose />)
    await type('see [line 3 above')
    expect(options()).toEqual(['Ada: line 3'])
    await type('] and more')
    expect(screen.queryByRole('listbox')).toBeNull()
    await press('Enter')
    expect(nodes()).toEqual([])
  })

  it('stays closed after Escape for the rest of that bracket', async () => {
    render(<Loose />)
    await type('[line 3')
    expect(options()).toEqual(['Ada: line 3'])
    await press('Escape')
    await type(' still line 3')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('stops at a new line', async () => {
    render(<Loose />)
    await type('[line 3')
    expect(options()).toEqual(['Ada: line 3'])
    // A Shift+Enter line, inserted without the scroll jsdom cannot measure.
    await act(async () => {
      editor!.commands.insertContent([{ type: 'hardBreak' }, { type: 'text', text: 'line 3' }])
    })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('counts a list as open only while it shows rows, so an Enter with none still sends', async () => {
    // The grace after the last test's list closed is module-wide: let it pass.
    await new Promise((resolve) => setTimeout(resolve, 120))
    render(<Composer />)
    await type('meet @ad')
    expect(isSuggestionOpen()).toBe(true)
    await type(' at noon')
    expect(screen.queryByRole('listbox')).toBeNull()
    // A keystroke that left no rows closed nothing, so no grace either.
    expect(isSuggestionOpen()).toBe(false)
    expect(isSuggestionActive()).toBe(false)
    // Words that match again count again.
    await act(async () => {
      editor!.commands.deleteRange({ from: editor!.state.selection.from - 8, to: editor!.state.selection.from })
    })
    await type('a lo')
    expect(isSuggestionOpen()).toBe(true)
  })

  it('takes a space straight after the key for prose, not a query', async () => {
    render(<Composer />)
    // Every two-word name holds a space, so "@ " would list them all.
    await type('meet @ ')
    expect(screen.queryByRole('listbox')).toBeNull()
    await type('lovelace')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(isSuggestionOpen()).toBe(false)
  })

  it('opens nothing for a task box, "[ ]"', async () => {
    render(<Loose />)
    await type('[ ] line')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('finds a person by first and last name, and a second @ starts over', async () => {
    render(<Composer />)
    // A row's text starts with its avatar's initials.
    await type('@ada lo')
    expect(options()).toEqual([expect.stringContaining('Ada Lovelace')])
    await type('ve @be')
    expect(options()).toEqual([expect.stringContaining('Bea')])
    await press('Enter')
    expect(nodes()).toEqual([{ type: 'mention', attrs: { id: 'bea', label: 'Bea', pubkey: null } }])
    expect(editor!.getText()).toBe('@ada love @Bea ')
  })
})

describe('leaving the box', () => {
  // A page with a second box, as Ship's issue page: the message box and the description.
  function Page() {
    return (
      <>
        <Composer />
        <input aria-label="Other box" />
      </>
    )
  }
  const other = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Other box' })

  it('ends the list when focus moves to another box, and coming back finds none', async () => {
    // The grace after the last test's list closed is module-wide: let it pass.
    await new Promise((resolve) => setTimeout(resolve, 120))
    render(<Page />)
    await type('see [')
    // The caret is in the text before it leaves (the focus command waits a frame).
    await act(async () => editor!.view.focus())
    expect(document.activeElement).toBe(editor!.view.dom)
    expect(options()).toHaveLength(6)
    expect(isSuggestionOpen()).toBe(true)
    await act(async () => other().focus())
    expect(screen.queryByRole('listbox')).toBeNull()
    // The closing list does not pull focus back into the box that was left.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(document.activeElement).toBe(other())
    // So the other box's own Escape and Enter are its own — no grace either.
    expect(isSuggestionOpen()).toBe(false)
    expect(isSuggestionActive()).toBe(false)
    // A click back in, as the view takes it (the focus command waits a frame).
    await act(async () => editor!.view.focus())
    expect(screen.queryByRole('listbox')).toBeNull()
    // As after Escape: the rest of that bracket is text.
    await type('line')
    expect(screen.queryByRole('listbox')).toBeNull()
    await press('Enter')
    expect(nodes()).toEqual([])
  })

  it('keeps focus in the text when the list’s own panel is pressed (its scrollbar)', async () => {
    render(<Page />)
    await type('see [')
    const panel = screen.getByRole('listbox').closest('[role="dialog"]')!
    const pressed = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    panel.dispatchEvent(pressed)
    expect(pressed.defaultPrevented).toBe(true)
    // A press anywhere else on the page is left alone.
    const elsewhere = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    other().dispatchEvent(elsewhere)
    expect(elsewhere.defaultPrevented).toBe(false)
  })

  it('keeps the list when the window loses focus, not the page', async () => {
    render(<Page />)
    await type('see [')
    // What a browser sends when another window takes focus: a blur, with the editor still the active element.
    await act(async () => {
      editor!.view.dom.dispatchEvent(new FocusEvent('blur'))
    })
    expect(document.activeElement).toBe(editor!.view.dom)
    expect(options()).toHaveLength(6)
    expect(isSuggestionOpen()).toBe(true)
  })

  it('still picks a row by mouse, which never takes focus from the text', async () => {
    render(<Page />)
    await type('see [')
    const row = within(screen.getByRole('listbox')).getAllByRole('option')[2]
    await act(async () => {
      fireEvent.mouseDown(row)
    })
    expect(nodes()).toEqual([{ type: 'messageMention', attrs: { id: ITEMS[4].id, label: 'Ada', snippet: 'line 4', uri: ITEMS[4].uri } }])
    expect(isSuggestionOpen()).toBe(false)
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

  it("hints the fence beside Code when it makes a block, and the backtick when it doesn't", () => {
    const hint = (section: ReturnType<typeof formatSection>) => section.commands.find((c) => c.key === 'format-code')!.row.shortcut
    expect(hint(formatSection('block'))).toBe('```')
    expect(hint(formatSection())).toBe('`')
  })
})
