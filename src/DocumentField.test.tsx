// @vitest-environment jsdom
/**
 * A form's field that holds a document (C12): what its page says it owns. Every
 * edit goes back as it is typed, and nothing is saved on leaving: the form
 * around it sends. A value from outside (a prefill) loads as the document it
 * is, never handed back as an edit, and the field's own edits coming round
 * late are never loaded over newer typing — Peek's `ProseField` tests (MAN-1,
 * RIC-13), moved with it. Ctrl/Cmd+Enter is the form's. `[` and `@` are the
 * kit's. The app's side is played by `@estiva-app/protocol`.
 */
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import type { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/react'
import { documentForEditing, encodeNpub, publishableFromEditor, toEditorDocument, type ContentFormat, type EditorDocument } from '@estiva-app/protocol'
import type { MentionPerson, ReferenceSection } from './ComposerTriggers'
import type { DocumentCodec } from './DocumentEditor'
import { DocumentField, type DocumentFieldProps } from './DocumentField'
import { Field } from './Field'
import { Form } from './Form'

const codec: DocumentCodec = {
  read: (value, format) => toEditorDocument(documentForEditing(value, format as ContentFormat), { links: true }) as JSONContent,
  write: (doc) => publishableFromEditor(doc as EditorDocument),
}

const PEOPLE: MentionPerson[] = [{ id: 'one', name: 'Person one', pubkey: 'b'.repeat(64) }]
const mentions = { people: () => PEOPLE, uriOf: (person: MentionPerson) => (person.pubkey ? `nostr:${encodeNpub(person.pubkey)}` : null) }
const SECTIONS: ReferenceSection[] = [{ label: 'Group one', items: [{ id: 'item-one', label: 'Item one', snippet: '', uri: 'nostr:naddr1itemone' }] }]
const references = { sections: () => SECTIONS, ariaLabel: 'Items', sectionLabel: 'Items' }

/** A block document of paragraphs, as the protocol writes one. */
const doc = (...blocks: object[]) => JSON.stringify({ type: 'doc', content: blocks })
const para = (id: string, ...runs: object[]) => ({ type: 'paragraph', id, content: runs })
const run = (text: string, marks?: string[]) => ({ type: 'text', text, ...(marks ? { marks: marks.map((type) => ({ type })) } : {}) })

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const box = () => screen.getByRole('textbox', { name: 'Description' }) as HTMLElement & { editor: Editor }
const editorOf = () => box().editor

function Described(props: Partial<DocumentFieldProps>) {
  return <DocumentField value="" format="blocks" codec={codec} label="Description" onChange={() => {}} {...props} />
}

async function type(text: string) {
  await act(async () => {
    editorOf().view.focus()
    editorOf().chain().focus('end').insertContent(text).run()
  })
}

/** The key codes a browser sends with these keys: the editor reads them, and takes every Enter and Escape as handled. */
const KEY_CODES: Record<string, number> = { Enter: 13, Escape: 27 }

/** A key pressed in the editor, as the browser sends it: to the editor's own element, with its key code, bubbling up. */
function key(init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: KEY_CODES[init.key ?? ''] ?? 0, ...init })
  act(() => {
    editorOf().view.dom.dispatchEvent(event)
  })
  return event
}

const options = () => within(screen.getByRole('listbox')).getAllByRole('option').map((one) => one.textContent?.replace('↩ Enter', ''))

describe('every edit goes back as it is typed', () => {
  it('hands back each edit with its format, while you are still in it', async () => {
    const onChange = vi.fn<DocumentFieldProps['onChange']>()
    render(<Described onChange={onChange} />)
    await type('Hello')
    expect(onChange).toHaveBeenCalled()
    const [value, format] = onChange.mock.calls.at(-1)!
    expect(format).toBe('estiva-blocks-1')
    expect(codec.read(value, 'blocks').content?.[0]?.content?.[0]?.text).toBe('Hello')
    expect(document.activeElement).toBe(box())
  })

  it('leaving saves nothing: there is nothing to save, the form sends', async () => {
    const onChange = vi.fn<DocumentFieldProps['onChange']>()
    render(<Described onChange={onChange} />)
    await type('Hello')
    const edits = onChange.mock.calls.length
    act(() => box().blur())
    expect(onChange).toHaveBeenCalledTimes(edits)
  })

  it('emptied, it hands back nothing, so a required field is missing again', async () => {
    const onChange = vi.fn<DocumentFieldProps['onChange']>()
    render(<Described onChange={onChange} />)
    await type('Hello')
    act(() => {
      editorOf().commands.clearContent(true)
    })
    expect(onChange).toHaveBeenLastCalledWith('', undefined)
  })
})

