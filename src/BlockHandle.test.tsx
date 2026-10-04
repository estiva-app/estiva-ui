// @vitest-environment jsdom
/**
 * The block handle (RIC-18): what its rows do to the document, and which rows
 * it offers. The drag itself is the browser's and is driven in real Chromium
 * (the PR says how); here, the slice it starts with and what a drop of it keeps.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { BlockHandle } from './BlockHandle'
import { BlockId } from './BlockNodes'
import { EditorBlockHandle, deleteBlock, duplicateBlock, moveBlock, startBlockDrag } from './EditorBlockHandle'
import { MenuItem } from './Menu'

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'one' }] },
    { type: 'paragraph', attrs: { blockId: 'p2' }, content: [{ type: 'text', text: 'two' }] },
  ],
}

type Json = { type: string; attrs?: Record<string, unknown>; content?: Json[] }
const editors: Editor[] = []
function editor(content: object = DOCUMENT) {
  const e = new Editor({ extensions: [StarterKit, BlockId], content })
  editors.push(e)
  return e
}
const ids = (e: Editor) => (e.getJSON().content as Json[]).map((b) => b.attrs?.blockId)
const posOf = (e: Editor, id: string) => {
  let at = -1
  e.state.doc.forEach((node, pos) => {
    if (node.attrs.blockId === id) at = pos
  })
  return at
}

/**
 * Press and release on the handle. Base UI opens a menu on the press; under
 * jsdom `user.click`'s own move-press-release-click left it shut, while the
 * same handle opens on a click in Chromium (the story, driven in the PR).
 */
async function press(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
  await user.pointer({ keys: '[MouseLeft>]', target })
  await user.pointer({ keys: '[/MouseLeft]', target })
  await screen.findByRole('menu')
}

// jsdom lays nothing out, so a Range has no rects. The editor measures the caret
// a frame after Duplicate, Delete or a move gives it the focus back; under load
// that frame came while a test still ran (CI, 5 October), and threw.
beforeAll(() => {
  const none = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => none as DOMRect
})

afterEach(() => {
  cleanup()
  for (const e of editors.splice(0)) e.destroy()
})

describe('duplicateBlock', () => {
  it('puts a copy after the block, and the copy gets an id of its own', () => {
    const e = editor()
    duplicateBlock(e, posOf(e, 'p1'))
    const [first, copy, last] = ids(e)
    expect(first).toBe('p1')
    expect(copy).toMatch(/^[0-9a-f]{12}$/)
    expect(last).toBe('p2')
    expect(e.getText()).toBe('one\n\none\n\ntwo')
  })

  it('then deleting the copy gives back the document it started from', () => {
    const e = editor()
    const before = e.getJSON()
    duplicateBlock(e, posOf(e, 'p2'))
    deleteBlock(e, posOf(e, ids(e)[2] as string))
    expect(e.getJSON()).toEqual(before)
  })
})

describe('deleteBlock', () => {
  it('removes the block and leaves the others their ids', () => {
    const e = editor()
    deleteBlock(e, posOf(e, 'p1'))
    expect(ids(e)).toEqual(['p2'])
  })

  it('leaves an empty paragraph when it was the only block', () => {
    const e = editor({ type: 'doc', content: [DOCUMENT.content[0]] })
    deleteBlock(e, 0)
    expect(e.getText()).toBe('')
    expect(e.state.doc.childCount).toBe(1)
  })
})

describe('moveBlock', () => {
  it('moves the block whole, so it keeps its id, as a drop in the gutter does', () => {
    const e = editor()
    moveBlock(e, posOf(e, 'p1'), e.state.doc.content.size)
    expect(ids(e)).toEqual(['p2', 'p1'])
    expect(e.getText()).toBe('two\n\none')
  })

  it('does nothing when the block would land where it is', () => {
    const e = editor()
    const before = e.getJSON()
    expect(moveBlock(e, posOf(e, 'p2'), posOf(e, 'p2'))).toBe(false)
    expect(e.getJSON()).toEqual(before)
  })
})

