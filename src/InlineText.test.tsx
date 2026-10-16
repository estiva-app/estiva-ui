// @vitest-environment jsdom
/**
 * What the InlineText page claims, pinned: the text is the editor, Enter saves
 * and moves on, Escape and leaving save, nothing unchanged is written, a title
 * left empty comes back and a summary left empty is cleared, a refused save
 * keeps your text, a paste is one line, and read-only is text only.
 *
 * jsdom lays nothing out, so text goes in through the editor and the caret is
 * put at the end by hand; the keys are real key presses.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Editor } from '@tiptap/core'
import { InlineText, type InlineTextProps } from './InlineText'

// jsdom draws nothing, so it has no rects; the editor asks for them when it scrolls to the caret.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
})

afterEach(cleanup)

const field = (name = 'Title') => screen.getByRole('textbox', { name })
const editorOf = (box: HTMLElement) => (box as HTMLElement & { editor: Editor }).editor

function draw(props: Partial<InlineTextProps> = {}) {
  const onCommit = props.onCommit ?? vi.fn(() => true)
  const base = { value: 'Item one', placeholder: 'Untitled', label: 'Title' }
  const view = render(<InlineText {...base} {...props} onCommit={onCommit} />)
  return { onCommit, rerender: (next: Partial<InlineTextProps>) => view.rerender(<InlineText {...base} {...props} {...next} onCommit={onCommit} />) }
}

/** Click into it: focus, with the caret at the end. */
async function enter(name?: string) {
  const box = field(name)
  await act(async () => {
    box.focus()
    editorOf(box).commands.setTextSelection(editorOf(box).state.doc.content.size - 1)
  })
}

/** Type at the caret. */
async function type(text: string, name?: string) {
  await act(async () => {
    editorOf(field(name)).commands.insertContent(text)
  })
}

/** Delete everything in it. */
async function clear(name?: string) {
  await act(async () => {
    editorOf(field(name)).commands.clearContent(true)
  })
}

describe('InlineText: the text is the editor', () => {
  it('is an editable text box named for what it edits, holding the saved text, with no button to open it', () => {
    draw()
    expect(field().getAttribute('contenteditable')).toBe('true')
    expect(field().textContent).toBe('Item one')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows the placeholder while empty, and not once there is text', async () => {
    draw({ value: '', clearable: true })
    expect(screen.queryByText('Untitled')).not.toBeNull()
    await enter()
    await type('A')
    expect(screen.queryByText('Untitled')).toBeNull()
  })

  it('read-only is the text alone: not editable and no placeholder', () => {
    draw({ value: '', readOnly: true })
    expect(field().getAttribute('contenteditable')).toBe('false')
    expect(screen.queryByText('Untitled')).toBeNull()
  })
})

describe('InlineText: keys and saving', () => {
  it('Enter saves the text and moves on', async () => {
    const onEnter = vi.fn()
    const { onCommit } = draw({ onEnter })
    await enter()
    await type(' two')
    await userEvent.keyboard('{Enter}')
    expect(onCommit).toHaveBeenCalledWith('Item one two')
    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(field().textContent).toBe('Item one two')
  })

  it('Escape stops editing and saves what was typed', async () => {
    const { onCommit } = draw()
    await enter()
    await type(' two')
    await userEvent.keyboard('{Escape}')
    expect(document.activeElement).not.toBe(field())
    expect(onCommit).toHaveBeenCalledWith('Item one two')
    expect(field().textContent).toBe('Item one two')
  })

  it('leaving saves it', async () => {
    const { onCommit } = draw()
    await enter()
    await type(' two')
    await act(async () => field().blur())
    expect(onCommit).toHaveBeenCalledWith('Item one two')
  })

  it('an unchanged text is not a write', async () => {
    const { onCommit } = draw()
    await enter()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{Escape}')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('a title left empty brings the saved one back, and is not a write', async () => {
    const { onCommit } = draw()
    await enter()
    await clear()
    await userEvent.keyboard('{Escape}')
    expect(onCommit).not.toHaveBeenCalled()
    expect(field().textContent).toBe('Item one')
  })

  it('a clearable one left empty is saved as nothing', async () => {
    const { onCommit } = draw({ clearable: true, label: 'Summary' })
    await enter('Summary')
    await clear('Summary')
    await userEvent.keyboard('{Escape}')
    expect(onCommit).toHaveBeenCalledWith('')
  })

  it('a paste of several lines is one line of plain text', async () => {
    const { onCommit } = draw({ value: '', clearable: true })
    await enter()
    await userEvent.paste('Line one\n\nline   two\n')
    await userEvent.keyboard('{Enter}')
    expect(onCommit).toHaveBeenCalledWith('Line one line two')
  })

  it('reports the text being written, and null on leaving', async () => {
    const onText = vi.fn()
    draw({ onText })
    await enter()
    expect(onText).toHaveBeenLastCalledWith('Item one')
    await type('!')
    expect(onText).toHaveBeenLastCalledWith('Item one!')
    await userEvent.keyboard('{Escape}')
    expect(onText).toHaveBeenLastCalledWith(null)
  })
})

describe('InlineText: a refused save, and a change from elsewhere', () => {
  it('a refused save keeps your text where it is, and a change from elsewhere does not overwrite it', async () => {
    const onCommit = vi.fn(() => false)
    const { rerender } = draw({ onCommit })
    await enter()
    await type(' two')
    await userEvent.keyboard('{Escape}')
    expect(onCommit).toHaveBeenCalledWith('Item one two')
    expect(field().textContent).toBe('Item one two')
    rerender({ value: 'Item three' })
    expect(field().textContent).toBe('Item one two')
  })

  it('a change from elsewhere is loaded while you are not in it', async () => {
    const { rerender } = draw()
    rerender({ value: 'Item three' })
    await waitFor(() => expect(field().textContent).toBe('Item three'))
  })

  it('your own save coming back is not loaded over what you go on typing', async () => {
    const { rerender, onCommit } = draw()
    await enter()
    await type(' two')
    await userEvent.keyboard('{Enter}')
    expect(onCommit).toHaveBeenCalledWith('Item one two')
    await type('!')
    rerender({ value: 'Item one two' })
    expect(field().textContent).toBe('Item one two!')
  })
})
