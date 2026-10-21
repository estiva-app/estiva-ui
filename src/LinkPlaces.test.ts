// @vitest-environment jsdom
/**
 * Where a link in a document sits decides how it draws (SPEC §13.3, C22): its
 * chip in a sentence, its row alone on its line, its card in the row's place.
 * The editor reads the rule off its own tree; the protocol reads it off the
 * saved document. Both must give the same answer, or a page reads one way
 * while it is written and another once it is saved.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor, type JSONContent } from '@tiptap/core'
import { TableKit } from '@tiptap/extension-table'
import { documentForEditing, documentLineDraws, encodeNaddr, encodeNpub, publishableFromEditor, toEditorDocument, toRenderTree, type EditorDocument } from '@estiva-app/protocol'
import { BlockId, Callout, Checklist, ReferenceNode, UnknownBlock } from './BlockNodes'
import { LinkPlaces, linkPlaceAt, linkPlaces, staysChip, type LinkPlace } from './LinkPlaces'
import { DocumentKit } from './links'

const naddr = (kind: number, identifier: string) => `nostr:${encodeNaddr({ kind, pubkey: 'a'.repeat(64), identifier, relays: [] })}`
const V = naddr(30851, 'item-one')
const FOLDER = naddr(39000, 'place-one')
const PERSON = `nostr:${encodeNpub('b'.repeat(64))}`

const ref = (uri: string, attrs: Record<string, unknown> = {}): JSONContent => ({ type: 'reference', attrs: { uri, ...attrs } })
const text = (t: string): JSONContent => ({ type: 'text', text: t })
const p = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content })
const doc = (...content: JSONContent[]): JSONContent => ({ type: 'doc', content })

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
})

const make = (content: JSONContent | string) => {
  editor = new Editor({
    extensions: [DocumentKit.configure({ link: false }), TableKit, BlockId, Checklist, Callout, ReferenceNode, UnknownBlock, LinkPlaces],
    content,
  })
  return editor
}

/** The place of the one reference in `content`. */
function placeIn(content: JSONContent): LinkPlace {
  const ed = make(content)
  let at = -1
  ed.state.doc.descendants((node, pos) => {
    if (node.type.name === 'reference' && at < 0) at = pos
  })
  return linkPlaceAt(ed.state.doc, at)
}

/** Each case: a document holding one reference, and how it draws. */
const CASES: [string, JSONContent, LinkPlace][] = [
  ['alone in a paragraph', doc(p(ref(V))), 'row'],
  ['alone with a space after it, as a `[` pick leaves it', doc(p(ref(V), text(' '))), 'row'],
  ['in a sentence', doc(p(text('See '), ref(V), text(' today.'))), 'chip'],
  ['followed by a full stop', doc(p(ref(V), text('.'))), 'chip'],
  ['alone on the second line of a paragraph, after a hard break', doc(p(text('First line'), { type: 'hardBreak' }, ref(V))), 'row'],
  ['in a heading', doc({ type: 'heading', attrs: { level: 2 }, content: [ref(V)] }), 'chip'],
  ['in a quote', doc({ type: 'blockquote', content: [p(ref(V))] }), 'chip'],
  ['in a callout', doc({ type: 'blockquote', attrs: { tone: 'note' }, content: [p(ref(V))] }), 'chip'],
  ['alone in a list item', doc({ type: 'bulletList', content: [{ type: 'listItem', content: [p(ref(V))] }] }), 'row'],
  ['alone in a checklist item', doc({ type: 'bulletList', content: [{ type: 'listItem', attrs: { checked: false }, content: [p(ref(V))] }] }), 'row'],
  ['alone in a numbered list item', doc({ type: 'orderedList', content: [{ type: 'listItem', content: [p(ref(V))] }] }), 'row'],
  ['in a table cell', doc({ type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [p(ref(V))] }] }] }), 'chip'],
  ['alone with its card chosen', doc(p(ref(V, { embed: 'detailed' }))), 'card'],
  ['alone with an older writer\'s compact card', doc(p(ref(V, { embed: 'compact' }))), 'row'],
  ['alone with a card value this version does not know', doc(p(ref(V, { embed: 'wide' }))), 'row'],
  ['in a sentence with its card chosen', doc(p(text('See '), ref(V, { embed: 'detailed' }))), 'chip'],
  ['alone but bold', doc(p(ref(V, { marks: ['bold'] }))), 'chip'],
  ['a person alone', doc(p(ref(PERSON))), 'chip'],
  ['a Folder alone', doc(p(ref(FOLDER))), 'chip'],
  ['a Folder alone with a card chosen', doc(p(ref(FOLDER, { embed: 'detailed' }))), 'chip'],
]

