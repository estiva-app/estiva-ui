// @vitest-environment jsdom
/**
 * An app URL in a document reads as its chip (SPEC §13.3, §7.7): a URL that
 * names something becomes a URL chip keeping its URL, one that names nothing or
 * is not answered yet stays text, and the URL being typed is left alone.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode } from './BlockNodes'
import { LinkChips, refreshLinkChips } from './LinkChips'
import { ReferenceCards, referenceAtSelection, referenceCardPlacements } from './ReferenceCards'

const URL_ = 'https://app.example/i/one'
const V = 'nostr:naddr1example'

type Json = { type: string; text?: string; attrs?: Record<string, unknown>; content?: Json[] }
const inline = (ed: Editor) => (ed.getJSON() as Json).content?.[0].content ?? []
const para = (...content: unknown[]): Record<string, unknown> => ({ type: 'doc', content: [{ type: 'paragraph', attrs: { blockId: 'p1' }, content }] })

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
})

const make = (content: Record<string, unknown>, known: Map<string, string>, asked: string[][] = []) => {
  editor = new Editor({
    extensions: [
      // A document editor has no link mark: its URLs are text until they are chips.
      StarterKit.configure({ link: false }),
      BlockId,
      ReferenceNode,
      ReferenceCards,
      LinkChips.configure({
        referenceOf: (url) => known.get(url),
        ask: (urls) => {
          asked.push(urls)
          return Promise.resolve()
        },
      }),
    ],
    content,
  })
  return editor
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('LinkChips', () => {
  it('makes a URL that names something its chip on open, keeping the URL and the marks', async () => {
    const ed = make(para({ type: 'text', text: `See ${URL_}.` }), new Map([[URL_, V]]))
    await tick()
    const [before, chip, after] = inline(ed)
    expect(before.text).toBe('See ')
    expect(chip.type).toBe('reference')
    expect(chip.attrs).toMatchObject({ uri: V, href: URL_ })
    expect(after.text).toBe('.')
  })

  it('leaves a URL that names nothing as text, and asks the app about it', async () => {
    const asked: string[][] = []
    const ed = make(para({ type: 'text', text: `See ${URL_} and https://else.example/x` }), new Map(), asked)
    await tick()
    expect(inline(ed)).toHaveLength(1)
    expect(asked[0]).toEqual([URL_, 'https://else.example/x'])
  })

  it('asks about each URL once, and no more than its limit', async () => {
    const asked: string[][] = []
    editor = new Editor({
      extensions: [
        StarterKit.configure({ link: false }),
        BlockId,
        ReferenceNode,
        LinkChips.configure({ referenceOf: () => undefined, ask: (urls) => void asked.push(urls), limit: 2 }),
      ],
      content: para({ type: 'text', text: 'https://a.example/1 https://a.example/2 https://a.example/3' }),
    })
    await tick()
    editor.commands.insertContentAt(1, 'x ')
    expect(asked).toEqual([['https://a.example/1', 'https://a.example/2']])
  })

  it('turns the URL into its chip once the answer comes back', async () => {
    const known = new Map<string, string>()
    const ed = make(para({ type: 'text', text: `See ${URL_} now` }), known)
    await tick()
    expect(inline(ed)).toHaveLength(1)
    known.set(URL_, V)
    refreshLinkChips(ed)
    expect(inline(ed)[1].attrs).toMatchObject({ uri: V, href: URL_ })
  })

  it('leaves the URL the caret is at the end of, and takes it once the person moves on', async () => {
    const ed = make(para({ type: 'text', text: 'See ' }), new Map([[URL_, V]]))
    await tick()
    ed.view.dispatch(ed.state.tr.setSelection(TextSelection.create(ed.state.doc, ed.state.doc.content.size - 1)))
    ed.view.dispatch(ed.state.tr.insertText(URL_))
    expect(inline(ed)).toHaveLength(1)
    ed.view.dispatch(ed.state.tr.insertText(' '))
    expect(inline(ed)[1].attrs).toMatchObject({ uri: V, href: URL_ })
  })

  it('fills in a URL chip read from a document once it is answered; until then it offers no card', async () => {
    const known = new Map<string, string>()
    const ed = make(para({ type: 'reference', attrs: { uri: '', href: URL_, embed: 'compact' } }), known)
    await tick()
    expect(referenceCardPlacements(ed.state.doc)).toEqual([])
    ed.view.dispatch(ed.state.tr.setSelection(TextSelection.create(ed.state.doc, 1, 2)))
    expect(referenceAtSelection(ed.state)).toBeNull()
    known.set(URL_, V)
    refreshLinkChips(ed)
    expect(inline(ed)[0].attrs).toMatchObject({ uri: V, href: URL_, embed: 'compact' })
    expect(referenceCardPlacements(ed.state.doc)[0].cards).toEqual([{ uri: V, layout: 'compact' }])
  })

  it('dispatches nothing on open when there is no chip to make, so no other plugin wakes', async () => {
    const ed = make(para({ type: 'text', text: 'Words, no address.' }), new Map([[URL_, V]]))
    let transactions = 0
    ed.on('transaction', () => void transactions++)
    await tick()
    refreshLinkChips(ed)
    expect(transactions).toBe(0)
  })

  it('leaves a URL in code alone', async () => {
    const ed = make(para({ type: 'text', text: URL_, marks: [{ type: 'code' }] }), new Map([[URL_, V]]))
    await tick()
    expect(inline(ed)[0].type).toBe('text')
  })

  it('takes a pasted URL chip\'s URL and resolves it itself, never the clipboard\'s reference', async () => {
    const known = new Map<string, string>()
    const ed = make(para({ type: 'text', text: 'x' }), known)
    await tick()
    ed.commands.insertContent(`<p><span data-reference="nostr:naddr1hostile" data-href="${URL_}" data-embed="detailed">${URL_}</span></p>`)
    const chip = (ed.getJSON() as Json).content?.flatMap((b) => b.content ?? []).find((n) => n.type === 'reference')
    expect(chip?.attrs).toMatchObject({ uri: '', href: URL_ })
    expect(referenceCardPlacements(ed.state.doc)).toEqual([])
  })

  it('drops a pasted URL chip whose href is not http(s)', async () => {
    const ed = make(para({ type: 'text', text: 'x' }), new Map())
    await tick()
    ed.commands.insertContent('<p><span data-reference="nostr:naddr1x" data-href="javascript:alert(1)">x</span></p>')
    const chip = (ed.getJSON() as Json).content?.flatMap((b) => b.content ?? []).find((n) => n.type === 'reference')
    expect(chip?.attrs?.href).toBeNull()
  })

  it('asks nothing while a URL is typed one character at a time, then the whole URL once', async () => {
    const asked: string[][] = []
    const ed = make(para({ type: 'text', text: 'See ' }), new Map(), asked)
    await tick()
    ed.view.dispatch(ed.state.tr.setSelection(TextSelection.create(ed.state.doc, ed.state.doc.content.size - 1)))
    for (const ch of URL_) ed.view.dispatch(ed.state.tr.insertText(ch))
    expect(asked).toEqual([])
    ed.view.dispatch(ed.state.tr.insertText(' '))
    expect(asked).toEqual([[URL_]])
  })

  it('turns a URL with the caret before it, but not one under a selection', async () => {
    const ed = make(para({ type: 'text', text: `${URL_} end` }), new Map([[URL_, V]]))
    await tick()
    // The editor opens with the caret at the URL's start: it is not being typed.
    expect(inline(ed)[0].type).toBe('reference')
    ed.commands.setContent(para({ type: 'text', text: `see ${URL_}` }))
    ed.view.dispatch(ed.state.tr.setSelection(TextSelection.create(ed.state.doc, 10, 14)))
    expect(inline(ed)).toHaveLength(1)
  })

  it('copies a URL chip as its URL', async () => {
    const ed = make(para({ type: 'text', text: `${URL_} ` }), new Map([[URL_, V]]))
    await tick()
    expect(ed.getText()).toBe(`${URL_} `)
  })
})
