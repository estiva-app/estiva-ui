// @vitest-environment jsdom
/**
 * A chip's menu while writing (Miky, 14 Oct): a click on a chip opens Open and
 * its card instead of following it; a chip just pasted opens the menu by
 * itself, without taking the caret, and typing on closes it with no card.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { LinkChips } from './LinkChips'
import { ReferenceCards } from './ReferenceCards'
import { ReferenceMenu, ReferenceMenuView, isReferenceMenuOpen, referenceMenuClick } from './ReferenceMenu'

const URL_ = 'https://app.example/i/one'
const V = 'nostr:naddr1example'

type Json = { type: string; text?: string; attrs?: Record<string, unknown>; content?: Json[] }
const inline = (ed: Editor) => (ed.getJSON() as Json).content?.[0].content ?? []
const chipOf = (ed: Editor) => inline(ed).find((n) => n.type === 'reference')
const para = (...content: unknown[]): Record<string, unknown> => ({ type: 'doc', content: [{ type: 'paragraph', attrs: { blockId: 'p1' }, content }] })
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
      ReferenceCards,
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
  it('opens by itself on a pasted URL that becomes its chip, and typing on closes it with no card', async () => {
    const ed = make(para({ type: 'text', text: 'See ' }), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(chipOf(ed)?.attrs).toMatchObject({ uri: V, href: URL_ })
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // The caret stayed in the text, after the chip.
    expect(ed.state.selection.empty).toBe(true)
    ed.view.dispatch(ed.state.tr.insertText(' and more'))
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    expect(chipOf(ed)?.attrs?.embed).toBeNull()
  })

  it('opens when a pasted URL\'s answer comes back with the caret still after it, not once the person typed on', async () => {
    const answers: (() => void)[] = []
    const ed = make(para({ type: 'text', text: 'See ' }), new Map(), answers)
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
    const ed2 = make(para({ type: 'text', text: 'See ' }), new Map(), later)
    await tick()
    toEnd(ed2)
    paste(ed2, other)
    ed2.view.dispatch(ed2.state.tr.insertText(' then'))
    later[0]()
    await tick()
    expect(chipOf(ed2)?.attrs).toMatchObject({ uri: V })
    expect(isReferenceMenuOpen(ed2.state)).toBe(false)
  })

  it('opens on a chip picked from a list, which puts a space after it', async () => {
    const ed = make(para({ type: 'text', text: 'See ' }), new Map())
    toEnd(ed)
    ed.commands.insertContent([{ type: 'reference', attrs: { uri: V } }, { type: 'text', text: ' ' }])
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
  })

  it('does not open on a URL typed by hand, an undo, or a document loaded over the editor', async () => {
    const ed = make(para({ type: 'text', text: 'See ' }), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    for (const ch of URL_) ed.view.dispatch(ed.state.tr.insertText(ch))
    ed.view.dispatch(ed.state.tr.insertText(' '))
    expect(chipOf(ed)?.attrs).toMatchObject({ uri: V })
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    ed.commands.setContent(para({ type: 'text', text: 'x ' }, { type: 'reference', attrs: { uri: V } }))
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
  })

  it('keeps Enter for a new line after a paste until an arrow highlights a row; then Enter chooses it', async () => {
    const ed = make(para({ type: 'text', text: 'See ' }), new Map([[URL_, V]]))
    await tick()
    toEnd(ed)
    paste(ed, URL_)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // ↓ to Open, ↓ to None, ↓ to Compact, ↓ to Detailed.
    for (let i = 0; i < 4; i++) expect(press(ed, 'ArrowDown')).toBe(true)
    expect(press(ed, 'Enter')).toBe(true)
    expect(chipOf(ed)?.attrs?.embed).toBe('detailed')
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    // Closed, Enter is the editor's again.
    expect((ed.getJSON() as Json).content).toHaveLength(1)
  })

  it('opens from the keyboard with Enter on a selected chip, and Escape closes it', () => {
    const ed = make(para({ type: 'text', text: 'See ' }, { type: 'reference', attrs: { uri: V, embed: 'compact' } }), new Map())
    ed.view.dispatch(ed.state.tr.setSelection(NodeSelection.create(ed.state.doc, 5)))
    expect(press(ed, 'Enter')).toBe(true)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // The chip is still there: Enter did not replace it with a line break.
    expect(chipOf(ed)).toBeDefined()
    // Open is highlighted; ↑ wraps to Detailed.
    press(ed, 'ArrowUp')
    expect(press(ed, 'Escape')).toBe(true)
    expect(isReferenceMenuOpen(ed.state)).toBe(false)
    expect(chipOf(ed)?.attrs?.embed).toBe('compact')
  })

  it('opens on a click only while editing', () => {
    const ed = make(para({ type: 'text', text: 'See ' }, { type: 'reference', attrs: { uri: V } }), new Map())
    ed.setEditable(false)
    expect(referenceMenuClick(ed, 5)).toBe(false)
    ed.setEditable(true)
    expect(referenceMenuClick(ed, 5)).toBe(true)
    expect(isReferenceMenuOpen(ed.state)).toBe(true)
    // The caret right after the chip, not the chip selected: no selection toolbar beside the menu, and typing does not replace it.
    expect(ed.state.selection.empty && ed.state.selection.from).toBe(6)
  })
})

describe('ReferenceMenuView', () => {
  function Linked({ uri }: ReferenceViewProps) {
    return (
      <a href={`/o/${uri}`} onClick={(event) => (followed(uri), event.preventDefault())}>
        Item
      </a>
    )
  }
  const followed = vi.fn()

  function Harness({ content }: { content: Record<string, unknown> }) {
    const e = useEditor({
      extensions: [StarterKit.configure({ link: false }), BlockId, ReferenceNode.configure({ view: Linked }), ReferenceCards, ReferenceMenu],
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

  it('takes a click on the chip while editing for its menu, and Open hands the click to the chip', async () => {
    followed.mockClear()
    render(<Harness content={para({ type: 'text', text: 'See ' }, { type: 'reference', attrs: { uri: V } })} />)
    const chip = await screen.findByRole('link', { name: 'Item' })
    fireEvent.click(chip)
    expect(followed).not.toHaveBeenCalled()
    await screen.findByRole('menu', { name: 'Link' })
    fireEvent.mouseDown(screen.getByRole('menuitem', { name: 'Open' }))
    expect(followed).toHaveBeenCalledWith(V)
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Link' })).toBeNull())
  })

  it('shows the chip\'s card checked, and choosing one sets it and closes', async () => {
    render(<Harness content={para({ type: 'text', text: 'See ' }, { type: 'reference', attrs: { uri: V } })} />)
    fireEvent.click(await screen.findByRole('link', { name: 'Item' }))
    const none = await screen.findByRole('menuitemradio', { name: 'None' })
    expect(none.getAttribute('aria-checked')).toBe('true')
    fireEvent.mouseDown(screen.getByRole('menuitemradio', { name: 'Detailed' }))
    expect(chipOf(editor!)?.attrs?.embed).toBe('detailed')
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Link' })).toBeNull())
  })

  it('lets a click follow the chip when the editor is not editable', async () => {
    followed.mockClear()
    render(<Harness content={para({ type: 'text', text: 'See ' }, { type: 'reference', attrs: { uri: V } })} />)
    const chip = await screen.findByRole('link', { name: 'Item' })
    act(() => editor!.setEditable(false))
    fireEvent.click(chip)
    expect(followed).toHaveBeenCalledWith(V)
    expect(screen.queryByRole('menu', { name: 'Link' })).toBeNull()
  })
})