describe('linkPlaceAt', () => {
  it.each(CASES)('draws a link %s as its %s', (_name, content, place) => {
    expect(placeIn(content)).toBe(place)
  })

  it('draws two links on one line as chips', () => {
    const ed = make(doc(p(ref(V), text(' '), ref(naddr(30851, 'item-two')))))
    expect(linkPlaces(ed.state.doc)).toEqual([])
  })

  it('draws a pasted URL not resolved yet as its URL, a chip, even alone', () => {
    expect(placeIn(doc(p(ref('', { href: 'https://app.example/item/one' }))))).toBe('chip')
  })

  it('turns a row into a chip as soon as words are typed beside it, and back when they are deleted', () => {
    const ed = make(doc(p(ref(V))))
    expect(linkPlaceAt(ed.state.doc, 1)).toBe('row')
    ed.commands.insertContentAt(2, 'and more')
    expect(linkPlaceAt(ed.state.doc, 1)).toBe('chip')
    ed.commands.deleteRange({ from: 2, to: 2 + 'and more'.length })
    expect(linkPlaceAt(ed.state.doc, 1)).toBe('row')
  })

  it('tells the view of each lone link its place, through a node decoration', () => {
    const ed = make(doc(p(ref(V)), p(ref(V, { embed: 'detailed' })), p(text('See '), ref(V))))
    const places = [...ed.view.dom.querySelectorAll('[data-reference]')].map((el) => el.closest('[data-link-place]')?.getAttribute('data-link-place') ?? 'chip')
    expect(places).toEqual(['row', 'card', 'chip'])
  })
})

describe('staysChip', () => {
  it('keeps a person and a Folder as chips, and nothing else', () => {
    expect(staysChip(PERSON)).toBe(true)
    expect(staysChip(FOLDER)).toBe(true)
    expect(staysChip(FOLDER.toUpperCase())).toBe(true)
    expect(staysChip(V)).toBe(false)
    expect(staysChip(naddr(30850, 'group-one'))).toBe(false)
    expect(staysChip('nostr:naddr1notbech32')).toBe(false)
  })
})

describe('the editor and the protocol agree', () => {
  /** How the protocol draws the saved document's one link: `row` or `card` where it says so, else its chip. */
  function protocolPlace(value: string): LinkPlace {
    for (const draws of documentLineDraws(toRenderTree(value, 'blocks')).values()) {
      for (const line of draws) if (line.draw === 'row' || line.draw === 'card') return line.draw
    }
    return 'chip'
  }

  it.each(CASES)('on a link %s, once saved and opened again', (_name, content, place) => {
    const { value } = publishableFromEditor(make(content).getJSON() as EditorDocument)
    editor?.destroy()
    // Opened again as an app opens it: the saved bytes, read back into the editor.
    const reopened = make(toEditorDocument(documentForEditing(value, 'blocks'), { links: true }) as JSONContent)
    const editorPlaces = linkPlaces(reopened.state.doc).map((one) => one.place)
    expect(protocolPlace(value)).toBe(place)
    expect(editorPlaces[0] ?? 'chip').toBe(place)
  })
})
