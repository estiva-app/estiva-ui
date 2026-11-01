// @vitest-environment jsdom
/**
 * EditableText's `buttons` manner: the text with a button beside it, a field
 * with Save and Cancel, and what happened said under it — Peek's Details,
 * where a name and a summary were each built by hand with the only key
 * handlers left in Peek (C13, 2 November). Peek's tests for both, pinned on
 * the kit's part.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DialogShell } from './DialogShell'
import { EditableText, type EditableTextProps } from './EditableText'
import { FieldLine } from './Field'

afterEach(cleanup)

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

/** The name, as Peek's Details has it. */
function Name(props: Partial<EditableTextProps>) {
  const [value, setValue] = useState(props.value ?? 'Launch naming')
  return (
    <EditableText
      manner="buttons"
      label="Name"
      placeholder="Untitled"
      editLabel="Rename"
      required
      {...props}
      value={value}
      onCommit={async (next) => {
        const answer = props.onCommit ? await props.onCommit(next) : true
        if (answer === true || (typeof answer === 'object' && answer.kind !== 'error')) setValue(next)
        return answer
      }}
    />
  )
}

/** The summary, as Peek's Details has it. */
function Summary(props: Partial<EditableTextProps>) {
  const [value, setValue] = useState(props.value ?? '')
  return (
    <EditableText
      manner="buttons"
      multiline
      label="Summary"
      placeholder="No summary yet."
      fieldPlaceholder="What is it for, in a sentence?"
      editLabel="Edit"
      addLabel="Add a summary"
      clean={oneLine}
      {...props}
      value={value}
      onCommit={async (next) => {
        const answer = props.onCommit ? await props.onCommit(next) : true
        if (answer === true) setValue(next)
        return answer
      }}
    />
  )
}

const field = (name = 'Name') => screen.getByRole('textbox', { name }) as HTMLInputElement
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

