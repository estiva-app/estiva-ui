// @vitest-environment jsdom
/**
 * The shared document editor (WBD-3): what its page says it owns — saving when
 * you leave, someone else's save arriving, the text held when the sign-in
 * ends, `[`, `/`, `@`, a link on words, files, and reading. The app's side is
 * played by `@estiva-app/protocol` and `@estiva-app/conversation`, so what is
 * checked is what an app would save and whom it would add.
 */
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { Editor } from '@tiptap/core'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { JSONContent } from '@tiptap/react'
import { documentForEditing, encodeNpub, publishableFromEditor, toEditorDocument, type ContentFormat, type EditorDocument } from '@estiva-app/protocol'
import { newlyNamedPeople } from '@estiva-app/conversation'
import type { MentionPerson, ReferenceSection } from './ComposerTriggers'
import { DocumentEditor, type DocumentCodec, type DocumentEditorProps, type HeldTyping } from './DocumentEditor'

const codec: DocumentCodec = {
  read: (value, format) => toEditorDocument(documentForEditing(value, format as ContentFormat), { links: true }) as JSONContent,
  write: (doc) => publishableFromEditor(doc as EditorDocument),
}

const KEY_ONE = 'b'.repeat(64)
const KEY_TWO = 'c'.repeat(64)
const PEOPLE: MentionPerson[] = [
  { id: 'one', name: 'Person one', pubkey: KEY_ONE },
  { id: 'two', name: 'Person two', pubkey: KEY_TWO },
  { id: 'three', name: 'Person three', pubkey: null },
]
const mentions = { people: () => PEOPLE, uriOf: (person: MentionPerson) => (person.pubkey ? `nostr:${encodeNpub(person.pubkey)}` : null) }
const ITEM_URI = 'nostr:naddr1itemone'
const SECTIONS: ReferenceSection[] = [{ label: 'Group one', items: [{ id: 'item-one', label: 'Item one', snippet: '', uri: ITEM_URI }] }]
const references = { sections: () => SECTIONS, ariaLabel: 'Items', sectionLabel: 'Items' }

/** A block document of paragraphs, each with its id. */
const doc = (...blocks: object[]) => JSON.stringify({ type: 'doc', content: blocks })
const para = (id: string, text: string, marks?: object[]) => ({ type: 'paragraph', id, content: [{ type: 'text', text, ...(marks ? { marks } : {}) }] })

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const editorOf = (): Editor => (document.querySelector('.ProseMirror') as unknown as { editor: Editor }).editor

/** Types at `at`, in the editor, as a person would: focused. Tiptap's `focus` command focuses a frame later, so the view is focused now. */
async function type(text: string, at: number | 'end' = 'end') {
  await act(async () => {
    const editor = editorOf()
    editor.view.focus()
    editor.chain().focus(at).insertContent(text).run()
  })
}

async function press(key: string) {
  await act(async () => {
    const editor = editorOf()
    editor.view.someProp('handleKeyDown', (handle) => handle(editor.view, new KeyboardEvent('keydown', { key })))
  })
}