describe('startBlockDrag', () => {
  it('selects the block and drags its slice, with its id, as a move', () => {
    const e = editor()
    const transfer = { data: {} as Record<string, string>, clearData() {}, setData(type: string, value: string) { this.data[type] = value }, effectAllowed: '' }
    startBlockDrag(e, posOf(e, 'p2'), { dataTransfer: transfer as unknown as DataTransfer })
    expect(e.view.dragging?.move).toBe(true)
    expect(e.view.dragging?.slice.content.firstChild?.attrs.blockId).toBe('p2')
    expect(e.state.selection.from).toBe(posOf(e, 'p2'))
    expect(transfer.data['text/plain']).toBe('two')
  })

  it('a drop of that slice, as ProseMirror makes it, keeps the id', () => {
    const e = editor()
    startBlockDrag(e, posOf(e, 'p1'), { dataTransfer: null })
    // ProseMirror's drop: delete the selection, then insert the slice's node at the drop point.
    const node = e.view.dragging!.slice.content.firstChild!
    const tr = e.state.tr.deleteSelection()
    tr.insert(tr.doc.content.size, node)
    e.view.dispatch(tr)
    expect(ids(e)).toEqual(['p2', 'p1'])
  })
})

describe('BlockHandle', () => {
  it('reading, offers only the caller’s rows and does not drag', async () => {
    render(
      <BlockHandle actions={(b) => <MenuItem label={`Copy link ${b.id}`} onClick={() => {}} />}>
        <div>
          <p data-block-id="r1">read me</p>
        </div>
      </BlockHandle>,
    )
    const user = userEvent.setup()
    await user.hover(screen.getByText('read me'))
    const handle = screen.getByRole('button', { name: 'Block menu' })
    expect(handle.getAttribute('draggable')).toBe('false')
    await press(user, handle)
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Copy link r1'])
  })

  it('reading with no rows of the caller’s, draws no handle', async () => {
    render(
      <BlockHandle>
        <div>
          <p data-block-id="r1">read me</p>
        </div>
      </BlockHandle>,
    )
    await userEvent.setup().hover(screen.getByText('read me'))
    expect(screen.queryByRole('button', { name: 'Block menu' })).toBeNull()
  })

  it('editing, Delete from the menu removes the block', async () => {
    const e = editor()
    const { EditorContent } = await import('@tiptap/react')
    render(
      <EditorBlockHandle editor={e}>
        <EditorContent editor={e} />
      </EditorBlockHandle>,
    )
    const user = userEvent.setup()
    // jsdom lays nothing out: every block's top is 0, so the pointer is on the last.
    await act(async () => user.hover(screen.getByText('two')))
    await press(user, screen.getByRole('button', { name: 'Block menu' }))
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Duplicate', 'Delete'])
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    // The editor takes the focus back a frame later and measures the caret then: wait for it, so it is part of the test.
    await act(() => new Promise<void>((done) => requestAnimationFrame(() => done())))
    expect(ids(e)).toEqual(['p1'])
  })

  it('an editor that cannot be edited gets the caller’s rows only, and no drag', async () => {
    const e = editor()
    e.setEditable(false)
    const { EditorContent } = await import('@tiptap/react')
    render(
      <EditorBlockHandle editor={e} actions={(b) => <MenuItem label={`Copy link ${b.id}`} onClick={() => {}} />}>
        <EditorContent editor={e} />
      </EditorBlockHandle>,
    )
    const user = userEvent.setup()
    await act(async () => user.hover(screen.getByText('two')))
    const handle = screen.getByRole('button', { name: 'Block menu' })
    expect(handle.getAttribute('draggable')).toBe('false')
    await press(user, handle)
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Copy link p2'])
  })

  it('draws no handle before its editor exists', async () => {
    render(
      <EditorBlockHandle editor={null} actions={() => <MenuItem label="Copy link" onClick={() => {}} />}>
        <div>
          <p data-block-id="r1">not yet</p>
        </div>
      </EditorBlockHandle>,
    )
    await userEvent.setup().hover(screen.getByText('not yet'))
    expect(screen.queryByRole('button', { name: 'Block menu' })).toBeNull()
  })
})
