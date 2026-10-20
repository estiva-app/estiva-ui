// @vitest-environment jsdom
/**
 * A link's menu while writing a document (the record
 * a-lone-links-chip-menu-offers-row-or-card): a click on a link opens Open, and
 * alone on its line Show as Row or Card, instead of following it; a lone-line
 * link just pasted or picked opens the menu by itself, without taking the
 * caret, and typing on closes it with no card.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPortal } from 'react-dom'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { encodeNaddr, encodeNpub } from '@estiva-app/protocol'
import { BlockId, ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { LinkChips } from './LinkChips'
import { LinkPlaces } from './LinkPlaces'
import { ReferenceMenu, ReferenceMenuView, isReferenceMenuOpen, referenceMenuClick } from './ReferenceMenu'

const URL_ = 'https://app.example/i/one'
const V = 'nostr:naddr1example'
const FOLDER = `nostr:${encodeNaddr({ kind: 39000, pubkey: 'a'.repeat(64), identifier: 'place-one', relays: [] })}`
const PERSON = `nostr:${encodeNpub('b'.repeat(64))}`

type Json = { type: string; text?: string; attrs?: Record<string, unknown>; content?: Json[] }
const inline = (ed: Editor) => (ed.getJSON() as Json).content?.[0].content ?? []
const chipOf = (ed: Editor) => inline(ed).find((n) => n.type === 'reference')
const para = (...content: unknown[]): Record<string, unknown> => ({ type: 'doc', content: [{ type: 'paragraph', attrs: { blockId: 'p1' }, content }] })
const ref = (uri: string, embed?: string) => ({ type: 'reference', attrs: { uri, ...(embed ? { embed } : {}) } })
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
// jsdom has no ClipboardEvent; `pasteText` takes the paste's event, so a plain one stands in.
const paste = (ed: Editor, text: string) => ed.view.pasteText(text, new Event('paste') as ClipboardEvent)
const press = (ed: Editor, key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  ed.view.dom.dispatchEvent(event)
  return event.defaultPrevented
}

let editor: Editor | undefined
afterEach(() => {
  cleanup()
  editor?.destroy()
  editor = undefined
})

/** An editor with the menu, and a stand-in app that knows `known` and answers `ask` when told to. */
const make = (content: Record<string, unknown>, known: Map<string, string>, answers: (() => void)[] = []) => {
  editor = new Editor({
    extensions: [
      StarterKit.configure({ link: false }),
      BlockId,
      ReferenceNode,
      LinkPlaces,
      ReferenceMenu,
      LinkChips.configure({
        referenceOf: (url) => known.get(url),
        ask: (urls) =>
          new Promise<void>((resolve) =>
            answers.push(() => {
              for (const url of urls) known.set(url, V)
              resolve()
            }),
          ),
      }),
    ],
    content,
  })
  return editor
}

/** The caret at the end of the first paragraph. */
const toEnd = (ed: Editor) => ed.view.dispatch(ed.state.tr.setSelection(TextSelection.create(ed.state.doc, ed.state.doc.content.size - 1)))

