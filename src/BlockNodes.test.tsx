// @vitest-environment jsdom
/**
 * The block nodes (MAN-9, moved from Ship's `editorSchema.tsx`): what the
 * editor must hand back unchanged for a save to keep every anchored comment.
 *
 * The JSON loaded here is what `@estiva-app/protocol`'s `toEditorDocument`
 * produces, and what `getJSON()` returns is what its `fromEditorDocument`
 * reads — so each test is a load, an edit or none, and a read back.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, cleanup, waitFor } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AttachmentNode, BlockId, Callout, Checklist, ReferenceNode, UnknownBlock, isChecklistTick, type ReferenceViewProps } from './BlockNodes'
import { applyFormat } from './ComposerTriggers'

const EXTENSIONS = [StarterKit, BlockId, UnknownBlock, ReferenceNode, AttachmentNode]

const SOURCE = { type: 'widget', id: 'w1', content: [{ type: 'text', text: 'kept' }] }
const FILE = { url: '/media/f.png', m: 'image/png', x: 'f'.repeat(64), size: 4096 }

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, blockId: 'h1' }, content: [{ type: 'text', text: 'Title' }] },
    {
      type: 'paragraph',
      attrs: { blockId: 'p1' },
      content: [
        { type: 'text', text: 'see ' },
        { type: 'reference', attrs: { uri: 'nostr:naddr1example', marks: ['bold'] } },
      ],
    },
    { type: 'unknownBlock', attrs: { blockId: 'w1', source: SOURCE, text: 'kept' } },
    { type: 'attachment', attrs: { blockId: 'a1', ...FILE, filename: 'shot.png' } },
    { type: 'bulletList', attrs: { blockId: 'l1' }, content: [{ type: 'listItem', attrs: { blockId: 'i1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] }] },
  ],
}

type Json = { type: string; attrs?: Record<string, unknown>; content?: Json[] }

// jsdom has no ClipboardEvent, which ProseMirror's `pasteHTML` and `pasteText` make.
globalThis.ClipboardEvent ??= class extends Event {
  clipboardData = null
} as unknown as typeof ClipboardEvent

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
  cleanup()
})

describe('what the editor hands back', () => {
  it('keeps every block id through a load and a read', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const back = editor.getJSON() as Json
    expect(back.content?.map((n) => n.attrs?.blockId)).toEqual(['h1', 'p1', 'w1', 'a1', 'l1'])
    expect(back.content?.[4].content?.[0].attrs?.blockId).toBe('i1')
  })

  it('keeps a block id when its text is typed into', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    // The end of the heading's text: 1 opens the heading, 5 characters of "Title".
    editor.chain().setTextSelection(6).insertContent(', edited').run()
    const heading = (editor.getJSON() as Json).content?.[0]
    expect(heading?.attrs?.blockId).toBe('h1')
    expect(JSON.stringify(heading)).toContain('Title, edited')
  })

  it('carries an unknown block whole, source and all', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const kept = (editor.getJSON() as Json).content?.[2]
    expect(kept?.type).toBe('unknownBlock')
    expect(kept?.attrs?.source).toEqual(SOURCE)
  })

  it('keeps a reference an atom, with its uri and the marks it carries', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const reference = (editor.getJSON() as Json).content?.[1].content?.[1]
    expect(reference).toEqual({ type: 'reference', attrs: { uri: 'nostr:naddr1example', marks: ['bold'] } })
  })

  it('keeps every imeta field on a file, which ProseMirror drops when undeclared', () => {
    const rich = { ...FILE, dim: '800x600', thumb: '/media/f.thumb.jpg', alt: 'a picture', filename: 'shot.png' }
    editor = new Editor({ extensions: EXTENSIONS, content: { type: 'doc', content: [{ type: 'attachment', attrs: { blockId: 'a1', ...rich } }] } })
    expect((editor.getJSON() as Json).content?.[0].attrs).toEqual({ blockId: 'a1', ...rich })
  })
})

describe('Enter inside an anchored block — MAN-10', () => {
  const TWO = {
    type: 'doc',
    content: [
      { type: 'paragraph', attrs: { blockId: 'p0' }, content: [{ type: 'text', text: 'intro' }] },
      { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'anchored' }] },
    ],
  }
  // Where "anchored" starts: "intro" is 1 + 5 + 1, then 1 opens the paragraph.
  const START = 8
  const blocks = () => {
    const out: { id: unknown; text: string }[] = []
    editor!.state.doc.forEach((node) => out.push({ id: node.attrs.blockId, text: node.textContent }))
    return out
  }

  it('keeps the id on the text when Enter is pressed at the start and the new line is typed into', () => {
    // The usual reason to press Enter there: to write a paragraph above. By the
    // time it saves both halves hold text, so only the editor can tell them apart.
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.commands.setTextSelection(START)
    editor.commands.keyboardShortcut('Enter')
    editor.chain().setTextSelection(START).insertContent('new line above').run()

    const [intro, above, anchored] = blocks()
    expect(intro).toEqual({ id: 'p0', text: 'intro' })
    expect(anchored).toEqual({ id: 'p1', text: 'anchored' })
    expect(above.text).toBe('new line above')
    expect(above.id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('keeps the id on the first half when Enter is pressed in the middle', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.commands.setTextSelection(START + 3)
    editor.commands.keyboardShortcut('Enter')
    const [, first, second] = blocks()
    expect(first).toEqual({ id: 'p1', text: 'anc' })
    expect(second.id).not.toBe('p1')
  })

  it('keeps the id on the text when Enter is pressed at the end', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.commands.setTextSelection(START + 'anchored'.length)
    editor.commands.keyboardShortcut('Enter')
    const [, first, second] = blocks()
    expect(first).toEqual({ id: 'p1', text: 'anchored' })
    expect(second.id).not.toBe('p1')
  })

  it('does the same for a list item', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    // The start of the list item's text: the last block, inside list, item and paragraph.
    let at = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'listItem') at = pos + 2
    })
    editor.commands.setTextSelection(at)
    editor.commands.keyboardShortcut('Enter')
    const items = (editor.getJSON() as Json).content?.[4].content ?? []
    expect(items).toHaveLength(2)
    expect(items[1].attrs?.blockId).toBe('i1')
    expect(items[0].attrs?.blockId).not.toBe('i1')
  })

  it('leaves the id on the original when a copy is pasted above it', () => {
    // Both copies hold the same text; only the change says which one was there.
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.commands.insertContentAt(START - 1, {
      type: 'paragraph',
      attrs: { blockId: 'p1' },
      content: [{ type: 'text', text: 'anchored' }],
    })
    const [, pasted, original] = blocks()
    expect(original).toEqual({ id: 'p1', text: 'anchored' })
    expect(pasted.text).toBe('anchored')
    expect(pasted.id).not.toBe('p1')
  })

  it('never takes an unknown block’s id, which the save hands back untouched', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    editor.commands.insertContentAt(0, { type: 'paragraph', attrs: { blockId: 'w1' }, content: [{ type: 'text', text: 'same id' }] })
    const [first, , , unknown] = blocks()
    expect(unknown.id).toBe('w1')
    expect(first.id).not.toBe('w1')
  })

  it('takes the fresh id back with an undo of the split', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.commands.setTextSelection(START)
    editor.commands.keyboardShortcut('Enter')
    editor.commands.undo()
    expect(blocks()).toEqual([
      { id: 'p0', text: 'intro' },
      { id: 'p1', text: 'anchored' },
    ])
  })
})

describe('a block added without an id — MAN-11', () => {
  const ID = /^[0-9a-f]{12}$/
  const ONE = { type: 'doc', content: [{ type: 'paragraph', attrs: { blockId: 'p0' }, content: [{ type: 'text', text: 'intro' }] }] }
  // The end of "intro": 1 opens the paragraph, then 5 characters.
  const END = 6
  const blocks = () => {
    const out: { type: string; id: unknown; inner?: unknown[] }[] = []
    editor!.state.doc.forEach((node) => {
      const inner: unknown[] = []
      node.forEach((child) => {
        if (child.isBlock) inner.push(child.attrs.blockId)
      })
      out.push({ type: node.type.name, id: node.attrs.blockId, ...(inner.length ? { inner } : {}) })
    })
    return out
  }
  // The editor's `create` comes a tick after it mounts.
  const created = () => new Promise((resolve) => setTimeout(resolve, 0))
  // What the `/` menu does (Ship's `slashMenu.tsx`): delete the typed "/" and run the command.
  type Chain = ReturnType<Editor['chain']>
  const slash = (run: (chain: Chain) => Chain) => {
    editor!.chain().setTextSelection(END).insertContent('/').run()
    run(editor!.chain().focus().deleteRange({ from: END, to: END + 1 })).run()
  }

  it('gives the empty paragraph a new editor starts with an id, without an edit to undo or an update', async () => {
    let updates = 0
    editor = new Editor({ extensions: EXTENSIONS, onUpdate: () => void updates++ })
    await created()
    const [first] = blocks()
    expect(first.id).toMatch(ID)
    editor.commands.undo()
    expect(blocks()[0].id).toBe(first.id)
    expect(updates).toBe(0)
  })

  it('keeps the id it gave the first paragraph once it is typed into', async () => {
    editor = new Editor({ extensions: EXTENSIONS })
    await created()
    const [first] = blocks()
    expect(first.id).toMatch(ID)
    editor.chain().setTextSelection(1).insertContent('typed').run()
    expect(blocks()[0].id).toBe(first.id)
  })

  it('changes nothing in a document whose blocks all have ids', async () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const loaded = editor.getJSON()
    await created()
    expect(editor.getJSON()).toEqual(loaded)
  })

  it('gives each pasted block an id as it is pasted, and the same one on every read after', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: ONE })
    editor.commands.setTextSelection(END)
    editor.view.pasteHTML('<p>one</p><h2>two</h2><ul><li><p>three</p></li></ul>')
    const pasted = blocks()
    // "one" joins the line it is pasted into; the paragraph after the list is the one StarterKit keeps at the end.
    expect(pasted.map((b) => b.type)).toEqual(['paragraph', 'heading', 'bulletList', 'paragraph'])
    expect(pasted[0].id).toBe('p0')
    for (const b of pasted.slice(1)) expect(b.id).toMatch(ID)
    expect(pasted[2].inner?.[0]).toMatch(ID)
    // What a later save reads: the same ids, after typing elsewhere as before it.
    const saved = JSON.stringify(editor.getJSON())
    editor.chain().setTextSelection(END).insertContent(' more').run()
    expect(blocks()).toEqual(pasted)
    expect(JSON.stringify(editor.getJSON()).replace(' more', '')).toBe(saved)
  })

  it('leaves the paragraph inside a list item or a quote without one, which the save flattens', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: ONE })
    editor.commands.setTextSelection(END)
    editor.view.pasteHTML('<p>x</p><ul><li><p>item</p></li></ul><blockquote><p>quoted</p></blockquote>')
    const [, list, quote] = blocks()
    expect(list.inner?.[0]).toMatch(ID)
    const item = editor.state.doc.child(1).child(0)
    expect(item.child(0).attrs.blockId).toBeNull()
    expect(quote).toEqual({ type: 'blockquote', id: expect.stringMatching(ID), inner: [null] })
  })

  it('gives a pasted plain text its id too', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: ONE })
    editor.commands.setTextSelection(END)
    editor.view.pasteText('first\n\nsecond')
    const [intro, ...added] = blocks()
    expect(intro.id).toBe('p0')
    expect(editor.state.doc.lastChild?.textContent).toBe('second')
    expect(added.length).toBeGreaterThan(0)
    for (const b of added) expect(b.id).toMatch(ID)
  })

  it('gives a quote pasted with its paragraph wrapper an id, and the wrapper none', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: ONE })
    editor.commands.setTextSelection(END)
    editor.view.pasteHTML('<p>x</p><blockquote><p>quoted</p></blockquote>')
    expect(blocks()[1]).toEqual({ type: 'blockquote', id: expect.stringMatching(ID), inner: [null] })
  })

  it('gives the paragraph lifted out of a quote by Backspace an id', () => {
    // A quote as loaded: its paragraph wrapper has no id, which the save does not need.
    editor = new Editor({ extensions: EXTENSIONS, content: { type: 'doc', content: [{ type: 'blockquote', attrs: { blockId: 'q1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'quoted' }] }] }] } })
    editor.chain().setTextSelection(2).run()
    editor.commands.keyboardShortcut('Backspace')
    const [lifted] = blocks()
    expect(lifted.type).toBe('paragraph')
    expect(lifted.id).toBe('q1')
  })

  it('gives the paragraph of a one-item list turned off the item’s id', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: { type: 'doc', content: [] } })
    editor.commands.setContent({ type: 'doc', content: [{ type: 'bulletList', attrs: { blockId: 'l1' }, content: [{ type: 'listItem', attrs: { blockId: 'i1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] }] }] })
    editor.chain().setTextSelection(3).toggleBulletList().run()
    const [lifted] = blocks()
    expect(lifted.type).toBe('paragraph')
    expect(lifted.id).toBe('i1')
  })

  it('gives a divider and the paragraph kept after it ids', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: ONE })
    editor.commands.setTextSelection(END)
    editor.commands.setHorizontalRule()
    const [intro, ...added] = blocks()
    expect(intro.id).toBe('p0')
    expect(added.map((b) => b.type)).toContain('horizontalRule')
    for (const b of added) expect(b.id).toMatch(ID)
  })

  it('keeps the id on a paragraph the / menu turns into a heading or code', () => {
    for (const run of [(c: Chain) => c.setHeading({ level: 1 }), (c: Chain) => c.setCodeBlock()]) {
      editor = new Editor({ extensions: EXTENSIONS, content: ONE })
      slash(run)
      const [turned, ...after] = blocks()
      expect(turned.id).toBe('p0')
      for (const b of after) expect(b.id).toMatch(ID)
      editor.destroy()
    }
    editor = undefined
  })
})

describe('a commented paragraph turned into a quote or a list — MAN-12', () => {
  const ID = /^[0-9a-f]{12}$/
  const TWO = {
    type: 'doc',
    content: [
      { type: 'paragraph', attrs: { blockId: 'p0' }, content: [{ type: 'text', text: 'intro' }] },
      { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'after' }] },
    ],
  }
  type Chain = ReturnType<Editor['chain']>
  // The ids on the first block, the one inside it, and the one inside that.
  const first = () => {
    const outer = editor!.state.doc.child(0)
    const inner = outer.firstChild?.isBlock ? outer.firstChild : undefined
    const innermost = inner?.firstChild?.isBlock ? inner.firstChild : undefined
    return [outer.type.name, outer.attrs.blockId, inner?.attrs.blockId, innermost?.attrs.blockId]
  }
  // What a save and a reload hand the next editor: the same JSON, read again.
  const reload = () => {
    const saved = editor!.getJSON()
    editor!.destroy()
    editor = new Editor({ extensions: EXTENSIONS, content: saved })
  }

  it('keeps the paragraph’s id on the quote, through a save and a reload', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.chain().setTextSelection(3).setBlockquote().run()
    expect(first()).toEqual(['blockquote', 'p0', null, undefined])
    reload()
    expect(first()).toEqual(['blockquote', 'p0', null, undefined])
    expect(editor.state.doc.child(1).attrs.blockId).toBe('p1')
  })

  for (const [name, toggle, type] of [
    ['bullet list', (c: Chain) => c.toggleBulletList(), 'bulletList'],
    ['numbered list', (c: Chain) => c.toggleOrderedList(), 'orderedList'],
  ] as const) {
    it(`keeps the paragraph’s id on the item of a ${name}, and gives the list its own, through a save and a reload`, () => {
      editor = new Editor({ extensions: EXTENSIONS, content: TWO })
      toggle(editor.chain().setTextSelection(3)).run()
      const [turned, list, item, paragraph] = first()
      expect([turned, item, paragraph]).toEqual([type, 'p0', null])
      expect(list).toMatch(ID)
      reload()
      expect(first()).toEqual([type, list, 'p0', null])
    })
  }

  // Ship's `/` menu at the start of the text: type the command, then delete it and wrap in one change.
  for (const [name, typed, run, type] of [
    ['quote', '/quo', (c: Chain) => c.setBlockquote(), 'blockquote'],
    ['bullet list', '/bul', (c: Chain) => c.toggleBulletList(), 'bulletList'],
    ['numbered list', '/num', (c: Chain) => c.toggleOrderedList(), 'orderedList'],
  ] as const) {
    it(`keeps the id when the / menu at the start of the text makes a ${name}`, () => {
      editor = new Editor({ extensions: EXTENSIONS, content: TWO })
      editor.chain().setTextSelection(1).insertContent(typed).run()
      run(editor.chain().focus().deleteRange({ from: 1, to: 1 + typed.length })).run()
      const [turned, outer, item] = first()
      expect(turned).toBe(type)
      expect(type === 'blockquote' ? outer : item).toBe('p0')
    })
  }

  // Peek's and Ship's typed shortcuts: the input rule deletes what was typed and wraps.
  for (const [typed, type] of [['> ', 'blockquote'], ['- ', 'bulletList'], ['1. ', 'orderedList']] as const) {
    it(`keeps the id when "${typed}" is typed at the start of the text`, () => {
      editor = new Editor({ extensions: EXTENSIONS, content: TWO })
      const { view } = editor
      editor.commands.setTextSelection(1)
      for (const ch of typed) {
        const { from, to } = view.state.selection
        const handled = view.someProp('handleTextInput', (f) => f(view, from, to, ch, () => view.state.tr.insertText(ch, from, to)))
        if (!handled) view.dispatch(view.state.tr.insertText(ch, from, to))
      }
      const [turned, outer, item] = first()
      expect(turned).toBe(type)
      expect(type === 'blockquote' ? outer : item).toBe('p0')
      expect(editor.state.doc.textContent.startsWith('intro')).toBe(true)
    })
  }

  it('gives a block pasted over a whole paragraph its own id, not the paragraph’s', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.commands.setNodeSelection(0)
    editor.view.pasteHTML('<blockquote><p>new</p></blockquote>')
    const ids = JSON.stringify(editor.getJSON())
    expect(editor.state.doc.child(0).type.name).toBe('blockquote')
    expect(ids).not.toContain('"p0"')
  })

  it('hands the id back to the paragraph when the quote or the list is turned off', () => {
    for (const run of [(c: Chain) => c.toggleBlockquote(), (c: Chain) => c.toggleBulletList(), (c: Chain) => c.toggleOrderedList()]) {
      editor = new Editor({ extensions: EXTENSIONS, content: TWO })
      run(editor.chain().setTextSelection(3)).run()
      run(editor.chain().setTextSelection(4)).run()
      expect(first()).toEqual(['paragraph', 'p0', undefined, undefined])
      editor.destroy()
    }
    editor = undefined
  })

  it('takes the wrap back with an undo, ids and all', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    const loaded = editor.getJSON()
    editor.chain().setTextSelection(3).toggleBulletList().run()
    editor.commands.undo()
    expect(editor.getJSON()).toEqual(loaded)
  })

  it('keeps each paragraph’s id on its own item when both are turned into a list', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: TWO })
    editor.chain().setTextSelection({ from: 3, to: 10 }).toggleBulletList().run()
    const list = editor.state.doc.child(0)
    expect(list.childCount).toBe(2)
    expect([list.child(0).attrs.blockId, list.child(1).attrs.blockId]).toEqual(['p0', 'p1'])
  })
})

describe('what it draws', () => {
  function WithAnEditor({ view }: { view: ((props: ReferenceViewProps) => React.ReactNode) | null }) {
    const e = useEditor({
      extensions: [StarterKit, BlockId, UnknownBlock, ReferenceNode.configure({ view }), AttachmentNode],
      content: DOCUMENT,
    })
    return <EditorContent editor={e} />
  }

  it('draws a reference with the view it is given', async () => {
    render(<WithAnEditor view={({ uri }) => <span data-testid="chip">{uri}</span>} />)
    expect((await screen.findByTestId('chip')).textContent).toBe('nostr:naddr1example')
  })

  it('draws a reference as its uri without a view', async () => {
    const { container } = render(<WithAnEditor view={null} />)
    await screen.findByText('Title')
    expect(container.querySelector('[data-reference]')?.textContent).toBe('nostr:naddr1example')
  })

  it('draws an unknown block as its text, addressed by its id', async () => {
    const { container } = render(<WithAnEditor view={null} />)
    expect((await screen.findByText('kept')).closest('[data-block-id]')?.getAttribute('data-block-id')).toBe('w1')
    expect(container.querySelector('[data-block-type="widget"]')).not.toBeNull()
  })

  it('puts data-block-id on each block, as RichText does', async () => {
    const { container } = render(<WithAnEditor view={null} />)
    await screen.findByText('Title')
    expect(container.querySelector('h1')?.getAttribute('data-block-id')).toBe('h1')
  })
})

describe('Tab on a list item — MAN-13', () => {
  /** A key as a person presses it: through the editor's own key handling, not a command. */
  const press = (key: string, shiftKey = false) =>
    editor!.view.someProp('handleKeyDown', (f) => f(editor!.view, new KeyboardEvent('keydown', { key, shiftKey })))
  const LIST = {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        attrs: { blockId: 'l1' },
        content: [
          { type: 'listItem', attrs: { blockId: 'i1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'intro' }] }] },
          { type: 'listItem', attrs: { blockId: 'i2' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'after' }] }] },
        ],
      },
    ],
  }
  /** The end of "after": 1 opens the list, 2 the first item, 3 its paragraph, then "intro", two closes, two opens. */
  const END_OF_AFTER = 1 + 1 + 1 + 5 + 2 + 2 + 5

  it('puts the item in a list inside the one above, keeping its id, and gives that list none', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: LIST })
    editor.commands.setTextSelection(END_OF_AFTER)
    expect(press('Tab')).toBe(true)
    const list = (editor.getJSON() as Json).content![0]
    expect(list.content!.map((n) => n.attrs?.blockId)).toEqual(['i1'])
    const inner = list.content![0].content![1]
    expect(inner.type).toBe('bulletList')
    expect(inner.attrs?.blockId ?? null).toBeNull()
    expect(inner.content![0].attrs?.blockId).toBe('i2')
    expect(JSON.stringify(inner)).toContain('after')
  })

  it('names an item made by Enter inside the inner list, so a save does not re-mint it each time', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: LIST })
    editor.commands.setTextSelection(END_OF_AFTER)
    press('Tab')
    press('Enter')
    editor.commands.insertContent('third')
    const inner = (editor.getJSON() as Json).content![0].content![0].content![1]
    const ids = inner.content!.map((n) => n.attrs?.blockId)
    expect(ids[0]).toBe('i2')
    expect(typeof ids[1]).toBe('string')
    expect(ids[1]).not.toBe('i2')
    expect(inner.attrs?.blockId ?? null).toBeNull()
  })

  it('names an item in an inner list that arrives without an id, as it does one in the outer list', async () => {
    const nested = structuredClone(LIST)
    const [first, second] = nested.content[0].content
    ;(first.content as unknown[]).push({ type: 'bulletList', content: [{ ...second, attrs: {} }] })
    nested.content[0].content = [first]
    editor = new Editor({ extensions: EXTENSIONS, content: nested })
    // The editor's `create` comes a tick after it mounts.
    await new Promise((resolve) => setTimeout(resolve, 0))
    const inner = (editor.getJSON() as Json).content![0].content![0].content![1]
    expect(typeof inner.content![0].attrs?.blockId).toBe('string')
    expect(inner.attrs?.blockId ?? null).toBeNull()
  })

  it('brings it back out with Shift+Tab, id and text kept', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: LIST })
    editor.commands.setTextSelection(END_OF_AFTER)
    press('Tab')
    press('Tab', true)
    const list = (editor.getJSON() as Json).content![0]
    expect(list.content!.map((n) => n.attrs?.blockId)).toEqual(['i1', 'i2'])
    expect(list.content![0].content).toHaveLength(1)
  })

  it('clears an id an inner list arrives with, since the save writes no block for it', () => {
    const nested = structuredClone(LIST)
    const [first, second] = nested.content[0].content
    ;(first.content as unknown[]).push({ type: 'bulletList', attrs: { blockId: 'stray' }, content: [second] })
    nested.content[0].content = [first]
    editor = new Editor({ extensions: EXTENSIONS, content: nested })
    // Any change that brings in a block runs the check; Enter at the end of "after" is one.
    editor.commands.setTextSelection(END_OF_AFTER)
    press('Enter')
    expect(JSON.stringify(editor.getJSON())).not.toContain('stray')
  })

  it('never lets an inner list keep a real block\'s id: the block keeps it', () => {
    const nested = structuredClone(LIST)
    const [first, second] = nested.content[0].content
    ;(first.content as unknown[]).push({ type: 'bulletList', attrs: { blockId: 'i1' }, content: [second] })
    nested.content[0].content = [first]
    editor = new Editor({ extensions: EXTENSIONS, content: nested })
    editor.commands.setTextSelection(END_OF_AFTER)
    press('Enter')
    const item = (editor.getJSON() as Json).content![0].content![0]
    expect(item.attrs?.blockId).toBe('i1')
    expect(item.content![1].attrs?.blockId ?? null).toBeNull()
  })
})