/** Leaving the editor: its blur, as a click elsewhere gives it. */
async function leave() {
  await act(async () => {
    // The view's own blur: Tiptap's `blur` command waits a frame.
    const { view } = editorOf()
    view.focus()
    view.dom.blur()
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

/** Lets an answer reach the editor: it passes through a few promises on the way. */
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

const options = () => within(screen.getByRole('listbox')).getAllByRole('option').map((one) => one.textContent?.replace('↩ Enter', ''))

/** What the saved text holds: each block's id and its runs, a run as its text and its marks. */
const saved = (value: string) =>
  (JSON.parse(value) as { content: { id: string; content?: { text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[] }[] }[] }).content.map((block) => ({
    id: block.id,
    runs: (block.content ?? []).map((run) => ({ text: run.text, marks: run.marks ?? [] })),
  }))

function Doc(props: Partial<DocumentEditorProps>) {
  return <DocumentEditor value={doc(para('a1', 'First line'))} format="blocks" codec={codec} label="Document" onCommit={async () => true} {...props} />
}

describe('saving', () => {
  it('saves when you leave, not while typing, and says which saved text the edit started from', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    const start = doc(para('a1', 'First line'))
    render(<Doc value={start} onCommit={onCommit} />)
    await type(' and more')
    expect(onCommit).not.toHaveBeenCalled()
    await leave()
    expect(onCommit).toHaveBeenCalledTimes(1)
    const [value, format, editedFrom] = onCommit.mock.calls[0]
    expect(saved(value)).toEqual([{ id: 'a1', runs: [{ text: 'First line and more', marks: [] }] }])
    expect(format).toBe('estiva-blocks-1')
    expect(editedFrom).toBe(start)
  })

  it('leaving with nothing changed saves nothing', async () => {
    const onCommit = vi.fn(async () => true)
    render(<Doc onCommit={onCommit} />)
    await act(async () => {
      editorOf().commands.focus()
    })
    await leave()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('a refused save keeps the text and says so', async () => {
    render(<Doc onCommit={async () => false} />)
    await type(' kept')
    await leave()
    expect(screen.getByText('Could not save. Your text is still here.')).toBeTruthy()
    expect(editorOf().getText()).toBe('First line kept')
  })

  it('Escape leaves, and so saves', async () => {
    const onCommit = vi.fn(async () => true)
    render(<Doc onCommit={onCommit} />)
    await type('!')
    await press('Escape')
    await settle()
    expect(onCommit).toHaveBeenCalledTimes(1)
  })
})

describe("someone else's save", () => {
  it('is loaded while you are not in the editor', async () => {
    const { rerender } = render(<Doc />)
    rerender(<Doc value={doc(para('a1', 'Their line'))} changedBy={{ name: 'Person two' }} />)
    await settle()
    expect(editorOf().getText()).toBe('Their line')
  })

  it('waits while you type, with who saved it, and does not touch your text; Load it takes theirs', async () => {
    const { rerender } = render(<Doc />)
    await type(' mine')
    rerender(<Doc value={doc(para('a1', 'Their line'))} changedBy={{ name: 'Person two' }} />)
    await settle()
    // Who saved it, and what pressing Load it costs.
    expect(screen.getByText(/^Person two saved a newer version\.\s+\(replaces your changes\)$/)).toBeTruthy()
    expect(editorOf().getText()).toBe('First line mine')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Load it' }))
    })
    expect(editorOf().getText()).toBe('Their line')
  })

  it('your own save coming back is not someone else’s', async () => {
    let value = doc(para('a1', 'First line'))
    const onCommit = vi.fn(async (next: string) => {
      value = next
      return true
    })
    const { rerender } = render(<Doc value={value} onCommit={onCommit} changedBy={{ name: 'Person two' }} />)
    await type(' one')
    await leave()
    await act(async () => {
      editorOf().commands.focus('end')
    })
    rerender(<Doc value={value} onCommit={onCommit} changedBy={{ name: 'Person two' }} />)
    await settle()
    expect(screen.queryByText('Person two saved a newer version.')).toBeNull()
  })
})

describe('the sign-in ending', () => {
  /** An app's held-typing store, by key. */
  function store() {
    const held = new Map<string, string>()
    const readers = new Map<string, () => string | undefined>()
    let ending = false
    const hold: HeldTyping = {
      text: (key) => held.get(key),
      release: (key) => void held.delete(key),
      register: (key, read) => {
        readers.set(key, read)
        return () => {
          readers.delete(key)
          if (!ending) held.delete(key)
        }
      },
      ended: () => ending,
    }
    const end = () => {
      ending = true
      for (const [key, read] of readers) {
        const text = read()
        if (text) held.set(key, text)
      }
    }
    const back = () => {
      ending = false
    }
    return { hold, end, back }
  }

  it('what was typed is in the editor again, unsaved, when it opens after the tap; nothing was saved on the way out', async () => {
    const { hold, end, back } = store()
    const onCommit = vi.fn(async () => true)
    const first = render(<Doc hold={hold} holdKey="doc-1" onCommit={onCommit} />)
    await type(' typed before the end')
    act(() => end())
    first.unmount()
    await settle()
    expect(onCommit).not.toHaveBeenCalled()
    back()
    render(<Doc hold={hold} holdKey="doc-1" onCommit={onCommit} />)
    expect(editorOf().getText()).toBe('First line typed before the end')
    await leave()
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(hold.text('doc-1')).toBeUndefined()
  })

  it('the blur as the editor closes after the ending saves nothing', async () => {
    const { hold, end } = store()
    const onCommit = vi.fn(async () => true)
    render(<Doc hold={hold} holdKey="doc-1" onCommit={onCommit} />)
    await type(' typed before the end')
    act(() => end())
    await leave()
    expect(onCommit).not.toHaveBeenCalled()
  })
})

describe('[ and /', () => {
  it('[ opens the list the app supplies, and a pick puts the chip in the text', async () => {
    render(<Doc references={references} />)
    await type(' [')
    expect(screen.getByRole('listbox', { name: 'Items' })).toBeTruthy()
    await press('Enter')
    const chips: unknown[] = []
    editorOf().state.doc.descendants((node) => void (node.type.name === 'reference' && chips.push(node.attrs.uri)))
    expect(chips).toEqual([ITEM_URI])
  })

  it('without the app’s lists, [ is a bracket', async () => {
    render(<Doc />)
    await type(' [')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('/ offers Format and Insert: Table, File, Upload and Mention, each when the app can do it', async () => {
    render(<Doc references={references} mentions={mentions} upload={async () => ({})} />)
    await type(' /')
    // A row reads as its label and the key it is typed with; Insert in this order.
    const rows = options()
    expect(rows).toEqual(expect.arrayContaining(['Text', 'Checklist[]', 'Note']))
    expect(rows.slice(-4)).toEqual(['Table', 'File[', 'Upload', 'Mention@'])
    await press('Escape')
    cleanup()
    render(<Doc />)
    await type(' /')
    expect(options().slice(-1)).toEqual(['Table'])
  })

  it('/ → Upload opens the file dialog, and that dialog taking focus does not save', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const onCommit = vi.fn(async () => true)
    render(<Doc upload={async () => ({})} onCommit={onCommit} />)
    await type(' /upload')
    await press('Enter')
    expect(click).toHaveBeenCalledTimes(1)
    await leave()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it.each([
    ['File', '/file', 'Items'],
    ['Mention', '/mention', 'People'],
  ])('/ → %s opens its list', async (_row, typed, list) => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] })
    render(<Doc references={references} mentions={mentions} />)
    await type(` ${typed}`)
    // The row Enter picks is the one named so, not another the word also finds.
    expect(within(screen.getByRole('listbox', { name: 'Commands' })).getAllByRole('option')[0].textContent).toMatch(new RegExp(`^${_row}`))
    await press('Enter')
    await act(async () => {
      vi.advanceTimersToNextFrame()
    })
    expect(screen.getByRole('listbox', { name: list })).toBeTruthy()
  })
})

describe('@', () => {
  it('lists the people the app supplies who have a key, and a pick writes a reference to their npub', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc mentions={mentions} onCommit={onCommit} />)
    await type(' @')
    // The names offered; each row also draws the face before its name.
    const offered = options()
    expect(offered).toHaveLength(2)
    expect(offered[0]).toMatch(/Person one$/)
    expect(offered[1]).toMatch(/Person two$/)
    await press('Enter')
    await leave()
    const runs = saved(onCommit.mock.calls[0][0])[0].runs
    expect(runs[1].marks).toEqual([{ type: 'reference', attrs: { uri: `nostr:${encodeNpub(KEY_ONE)}` } }])
  })

  it('a save that names someone new adds them; a typo fix in a text that already names them adds nobody', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    const { unmount } = render(<Doc mentions={mentions} onCommit={onCommit} />)
    await type(' @')
    await press('Enter')
    await leave()
    const [named, , from] = onCommit.mock.calls[0]
    expect(newlyNamedPeople({ content: named, format: 'estiva-blocks-1' }, { content: from, format: 'estiva-blocks-1' })).toEqual([KEY_ONE])
    unmount()
    await settle()

    onCommit.mockClear()
    render(<Doc value={named} mentions={mentions} onCommit={onCommit} />)
    await type('x', 3)
    await leave()
    const [fixed, , before] = onCommit.mock.calls[0]
    expect(before).toBe(named)
    expect(newlyNamedPeople({ content: fixed, format: 'estiva-blocks-1' }, { content: before, format: 'estiva-blocks-1' })).toEqual([])
  })
})