describe('ReferenceMenu', () => {
  it('opens by itself on a URL pasted on an empty line that becomes its chip, and typing on closes it with no card', async () => {
    const ed = make(para(), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(chipOf(ed)?.attrs).toMatchObject({ uri: V, href: URL_ })
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // The caret stayed in the text, after the link.
    expect(ed.state.selection.empty).toBe(true)
    ed.view.dispatch(ed.state.tr.insertText(' and more'))
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    expect(chipOf(ed)?.attrs?.embed).toBeNull()
  })

  it('does not open by itself on a link pasted or picked into a sentence, where it would offer Open alone', async () => {
    const ed = make(para({ type: 'text', text: 'See ' }), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(chipOf(ed)?.attrs).toMatchObject({ uri: V, href: URL_ })
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    ed.commands.insertContent([ref(V), { type: 'text', text: ' ' }])
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
  })

  it('does not open by itself on a person or a Folder picked on an empty line, which stay chips', () => {
    for (const uri of [PERSON, FOLDER]) {
      const ed = make(para(), new Map())
      toEnd(ed)
      ed.commands.insertContent([ref(uri), { type: 'text', text: ' ' }])
      expect(isReferenceMenuOpen(ed.state)).toBe(false)
      ed.destroy()
    }
  })

  it('opens when a pasted URL\'s answer comes back with the caret still after it, not once the person typed on', async () => {
    const answers: (() => void)[] = []
    const ed = make(para(), new Map(), answers)
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    // Asked at once: a pasted URL is whole.
    expect(answers).toHaveLength(1)
    answers[0]()
    await tick()
    expect(chipOf(ed)?.attrs).toMatchObject({ uri: V })
    expect(isReferenceMenuOpen(ed.state)).toBe(true)

    const later: (() => void)[] = []
    const other = 'https://app.example/i/two'
    const ed2 = make(para(), new Map(), later)
    await tick()
    toEnd(ed2)
    paste(ed2, other)
    ed2.view.dispatch(ed2.state.tr.insertText(' then'))
    later[0]()
    await tick()
    expect(chipOf(ed2)?.attrs).toMatchObject({ uri: V })
    expect(isReferenceMenuOpen(ed2.state)).toBe(false)
  })

  it('stays open while a URL elsewhere becomes its chip, and closes when the editor loses focus', async () => {
    const answers: (() => void)[] = []
    const other = 'https://app.example/i/two'
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: 'p1' }, content: [ref(V)] },
        { type: 'paragraph', attrs: { blockId: 'p2' }, content: [{ type: 'text', text: other }] },
      ],
    }
    const ed = make(doc, new Map(), answers)
    await tick()
    expect(referenceMenuClick(ed, 1)).toBe(true)
    answers[0]()
    await tick()
    expect((ed.getJSON() as Json).content?.[1].content?.[0].type).toBe('reference')
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    ed.view.dom.dispatchEvent(new FocusEvent('blur'))
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
  })

  it('leaves a key with a modifier to the editor', async () => {
    const ed = make(para(), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    const shifted = new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true, cancelable: true })
    ed.view.dom.dispatchEvent(shifted)
    expect(shifted.defaultPrevented).toBe(false)
  })

  it('offers no Open for a link with nothing to open, and still Show as', () => {
    // No view: the link draws no control of its own, and it has no URL.
    const ed = make(para(ref(V)), new Map())
    render(<ReferenceMenuView editor={ed} />)
    act(() => void referenceMenuClick(ed, 1))
    expect(screen.queryByRole('menuitem', { name: 'Open' })).toBeNull()
    expect(screen.getByRole('menuitemradio', { name: 'Card' })).toBeDefined()
  })

  it('has no menu for a link in a sentence with nothing to open', () => {
    const ed = make(para({ type: 'text', text: 'See ' }, ref(V)), new Map())
    expect(referenceMenuClick(ed, 5)).toBe(false)
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
  })

  it('forgets a paste edited inside: each keystroke in it is not an ask', async () => {
    const answers: (() => void)[] = []
    const ed = make(para({ type: 'text', text: 'See ' }), new Map(), answers)
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(answers).toHaveLength(1)
    // A character fixed in the middle of the pasted URL, the caret left there.
    const at = 5 + URL_.length - 3
    ed.view.dispatch(ed.state.tr.setSelection(TextSelection.create(ed.state.doc, at)))
    for (const ch of 'xyz') ed.view.dispatch(ed.state.tr.insertText(ch))
    toEnd(ed)
    for (const ch of 'abc') ed.view.dispatch(ed.state.tr.insertText(ch))
    expect(answers).toHaveLength(1)
  })

  it('opens on a link picked from a list on an empty line, which puts a space after it', () => {
    const ed = make(para(), new Map())
    toEnd(ed)
    ed.commands.insertContent([ref(V), { type: 'text', text: ' ' }])
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
  })

  it('does not open on a URL typed by hand, an undo, or a document loaded over the editor', async () => {
    const ed = make(para(), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    for (const ch of URL_) ed.view.dispatch(ed.state.tr.insertText(ch))
    ed.view.dispatch(ed.state.tr.insertText(' '))
    expect(chipOf(ed)?.attrs).toMatchObject({ uri: V })
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    ed.commands.setContent(para(ref(V)))
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
  })

  it('keeps Enter for a new line after a paste until an arrow highlights a row; then Enter chooses it', async () => {
    const ed = make(para(), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // ↓ to Open, ↓ to Row, ↓ to Card.
    for (let i = 0; i < 3; i++) expect(press(ed, 'ArrowDown')).toBe(true)
    expect(press(ed, 'Enter')).toBe(true)
    expect(chipOf(ed)?.attrs?.embed).toBe('detailed')
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    // Closed, Enter is the editor's again.
    expect((ed.getJSON() as Json).content).toHaveLength(1)
  })

  it('opens from the keyboard with Enter on a selected link, and Escape closes it without writing', () => {
    const ed = make(para(ref(V, 'compact')), new Map())
    ed.view.dispatch(ed.state.tr.setSelection(NodeSelection.create(ed.state.doc, 1)))
    expect(press(ed, 'Enter')).toBe(true)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // The link is still there: Enter did not replace it with a line break.
    expect(chipOf(ed)).toBeDefined()
    // Row is highlighted; ↑ wraps to Card.
    press(ed, 'ArrowUp')
    expect(press(ed, 'Escape')).toBe(true)
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    // An older writer's compact is kept as written until Row or Card is chosen.
    expect(chipOf(ed)?.attrs?.embed).toBe('compact')
  })

  it('opens on a click only while editing', () => {
    const ed = make(para(ref(V)), new Map())
    ed.setEditable(false)
    expect(referenceMenuClick(ed, 1)).toBe(false)
    ed.setEditable(true)
    expect(referenceMenuClick(ed, 1)).toBe(true)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // The caret right after the link, not the link selected: no selection toolbar beside the menu, and typing does not replace it.
    expect(ed.state.selection.empty && ed.state.selection.from).toBe(2)
  })
})