describe('a checklist item and a callout — RIC-19', () => {
  const WITH = [StarterKit, BlockId, Checklist, Callout]
  const press = (key: string) => editor!.view.someProp('handleKeyDown', (f) => f(editor!.view, new KeyboardEvent('keydown', { key })))
  const item = (id: string, text: string, checked?: boolean) => ({
    type: 'listItem',
    attrs: { blockId: id, ...(checked === undefined ? {} : { checked }) },
    content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
  })
  const CHECKLIST = {
    type: 'doc',
    content: [
      { type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'ship', true), item('i2', 'plain')] },
      { type: 'blockquote', attrs: { blockId: 'q1', tone: 'warning' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'careful' }] }] },
    ],
  }
  const items = () => ((editor!.getJSON() as Json).content![0].content ?? []).map((n) => [JSON.stringify(n.content).match(/"text":"([^"]*)"/)?.[1] ?? '', n.attrs?.checked ?? null])
  /** The end of "ship": 1 opens the list, 1 the item, 1 its paragraph. */
  const END_OF_SHIP = 3 + 4

  it('keeps a tick and a tone through a load and a read, and a plain item plain', () => {
    editor = new Editor({ extensions: WITH, content: CHECKLIST })
    expect(items()).toEqual([['ship', true], ['plain', null]])
    expect((editor.getJSON() as Json).content![1].attrs?.tone).toBe('warning')
    expect(editor.getHTML()).toContain('data-callout="warning"')
  })

  it('starts the next item unticked on Enter, never with the tick it was split from', () => {
    editor = new Editor({ extensions: WITH, content: CHECKLIST })
    editor.commands.setTextSelection(END_OF_SHIP)
    expect(press('Enter')).toBe(true)
    expect(items()).toEqual([['ship', true], ['', false], ['plain', null]])
  })

  it('moves the text down with its tick on Enter at the start of an item', () => {
    editor = new Editor({ extensions: WITH, content: CHECKLIST })
    editor.commands.setTextSelection(3)
    expect(press('Enter')).toBe(true)
    expect(items()).toEqual([['', false], ['ship', true], ['plain', null]])
  })

  it('takes the box away first on Backspace at the start of an item', () => {
    editor = new Editor({ extensions: WITH, content: CHECKLIST })
    editor.commands.setTextSelection(3)
    expect(press('Backspace')).toBe(true)
    expect(items()).toEqual([['ship', null], ['plain', null]])
  })

  /** A space typed after `text`, as a key reaches the input rules. */
  const typeSpaceAfter = (doc: object, at: number) => {
    editor = new Editor({ extensions: WITH, content: doc })
    editor.commands.setTextSelection(at)
    const tr = () => editor!.state.tr.insertText(' ', at, at)
    return editor.view.someProp('handleTextInput', (f) => f(editor!.view, at, at, ' ', tr))
  }

  it('makes a checklist item from [ ] at the start of a line', () => {
    expect(typeSpaceAfter({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[ ]' }] }] }, 4)).toBe(true)
    const list = (editor!.getJSON() as Json).content![0]
    expect(list.type).toBe('bulletList')
    expect(list.content![0].attrs?.checked).toBe(false)
    expect(editor!.getText().trim()).toBe('')
  })

  it('turns a list item into a ticked one from [x]', () => {
    const doc = { type: 'doc', content: [{ type: 'bulletList', content: [item('i1', '[x]')] }] }
    expect(typeSpaceAfter(doc, 6)).toBe(true)
    expect(items()).toEqual([['', true]])
  })

  it('makes a checklist and a callout from `/`', () => {
    editor = new Editor({ extensions: WITH, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'todo' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'heads up' }] }] } })
    editor.commands.setTextSelection(2)
    expect(applyFormat(editor, 'checklist')).toBe(true)
    editor.commands.setTextSelection(editor.state.doc.content.size - 2)
    expect(applyFormat(editor, 'note')).toBe(true)
    const [list, quote] = (editor.getJSON() as Json).content!
    expect(list.content![0].attrs?.checked).toBe(false)
    expect(quote.attrs?.tone).toBe('note')
  })

  it('ticks with one click on the box, and says the change was a tick', async () => {
    let ticked = false
    function Checklisted() {
      const e = useEditor({ extensions: WITH, content: CHECKLIST, onUpdate: ({ transaction }) => { ticked ||= isChecklistTick(transaction) } })
      editor = e ?? undefined
      return <EditorContent editor={e} />
    }
    render(<Checklisted />)
    // Named by its item's words (Katerina, review of #170).
    const boxes = await screen.findAllByRole('checkbox', { name: 'ship' })
    expect(boxes).toHaveLength(1)
    expect(boxes[0].getAttribute('aria-checked')).toBe('true')
    boxes[0].click()
    expect(items()[0]).toEqual(['ship', false])
    expect(ticked).toBe(true)
  })

  it('follows the editor going read-only and back, not only how it was when drawn', async () => {
    function Checklisted() {
      const e = useEditor({ extensions: WITH, content: CHECKLIST })
      editor = e ?? undefined
      return <EditorContent editor={e} />
    }
    const { container } = render(<Checklisted />)
    await screen.findByRole('checkbox', { name: 'ship' })
    const box = () => container.querySelector('[data-checklist-box]')!
    act(() => editor!.setEditable(false))
    // A picture now: the box around it says done, and nothing ticks.
    expect([box().getAttribute('role'), box().getAttribute('aria-checked'), box().getAttribute('aria-readonly')]).toEqual(['checkbox', 'true', 'true'])
    await waitFor(() => expect(box().querySelector('[role=checkbox]')).toBeNull())
    act(() => editor!.setEditable(true))
    expect(box().getAttribute('role')).toBeNull()
    expect(await screen.findByRole('checkbox', { name: 'ship' })).toBeTruthy()
  })
})
