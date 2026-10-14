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
const para = (...content: unknown[]) => ({ type: 'doc', content: [{ type: 'paragraph', attrs: { blockId: 'p1' }, content }] })

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

  it('leaves a URL in code alone', async () => {
    const ed = make(para({ type: 'text', text: URL_, marks: [{ type: 'code' }] }), new Map([[URL_, V]]))
    await tick()
    expect(inline(ed)[0].type).toBe('text')
  })

  it('copies a URL chip as its URL', async () => {
    const ed = make(para({ type: 'text', text: `${URL_} ` }), new Map([[URL_, V]]))
    await tick()
    expect(ed.getText()).toBe(`${URL_} `)
  })
})
