// @vitest-environment jsdom
/**
 * What the Select page claims, pinned.
 *
 * This component had no component test at all — only `Select.fit.test.ts`,
 * eight assertions about the pure geometry it grew and then shared with the
 * Menu shell. That geometry is Floating UI's now, so the file is deleted and
 * its subject is measured in a browser instead (jsdom lays nothing out, so a
 * jsdom test that claimed to check placement would be checking nothing).
 * What is testable here is behaviour, and it never was.
 *
 * Ship asserts on this component in `web/src/components/ui/ui.test.tsx`; the
 * shapes it uses are repeated here deliberately, so a break shows up in this
 * repository rather than in Ship's adoption PR.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Select } from './Select'

afterEach(cleanup)

const STATUSES = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

function Controlled({ initial = 'todo', ...rest }: { initial?: string } & Partial<React.ComponentProps<typeof Select>>) {
  const [value, setValue] = useState(initial)
  return <Select value={value} onChange={setValue} options={STATUSES} ariaLabel="Status" {...rest} />
}

describe('Select', () => {
  it('is a button naming itself, showing the chosen label', () => {
    render(<Controlled initial="in_progress" />)
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    expect(trigger.textContent).toContain('In Progress')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows the placeholder when nothing matches', () => {
    render(<Controlled initial="" placeholder="Choose" />)
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toContain('Choose')
  })

  it('opens on click, lists every option, and marks the chosen one', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="in_progress" />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('listbox')).toBeTruthy()
    const options = screen.getAllByRole('option')
    // The tick's icon contributes a fallback glyph to textContent, so read the
    // labels rather than the whole row.
    expect(options.map((o) => o.textContent?.slice(0, 11))).toEqual(['Todo', 'In Progress', 'Done'])
    expect(options[1].getAttribute('data-selected')).not.toBeNull()
    expect(screen.getByRole('combobox', { name: 'Status' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('opens from the keyboard, moves with arrows, picks with Enter, and gives focus back', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select value="todo" onChange={onChange} options={STATUSES} ariaLabel="Status" />)
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('listbox')).toBeTruthy()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('in_progress')
    expect(document.activeElement).toBe(trigger)
  })

  /**
   * The list is unmounted from the page's point of view when it closes: Base UI
   * leaves the popup element in the DOM but hides the positioner around it with
   * the `hidden` attribute, so it is out of the accessibility tree and
   * `queryByRole` cannot see it. Ship asserts exactly this — pinned here so the
   * assertion is known to hold before Ship ever runs it.
   */
  it('closes on Escape, and the listbox is no longer findable', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('listbox')).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('closes on a press outside', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Controlled />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('listbox')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('picking an option reports it and closes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select value="todo" onChange={onChange} options={STATUSES} ariaLabel="Status" />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: /Done/ }))
    expect(onChange).toHaveBeenCalledWith('done')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  /** New at stage 4, and nothing here implements it: type the start of an
   *  option's label and the list jumps to it. */
  it('typeahead moves the highlight to a matching option', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('listbox')).toBeTruthy()
    await user.keyboard('don')
    const highlighted = screen.getAllByRole('option').find((o) => o.getAttribute('data-highlighted') !== null)
    expect(highlighted?.textContent).toContain('Done')
  })

  it('Home and End jump to the first and last option', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="in_progress" />)
    screen.getByRole('combobox', { name: 'Status' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('listbox')).toBeTruthy()
    const highlighted = () => screen.getAllByRole('option').find((o) => o.getAttribute('data-highlighted') !== null)?.textContent
    await user.keyboard('{End}')
    expect(highlighted()).toContain('Done')
    await user.keyboard('{Home}')
    expect(highlighted()).toContain('Todo')
  })

  it('Tab closes the list', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('listbox')).toBeTruthy()
    await user.tab()
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })
  it('disabled: the trigger cannot be opened', async () => {
    const user = userEvent.setup()
    render(<Controlled disabled />)
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    expect(trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true').toBe(true)
    await user.click(trigger)
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