describe('EditableText, buttons: a name (Peek’s Details)', () => {
  it('reads as the text with Rename beside it, and Rename opens the field holding the name', async () => {
    const user = userEvent.setup()
    render(<Name />)
    expect(screen.getByText('Launch naming').className).toContain('truncate')
    expect(screen.queryByRole('textbox')).toBeNull()
    await user.click(button('Rename'))
    expect(field().value).toBe('Launch naming')
    expect(document.activeElement).toBe(field())
    // Nothing changed yet: nothing to save.
    expect(button('Save').disabled).toBe(true)
    expect(button('Cancel')).toBeTruthy()
  })

  it('Enter saves the trimmed name, and the field closes on the new text', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(async () => true as const)
    render(<Name onCommit={onCommit} />)
    await user.click(button('Rename'))
    await user.clear(field())
    await user.type(field(), '  Launch name {Enter}')
    expect(onCommit).toHaveBeenCalledWith('Launch name')
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull())
    expect(screen.getByText('Launch name')).toBeTruthy()
  })

  it('Escape in the field abandons the edit, and only the edit: the dialog around it stays', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    const onClose = vi.fn()
    render(
      <DialogShell title="Details" onClose={onClose}>
        <Name onCommit={onCommit} />
      </DialogShell>,
    )
    await user.click(button('Rename'))
    await user.type(field(), ' two{Escape}')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Launch naming')).toBeTruthy()
    expect(onCommit).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Cancel abandons it too, and the next open starts from the name again', async () => {
    const user = userEvent.setup()
    render(<Name />)
    await user.click(button('Rename'))
    await user.type(field(), ' two')
    await user.click(button('Cancel'))
    expect(screen.queryByRole('textbox')).toBeNull()
    await user.click(button('Rename'))
    expect(field().value).toBe('Launch naming')
  })

  it('an emptied name cannot be saved', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Name onCommit={onCommit} />)
    await user.click(button('Rename'))
    await user.clear(field())
    expect(button('Save').disabled).toBe(true)
    await user.keyboard('{Enter}')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('a refusal keeps the field open with the text, and says why under it', async () => {
    const user = userEvent.setup()
    render(<Name onCommit={async () => ({ kind: 'error', message: 'The relay refused the rename: relay_membership_required.' })} />)
    await user.click(button('Rename'))
    await user.type(field(), ' two{Enter}')
    const line = await screen.findByRole('alert')
    expect(line.textContent).toBe('The relay refused the rename: relay_membership_required.')
    expect(line.className).toContain('text-error-default')
    expect(field().value).toBe('Launch naming two')
    // The line is under the field, in the field's form, 8px down.
    const form = line.closest('form')!
    expect(form.contains(field())).toBe(true)
    expect(form.className.split(' ')).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-2']))
    expect(form.lastElementChild!.lastElementChild).toBe(line)
  })

  it('a warning saves, closes, and says it under the text', async () => {
    const user = userEvent.setup()
    render(<Name onCommit={async () => ({ kind: 'warning', message: 'Renamed here; Ship shows the old name until it reloads.' })} />)
    await user.click(button('Rename'))
    await user.type(field(), ' two{Enter}')
    const line = await screen.findByRole('status')
    expect(line.textContent).toBe('Renamed here; Ship shows the old name until it reloads.')
    expect(screen.queryByRole('textbox')).toBeNull()
    // Under the text, 12px down.
    expect(line.parentElement!.className.split(' ')).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-3']))
  })

  it('a save that throws keeps the field open and says the error’s words', async () => {
    const user = userEvent.setup()
    render(
      <Name
        onCommit={async () => {
          throw new Error('The relay did not answer.')
        }}
      />,
    )
    await user.click(button('Rename'))
    await user.type(field(), ' two{Enter}')
    expect((await screen.findByRole('alert')).textContent).toBe('The relay did not answer.')
    // Nothing is left stuck on "Saving…".
    expect(button('Save').disabled).toBe(false)
  })

  it('says it is saving, and switches the field and both buttons off', async () => {
    const user = userEvent.setup()
    render(<Name onCommit={() => new Promise<boolean>(() => {})} />)
    await user.click(button('Rename'))
    await user.type(field(), ' two{Enter}')
    expect(button('Saving…').disabled).toBe(true)
    expect(button('Cancel').disabled).toBe(true)
    // Off through the form's fieldset, as every field in a busy Form is.
    expect(field().matches(':disabled')).toBe(true)
  })

  it('read-only: the text, and no way in', () => {
    render(<Name readOnly />)
    expect(screen.getByText('Launch naming')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('defaultEditing opens as the field, holding the name (a menu’s Rename)', () => {
    render(<Name defaultEditing />)
    expect(field().value).toBe('Launch naming')
  })
})

describe('EditableText, buttons: a summary (Peek’s Details, SPEC §6.12)', () => {
  it('offers its add words with a plus when there is none, and saves on one line', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(async () => true as const)
    render(<Summary onCommit={onCommit} />)
    const empty = screen.getByText('No summary yet.')
    expect(empty.className).toContain('text-text-muted')
    await user.click(button('Add a summary'))
    expect(field('Summary').getAttribute('placeholder')).toBe('What is it for, in a sentence?')
    fireEvent.change(field('Summary'), { target: { value: ' Where we pick\nthe name. ' } })
    await user.click(button('Save'))
    await waitFor(() => expect(onCommit).toHaveBeenCalledWith('Where we pick the name.'))
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull())
    expect(button('Edit')).toBeTruthy()
  })

  it('edits the whole value it was given', async () => {
    const user = userEvent.setup()
    render(<Summary value={'x'.repeat(300)} />)
    await user.click(button('Edit'))
    expect(field('Summary').value).toBe('x'.repeat(300))
  })

  it('saving an empty field clears it, when the value is not required', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(async () => true as const)
    render(<Summary value="Where we pick the name." onCommit={onCommit} />)
    await user.click(button('Edit'))
    fireEvent.change(field('Summary'), { target: { value: '  ' } })
    await user.click(button('Save'))
    await waitFor(() => expect(onCommit).toHaveBeenCalledWith(''))
  })

  it('a change only in spaces is no change', async () => {
    const user = userEvent.setup()
    render(<Summary value="Where we pick the name." />)
    await user.click(button('Edit'))
    fireEvent.change(field('Summary'), { target: { value: 'Where  we pick\nthe name.' } })
    expect(button('Save').disabled).toBe(true)
  })

  it('says its note under the field as it is typed, and still lets it save', async () => {
    const user = userEvent.setup()
    render(<Summary draftNote={(draft) => (draft.length > 240 ? <FieldLine tone="warning">{`${draft.length} characters.`}</FieldLine> : null)} />)
    await user.click(button('Add a summary'))
    fireEvent.change(field('Summary'), { target: { value: 'a'.repeat(250) } })
    const note = screen.getByText('250 characters.')
    // Between the field and its buttons.
    expect(note.previousElementSibling).toBe(field('Summary'))
    expect(note.nextElementSibling!.contains(button('Save'))).toBe(true)
    expect(button('Save').disabled).toBe(false)
  })

  it('Enter in it is a new line; Ctrl+Enter saves', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(async () => true as const)
    render(<Summary onCommit={onCommit} />)
    await user.click(button('Add a summary'))
    await user.type(field('Summary'), 'One{Enter}two')
    expect(onCommit).not.toHaveBeenCalled()
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onCommit).toHaveBeenCalledWith('One two')
  })

  it('a refusal keeps your text and the reason; the same text can be sent again, and changing it takes the reason away', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(async () => ({ kind: 'error' as const, message: 'Summary not saved. relay_membership_required Your text is still here.' }))
    render(<Summary onCommit={onCommit} />)
    await user.click(button('Add a summary'))
    fireEvent.change(field('Summary'), { target: { value: 'Mine' } })
    await user.click(button('Save'))
    expect((await screen.findByRole('alert')).textContent).toBe('Summary not saved. relay_membership_required Your text is still here.')
    expect(field('Summary').value).toBe('Mine')
    await user.click(button('Save'))
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(2))
    fireEvent.change(field('Summary'), { target: { value: 'Mine, again' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('back at the saved text once the reason has gone, there is nothing to send', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(async () => ({ kind: 'error' as const, message: 'Not saved.' }))
    render(<Summary value="Where we pick the name." onCommit={onCommit} />)
    await user.click(button('Edit'))
    fireEvent.change(field('Summary'), { target: { value: 'Where we pick the name!' } })
    await user.click(button('Save'))
    await screen.findByRole('alert')
    fireEvent.change(field('Summary'), { target: { value: 'Where we pick the name.' } })
    // Back to the saved text and no reason standing: nothing to send.
    expect(button('Save').disabled).toBe(true)
  })

  it('Escape in it abandons the edit', async () => {
    const user = userEvent.setup()
    render(<Summary value="Where we pick the name." />)
    await user.click(button('Edit'))
    await user.type(field('Summary'), ' More.{Escape}')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Where we pick the name.')).toBeTruthy()
  })
})