describe('ReferenceMenuView', () => {
  /** The app's drawing: a link, named by its place, that follows on a click. */
  function Linked({ uri, place = 'chip' }: ReferenceViewProps) {
    return (
      <a href={`/o/${uri}`} data-place={place} onClick={(event) => (followed(uri), event.preventDefault())}>
        Item
      </a>
    )
  }
  const followed = vi.fn()

  function Harness({ content }: { content: Record<string, unknown> }) {
    const e = useEditor({
      extensions: [StarterKit.configure({ link: false }), BlockId, ReferenceNode.configure({ view: Linked }), LinkPlaces, ReferenceMenu],
      content,
    })
    editor = e ?? undefined
    return (
      <>
        <EditorContent editor={e} />
        <ReferenceMenuView editor={e} />
      </>
    )
  }

  it('takes a click on a link in a sentence for its menu, which offers Open only, and Open hands the click to the link', async () => {
    followed.mockClear()
    render(<Harness content={para({ type: 'text', text: 'See ' }, ref(V))} />)
    const chip = await screen.findByRole('link', { name: 'Item' })
    fireEvent.click(chip)
    expect(followed).not.toHaveBeenCalled()
    await screen.findByRole('menu', { name: 'Link' })
    expect(screen.queryByRole('group', { name: 'Show as' })).toBeNull()
    expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)
    fireEvent.mouseDown(screen.getByRole('menuitem', { name: 'Open' }))
    expect(followed).toHaveBeenCalledWith(V)
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Link' })).toBeNull())
  })

  it('offers Open only on a person or a Folder alone on its line, which stay chips', async () => {
    for (const uri of [PERSON, FOLDER]) {
      render(<Harness content={para(ref(uri))} />)
      const link = await screen.findByRole('link', { name: 'Item' })
      expect(link.getAttribute('data-place')).toBe('chip')
      fireEvent.click(link)
      await screen.findByRole('menuitem', { name: 'Open' })
      expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)
      cleanup()
      editor?.destroy()
    }
  })

  it('draws a lone link as its row with Row checked; Card puts its card in the row\'s place, and Row puts the row back', async () => {
    render(<Harness content={para(ref(V))} />)
    const link = await screen.findByRole('link', { name: 'Item' })
    expect(link.getAttribute('data-place')).toBe('row')
    fireEvent.click(link)
    expect((await screen.findByRole('group', { name: 'Show as' })).textContent).toContain('Row')
    expect(screen.getByRole('menuitemradio', { name: 'Row' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.mouseDown(screen.getByRole('menuitemradio', { name: 'Card' }))
    expect(chipOf(editor!)?.attrs?.embed).toBe('detailed')
    await waitFor(() => expect(screen.getByRole('link', { name: 'Item' }).getAttribute('data-place')).toBe('card'))
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Link' })).toBeNull())

    fireEvent.click(screen.getByRole('link', { name: 'Item' }))
    expect((await screen.findByRole('menuitemradio', { name: 'Card' })).getAttribute('aria-checked')).toBe('true')
    fireEvent.mouseDown(screen.getByRole('menuitemradio', { name: 'Row' }))
    // Row writes no `embed` at all, not `none`.
    expect(chipOf(editor!)?.attrs?.embed).toBeNull()
    await waitFor(() => expect(screen.getByRole('link', { name: 'Item' }).getAttribute('data-place')).toBe('row'))
  })

  it('lets a click on a card\'s own control reach it while editing, instead of opening the menu', async () => {
    const changed = vi.fn()
    function WithControl({ place = 'chip' }: ReferenceViewProps) {
      return place === 'card' ? (
        <>
          <button type="button" onClick={changed}>
            Status
          </button>
          {/* A picker's list, portalled out as a Select's is: its click travels React's tree through the link. */}
          {createPortal(
            <div role="option" aria-selected={false} onClick={changed}>
              Done
            </div>,
            document.body,
          )}
        </>
      ) : (
        <a href="/o/item">Item</a>
      )
    }
    function CardHarness() {
      const e = useEditor({ extensions: [StarterKit.configure({ link: false }), BlockId, ReferenceNode.configure({ view: WithControl }), LinkPlaces, ReferenceMenu], content: para(ref(V, 'detailed')) })
      editor = e ?? undefined
      return (
        <>
          <EditorContent editor={e} />
          <ReferenceMenuView editor={e} />
        </>
      )
    }
    render(<CardHarness />)
    fireEvent.click(await screen.findByRole('button', { name: 'Status' }))
    expect(changed).toHaveBeenCalledTimes(1)
    expect(isReferenceMenuOpen(editor!.state)).toBe(false)
    fireEvent.click(screen.getByRole('option', { name: 'Done' }))
    expect(changed).toHaveBeenCalledTimes(2)
    expect(isReferenceMenuOpen(editor!.state)).toBe(false)
  })

  it('offers Open at once on a link picked on an empty line, before the app has drawn it', async () => {
    render(<Harness content={para()} />)
    await screen.findByRole('textbox')
    act(() => {
      editor!.commands.focus('end')
      editor!.commands.insertContent([ref(V), { type: 'text', text: ' ' }])
    })
    expect((await screen.findAllByRole('menuitem', { name: 'Open' })).length).toBe(1)
    expect(screen.getByRole('menuitemradio', { name: 'Row' }).getAttribute('aria-checked')).toBe('true')
  })

  it('lets a click follow the link when the editor is not editable', async () => {
    followed.mockClear()
    render(<Harness content={para(ref(V))} />)
    const chip = await screen.findByRole('link', { name: 'Item' })
    act(() => editor!.setEditable(false))
    fireEvent.click(chip)
    expect(followed).toHaveBeenCalledWith(V)
    expect(screen.queryByRole('menu', { name: 'Link' })).toBeNull()
  })
})
