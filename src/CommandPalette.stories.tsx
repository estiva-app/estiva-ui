import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useMemo, useState } from 'react'
import { IconSquareRounded } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { Button } from './Button'
import {
  CommandPalette,
  CommandPaletteAnswer,
  CommandPaletteForm,
  CommandPaletteQuote,
  CommandPaletteSearch,
  CommandPaletteWorking,
  type CommandPaletteGroup,
  type CommandPaletteRow,
} from './CommandPalette'
import { Field } from './Field'
import { Select } from './Select'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

/**
 * A window that searches and runs things. It shows one level at a time — a
 * level of rows, or a form — and the caller keeps the levels. Every story
 * below is the same small caller, started at a different place, so every key
 * works in all of them.
 *
 * Nothing here is fetched: what "arrives later" is a timer.
 */
const meta = {
  title: 'Overlays/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — an iframe on the Docs page,
    // so it does not escape over the docs content.
    docs: { story: { inline: false, height: '640px' } },
    // axe color-contrast is off here until PLAN.md stage 0.10 is ruled: the
    // footer and the "Searching…" and empty lines are muted text, 3.49:1 on
    // --bg-elevated in signal (AA 4.5:1), measured by CI on PR #43; ship passes.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: { open: true, onOpenChange: () => {}, label: 'Command palette', where: 'In Item one', modKey: 'Ctrl', children: null },
  argTypes: { children: { control: false }, onOpenChange: { control: false }, open: { control: false } },
} satisfies Meta<typeof CommandPalette>

export default meta
type Story = StoryObj<typeof meta>

const icon = <IconSquareRounded size={16} stroke={1.5} />
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Level =
  | { kind: 'first' }
  | { kind: 'place'; name: string }
  | { kind: 'ask' }
  | { kind: 'draft' }
  | { kind: 'form' }
  | { kind: 'one-list' }

interface Frame {
  level: Level
  query: string
}

type Start = 'first' | 'arriving' | 'nothing' | 'place' | 'working' | 'answer' | 'draft' | 'form' | 'refused' | 'one-list'

const PLACES = ['Place one', 'Place two']
const ACTIONS = [
  { id: 'action-one', label: 'Action one', description: 'Opens a form' },
  { id: 'action-two', label: 'Action two', description: 'Opens a form' },
]
const LATER = ['Item one, as it was on Monday', 'Item three, where item one is named']
const KINDS = [
  { value: 'one', label: 'Kind one' },
  { value: 'two', label: 'Kind two' },
  { value: 'three', label: 'Kind three' },
]
const GROUPS = [
  { value: 'first', label: 'Group one' },
  { value: 'second', label: 'Group two' },
]
const ANSWER = 'Item one moved on Monday [1], and item two is waiting on a reply [2].\n\nNothing else changed this week.'
const DRAFT = 'Thanks, both. I will look at item one today\nand reply on item two tomorrow.'

function startStack(start: Start): Frame[] {
  const first: Frame = { level: { kind: 'first' }, query: '' }
  switch (start) {
    case 'arriving':
      return [{ ...first, query: 'item' }]
    case 'nothing':
      return [{ ...first, query: 'nothing matches this' }]
    case 'place':
      return [first, { level: { kind: 'place', name: 'Place one' }, query: '' }]
    case 'working':
    case 'answer':
      return [first, { level: { kind: 'ask' }, query: 'What changed this week?' }]
    case 'draft':
      return [first, { level: { kind: 'draft' }, query: 'Say I will look today' }]
    case 'form':
    case 'refused':
      return [first, { level: { kind: 'place', name: 'Place one' }, query: '' }, { level: { kind: 'form' }, query: '' }]
    case 'one-list':
      return [first, { level: { kind: 'one-list' }, query: '' }]
    default:
      return [first]
  }
}