describe('a value from outside', () => {
  it('loads a prefill as formatted text, without handing it back as an edit', async () => {
    const onChange = vi.fn<DocumentFieldProps['onChange']>()
    const { rerender } = render(<Described onChange={onChange} />)
    rerender(<Described onChange={onChange} value={doc(para('a1', run('The '), run('total', ['bold']), run(' is wrong')))} />)
    expect(box().querySelector('strong')?.textContent).toBe('total')
    expect(box().textContent).toBe('The total is wrong')
    // A suggestion is not the person typing.
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not reload an older edit of its own that arrives late', async () => {
    /*
      Production, RIC-13's probe: keys pressed back-to-back reached the editor
      before the draft from the previous key came back, and that older value
      was loaded over the newer text — the bold vanished. Two edits, then the
      first comes round as `value`.
    */
    const onChange = vi.fn<DocumentFieldProps['onChange']>()
    const { rerender } = render(<Described onChange={onChange} />)
    act(() => {
      editorOf().commands.insertContent('abc')
    })
    act(() => {
      editorOf().commands.selectAll()
      editorOf().commands.toggleBold()
    })
    const [first, second] = onChange.mock.calls.map(([value]) => value)
    expect(onChange).toHaveBeenCalledTimes(2)

    rerender(<Described onChange={onChange} value={first} />)
    expect(box().querySelector('strong')?.textContent).toBe('abc')

    // The draft catches up, and a genuine outside value still loads after it.
    rerender(<Described onChange={onChange} value={second} />)
    rerender(<Described onChange={onChange} value={doc(para('b1', run('From the thread')))} />)
    expect(box().textContent).toBe('From the thread')
  })

  it('keeps a quick Backspace when the text it undid comes round late', async () => {
    // `a`, `ab`, `a`: the value repeats, so matching edits by value alone let the late `ab` back in and undid the Backspace.
    const onChange = vi.fn<DocumentFieldProps['onChange']>()
    const { rerender } = render(<Described onChange={onChange} />)
    act(() => {
      editorOf().commands.insertContent('a')
    })
    act(() => {
      editorOf().commands.insertContent('b')
    })
    act(() => {
      editorOf().commands.deleteRange({ from: 2, to: 3 })
    })
    const [a, ab, again] = onChange.mock.calls.map(([value]) => value)
    expect(again).toBe(a)

    rerender(<Described onChange={onChange} value={a} />)
    rerender(<Described onChange={onChange} value={ab} />)
    expect(editorOf().getText()).toBe('a')
    rerender(<Described onChange={onChange} value={again} />)
    expect(editorOf().getText()).toBe('a')
  })
})

describe('in a form', () => {
  it('Ctrl+Enter reaches the form around it, which sends; Shift+Enter breaks the line', async () => {
    const onSubmit = vi.fn()
    render(
      <Form onSubmit={onSubmit}>
        <Described />
      </Form>,
    )
    await type('Hello')
    const sent = key({ key: 'Enter', ctrlKey: true })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(sent.defaultPrevented).toBe(true)
    let breaks = 0
    key({ key: 'Enter', shiftKey: true })
    editorOf().state.doc.descendants((node) => void (node.type.name === 'hardBreak' && breaks++))
    expect(breaks).toBe(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('Escape is the form’s: it reaches what is around the field', async () => {
    const around = vi.fn()
    render(
      <div onKeyDown={(event) => around(event.key)}>
        <Described />
      </div>,
    )
    await type('Hello')
    key({ key: 'Escape' })
    expect(around).toHaveBeenCalledWith('Escape')
  })

  it('a required field says so to a screen reader', () => {
    render(
      <Field label="Description" required>
        <Described />
      </Field>,
    )
    expect(box().getAttribute('aria-required')).toBe('true')
  })
})

describe('what it shows', () => {
  it('its placeholder while it is empty, and not once something is written', async () => {
    render(<Described placeholder="What happened?" />)
    expect(screen.getByText('What happened?')).toBeTruthy()
    await type('Hello')
    expect(screen.queryByText('What happened?')).toBeNull()
  })

  it('[ opens the list the app supplies, and @ the people', async () => {
    render(<Described references={references} mentions={mentions} />)
    await type(' [')
    expect(screen.getByRole('listbox', { name: 'Items' })).toBeTruthy()
    act(() => {
      editorOf().commands.clearContent()
    })
    await type(' @')
    expect(options()[0]).toMatch(/Person one$/)
  })
})
