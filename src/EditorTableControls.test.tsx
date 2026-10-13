// @vitest-environment jsdom
/**
 * A table's controls in an editor (RIC-21): what each row of the row and column
 * menus and each ➕ bar does to the document, that new rows and cells get ids of
 * their own, and that deleting a table's only row or column deletes the table.
 * Where the controls sit is measured in real Chromium (the PR says how): jsdom
 * lays nothing out.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { BlockId } from './BlockNodes'
import { EditorTableControls, appendTableColumn, appendTableRow, deleteTableColumn, deleteTableRow } from './EditorTableControls'

type Json = { type: string; attrs?: Record<string, unknown>; content?: Json[]; text?: string }

const cell = (type: 'tableHeader' | 'tableCell', text: string): Json => ({ type, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
const row = (type: 'tableHeader' | 'tableCell', ...texts: string[]): Json => ({ type: 'tableRow', content: texts.map((t) => cell(type, t)) })
const table = (...rows: Json[]): object => ({ type: 'doc', content: [{ type: 'table', attrs: { blockId: 't1' }, content: rows }, { type: 'paragraph', content: [{ type: 'text', text: 'after' }] }] })
const THREE = table(row('tableHeader', 'A', 'B', 'C'), row('tableCell', 'a1', 'b1', 'c1'), row('tableCell', 'a2', 'b2', 'c2'))

const editors: Editor[] = []
function editor(content: object = THREE, editable = true) {
  const e = new Editor({ extensions: [StarterKit, TableKit.configure({ table: { resizable: false } }), BlockId], content, editable })
  editors.push(e)
  return e
}

/** The table as text, a row a line: `#` before a header cell. */
function shape(e: Editor): string[] {
  const t = (e.getJSON().content as Json[]).find((b) => b.type === 'table')
  if (!t) return []
  const text = (n: Json): string => n.text ?? (n.content ?? []).map(text).join('')
  return (t.content ?? []).map((r) => (r.content ?? []).map((c) => (c.type === 'tableHeader' ? '#' : '') + text(c)).join('|'))
}
const cellOf = (text: string) => screen.getByText(text).closest('td, th') as HTMLTableCellElement
const tableOf = (e: Editor) => e.view.dom.querySelector('table') as HTMLTableElement

/** Every id under the table: rows and cells, each its own. */
function ids(e: Editor): unknown[] {
  const out: unknown[] = []
  e.state.doc.descendants((n) => {
    if (n.type.name.startsWith('table')) out.push(n.attrs.blockId)
  })
  return out
}

/** Press and release, as BlockHandle's test does: under jsdom `user.click` left a Base UI menu shut. */
async function press(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
  await user.pointer({ keys: '[MouseLeft>]', target })
  await user.pointer({ keys: '[/MouseLeft]', target })
  await screen.findByRole('menu')
}
/**
 * A click on a ➕ bar, with no pointer move before it. user-event moves the
 * pointer first, and jsdom, with no layout, reports that move as leaving the
 * frame (a `mouseleave` with no `relatedTarget`), which takes the bar away
 * before its click. In Chromium the pointer reaches the bar from the cell (the
 * PR says how).
 */
const tap = (target: HTMLElement) => act(async () => void fireEvent.click(target))
/** The editor takes the focus back a frame later and measures the caret then. */
const frame = () => act(() => new Promise<void>((done) => requestAnimationFrame(() => done())))
/**
 * `BlockId` gives the blocks their ids on the editor's `create`, a tick after it
 * is made — which redraws every cell, so a cell found before it is no longer the
 * editor's. Wait for it.
 */
const created = () => act(() => new Promise<void>((done) => setTimeout(done, 0)))

beforeAll(() => {
  const none = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => none as DOMRect
})

afterEach(() => {
  cleanup()
  for (const e of editors.splice(0)) e.destroy()
})

async function mount(e: Editor) {
  const { EditorContent } = await import('@tiptap/react')
  render(
    <EditorTableControls editor={e}>
      <EditorContent editor={e} />
    </EditorTableControls>,
  )
  await created()
  return userEvent.setup()
}

