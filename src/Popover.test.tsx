// @vitest-environment jsdom
/**
 * What the Popover page claims, pinned — including the two things that
 * distinguish it from a `Menu`, which is the whole reason it exists: its
 * contents are not menu items, and a field inside it keeps its focus.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { Popover } from './Popover'
import { PreviewCard } from './PreviewCard'
import { TextInput } from './TextInput'

afterEach(cleanup)

function Opened({ onClose = () => {}, children }: { onClose?: () => void; children?: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button ref={ref} type="button" onClick={() => setOpen((v) => !v)}>
        Trigger
      </button>
      {open && (
        <Popover
          anchor={ref.current}
          ariaLabel="A panel"
          onClose={() => {
            setOpen(false)
            onClose()
          }}
        >
          {children ?? <button type="button">Inside</button>}
        </Popover>
      )}
    </>
  )
}

describe('Popover', () => {
  it('is a named panel, portalled out of what rendered it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Opened />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const panel = await screen.findByRole('dialog', { name: 'A panel' })
    expect(container.contains(panel)).toBe(false)
  })

  /** The distinction from Menu, in one assertion: nothing in here is a
   *  menuitem, so nothing takes the arrow keys or the typeahead. */
  it('its contents are contents, not menu items', async () => {
    const user = userEvent.setup()
    render(<Opened />)
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
      <Opened>
        <Field />
      </Opened>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    const field = await screen.findByRole('textbox', { name: 'Link address' })
    expect(document.activeElement).toBe(field)
    await user.keyboard('abc')
    expect((field as HTMLInputElement).value).toBe('abc')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Opened onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on a press outside', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <>
        <Opened onClose={onClose} />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('a press on the anchor closes it once, and does not reopen it', async () => {
    const user = userEvent.setup()
    render(<Opened />)
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('PreviewCard', () => {
  it('renders its trigger, and nothing of its content, until it opens', () => {
    render(
      <PreviewCard content={<span>The rest of it</span>}>
        <span>A row</span>
      </PreviewCard>,
    )
    expect(screen.getByText('A row')).toBeTruthy()
    // `content` is not rendered while closed, so a preview that fetches does
    // not fetch once per row on screen.
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('opens when the pointer rests on the trigger, and closes when it leaves', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard content={<span>The rest of it</span>} delay={0} closeDelay={0}>
        <span>A row</span>
      </PreviewCard>,
    )
    await user.hover(screen.getByText('A row'))
    expect(await screen.findByText('The rest of it')).toBeTruthy()
    await user.unhover(screen.getByText('A row'))
    expect(screen.queryByText('The rest of it')).toBeNull()
  })

  it('the trigger is the wrapper, and the row inside it is untouched', () => {
    const { container } = render(
      <PreviewCard content={<span>x</span>} wrapperClassName="block w-full">
        <div data-testid="row">A row</div>
      </PreviewCard>,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.tagName).toBe('SPAN')
    expect(wrapper.className).toContain('block')
    expect(wrapper.firstElementChild?.getAttribute('data-testid')).toBe('row')
  })
})
