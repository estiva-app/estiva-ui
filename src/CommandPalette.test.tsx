// @vitest-environment jsdom
/**
 * What the CommandPalette page claims, pinned.
 *
 * Every key on the page's Keys table has a test here. They were first walked
 * in Chrome on the stories (UIG-29, 16 September 2026), because a key that
 * works in jsdom can still fail in a browser; what is here keeps them from
 * quietly changing afterwards. Where Base UI did something the key list does
 * not want — Home and End moving the highlight, a late row taking it — the
 * test is the measured case.
 */
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CommandPalette,
  CommandPaletteAnswer,
  CommandPaletteForm,
  CommandPaletteQuote,
  CommandPaletteSearch,
  CommandPaletteWorking,
  type CommandPaletteChip,
  type CommandPaletteGroup,
  type CommandPaletteRow,
} from './CommandPalette'
import { Field } from './Field'
import { Select } from './Select'
import { TextInput } from './TextInput'

afterEach(cleanup)

const row = (id: string, extra: Partial<CommandPaletteRow> = {}): CommandPaletteRow => ({ id, label: id, onSelect: () => {}, ...extra })

function Search({
  groups,
  chip,
  initialQuery = '',
  onOpenChange = () => {},
  modKey,
  pending,
  empty,
}: {
  groups: CommandPaletteGroup[]
  chip?: CommandPaletteChip
  initialQuery?: string
  onOpenChange?: (open: boolean) => void
  modKey?: string
  pending?: string
  empty?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  return (
    <CommandPalette open onOpenChange={onOpenChange} label="Palette" where="In Item one" modKey={modKey}>
      <CommandPaletteSearch query={query} onQueryChange={setQuery} placeholder="Search" groups={groups} chip={chip} pending={pending} empty={empty} />
    </CommandPalette>
  )
}

const field = () => screen.getByRole('combobox', { name: 'Search' }) as HTMLInputElement
const lit = () => document.querySelector('[role="option"][data-highlighted] .truncate')?.textContent ?? null
const footer = () => document.querySelector('.border-t.h-9')?.textContent ?? ''

/** The field, once the dialog has put focus in it. */
async function focusedField() {
  await waitFor(() => expect(document.activeElement).toBe(field()))
  return field()
}

describe('CommandPalette — the window', () => {
  it('is a dialog named by its label, and starts in the field', async () => {
    render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} />)
    expect(screen.getByRole('dialog', { name: 'Palette' })).toBeTruthy()
    await focusedField()
  })

  it('closes on Escape, with text in the field too', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} onOpenChange={onOpenChange} />)
    await focusedField()
    await user.keyboard('abc{Escape}')
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

