// @vitest-environment jsdom
/**
 * What the EditableText page claims, pinned.
 *
 * It had no test file, and it is the component in the package with the most
 * rules of its own: Base UI supplies the field and nothing else, so *every*
 * sentence on its page — Enter commits, Escape cancels, blur commits, an
 * unchanged value is not committed, a refused commit keeps the text — is this
 * file's code and was held by nothing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditableText } from './EditableText'

afterEach(cleanup)

const read = () => screen.getByRole('button', { name: 'Edit title' })
const field = () => screen.getByRole('textbox', { name: 'Title' })

describe('EditableText: reading', () => {
  it('reads as a button named for what it edits', () => {
    render(<EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={() => true} />)
    expect(read().textContent).toBe('Item one')
  })

  it('shows the placeholder when there is nothing yet', () => {
    render(<EditableText value="" placeholder="Untitled" label="Title" onCommit={() => true} />)
    expect(read().textContent).toBe('Untitled')
  })

  it('`display` changes what is shown, never what is edited', async () => {
    const user = userEvent.setup()
    render(<EditableText value="Item one [ref]" display="Item one" placeholder="Untitled" label="Title" onCommit={() => true} />)
    expect(read().textContent).toBe('Item one')
    await user.click(read())
    expect((field() as HTMLInputElement).value).toBe('Item one [ref]')
  })

  it('read-only shows the value and offers no way in', () => {
    render(<EditableText readOnly value="Item one" placeholder="Untitled" label="Title" onCommit={() => true} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Item one')).toBeTruthy()
  })
})

describe('EditableText: editing', () => {
  it('a click opens the field with the value in it, selected', async () => {
    const user = userEvent.setup()
    render(<EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={() => true} />)
    await user.click(read())
    const input = field() as HTMLInputElement
    expect(input.value).toBe('Item one')
    // Selected, so typing replaces rather than appends — what a rename is.
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 'Item one'.length])
  })

  it('Enter commits the trimmed value and closes', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(() => true)
    render(<EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={onCommit} />)
    await user.click(read())
    await user.keyboard('{Control>}a{/Control}  Item two  {Enter}')
    expect(onCommit).toHaveBeenCalledWith('Item two')
  })

  it('Escape restores the value and closes without committing', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(() => true)
    render(<EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={onCommit} />)
    await user.click(read())
    await user.keyboard('{Control>}a{/Control}Item two{Escape}')
    expect(onCommit).not.toHaveBeenCalled()
    expect(read().textContent).toBe('Item one')
  })

  it('blur commits, because leaving a field is not cancelling', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(() => true)
    render(
      <>
        <EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={onCommit} />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(read())
    await user.keyboard('{Control>}a{/Control}Item two')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(onCommit).toHaveBeenCalledWith('Item two')
  })

  /** Nothing changed, so there is nothing to save — and a caller that writes
   *  on every commit would otherwise write on every glance. */
  it('an unchanged value is not committed', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(() => true)
    render(<EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={onCommit} />)
    await user.click(read())
    await user.keyboard('{Enter}')
    expect(onCommit).not.toHaveBeenCalled()
    expect(read()).toBeTruthy()
  })

  /** The caller has already said why, in its own banner. Closing the field
   *  here would throw the edit away on top of that. */
  it('a refused commit keeps the field open with the text still in it', async () => {
    const user = userEvent.setup()
    render(<EditableText value="Item one" placeholder="Untitled" label="Title" onCommit={() => false} />)
    await user.click(read())
    await user.keyboard('{Control>}a{/Control}Item two{Enter}')
    expect((field() as HTMLInputElement).value).toBe('Item two')
  })

  it('a commit that throws does the same', async () => {
    const user = userEvent.setup()
    render(
      <EditableText
        value="Item one"
        placeholder="Untitled"
        label="Title"
        onCommit={() => {
          throw new Error('the caller has shown why')
        }}
      />,
    )
    await user.click(read())
    await user.keyboard('{Control>}a{/Control}Item two{Enter}')
    expect((field() as HTMLInputElement).value).toBe('Item two')
  })
})

describe('EditableText: multiline', () => {
  it('edits in a textarea, and Shift+Enter is a new line rather than a commit', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(() => true)
    render(<EditableText multiline value="Line one" placeholder="Untitled" label="Title" onCommit={onCommit} />)
    await user.click(read())
    const area = screen.getByRole('textbox', { name: 'Title' }) as HTMLTextAreaElement
    expect(area.tagName).toBe('TEXTAREA')
    await user.keyboard('{Shift>}{Enter}{/Shift}Line two')
    expect(onCommit).not.toHaveBeenCalled()
    // The value opens SELECTED, here as everywhere, so the first keystroke
    // replaces it — the newline included. Worth knowing for a multiline field:
    // one key on an opened description replaces the whole body.
    expect(area.value).toBe('\nLine two')
  })

  it('and plain Enter still commits', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn(() => true)
    render(<EditableText multiline value="Line one" placeholder="Untitled" label="Title" onCommit={onCommit} />)
    await user.click(read())
    await user.keyboard('{Control>}a{/Control}Line two{Enter}')
    expect(onCommit).toHaveBeenCalledWith('Line two')
  })
})