describe('links', () => {
  const URL_ = 'https://example.com/plan'
  async function pasteOver(from: number, to: number, text: string) {
    await act(async () => {
      const editor = editorOf()
      editor.commands.setTextSelection({ from, to })
      const event = { clipboardData: { getData: (kind: string) => (kind === 'text/plain' ? text : ''), files: [], items: [] }, preventDefault: () => {} } as unknown as ClipboardEvent
      const slice = new Slice(Fragment.from(editor.state.schema.text(text)), 0, 0)
      editor.view.someProp('handlePaste', (handle) => handle(editor.view, event, slice))
    })
  }

  it('a URL pasted over words links them, and the link is still on the words after a save and a reload', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc value={doc(para('a1', 'see the plan now'))} onCommit={onCommit} />)
    await pasteOver(5, 13, URL_)
    await leave()
    const value = onCommit.mock.calls[0][0]
    expect(saved(value)[0].runs).toEqual([
      { text: 'see ', marks: [] },
      { text: 'the plan', marks: [{ type: 'link', attrs: { href: URL_ } }] },
      { text: ' now', marks: [] },
    ])
    cleanup()
    render(<Doc value={value} />)
    const link = document.querySelector('.ProseMirror a')
    expect(link?.textContent).toBe('the plan')
    expect(link?.getAttribute('href')).toBe(URL_)
  })

  it('a URL pasted over words in a callout or a list item links them too', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    const value = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'blockquote', id: 'q1', attrs: { tone: 'note' }, content: [{ type: 'text', text: 'the note' }] },
        { type: 'bulletList', id: 'l1', content: [{ type: 'listItem', id: 'i1', content: [{ type: 'text', text: 'the item' }] }] },
      ],
    })
    render(<Doc value={value} onCommit={onCommit} />)
    // Inside the quote's paragraph: 1 opens the quote, 2 its paragraph; "note" starts 4 characters in.
    await pasteOver(6, 10, URL_)
    // The item's words start after the list, the item and its paragraph open.
    const at = editorOf().state.doc.child(0).nodeSize + 3
    await pasteOver(at + 4, at + 8, `${URL_}/two`)
    await leave()
    const out = JSON.parse(onCommit.mock.calls[0][0]) as { content: { content: { text: string; marks?: unknown[]; content?: { text: string; marks?: unknown[] }[] }[] }[] }
    expect(out.content[0].content).toEqual([{ type: 'text', text: 'the ' }, { type: 'text', text: 'note', marks: [{ type: 'link', attrs: { href: URL_ } }] }])
    expect(out.content[1].content[0].content).toEqual([{ type: 'text', text: 'the ' }, { type: 'text', text: 'item', marks: [{ type: 'link', attrs: { href: `${URL_}/two` } }] }])
  })

  it('a link keeps the keys this version does not know through a save', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc value={doc(para('a1', 'the plan', [{ type: 'link', attrs: { href: URL_, title: 'Kept' } }]), para('b2', 'Second'))} onCommit={onCommit} />)
    await type('!', 'end')
    await leave()
    expect(saved(onCommit.mock.calls[0][0])[0].runs).toEqual([{ text: 'the plan', marks: [{ type: 'link', attrs: { href: URL_, title: 'Kept' } }] }])
  })

  /** A click on the element `pick` finds, as ProseMirror hands one to the editor. */
  async function clickOn(pick: (root: Element) => Element | null) {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await act(async () => {
      const { view } = editorOf()
      const target = pick(view.dom)
      expect(target).toBeTruthy()
      view.someProp('handleClick', (handle) => handle(view, 1, { button: 0, target } as unknown as MouseEvent))
    })
    return open
  }

  it('a click on a link on words or on a bare address opens it in a new tab that cannot reach this one', async () => {
    render(<Doc value={doc(para('a1', 'the plan', [{ type: 'link', attrs: { href: URL_ } }]), para('b2', `see ${URL_}/bare now`))} />)
    const onWords = await clickOn((root) => root.querySelector('a'))
    expect(onWords).toHaveBeenCalledWith(URL_, '_blank', 'noopener,noreferrer')
    onWords.mockRestore()
    const bare = await clickOn((root) => root.querySelector('[data-bare-link]'))
    expect(bare).toHaveBeenCalledWith(`${URL_}/bare`, '_blank', 'noopener,noreferrer')
  })

  it('a chip saved with a javascript: address opens nothing when clicked', async () => {
    const evil = 'javascript://example.com/%0aalert(1)'
    render(<Doc value={doc(para('a1', evil, [{ type: 'link', attrs: { href: evil } }]))} />)
    const open = await clickOn((root) => root.querySelector('[data-reference]') ?? root.querySelector('p'))
    expect(open).not.toHaveBeenCalled()
  })

  it('an address typed into the text is saved as the text it is', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc onCommit={onCommit} />)
    await type(` ${URL_} `)
    await leave()
    expect(saved(onCommit.mock.calls[0][0])[0].runs).toEqual([{ text: `First line ${URL_} `, marks: [] }])
  })
})

