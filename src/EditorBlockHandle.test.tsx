// @vitest-environment jsdom
/**
 * The block menu's Turn into (LEAF-11): what each row makes of a list, a quote
 * and a block of text, and that the block keeps its id — what a comment
 * anchored to it is attached by.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor, type Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, Callout, Checklist } from './BlockNodes'
import { EditorBlockHandle, turnIntoRows, turnListInto, turnQuoteInto } from './EditorBlockHandle'

type Json = { type: string; attrs?: Record<string, unknown>; content?: Json[]; text?: string }

const item = (id: string, text: string, attrs: Record<string, unknown> = {}, nested?: Json): Json => ({
  type: 'listItem',
  attrs: { blockId: id, ...attrs },
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }, ...(nested ? [nested] : [])],
})
const para = (id: string, text: string): Json => ({ type: 'paragraph', attrs: { blockId: id }, content: [{ type: 'text', text }] })
const quote = (id: string, text: string, tone: string | null = null): Json => ({ type: 'blockquote', attrs: { blockId: id, tone }, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

const editors: Editor[] = []
function editor(content: Json[], extensions: Extensions = [StarterKit, BlockId, Checklist, Callout]) {
  const e = new Editor({ extensions, content: { type: 'doc', content } })
  editors.push(e)
  return e
}
/** The document's blocks, less the empty paragraph StarterKit keeps after a last list or quote. */
const blocks = (e: Editor) => (e.getJSON().content as Json[]).filter((b, i, all) => !(i === all.length - 1 && b.type === 'paragraph' && !b.content))
const posOf = (e: Editor, id: string) => {
  let at = -1
  e.state.doc.forEach((node, pos) => {
    if (node.attrs.blockId === id) at = pos
  })
  return at
}
/** Each item of the list as `id text checked`, the nested ones after their parent. */
const items = (list: Json): string[] =>
  (list.content ?? []).flatMap((i) => [
    `${i.attrs?.blockId} ${i.content?.[0].content?.[0].text} ${i.attrs?.checked ?? '-'}`,
    ...(i.content ?? []).slice(1).flatMap(items),
  ])
const texts = (e: Editor) => blocks(e).map((b) => `${b.type} ${b.attrs?.blockId} ${b.content?.[0]?.content?.[0]?.text ?? b.content?.[0]?.text}`)

beforeAll(() => {
  const none = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => none as DOMRect
})

afterEach(() => {
  cleanup()
  for (const e of editors.splice(0)) e.destroy()
})

describe('turnListInto', () => {
  const LIST: Json = { type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'milk', { checked: true }), item('i2', 'eggs', {}, { type: 'bulletList', content: [item('i3', 'brown')] })] }

  it('a list into a checklist makes every item one, nested ones too, keeping ticks and every id', () => {
    const e = editor([LIST])
    expect(turnListInto(e, 0, 'checklist')).toBe(true)
    const [list] = blocks(e)
    expect(list.type).toBe('bulletList')
    expect(list.attrs?.blockId).toBe('l1')
    expect(items(list)).toEqual(['i1 milk true', 'i2 eggs false', 'i3 brown false'])
  })

  it('a checklist into a numbered list keeps the list’s id and drops every tick', () => {
    const e = editor([LIST])
    turnListInto(e, 0, 'checklist')
    turnListInto(e, 0, 'orderedList')
    const [list] = blocks(e)
    expect(list.type).toBe('orderedList')
    expect(list.attrs?.blockId).toBe('l1')
    expect(list.content?.[1].content?.[1].type).toBe('orderedList')
    expect(items(list)).toEqual(['i1 milk -', 'i2 eggs -', 'i3 brown -'])
  })

  it('does not join a list into a numbered list beside it, as Tiptap’s toggle would', () => {
    const e = editor([LIST, { type: 'orderedList', attrs: { blockId: 'l2' }, content: [item('i9', 'after')] }])
    turnListInto(e, 0, 'orderedList')
    expect(blocks(e).map((b) => `${b.type} ${b.attrs?.blockId}`)).toEqual(['orderedList l1', 'orderedList l2'])
  })

  it('a list into text makes each item a paragraph with the item’s id, in order', () => {
    const e = editor([para('p0', 'before'), LIST])
    turnListInto(e, posOf(e, 'l1'), 'text')
    expect(texts(e)).toEqual(['paragraph p0 before', 'paragraph i1 milk', 'paragraph i2 eggs', 'paragraph i3 brown'])
  })

  it('a numbered list into a checklist stays numbered', () => {
    const e = editor([{ type: 'orderedList', attrs: { blockId: 'l1' }, content: [item('i1', 'a')] }])
    turnListInto(e, 0, 'checklist')
    expect(blocks(e)[0].type).toBe('orderedList')
    expect(items(blocks(e)[0])).toEqual(['i1 a false'])
  })

  it('the kind a list or a quote already is makes no edit', () => {
    // A paragraph last, or StarterKit adds one on the first change and that is an edit.
    const e = editor([{ type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'a')] }, quote('q1', 'b', 'note'), para('p9', 'end')])
    let updates = 0
    e.on('update', () => updates++)
    turnListInto(e, 0, 'bulletList')
    turnQuoteInto(e, posOf(e, 'q1'), 'note')
    expect(updates).toBe(0)
    expect(e.can().undo()).toBe(false)
  })

  it('does nothing where there is no list', () => {
    const e = editor([para('p0', 'before')])
    expect(turnListInto(e, 0, 'checklist')).toBe(false)
    expect(texts(e)).toEqual(['paragraph p0 before'])
  })
})

