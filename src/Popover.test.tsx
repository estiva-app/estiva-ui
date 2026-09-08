// @vitest-environment jsdom
/**
 * What the Popover page claims, pinned — including the two things that
 * distinguish it from a `Menu`, which is the whole reason it exists: its
 * contents are not menu items, and a field inside it keeps its focus.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { Button } from './Button'
import { Popover } from './Popover'
import { TextInput } from './TextInput'

afterEach(cleanup)

function Basic({ children, onOpenChange }: { children?: React.ReactNode; onOpenChange?: (open: boolean) => void }) {
  return (
    <Popover trigger={<Button variant="outlined">Trigger</Button>} ariaLabel="A panel" onOpenChange={onOpenChange}>
      {children ?? <button type="button">Inside</button>}
    </Popover>
  )
}

describe('Popover', () => {
  it('is a named panel, portalled out of what rendered it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Basic />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const panel = await screen.findByRole('dialog', { name: 'A panel' })
    expect(container.contains(panel)).toBe(false)
  })

  /** The distinction from Menu, in one assertion: nothing in here is a
   *  menuitem, so nothing takes the arrow keys or the typeahead. */
  it('its contents are contents, not menu items', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Inside' })).toBeTruthy()
  })

  /** The link editor is why this component exists: a panel that steals focus
   *  from its own field would be useless. */
  it('a field inside keeps the focus its autoFocus asked for', async () => {
    const user = userEvent.setup()
    function Field() {
      const [value, setValue] = useState('')
      return <TextInput autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="Link address" />
    }
    render(
      <Basic>
        <Field />
      </Basic>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const field = await screen.findByRole('textbox', { name: 'Link address' })
    expect(document.activeElement).toBe(field)
    await user.keyboard('abc')
    expect((field as HTMLInputElement).value).toBe('abc')
  })

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on a press outside', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Basic />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('a second press of the trigger closes it', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.click(trigger)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  /** A control inside a panel is content, not a menu row: pressing it does not
   *  close the panel, which is what `actionsRef` is for. */
  it('a button inside does not close it; actionsRef does', async () => {
    const user = userEvent.setup()
    function WithActions() {
      const actions = useRef<{ close: () => void; unmount: () => void } | null>(null)
      return (
        <Popover trigger={<Button variant="outlined">Trigger</Button>} actionsRef={actions} ariaLabel="A panel">
          <Button size="small">Does nothing</Button>
          <Button size="small" onClick={() => actions.current?.close()}>
            Close
          </Button>
        </Popover>
      )
    }
    render(<WithActions />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Does nothing' }))
    expect(screen.queryByRole('dialog')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('reports opening and closing to a caller that asks', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Basic onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  /** The other mode: no trigger element, hung from a rect the caller measured. */
  it('opens from an anchored rect with no trigger at all', async () => {
    render(
      <Popover anchor={new DOMRect(10, 10, 40, 20)} open ariaLabel="Formatting">
        <button type="button">Bold</button>
      </Popover>,
    )
    expect(await screen.findByRole('dialog', { name: 'Formatting' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Trigger' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeTruthy()
  })

  /**
   * An anchored panel leaves focus where it was. The person is still in
   * whatever produced it — a text selection means a caret in the text — and a
   * panel that took the caret would end the edit it exists to serve.
   */
  it('an anchored panel does not take focus', async () => {
    render(
      <>
        <input aria-label="Where the person is" />
        <Popover anchor={new DOMRect(10, 10, 40, 20)} open ariaLabel="Formatting">
          <button type="button">Bold</button>
        </Popover>
      </>,
    )
    const field = screen.getByRole('textbox', { name: 'Where the person is' })
    field.focus()
    await screen.findByRole('dialog')
    expect(document.activeElement).toBe(field)
  })

  /** An anchored panel has the same two exits as any other. It is the mode
   *  with no trigger, so this is the only place they can be asserted. */
  it('an anchored panel still closes on Escape and on a press outside', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <>
        <Popover anchor={new DOMRect(10, 10, 40, 20)} open onOpenChange={onOpenChange} ariaLabel="Formatting">
          <button type="button">Bold</button>
        </Popover>
        <button type="button">Elsewhere</button>
      </>,
    )
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    onOpenChange.mockClear()
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