describe('blocks', () => {
  it('each block keeps its id through editing, so what is anchored to it stays on it', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc value={doc(para('a1', 'One'), para('b2', 'Two'), para('c3', 'Three'))} onCommit={onCommit} />)
    await type(' changed', 4)
    await act(async () => {
      editorOf().chain().focus('end').splitBlock().insertContent('Four').run()
    })
    await leave()
    const ids = saved(onCommit.mock.calls[0][0]).map((block) => block.id)
    expect(ids.slice(0, 3)).toEqual(['a1', 'b2', 'c3'])
    expect(ids[3]).toMatch(/\S/)
    expect(new Set(ids).size).toBe(4)
  })

  it('a checklist, a callout and a table come through a save as they were', async () => {
    const value = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'bulletList', id: 'l1', content: [{ type: 'listItem', id: 'i1', attrs: { checked: true }, content: [{ type: 'text', text: 'done' }] }] },
        { type: 'blockquote', id: 'q1', attrs: { tone: 'warning' }, content: [{ type: 'text', text: 'careful' }] },
        {
          type: 'table',
          id: 't1',
          content: [{ type: 'tableRow', id: 'r1', content: [{ type: 'tableHeader', id: 'h1', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', id: 'p1', content: [{ type: 'text', text: 'a' }] }] }] }],
        },
        para('a1', 'Last'),
      ],
    })
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc value={value} onCommit={onCommit} />)
    await type('!', 'end')
    await leave()
    const out = JSON.parse(onCommit.mock.calls[0][0]) as { content: object[] }
    expect(out.content.slice(0, 3)).toEqual((JSON.parse(value) as { content: object[] }).content.slice(0, 3))
  })

  it('a pasted picture is uploaded and placed; without an upload the paste is not taken', async () => {
    const upload = vi.fn(async (file: File) => ({ url: 'https://files.example/one.png', m: 'image/png', x: 'f'.repeat(64), size: file.size, filename: file.name }))
    render(<Doc upload={upload} />)
    const picture = new File(['png'], 'one.png', { type: 'image/png' })
    const pasteFile = async () => {
      let taken = false
      await act(async () => {
        const editor = editorOf()
        editor.commands.focus('end')
        const event = { clipboardData: { getData: () => '', files: [picture], items: [{ kind: 'file', type: 'image/png', getAsFile: () => picture }], types: ['Files'] }, preventDefault: () => {} } as unknown as ClipboardEvent
        editor.view.someProp('handlePaste', (handle) => {
          taken = handle(editor.view, event, Slice.empty) || taken
          return taken || undefined
        })
        for (let i = 0; i < 5; i++) await Promise.resolve()
      })
      return taken
    }
    expect(await pasteFile()).toBe(true)
    expect(upload).toHaveBeenCalledTimes(1)
    const files: unknown[] = []
    editorOf().state.doc.descendants((node) => void (node.type.name === 'attachment' && files.push(node.attrs.filename)))
    expect(files).toEqual(['one.png'])
    cleanup()
    render(<Doc />)
    expect(await pasteFile()).toBe(false)
  })
})

