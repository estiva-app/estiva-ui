// @vitest-environment jsdom
/**
 * A reference's card in a block document (SPEC §13.3): the choice is `embed` on
 * the `reference` node, kept through `getJSON`, and the slot it asks for sits
 * after its line and keeps its element while the line lives.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode } from './BlockNodes'
import { referenceAtSelection, referenceCardPlacements, setReferenceCard } from './ReferenceCards'

const EXTENSIONS = [StarterKit, BlockId, ReferenceNode]
const V = 'nostr:naddr1example'
const W = 'nostr:naddr1other'

type Json = { type: string; attrs?: Record<string, unknown>; content?: Json[] }
const json = (ed: Editor) => ed.getJSON() as Json

const ref = (uri: string, attrs: Record<string, unknown> = {}) => ({ type: 'reference', attrs: { uri, ...attrs } })
const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'Blocked by ' }, ref(V, { embed: 'detailed' }), { type: 'text', text: ' for now' }] },
    { type: 'paragraph', attrs: { blockId: 'p2' }, content: [ref(W)] },
    { type: 'bulletList', attrs: { blockId: 'l1' }, content: [{ type: 'listItem', attrs: { blockId: 'i1' }, content: [{ type: 'paragraph', content: [ref(W, { embed: 'huge' })] }] }] },
  ],
}

let editor: Editor | undefined
afterEach(() => {
  cleanup()
  editor?.destroy()
  editor = undefined
})

const select = (ed: Editor, uri: string) => {
  let at = -1
  ed.state.doc.descendants((node, pos) => {
    if (at < 0 && node.type.name === 'reference' && node.attrs.uri === uri) at = pos
  })
  ed.view.dispatch(ed.state.tr.setSelection(NodeSelection.create(ed.state.doc, at)))
}

describe('ReferenceNode keeps the card', () => {
  it('holds embed and extra through getJSON', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: { type: 'doc', content: [{ type: 'paragraph', content: [ref(V, { embed: 'compact', extra: { later: 1 } })] }] } })
    const node = json(editor).content?.[0].content?.[0]
    expect(node?.attrs?.embed).toBe('compact')
    expect(node?.attrs?.extra).toEqual({ later: 1 })
  })
})

describe('referenceCardPlacements', () => {
  it('finds each line whose chips chose a card, keyed by block id', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const placements = referenceCardPlacements(editor.state.doc)
    expect(placements.map((p) => [p.key, p.cards])).toEqual([
      ['b:p1', [{ uri: V, layout: 'detailed' }]],
      // A list item's paragraph carries no id of its own: the item's is used. An unknown layout is compact.
      ['b:i1', [{ uri: W, layout: 'compact' }]],
    ])
  })
})

describe('choosing a card', () => {
  it('reads and sets the selected chip\'s card, and none removes it', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    select(editor, W)
    expect(referenceAtSelection(editor.state)).toMatchObject({ uri: W, layout: 'none' })

    expect(setReferenceCard(editor, 'detailed')).toBe(true)
    expect(referenceAtSelection(editor.state)).toMatchObject({ uri: W, layout: 'detailed' })
    expect(referenceCardPlacements(editor.state.doc).map((p) => p.key)).toEqual(['b:p1', 'b:p2', 'b:i1'])

    setReferenceCard(editor, 'none')
    expect(json(editor).content?.[1].content?.[0].attrs?.embed).toBeNull()
    expect(referenceCardPlacements(editor.state.doc).map((p) => p.key)).toEqual(['b:p1', 'b:i1'])
  })

  it('finds the one chip in a selected range of spaces and that chip, and keeps the range', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    // The second paragraph is the chip alone: select across all of it, as Shift+arrow does.
    let start = -1
    editor.state.doc.forEach((node, offset, index) => {
      if (index === 1) start = offset + 1
    })
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, start, start + 1)))
    expect(referenceAtSelection(editor.state)).toMatchObject({ uri: W, layout: 'none' })
    setReferenceCard(editor, 'compact')
    expect(editor.state.selection.from).toBe(start)
    expect(editor.state.selection.to).toBe(start + 1)
    expect(referenceAtSelection(editor.state)).toMatchObject({ uri: W, layout: 'compact' })
  })

  it('offers nothing for a range with words in it, or with two chips', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    // "Blocked by " and the chip after it.
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1, 13)))
    expect(referenceAtSelection(editor.state)).toBeNull()
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1, editor.state.doc.content.size - 1)))
    expect(referenceAtSelection(editor.state)).toBeNull()
  })

  it('offers nothing when no chip is selected', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    expect(referenceAtSelection(editor.state)).toBeNull()
    expect(setReferenceCard(editor, 'compact')).toBe(false)
  })
})