describe('CommandPaletteSearch — rows', () => {
  it('draws a heading per group, and no group that has no rows', () => {
    render(<Search groups={[{ label: 'First', rows: [row('One')] }, { label: 'Empty', rows: [] }, { label: 'Second', rows: [row('Two')] }]} />)
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.firstElementChild?.textContent)).toEqual(['First', 'Second'])
  })

  it('lights the first row, and Enter does what it does', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('One', { onSelect }), row('Two')] }]} />)
    await focusedField()
    await waitFor(() => expect(lit()).toContain('One'))
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('stops the arrows at both ends', async () => {
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('One'), row('Two')] }]} />)
    await focusedField()
    await user.keyboard('{ArrowUp}')
    expect(lit()).toContain('One')
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(lit()).toContain('Two')
  })

  it('goes in with Tab on a row that leads somewhere, and does nothing with Tab anywhere else', async () => {
    const onGoIn = vi.fn()
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('One'), row('Place', { onGoIn })] }]} />)
    const input = await focusedField()
    await user.keyboard('{Tab}')
    expect(onGoIn).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
    await user.keyboard('{ArrowDown}{Tab}')
    expect(onGoIn).toHaveBeenCalledTimes(1)
  })

  it('goes in with → only at the end of the text', async () => {
    const onGoIn = vi.fn()
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('Place', { onGoIn })] }]} initialQuery="pl" />)
    const input = await focusedField()
    input.setSelectionRange(1, 1)
    await user.keyboard('{ArrowRight}')
    expect(onGoIn).not.toHaveBeenCalled()
    input.setSelectionRange(2, 2)
    await user.keyboard('{ArrowRight}')
    expect(onGoIn).toHaveBeenCalledTimes(1)
  })

  it('forgets a row that can be forgotten with Ctrl+Backspace, and only that', async () => {
    const onForget = vi.fn()
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('Plain'), row('Recent', { onForget })] }]} />)
    await focusedField()
    await user.keyboard('{Control>}{Backspace}{/Control}')
    expect(onForget).not.toHaveBeenCalled()
    await user.keyboard('{ArrowDown}{Control>}{Backspace}{/Control}')
    expect(onForget).toHaveBeenCalledTimes(1)
  })

  it('goes back with Backspace at the start of the field, inside a level only', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    const { unmount } = render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} />)
    await focusedField()
    await user.keyboard('{Backspace}')
    unmount()

    render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} chip={{ label: 'Place', onBack }} initialQuery="ab" />)
    const input = await focusedField()
    input.setSelectionRange(2, 2)
    await user.keyboard('{Backspace}')
    expect(onBack).not.toHaveBeenCalled()
    expect(input.value).toBe('a')
    input.setSelectionRange(0, 0)
    await user.keyboard('{Backspace}')
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("goes back from the chip's ✕, and leaves focus in the field", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} chip={{ label: 'Place', onBack }} />)
    const input = await focusedField()
    await user.click(screen.getByRole('button', { name: 'Leave Place' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  it('keeps the lit row where it is on Home and End', async () => {
    const user = userEvent.setup()
    render(<Search groups={[{ label: 'Group', rows: [row('One'), row('Two'), row('Three')] }]} initialQuery="text" />)
    await focusedField()
    await user.keyboard('{ArrowDown}')
    expect(lit()).toContain('Two')
    await user.keyboard('{Home}')
    expect(lit()).toContain('Two')
    await user.keyboard('{End}')
    expect(lit()).toContain('Two')
  })

  it('keeps the lit row lit when rows arrive above it (F7)', async () => {
    const user = userEvent.setup()
    const early: CommandPaletteGroup = { label: 'Early', rows: [row('One'), row('Two')] }
    const late: CommandPaletteGroup = { label: 'Late', rows: [row('Late one'), row('Late two')] }
    const { rerender } = render(<Search groups={[early]} />)
    await focusedField()
    await user.keyboard('{ArrowDown}')
    expect(lit()).toContain('Two')
    rerender(<Search groups={[late, early]} />)
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(4))
    await waitFor(() => expect(lit()).toBe('Two'))
  })

  it('names in the footer only the keys that work on the lit row', async () => {
    const user = userEvent.setup()
    render(
      <Search
        modKey="Cmd"
        chip={{ label: 'Place', onBack: () => {} }}
        groups={[{ label: 'Group', rows: [row('Plain'), row('Place', { onGoIn: () => {} }), row('Recent', { onForget: () => {} })] }]}
      />,
    )
    await focusedField()
    expect(footer()).toContain('Enter')
    expect(footer()).not.toContain('forget')
    expect(footer()).toContain('Backspace') // back, while the field is empty
    await user.keyboard('{ArrowDown}')
    expect(footer()).toContain('Tab')
    await user.keyboard('{ArrowDown}')
    expect(footer()).toContain('Cmd+Backspace')
    await user.keyboard('x')
    expect(footer()).not.toContain('back')
  })

  it('names no arrows with one row, and only Esc with none', async () => {
    const { unmount } = render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} />)
    expect(footer()).not.toContain('move')
    unmount()
    render(<Search groups={[]} empty="Nothing here yet." />)
    expect(footer()).toContain('Esc')
    expect(footer()).not.toContain('open')
    expect(await screen.findByText('Nothing here yet.')).toBeTruthy()
  })

  it('says rows are on their way', async () => {
    render(<Search groups={[{ label: 'Group', rows: [row('One')] }]} pending="Searching…" />)
    expect(await screen.findByText('Searching…')).toBeTruthy()
  })
})

function Form({
  onSubmit = () => {},
  onBack = () => {},
  submitWaits,
  working,
  error,
  oneList = false,
}: {
  onSubmit?: () => void
  onBack?: () => void
  submitWaits?: string
  working?: { button: string; line: string }
  error?: string
  oneList?: boolean
}) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('one')
  const [missing, setMissing] = useState<string | undefined>()
  return (
    <CommandPalette open onOpenChange={() => {}} label="Palette">
      <CommandPaletteForm
        chip={{ label: 'Action one', onBack }}
        submitLabel="Create item"
        onSubmit={() => {
          if (!oneList && !title) setMissing('Give it a title.')
          else onSubmit()
        }}
        submitWaits={submitWaits}
        working={working}
        error={error}
      >
        {!oneList && (
          <Field label="Title" required error={missing}>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        )}
        <Field label="Kind">
          <Select value={kind} onChange={setKind} options={[{ value: 'one', label: 'Kind one' }, { value: 'two', label: 'Kind two' }]} />
        </Field>
      </CommandPaletteForm>
    </CommandPalette>
  )
}