describe('the actions', () => {
  it('a ➕ under the table adds an empty row after the last, of cells', () => {
    const e = editor()
    expect(appendTableRow(e, tableOf(e))).toBe(true)
    expect(shape(e)).toEqual(['#A|#B|#C', 'a1|b1|c1', 'a2|b2|c2', '||'])
  })

  it('a ➕ right of the table adds an empty column after the last', () => {
    const e = editor()
    expect(appendTableColumn(e, tableOf(e))).toBe(true)
    expect(shape(e)).toEqual(['#A|#B|#C|#', 'a1|b1|c1|', 'a2|b2|c2|'])
  })

  it('new rows and cells get ids of their own; the old ones keep theirs', async () => {
    const e = editor()
    await created()
    const before = ids(e)
    expect(before.every((id) => typeof id === 'string')).toBe(true)
    appendTableRow(e, tableOf(e))
    appendTableColumn(e, tableOf(e))
    const after = ids(e)
    expect(after.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
    expect(new Set(after).size).toBe(after.length)
    expect(before.every((id) => after.includes(id))).toBe(true)
  })

  it('deleting a row or a column leaves the rest as they were', async () => {
    const e = editor()
    await mount(e)
    expect(deleteTableRow(e, cellOf('a1'))).toBe(true)
    expect(deleteTableColumn(e, cellOf('B'))).toBe(true)
    expect(shape(e)).toEqual(['#A|#C', 'a2|c2'])
  })

  it('Tab in the last cell adds a row; in another, moves to the next cell (TableKit’s own)', () => {
    const e = editor()
    const textAt = (text: string) => {
      let at = -1
      e.state.doc.descendants((n, pos) => {
        if (n.isText && n.text === text) at = pos
      })
      return at
    }
    // The caret's row in the table, and its cell in the row.
    const at = () => [e.state.selection.$from.index(1), e.state.selection.$from.index(2)]
    // The key as the view gets it: `commands.keyboardShortcut` runs inside a command, whose own transaction then puts the selection back.
    const press = (key: string, shiftKey = false) => e.view.someProp('handleKeyDown', (f) => f(e.view, new KeyboardEvent('keydown', { key, shiftKey })))
    e.commands.setTextSelection(textAt('a1'))
    press('Tab')
    expect(at()).toEqual([1, 1])
    press('Tab', true)
    expect(at()).toEqual([1, 0])
    e.commands.setTextSelection(textAt('c2'))
    press('Tab')
    expect(shape(e)).toEqual(['#A|#B|#C', 'a1|b1|c1', 'a2|b2|c2', '||'])
    expect(at()).toEqual([3, 0])
  })

  it('deleting the only row, or the only column, deletes the table', async () => {
    const one = editor(table(row('tableCell', 'x', 'y')))
    await mount(one)
    expect(deleteTableRow(one, cellOf('x'))).toBe(true)
    expect(shape(one)).toEqual([])
    cleanup()
    const narrow = editor(table(row('tableCell', 'p'), row('tableCell', 'q')))
    await mount(narrow)
    expect(deleteTableColumn(narrow, cellOf('q'))).toBe(true)
    expect(shape(narrow)).toEqual([])
    expect(narrow.getText()).toContain('after')
  })
})

describe('EditorTableControls', () => {
  it('draws nothing until the pointer is on a cell', async () => {
    const user = await mount(editor())
    expect(screen.queryByRole('button', { name: 'Row menu' })).toBeNull()
    await act(async () => user.hover(screen.getByText('after')))
    expect(screen.queryByRole('button', { name: 'Row menu' })).toBeNull()
    await act(async () => user.hover(screen.getByText('b1')))
    expect(screen.getByRole('button', { name: 'Row menu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Column menu' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add row' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add column' })).toBeNull()
  })

  it('offers the ➕ under the table from the last row, and the one right of it from the last column', async () => {
    const user = await mount(editor())
    await act(async () => user.hover(screen.getByText('b2')))
    expect(screen.getByRole('button', { name: 'Add row' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add column' })).toBeNull()
    await act(async () => user.hover(screen.getByText('c1')))
    expect(screen.queryByRole('button', { name: 'Add row' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Add column' })).toBeTruthy()
    await act(async () => user.hover(screen.getByText('c2')))
    expect(screen.getByRole('button', { name: 'Add row' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add column' })).toBeTruthy()
  })

  it('the row menu inserts above and below the row pointed at, and deletes it', async () => {
    const e = editor()
    const user = await mount(e)
    await act(async () => user.hover(screen.getByText('b1')))
    await press(user, screen.getByRole('button', { name: 'Row menu' }))
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Insert above', 'Insert below', 'Delete', 'Delete table'])
    await user.click(screen.getByRole('menuitem', { name: 'Insert below' }))
    await frame()
    expect(shape(e)).toEqual(['#A|#B|#C', 'a1|b1|c1', '||', 'a2|b2|c2'])

    await act(async () => user.hover(screen.getByText('a2')))
    await press(user, screen.getByRole('button', { name: 'Row menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await frame()
    expect(shape(e)).toEqual(['#A|#B|#C', 'a1|b1|c1', '||'])
  })

  it('the column menu inserts left and right of the column pointed at, and deletes it', async () => {
    const e = editor()
    const user = await mount(e)
    await act(async () => user.hover(screen.getByText('b2')))
    await press(user, screen.getByRole('button', { name: 'Column menu' }))
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Insert left', 'Insert right', 'Delete', 'Delete table'])
    await user.click(screen.getByRole('menuitem', { name: 'Insert left' }))
    await frame()
    expect(shape(e)).toEqual(['#A|#|#B|#C', 'a1||b1|c1', 'a2||b2|c2'])

    await act(async () => user.hover(screen.getByText('c1')))
    await press(user, screen.getByRole('button', { name: 'Column menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await frame()
    expect(shape(e)).toEqual(['#A|#|#B', 'a1||b1', 'a2||b2'])
  })

  it('a header row offers nothing above it, and deleting it makes the next row the header', async () => {
    const e = editor()
    const user = await mount(e)
    await act(async () => user.hover(screen.getByText('B')))
    await press(user, screen.getByRole('button', { name: 'Row menu' }))
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Insert below', 'Delete', 'Delete table'])
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await frame()
    expect(shape(e)).toEqual(['#a1|#b1|#c1', 'a2|b2|c2'])
  })

  it('takes the controls away when the document changes without an update — someone else’s edit loaded', async () => {
    const e = editor()
    const user = await mount(e)
    await act(async () => user.hover(screen.getByText('b1')))
    expect(screen.getByRole('button', { name: 'Row menu' })).toBeTruthy()
    await act(async () => void e.commands.setContent(THREE, { emitUpdate: false }))
    expect(screen.queryByRole('button', { name: 'Row menu' })).toBeNull()
  })

  it('Delete table removes the table and keeps the text after it', async () => {
    const e = editor()
    const user = await mount(e)
    await act(async () => user.hover(screen.getByText('a1')))
    await press(user, screen.getByRole('button', { name: 'Row menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete table' }))
    await frame()
    expect(shape(e)).toEqual([])
    expect(e.getText()).toContain('after')
  })

  it('the ➕ bars add a row and a column at the end', async () => {
    const e = editor()
    const user = await mount(e)
    await act(async () => user.hover(screen.getByText('a2')))
    // The press keeps the focus in the field, so a field that saves on leaving does not save half-way: `false` is a prevented default.
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'Add row' }))).toBe(false)
    await tap(screen.getByRole('button', { name: 'Add row' }))
    await frame()
    await act(async () => user.hover(screen.getByText('c1')))
    await tap(screen.getByRole('button', { name: 'Add column' }))
    await frame()
    expect(shape(e)).toEqual(['#A|#B|#C|#', 'a1|b1|c1|', 'a2|b2|c2|', '|||'])
  })

  it('an editor that cannot be edited gets no controls', async () => {
    const user = await mount(editor(THREE, false))
    await act(async () => user.hover(screen.getByText('b1')))
    expect(screen.queryByRole('button', { name: 'Row menu' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add row' })).toBeNull()
  })

  it('draws nothing before its editor exists', () => {
    render(
      <EditorTableControls editor={null}>
        <p>text</p>
      </EditorTableControls>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })
})