/** The caller every story uses: the levels, the rows, and what each one does. */
function Demo({ start, where, modKey, label }: { start: Start; where?: string; modKey?: string; label: string }) {
  const [open, setOpen] = useState(true)
  const [stack, setStack] = useState<Frame[]>(() => startStack(start))
  const [last, setLast] = useState<string>('Nothing chosen yet.')
  const frame = stack[stack.length - 1]
  const level = frame.level

  const setQuery = (query: string) => setStack((s) => [...s.slice(0, -1), { ...s[s.length - 1], query }])
  const push = (next: Level, query = '') => setStack((s) => [...s, { level: next, query }])
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  const close = (what: string) => {
    setLast(what)
    setOpen(false)
  }
  const reopen = () => {
    setStack([{ level: { kind: 'first' }, query: '' }])
    setOpen(true)
  }

  // ── A late group: arrives 600ms after the typing stops (slower in "arriving").
  const term = level.kind === 'first' ? frame.query.trim().toLowerCase() : ''
  const [searched, setSearched] = useState('')
  useEffect(() => {
    if (!term) return
    const timer = setTimeout(() => setSearched(term), start === 'arriving' ? 2500 : 600)
    return () => clearTimeout(timer)
  }, [term, start])
  const searching = !!term && searched !== term

  // ── An answer that takes a while ("working" never finishes).
  const [asked, setAsked] = useState<{ question: string; done: boolean } | null>(null)
  const ask = async (question: string) => {
    setAsked({ question, done: false })
    if (start === 'working') return
    await wait(1200)
    setAsked((a) => (a?.question === question ? { question, done: true } : a))
  }
  useEffect(() => {
    if (level.kind === 'ask' || level.kind === 'draft') void ask(frame.query)
    // Once per level: the question it was opened with.
    // (The stack's length changes exactly when a level opens.)
  }, [stack.length])

  // ── Recent rows are the person's own, and can be forgotten.
  const [recent, setRecent] = useState(['Item one', 'Item two', 'Person one'])

  // ── The form keeps what was typed while the palette is open.
  const [draft, setDraft] = useState({ title: '', notes: '', kind: 'one', group: '' })
  // What a field needs is worked out from the draft once a send has been tried, so a field that is
  // filled stops saying so at once. A mark left standing would keep the Form from ever sending.
  const [tried, setTried] = useState(false)
  const need = { title: draft.title.trim() ? undefined : 'Give it a title.', group: draft.group ? undefined : 'Choose a group.' }
  const missing: { title?: string; group?: string } = tried ? need : {}
  const [working, setWorking] = useState(false)
  const [refused, setRefused] = useState(false)
  const [kind, setKind] = useState('one')

  const groups = useMemo<CommandPaletteGroup[]>(() => {
    const q = frame.query.trim().toLowerCase()
    if (level.kind === 'place') {
      return [
        {
          label: `${level.name} actions`,
          rows: ACTIONS.filter((a) => a.label.toLowerCase().includes(q)).map((a) => ({
            id: a.id,
            label: a.label,
            description: a.description,
            icon,
            onSelect: () => push({ kind: 'form' }),
          })),
        },
      ]
    }
    if (level.kind === 'ask' || level.kind === 'draft') {
      if (!asked?.done) return []
      const changed = frame.query.trim() !== asked.question.trim()
      const again: CommandPaletteRow = { id: 'again', label: `Again: “${frame.query.trim()}”`, icon, onSelect: () => void ask(frame.query) }
      if (level.kind === 'ask') {
        return [
          { label: 'Ask again', rows: changed ? [again] : [] },
          {
            label: 'Sources',
            rows: ['Note one', 'Note two'].map((note, i) => ({
              id: note,
              label: note,
              description: `[${i + 1}] Person ${i === 0 ? 'one' : 'two'} · Monday`,
              leading: <Avatar name={`Person ${i === 0 ? 'one' : 'two'}`} size={20} />,
              onSelect: () => close(note),
            })),
          },
          { label: 'Next', rows: [{ id: 'use-answer', label: 'Use the answer', icon, onSelect: () => close('Use the answer') }] },
        ]
      }
      return [
        { label: 'Write again', rows: changed ? [again] : [] },
        {
          label: 'Next',
          rows: [
            { id: 'use-draft', label: 'Use it', description: 'Nothing is sent. Edit it first.', icon, onSelect: () => close('Use it') },
            { id: 'draft-again', label: 'Write it again', icon, onSelect: () => void ask(asked.question) },
          ],
        },
      ]
    }

    const place = (name: string): CommandPaletteRow => ({
      id: `place-${name}`,
      label: name,
      description: 'Has actions',
      icon,
      onSelect: () => push({ kind: 'place', name }),
      onGoIn: () => push({ kind: 'place', name }),
    })
    const recentRow = (name: string): CommandPaletteRow => ({
      id: `recent-${name}`,
      label: name,
      description: name.startsWith('Person') ? 'Role' : 'Opened today',
      ...(name.startsWith('Person') ? { leading: <Avatar name={name} size={24} /> } : { icon }),
      onSelect: () => close(name),
      onForget: () => setRecent((r) => r.filter((x) => x !== name)),
    })

    if (!q) {
      return [
        {
          label: 'This page',
          rows: [
            { id: 'ask', label: 'Ask about this page', icon, onSelect: () => push({ kind: 'ask' }) },
            { id: 'draft', label: 'Write a draft', icon, onSelect: () => push({ kind: 'draft' }) },
            { id: 'one-list', label: 'Change kind', description: 'Item one', icon, onSelect: () => push({ kind: 'one-list' }) },
          ],
        },
        {
          label: 'Recent',
          rows: recent.length ? [...recent.map(recentRow), { id: 'clear', label: 'Clear recent', icon, onSelect: () => setRecent([]) }] : [],
        },
        { label: 'Places', rows: PLACES.map(place) },
      ]
    }
    const matches = (s: string) => s.toLowerCase().includes(q)
    return [
      { label: 'Places', rows: PLACES.filter(matches).map(place) },
      { label: 'Recent', rows: recent.filter(matches).map(recentRow) },
      {
        label: 'Actions',
        rows: ACTIONS.filter((a) => matches(a.label)).map((a) => ({
          id: a.id,
          label: a.label,
          description: 'Place one',
          icon,
          onSelect: () => setStack((s) => [...s, { level: { kind: 'place', name: 'Place one' }, query: '' }, { level: { kind: 'form' }, query: '' }]),
        })),
      },
      {
        label: 'Later',
        rows: searching ? [] : LATER.filter(matches).map((text) => ({ id: text, label: text, description: 'Person two · Monday', icon, onSelect: () => close(text) })),
      },
    ]
  }, [frame, level, asked, recent, searching])

  const submitForm = async () => {
    setTried(true)
    setRefused(false)
    if (need.title || need.group) return
    setWorking(true)
    await wait(1200)
    setWorking(false)
    if (start === 'refused') {
      setRefused(true)
      return
    }
    close(`Created “${draft.title.trim()}”`)
  }

  const submitKind = async () => {
    setWorking(true)
    await wait(900)
    setWorking(false)
    close(`Kind set to ${KINDS.find((k) => k.value === kind)?.label}`)
  }

  const body = (() => {
    if (level.kind !== 'ask' && level.kind !== 'draft') return undefined
    if (!asked || !asked.done) return <CommandPaletteWorking>Reading 12 notes…</CommandPaletteWorking>
    const changed = frame.query.trim() !== asked.question.trim()
    return level.kind === 'ask' ? (
      <CommandPaletteAnswer note={changed ? 'You changed the question. Press Enter to ask again.' : undefined}>{ANSWER}</CommandPaletteAnswer>
    ) : (
      <CommandPaletteQuote>{DRAFT}</CommandPaletteQuote>
    )
  })()

  const q = frame.query.trim()

  return (
    <div className="flex h-screen flex-col items-start gap-3 bg-bg-base p-6">
      <Button variant="outlined" onClick={reopen}>
        Open the palette
      </Button>
      <p className="text-body-2 text-text-secondary">{last}</p>

      <CommandPalette open={open} onOpenChange={setOpen} label={label} where={where} modKey={modKey}>
        {level.kind === 'form' ? (
          <CommandPaletteForm
            chip={{ label: 'Place one · Action one', onBack: back }}
            icon={icon}
            submitLabel="Create item"
            onSubmit={() => void submitForm()}
            working={working ? { button: 'Creating…', line: 'Creating the item…' } : undefined}
            error={refused ? 'Group two is archived. Choose another one.' : undefined}
          >
            <Field label="Title" required error={missing.title}>
              <TextInput value={draft.title} placeholder="A few words" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Notes">
              <Textarea rows={3} value={draft.notes} placeholder="Anything else" onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </Field>
            <Field label="Kind">
              <Select value={draft.kind} onChange={(value) => setDraft({ ...draft, kind: value })} options={KINDS} />
            </Field>
            <Field label="Group" required error={missing.group}>
              <Select value={draft.group} onChange={(value) => setDraft({ ...draft, group: value })} options={GROUPS} placeholder="Choose a group…" />
            </Field>
          </CommandPaletteForm>
        ) : level.kind === 'one-list' ? (
          <CommandPaletteForm
            chip={{ label: 'Item one · Change kind', onBack: back }}
            icon={icon}
            submitLabel="Change kind"
            onSubmit={() => void submitKind()}
            submitWaits={kind === 'one' ? 'Choose a different kind first' : undefined}
            working={working ? { button: 'Saving…', line: 'Saving the kind…' } : undefined}
          >
            <Field label="Kind">
              <Select value={kind} onChange={setKind} options={KINDS} />
            </Field>
          </CommandPaletteForm>
        ) : (
          <CommandPaletteSearch
            query={frame.query}
            onQueryChange={setQuery}
            placeholder={
              level.kind === 'place'
                ? `Search ${level.name}'s actions`
                : level.kind === 'ask'
                  ? 'Ask anything about this page'
                  : level.kind === 'draft'
                    ? 'What should it say?'
                    : 'Search, or choose a place'
            }
            groups={groups}
            chip={
              level.kind === 'place'
                ? { label: level.name, leading: icon, onBack: back }
                : level.kind === 'ask'
                  ? { label: 'Ask', onBack: back }
                  : level.kind === 'draft'
                    ? { label: 'Draft', onBack: back }
                    : undefined
            }
            pending={level.kind === 'first' && searching ? 'Searching…' : undefined}
            // What the later group left out: a line to read, not a row to pick.
            notes={level.kind === 'first' && q && !searching && LATER.some((l) => l.toLowerCase().includes(q)) ? ['1 more in a place you cannot open.'] : undefined}
            empty={
              level.kind === 'first' && q && !searching
                ? `Nothing is called “${q}”.`
                : level.kind === 'place'
                  ? `${level.name} has no action called “${q}”.`
                  : undefined
            }
          >
            {body}
          </CommandPaletteSearch>
        )}
      </CommandPalette>
    </div>
  )
}