describe('CommandPaletteForm', () => {
  it('starts on the first field and submits with Ctrl+Enter', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Form onSubmit={onSubmit} />)
    const title = screen.getByRole('textbox', { name: 'Title' })
    await waitFor(() => expect(document.activeElement).toBe(title))
    await user.keyboard('A{Control>}{Enter}{/Control}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('puts focus on the first field that needs something', async () => {
    const user = userEvent.setup()
    render(<Form />)
    const title = screen.getByRole('textbox', { name: 'Title' })
    await waitFor(() => expect(document.activeElement).toBe(title))
    await user.tab()
    await user.keyboard('{Control>}{Enter}{/Control}')
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(screen.getByText('Give it a title.')).toBeTruthy()
  })

  it('waits, and says why, while there is nothing to submit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Form onSubmit={onSubmit} oneList submitWaits="Choose a different kind first" />)
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('combobox'))
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(footer()).not.toContain('Enter')
  })

  it('locks while working, keeps focus inside, ignores Ctrl+Enter, and gives focus back after', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<Form onSubmit={onSubmit} />)
    const title = screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement
    await waitFor(() => expect(document.activeElement).toBe(title))
    await user.keyboard('A{Control>}{Enter}{/Control}')
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(<Form onSubmit={onSubmit} working={{ button: 'Creating…', line: 'Creating the item…' }} />)
    expect(screen.getByRole('button', { name: /Creating…/ })).toBeTruthy()
    expect(screen.getByText('Creating the item…')).toBeTruthy()
    expect(title.closest('fieldset')?.disabled).toBe(true)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
    // Chrome drops focus to the page from a field that becomes disabled
    // (measured in the prototype); jsdom leaves it there. So what is pinned
    // is that focus does not sit on a locked field.
    expect(document.activeElement?.matches(':disabled')).toBe(false)
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(<Form onSubmit={onSubmit} error="Refused." />)
    expect(within(dialog).getByText('Refused.')).toBeTruthy()
    expect(document.activeElement).toBe(title)
  })

  it('goes back with Backspace from an empty text field only, keeping a list where it is', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<Form onBack={onBack} />)
    const title = screen.getByRole('textbox', { name: 'Title' })
    await waitFor(() => expect(document.activeElement).toBe(title))
    await user.keyboard('A{Backspace}')
    expect(onBack).not.toHaveBeenCalled()
    await user.tab()
    expect(document.activeElement?.getAttribute('role')).toBe('combobox')
    await user.keyboard('{Backspace}')
    expect(onBack).not.toHaveBeenCalled()
    await user.tab({ shift: true })
    await user.keyboard('{Backspace}')
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('goes back with Backspace from anywhere in a form that is one list', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<Form onBack={onBack} oneList />)
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('combobox'))
    await user.keyboard('{Backspace}')
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})

describe('what sits above the rows', () => {
  it('draws an answer as paragraphs, with its marks on the word before them', () => {
    render(<CommandPaletteAnswer note="Press Enter to ask again.">{'One moved [1], two waits [2].\n\nNothing else.'}</CommandPaletteAnswer>)
    const paragraphs = document.querySelectorAll('p.text-body-2')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0].textContent).toBe('One moved1, two waits2.')
    expect([...paragraphs[0].querySelectorAll('sup')].map((s) => s.textContent)).toEqual(['1', '2'])
    expect(screen.getByRole('status').textContent).toBe('Press Enter to ask again.')
  })

  it('keeps a quote’s line breaks', () => {
    render(<CommandPaletteQuote>{'Line one\nLine two'}</CommandPaletteQuote>)
    expect(screen.getByText(/Line one/).textContent).toBe('Line one\nLine two')
  })

  it('announces what is being worked on, with its grey bars', () => {
    const { container } = render(<CommandPaletteWorking bars={3}>Reading…</CommandPaletteWorking>)
    expect(screen.getByRole('status').textContent).toContain('Reading…')
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })
})

