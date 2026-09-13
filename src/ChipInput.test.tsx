// @vitest-environment jsdom
/**
 * What the ChipInput page claims, pinned. It had no test file before stage 5
 * (2026-09-13), so every promise below was held only by reading the code —
 * and moving it onto Base UI's `Combobox` is exactly the change that could
 * have broken one quietly.
 *
 * jsdom computes no layout, so where the list hangs and how wide it is were
 * measured in Chrome instead (the list 384px against a 384px field, below it,
 * its bar 1px from the edge). What is here is behaviour and roles.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ChipInput, type ChipInputOption } from './ChipInput'
import { Field } from './Field'

afterEach(cleanup)

const PEOPLE: ChipInputOption[] = [
  { id: 'ada', label: 'Ada Lovelace', description: 'Engineer' },
  { id: 'grace', label: 'Grace Hopper', description: 'Admiral' },
  { id: 'alan', label: 'Alan Turing', description: 'Mathematician' },
]

function Harness({
  initial = [],
  excludeIds,
  onChange,
  naming,
}: {
  initial?: ChipInputOption[]
  excludeIds?: string[]
  onChange?: (v: ChipInputOption[]) => void
  naming?: { 'aria-label'?: string; 'aria-labelledby'?: string }
}) {
  const [value, setValue] = useState(initial)
  return (
    <ChipInput
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      options={PEOPLE}
      excludeIds={excludeIds}
      placeholder="Search people"
      {...naming}
    />
  )
}

describe('ChipInput', () => {
  it('shows nothing until you type — focus alone must not drop the directory', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('is a combobox over a listbox, and focus stays in the text', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'a')
    expect(await screen.findByRole('listbox')).toBeTruthy()
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  it('names the highlighted row through aria-activedescendant', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'a')
    await screen.findByRole('listbox')
    await user.keyboard('{ArrowDown}')
    const id = input.getAttribute('aria-activedescendant')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)?.getAttribute('role')).toBe('option')
  })

  it('Enter picks the highlighted row, clears the query and closes the list', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    await user.type(input, 'grace')
    await screen.findByRole('listbox')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith([PEOPLE[1]])
    expect(input.value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Grace Hopper' })).toBeTruthy()
  })

  it('matches on the description as well as the label', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'admiral')
    const options = await screen.findAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual([expect.stringContaining('Grace Hopper')])
  })

  it('never offers what is already chosen, or what the caller excluded', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[PEOPLE[0]]} excludeIds={['alan']} />)
    await user.type(screen.getByRole('combobox'), 'a')
    const options = await screen.findAllByRole('option')
    const labels = options.map((o) => o.textContent ?? '')
    expect(labels.some((l) => l.includes('Ada'))).toBe(false)
    expect(labels.some((l) => l.includes('Alan'))).toBe(false)
    expect(labels.some((l) => l.includes('Grace'))).toBe(true)
  })

  it('Backspace on an empty query takes the last chip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial={[PEOPLE[0], PEOPLE[1]]} onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith([PEOPLE[0]])
  })

  it('a chip’s ✕ removes that chip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial={[PEOPLE[0], PEOPLE[1]]} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }))
    expect(onChange).toHaveBeenLastCalledWith([PEOPLE[1]])
  })

  it('Escape clears a query and keeps the key; with nothing typed it lets the key through', async () => {
    const user = userEvent.setup()
    const reachedOutside = vi.fn()
    render(
      <div onKeyDown={(e) => e.key === 'Escape' && reachedOutside()}>
        <Harness />
      </div>,
    )
    const input = screen.getByRole('combobox') as HTMLInputElement
    await user.type(input, 'a')
    await screen.findByRole('listbox')
    await user.keyboard('{Escape}')
    expect(input.value).toBe('')
    expect(reachedOutside).not.toHaveBeenCalled()
    // Now there is nothing to clear, so the surface around the field — a
    // dialog, the launcher — must hear it.
    await user.keyboard('{Escape}')
    expect(reachedOutside).toHaveBeenCalledTimes(1)
  })

  describe('the field’s name (PLAN Finding 6)', () => {
    /* Chrome names an empty field by its placeholder, and the first chip takes
       the placeholder away. Measured in Chrome's accessibility tree before this
       was fixed: with a chip in, the name was "". */
    it('keeps the placeholder as its name once a chip takes the placeholder away', () => {
      render(<Harness initial={[PEOPLE[0]]} />)
      const input = screen.getByRole('combobox', { name: 'Search people' })
      expect(input.getAttribute('placeholder')).toBe('')
    })

    it('adds no name of its own while the placeholder is still drawn', () => {
      render(<Harness />)
      expect(screen.getByRole('combobox').getAttribute('aria-label')).toBeNull()
    })

    it('takes a caller’s aria-label over the placeholder', () => {
      render(<Harness initial={[PEOPLE[0]]} naming={{ 'aria-label': 'To' }} />)
      expect(screen.getByRole('combobox', { name: 'To' })).toBeTruthy()
    })

    it('takes a caller’s aria-labelledby — a visible “To:”', () => {
      render(
        <div>
          <span id="to">To:</span>
          <Harness initial={[PEOPLE[0]]} naming={{ 'aria-labelledby': 'to' }} />
        </div>,
      )
      expect(screen.getByRole('combobox', { name: 'To:' })).toBeTruthy()
    })

    /* The trap this pins: Base UI copies a caller's prop over its own even when
       it is `undefined`, so an `aria-labelledby` passed through empty would wipe
       the `Field`'s and the placeholder would name the field instead. */
    it('inside a Field, is named by the Field’s label, chip or no chip', () => {
      render(
        <>
          <Field label="Invite people">
            <Harness />
          </Field>
          <Field label="Reviewers">
            <Harness initial={[PEOPLE[0]]} />
          </Field>
        </>,
      )
      expect(screen.getByRole('combobox', { name: 'Invite people' })).toBeTruthy()
      expect(screen.getByRole('combobox', { name: 'Reviewers' })).toBeTruthy()
    })
  })
})