const story = (start: Start): Story => ({
  render: (args) => <Demo start={start} label={args.label} where={args.where} modKey={args.modKey} />,
})

/** The first level: rows in groups, the first one lit. ↑ ↓ stop at the ends, Tab goes into a place, Ctrl+Backspace forgets a recent row. */
export const FirstLevel: Story = story('first')

/** Typing: the rows that match now, a line while a later group is on its way, that group arriving without moving the lit row, and a note about what it left out. */
export const WhileRowsArrive: Story = story('arriving')

/** Nothing matches: the empty line, where the first row would be. */
export const NothingFound: Story = story('nothing')

/** Inside a level: the chip names it. Backspace at the start of the field, or the chip's ✕, goes back with the text you had. */
export const InsideALevel: Story = story('place')

/** Something is being worked on: the line says what, the grey bars hold the place. */
export const Working: Story = story('working')

/** An answer, its marks, and the rows they point at. Change the question and an "Again" row comes first. */
export const Answer: Story = story('answer')

/** Text written to be used somewhere else, above what you can do with it. */
export const Quote: Story = story('draft')

/** A form. Ctrl+Enter creates; a missing field says so and takes focus; Backspace in an empty field goes back and keeps what was typed. */
export const Form: Story = story('form')

/** Creating is refused: the fields unlock, the reason sits beside the button, and focus is back where it was. */
export const FormRefused: Story = story('refused')

/** A form that is one list. It waits, and says why, until the value changes; Backspace goes back from the list. */
export const FormThatWaits: Story = story('one-list')