describe('a link, by where it sits', () => {
  const run = (uri: string, embed?: string) => ({ type: 'text', text: uri, marks: [{ type: 'reference', attrs: { uri, ...(embed ? { embed } : {}) } }] })
  /** The app's drawing of a link: says where it sits. */
  const Placed = ({ uri, place }: { uri: string; place?: string }) => (
    <a href={`/o/${uri}`} data-place={place ?? 'none'} onClick={(event) => event.preventDefault()}>
      Item
    </a>
  )
  const places = () => [...document.querySelectorAll('[data-place]')].map((el) => el.getAttribute('data-place'))

  it('draws as its row alone on its line, its chip in a sentence, and its card in the row\'s place once chosen', async () => {
    const value = doc(
      { type: 'paragraph', id: 'a1', content: [run(ITEM_URI)] },
      { type: 'paragraph', id: 'a2', content: [{ type: 'text', text: 'See ' }, run(ITEM_URI)] },
      { type: 'paragraph', id: 'a3', content: [run(ITEM_URI, 'detailed')] },
    )
    render(<Doc value={value} referenceView={Placed} />)
    await screen.findAllByRole('link', { name: 'Item' })
    expect(places()).toEqual(['row', 'chip', 'card'])
  })

  it('Show as Card on a lone link saves its card, and Show as Row saves it without one', async () => {
    const onCommit = vi.fn<DocumentEditorProps['onCommit']>(async () => true)
    render(<Doc value={doc({ type: 'paragraph', id: 'a1', content: [run(ITEM_URI)] })} referenceView={Placed} onCommit={onCommit} />)
    const choose = async (label: 'Row' | 'Card') => {
      await act(async () => editorOf().view.focus())
      fireEvent.click(await screen.findByRole('link', { name: 'Item' }))
      fireEvent.mouseDown(await screen.findByRole('menuitemradio', { name: label }))
      await leave()
    }
    await choose('Card')
    expect(places()).toEqual(['card'])
    expect(saved(onCommit.mock.calls[0][0])[0].runs[0].marks).toEqual([{ type: 'reference', attrs: { uri: ITEM_URI, embed: 'detailed' } }])
    await choose('Row')
    expect(places()).toEqual(['row'])
    expect(saved(onCommit.mock.calls[1][0])[0].runs[0].marks).toEqual([{ type: 'reference', attrs: { uri: ITEM_URI } }])
  })
})