describe('turnQuoteInto', () => {
  it('a quote into a Warning and back keeps its id and text', () => {
    const e = editor([quote('q1', 'careful')])
    turnQuoteInto(e, 0, 'warning')
    expect(blocks(e)[0].attrs).toMatchObject({ blockId: 'q1', tone: 'warning' })
    turnQuoteInto(e, 0, 'quote')
    expect(blocks(e)[0].attrs).toMatchObject({ blockId: 'q1', tone: null })
    expect(texts(e)).toEqual(['blockquote q1 careful'])
  })

  it('a callout into text is a paragraph with the quote’s id', () => {
    const e = editor([quote('q1', 'careful', 'note')])
    turnQuoteInto(e, 0, 'text')
    expect(texts(e)).toEqual(['paragraph q1 careful'])
  })
})

describe('turnIntoRows', () => {
  const labels = (e: Editor, id: string) => turnIntoRows(e.state.doc.nodeAt(posOf(e, id))!, e).map((r) => r.label)
  const selected = (e: Editor, id: string) => {
    const node = e.state.doc.nodeAt(posOf(e, id))!
    return turnIntoRows(node, e).filter((r) => r.active?.(node)).map((r) => r.label)
  }

  it('offers a list its kinds and Text, a quote its callouts and Text, a paragraph everything', () => {
    const e = editor([para('p1', 'one'), { type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'a')] }, quote('q1', 'b', 'warning')])
    expect(labels(e, 'l1')).toEqual(['Bulleted list', 'Numbered list', 'Checklist', 'Text'])
    expect(labels(e, 'q1')).toEqual(['Quote', 'Note', 'Warning', 'Text'])
    expect(labels(e, 'p1')).toEqual(['Text', 'Heading', 'Subheading', 'Quote', 'Code', 'Bulleted list', 'Numbered list', 'Checklist', 'Note', 'Warning'])
    expect(selected(e, 'l1')).toEqual(['Bulleted list'])
    expect(selected(e, 'q1')).toEqual(['Warning'])
  })

  it('selects Checklist, not Bulleted list, on a list of checklist items', () => {
    const e = editor([{ type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'a', { checked: false })] }])
    expect(selected(e, 'l1')).toEqual(['Checklist'])
  })

  it('selects no row on a list only partly of checklist items, since every row changes it', () => {
    const e = editor([{ type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'a', { checked: true }), item('i2', 'b')] }])
    expect(selected(e, 'l1')).toEqual([])
  })

  it('offers no checklist or callout where the editor cannot hold one', () => {
    const e = editor([{ type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'a')] }, quote('q1', 'b')], [StarterKit, BlockId])
    expect(labels(e, 'l1')).toEqual(['Bulleted list', 'Numbered list', 'Text'])
    expect(labels(e, 'q1')).toEqual(['Quote', 'Text'])
  })

  it('offers a block that is not text, a list or a quote nothing — a rule', () => {
    const e = editor([para('p1', 'one')])
    expect(turnIntoRows(e.schema.nodes.horizontalRule.create(), e)).toEqual([])
  })
})

describe('EditorBlockHandle Turn into', () => {
  async function press(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
    await user.pointer({ keys: '[MouseLeft>]', target })
    await user.pointer({ keys: '[/MouseLeft]', target })
    await screen.findByRole('menu')
  }

  it('turns a list into a checklist from the block menu, with no rows passed', async () => {
    // jsdom lays nothing out: every block's top is 0, so the pointer is on the last — the list.
    const e = editor([para('p1', 'one'), { type: 'bulletList', attrs: { blockId: 'l1' }, content: [item('i1', 'milk'), item('i2', 'eggs')] }])
    const { EditorContent } = await import('@tiptap/react')
    render(
      <EditorBlockHandle editor={e}>
        <EditorContent editor={e} />
      </EditorBlockHandle>,
    )
    const user = userEvent.setup()
    await act(async () => user.hover(screen.getByText('eggs')))
    await press(user, screen.getByRole('button', { name: 'Block menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Turn into' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Checklist' }))
    await act(() => new Promise<void>((done) => requestAnimationFrame(() => done())))
    const list = blocks(e)[1]
    expect(list.attrs?.blockId).toBe('l1')
    expect(items(list)).toEqual(['i1 milk false', 'i2 eggs false'])
  })
})