describe('reading', () => {
  it('read only, nothing can be typed or saved, and the text is drawn the same', async () => {
    const onCommit = vi.fn(async () => true)
    render(<Doc readOnly onCommit={onCommit} references={references} mentions={mentions} />)
    const view = screen.getByRole('textbox', { name: 'Document' })
    expect(view.getAttribute('contenteditable')).toBe('false')
    expect(view.textContent).toBe('First line')
    // Still focusable, so a selection's strip, and Comment on it, can show.
    expect(view.getAttribute('tabindex')).toBe('0')
    await act(async () => {
      editorOf().commands.focus()
    })
    await leave()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('the strip has Comment only when the app switches comments on', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onCommentOnSelection = vi.fn()
    const select = async () => {
      const editor = editorOf()
      vi.spyOn(editor.view, 'hasFocus').mockReturnValue(true)
      vi.spyOn(editor.view, 'coordsAtPos').mockReturnValue({ top: 10, bottom: 20, left: 10, right: 20 })
      act(() => {
        editor.commands.setTextSelection({ from: 1, to: 6 })
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400)
      })
    }
    render(<Doc readOnly onCommentOnSelection={onCommentOnSelection} />)
    await select()
    fireEvent.click(await screen.findByRole('button', { name: 'Comment' }))
    expect(onCommentOnSelection).toHaveBeenCalledTimes(1)
    cleanup()
    render(<Doc />)
    await select()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Comment' })).toBeNull()
  })
})
