// @vitest-environment jsdom
/**
 * The shared comment box (COMM-2): what its page says it owns — the keys,
 * sending held or shown at once, a refusal putting the words back, the edit
 * mode, drafts, files and the read-only line.
 */
import { act, Suspense, use } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Extension, type Editor } from '@tiptap/core'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { JSONContent } from '@tiptap/react'
import { CommentBox, commentBoxRows, keepCommentBoxWarm, type BoxUnder, type CommentBoxDraft, type CommentBoxEdit, type CommentBoxProps, type SendAnswer, type UploadAnswer } from './CommentBox'
import type { MentionPerson } from './ComposerTriggers'

const PEOPLE: MentionPerson[] = [{ id: 'one', name: 'Person one', pubkey: 'b'.repeat(64) }]
const INSERT = [commentBoxRows.file, commentBoxRows.mention, commentBoxRows.urgent, commentBoxRows.reference]

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // Only the clock: a list closing gives Enter 100ms of grace (suggestionPopup), which must not reach the next test.
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  cleanup()
  vi.setSystemTime(Date.now() + 1000)
})

/** A promise the test answers. */
function later<T>() {
  let answer!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    answer = resolve
  })
  return { promise, answer }
}

const editorOf = (): Editor => (document.querySelector('.ProseMirror') as unknown as { editor: Editor }).editor

const textOf = (body: JSONContent): string => (body.text ?? '') + (body.content ?? []).map(textOf).join('')

async function type(text: string) {
  await act(async () => {
    editorOf().chain().focus('end').insertContent(text).run()
  })
}

async function press(key: string, init: KeyboardEventInit = {}) {
  await act(async () => {
    const editor = editorOf()
    editor.view.someProp('handleKeyDown', (handle) => handle(editor.view, new KeyboardEvent('keydown', { key, ...init })))
  })
}

/** Lets an answer reach the box: it passes through a few promises on the way. */
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

function Box(props: Partial<CommentBoxProps>) {
  return <CommentBox people={PEOPLE} insert={INSERT} label="Write" placeholder="Write…" send={async () => ({ accepted: true })} {...props} />
}

describe('sending, held until the relay answers', () => {
  it('Enter sends the words and the box holds them, shut, until it is accepted; then it is empty', async () => {
    const answer = later<SendAnswer>()
    const send = vi.fn<CommentBoxProps['send']>(() => answer.promise)
    render(<Box send={send} />)
    await type('Hello there')
    await press('Enter')
    expect(send).toHaveBeenCalledTimes(1)
    expect(textOf(send.mock.calls[0][0])).toBe('Hello there')
    expect(screen.getByText('Sending…')).toBeTruthy()
    expect(editorOf().isEditable).toBe(false)
    expect(editorOf().getText()).toBe('Hello there')
    answer.answer({ accepted: true })
    await settle()
    expect(editorOf().getText()).toBe('')
    expect(screen.queryByText('Sending…')).toBeNull()
  })

  it('a refusal keeps the words in the box and says why under it', async () => {
    render(<Box send={async () => ({ accepted: false, reason: 'rate-limited' })} />)
    await type('Hello there')
    await press('Enter')
    await settle()
    expect(editorOf().getText()).toBe('Hello there')
    expect(screen.getByText('Not sent: rate-limited. Your text is back in the box.')).toBeTruthy()
    expect(editorOf().isEditable).toBe(true)
  })

  it('Ctrl/Cmd+Enter sends as Enter does; Shift+Enter does not send', async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} />)
    await type('One')
    await press('Enter', { shiftKey: true })
    expect(send).not.toHaveBeenCalled()
    await press('Enter', { ctrlKey: true })
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('an empty box sends nothing', async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} />)
    await type('   ')
    await press('Enter')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('sending, shown at once', () => {
  it('the box empties at once; a refusal puts the words back, says why, and tells the app', async () => {
    const answer = later<SendAnswer>()
    const onSent = vi.fn()
    const onRefused = vi.fn()
    render(<Box showsAtOnce send={() => answer.promise} onSent={onSent} onRefused={onRefused} />)
    await type('Hello there')
    await press('Enter')
    expect(editorOf().getText()).toBe('')
    expect(onSent).toHaveBeenCalledTimes(1)
    answer.answer({ accepted: false, reason: 'rate-limited' })
    await settle()
    expect(editorOf().getText()).toBe('Hello there')
    expect(onRefused).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Not sent: rate-limited. Your text is back in the box.')).toBeTruthy()
  })
})

describe('editing', () => {
  const body: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Said before' }] }] }

  it('opens with what it says; Enter saves it, and Escape cancels', async () => {
    const onSave = vi.fn<CommentBoxEdit['onSave']>(async () => ({ accepted: true }))
    const onCancel = vi.fn()
    render(<Box edit={{ body, onSave, onCancel }} />)
    expect(editorOf().getText()).toBe('Said before')
    expect(screen.getByText(/to cancel/).textContent).toBe('Esc to cancel · Enter to save')
    await type(', and now')
    await press('Enter')
    expect(textOf(onSave.mock.calls[0][0])).toBe('Said before, and now')
    await press('Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('!@ opens no urgent list in an edit, and @ still does', async () => {
    render(<Box edit={{ body, onSave: async () => ({ accepted: true }), onCancel: () => {} }} />)
    await type(' !@')
    expect(screen.queryByRole('listbox', { name: 'Urgent mention' })).toBeNull()
    await type(' @')
    expect(screen.getByRole('listbox', { name: 'People' })).toBeTruthy()
    await press('Escape')
  })

  it('Escape right after closing a list cancels the edit', async () => {
    const onCancel = vi.fn()
    render(<Box edit={{ body, onSave: async () => ({ accepted: true }), onCancel }} />)
    await type(' @')
    expect(screen.getByRole('listbox')).toBeTruthy()
    await press('Escape')
    expect(onCancel).not.toHaveBeenCalled()
    await press('Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('with words selected, the first Escape closes the selection strip and keeps the edit; the next cancels', async () => {
    const onCancel = vi.fn()
    render(<Box edit={{ body, onSave: async () => ({ accepted: true }), onCancel }} />)
    // Selected and pressed in one act, so the box's opening focus (a frame later) cannot collapse the selection in between.
    await act(async () => {
      const editor = editorOf()
      editor.commands.setTextSelection({ from: 1, to: 5 })
      editor.view.someProp('handleKeyDown', (handle) => handle(editor.view, new KeyboardEvent('keydown', { key: 'Escape' })))
    })
    expect(onCancel).not.toHaveBeenCalled()
    expect(editorOf().state.selection.empty).toBe(true)
    await press('Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('a refused save keeps the words and says it was not saved', async () => {
    render(<Box edit={{ body, onSave: async () => ({ accepted: false, reason: 'gone' }), onCancel: () => {} }} />)
    await press('Enter')
    await settle()
    expect(screen.getByText('Not saved: gone. Your changes are still in the box.')).toBeTruthy()
    expect(editorOf().getText()).toBe('Said before')
  })

  it('/ offers Upload and no Urgent in an edit', async () => {
    render(<Box upload={async () => ({ accepted: true, value: 1 })} edit={{ body, onSave: async () => ({ accepted: true }), onCancel: () => {} }} />)
    await type(' /')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(rows.some((r) => r.startsWith('Mention'))).toBe(true)
    expect(rows.some((r) => r.startsWith('Upload'))).toBe(true)
    expect(rows.some((r) => r.startsWith('Urgent'))).toBe(false)
    // Closed here: the editor is destroyed on a timer, and a list it closes then would hold the next test's Enter.
    await press('Escape')
  })

  it('a file added while editing uploads, Save waits for it, and it is saved with the files already there', async () => {
    const uploaded = later<UploadAnswer>()
    const onSave = vi.fn<CommentBoxEdit['onSave']>(async () => ({ accepted: true }))
    const files = [{ id: 'old', name: 'old.png', state: 'ready' as const, value: 'old-record' }]
    render(<Box upload={() => uploaded.promise} edit={{ body, files, onSave, onCancel: () => {} }} />)
    expect(screen.queryByRole('button', { name: 'Attach a file' })).toBeNull()
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'shot.png', { type: 'image/png' })] } })
    })
    expect(screen.getByText('Uploading… Save waits for the file.')).toBeTruthy()
    await press('Enter')
    expect(onSave).not.toHaveBeenCalled()
    uploaded.answer({ accepted: true, value: 'new-record' })
    await settle()
    await press('Enter')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][1]).toMatchObject([{ value: 'old-record' }, { name: 'shot.png', state: 'ready', value: 'new-record' }])
  })

  it('a file that did not upload holds Save until its ✕ takes it off', async () => {
    const onSave = vi.fn<CommentBoxEdit['onSave']>(async () => ({ accepted: true }))
    render(<Box upload={async () => ({ accepted: false, reason: 'too large' })} edit={{ body, onSave, onCancel: () => {} }} />)
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'big.mov', { type: 'video/quicktime' })] } })
    })
    await settle()
    expect(screen.getByText('Remove the file that did not upload to save.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
    await press('Enter')
    expect(onSave).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove big.mov' }))
    })
    await press('Enter')
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('an edit the app reopens after a refusal says why under it as it opens', () => {
    render(<Box edit={{ body, refused: 'rate-limited', onSave: async () => ({ accepted: true }), onCancel: () => {} }} />)
    expect(screen.getByText('Not saved: rate-limited. Your changes are still in the box.')).toBeTruthy()
    expect(editorOf().getText()).toBe('Said before')
  })
})

describe('drafts', () => {
  it('keeps what is written, opens with it again, and forgets it once sent', async () => {
    let kept: JSONContent | undefined
    const draft: CommentBoxDraft = { read: () => kept, write: (b) => (kept = b), clear: () => (kept = undefined) }
    const first = render(<Box draft={draft} />)
    await type('Half written')
    first.unmount()
    expect(textOf(kept!)).toBe('Half written')
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box draft={draft} send={send} />)
    expect(editorOf().getText()).toBe('Half written')
    await press('Enter')
    await settle()
    expect(send).toHaveBeenCalledTimes(1)
    expect(kept).toBeUndefined()
  })
})

describe('files', () => {
  it('a picked file uploads, Send waits for it, and it goes out with the words', async () => {
    const uploaded = later<UploadAnswer>()
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} upload={() => uploaded.promise} />)
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'plan.pdf', { type: 'application/pdf' })] } })
    })
    expect(screen.getByText('Uploading… Send waits for the file.')).toBeTruthy()
    await type('See this')
    await press('Enter')
    expect(send).not.toHaveBeenCalled()
    uploaded.answer({ accepted: true, value: 'the-record' })
    await settle()
    await press('Enter')
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][1]).toMatchObject([{ name: 'plan.pdf', state: 'ready', value: 'the-record' }])
  })

  it('a failed upload says why and holds Send and Enter until its ✕ takes it off', async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} upload={async () => ({ accepted: false, reason: 'too large' })} />)
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'big.mov', { type: 'video/quicktime' })] } })
    })
    await settle()
    expect(screen.getByText('too large')).toBeTruthy()
    expect(screen.queryByText('Uploading… Send waits for the file.')).toBeNull()
    await type('See this')
    expect(screen.getByText('Remove the file that did not upload to send.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true)
    await press('Enter')
    expect(send).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove big.mov' }))
    })
    expect(screen.queryByText('Remove the file that did not upload to send.')).toBeNull()
    await press('Enter')
    expect(send).toHaveBeenCalledTimes(1)
    expect(textOf(send.mock.calls[0][0])).toBe('See this')
    expect(send.mock.calls[0][1]).toEqual([])
  })

  it('an upload that arrives after the box opened offers Upload in /', async () => {
    const { rerender } = render(<Box />)
    rerender(<Box upload={async () => ({ accepted: true, value: 1 })} />)
    await type('/')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(rows.some((r) => r.startsWith('Upload'))).toBe(true)
    expect(rows.some((r) => r.startsWith('File'))).toBe(false)
    await press('Escape')
  })

  it('no upload: no paperclip and no Upload row', async () => {
    render(<Box />)
    expect(screen.queryByRole('button', { name: 'Attach a file' })).toBeNull()
    await type('/')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(rows.some((r) => r.startsWith('Upload'))).toBe(false)
    await press('Escape')
  })
})

describe('read-only', () => {
  it('a line saying why takes the box’s place', () => {
    render(<Box closed={{ reason: 'Archived. It takes no new comments.' }} />)
    expect(screen.getByText('Archived. It takes no new comments.')).toBeTruthy()
    expect(document.querySelector('.ProseMirror')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
  })
})

describe('under the box: the one card, with ✕, and the live parts', () => {
  const ISSUE = 'https://app.example/item/one'
  const BLOCK = 'https://app.example/page/two#block'
  /** The app's read, by what the text names: one item gets the card; a block link is a part and leaves no card. */
  const reader = (known = () => true): BoxUnder => ({
    read: (body) => {
      const text = textOf(body)
      const item = known() && text.includes(ISSUE)
      const part = text.includes(BLOCK)
      return {
        card: item && !part ? { value: 'item-one', view: <span>Card of item one</span> } : undefined,
        parts: part ? [{ key: 'page-two', view: <span>Live part of page two</span> }] : [],
        names: [...(item ? ['item-one'] : []), ...(part ? ['page-two'] : [])],
      }
    },
  })
  const removeCard = () => act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove card' })))

  it('a draft naming one item shows its card under the box, and it is sent with the words', async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} under={reader()} />)
    expect(screen.queryByText('Card of item one')).toBeNull()
    await type(`see ${ISSUE}`)
    expect(screen.getByText('Card of item one')).toBeTruthy()
    await press('Enter')
    await settle()
    expect(send.mock.calls[0][2]).toEqual({ card: 'item-one' })
    expect(screen.queryByText('Card of item one')).toBeNull()
  })

  it('✕ takes the card off, and the message is sent with none', async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} under={reader()} />)
    await type(`see ${ISSUE}`)
    await removeCard()
    expect(screen.queryByText('Card of item one')).toBeNull()
    await press('Enter')
    await settle()
    expect(send.mock.calls[0][2]).toEqual({})
  })

  it('a link taken out and put back gets its card again', async () => {
    render(<Box under={reader()} />)
    await type(`see ${ISSUE}`)
    await removeCard()
    await act(async () => {
      editorOf().commands.setContent('see')
    })
    await type(` ${ISSUE}`)
    expect(screen.getByText('Card of item one')).toBeTruthy()
  })

  it('a card the app learns of later shows when the app says its answers changed', async () => {
    let known = false
    let listener = () => {}
    const under: BoxUnder = {
      ...reader(() => known),
      changed: (l) => {
        listener = l
        return () => {}
      },
    }
    render(<Box under={under} />)
    await type(`see ${ISSUE}`)
    expect(screen.queryByText('Card of item one')).toBeNull()
    known = true
    await act(async () => listener())
    expect(screen.getByText('Card of item one')).toBeTruthy()
  })

  it('a refused send shown at once puts the words back without the card ✕ took off', async () => {
    const answer = later<SendAnswer>()
    const send = vi.fn<CommentBoxProps['send']>(() => answer.promise)
    render(<Box send={send} under={reader()} showsAtOnce />)
    await type(`see ${ISSUE}`)
    await removeCard()
    await press('Enter')
    expect(send.mock.calls[0][2]).toEqual({})
    await act(async () => answer.answer({ accepted: false, reason: 'the relay is busy' }))
    await settle()
    expect(editorOf().getText()).toBe(`see ${ISSUE}`)
    expect(screen.queryByText('Card of item one')).toBeNull()
  })

  it('a block link shows its live part under the box and no card', async () => {
    render(<Box under={reader()} />)
    await type(`see ${ISSUE} and ${BLOCK}`)
    expect(screen.getByText('Live part of page two')).toBeTruthy()
    expect(screen.queryByText('Card of item one')).toBeNull()
  })

  it('the edit box shows the card it would add and no part, and Save carries the card', async () => {
    const onSave = vi.fn<CommentBoxEdit['onSave']>(async () => ({ accepted: true }))
    const under: BoxUnder = {
      read: (body) => ({
        card: { value: 'item-one', view: <span>Card of item one</span> },
        parts: [{ key: 'page-two', view: <span>Live part of page two</span> }],
        names: textOf(body) ? ['item-one', 'page-two'] : [],
      }),
    }
    const body: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `see ${ISSUE}` }] }] }
    render(<Box under={under} edit={{ body, onSave, onCancel: () => {} }} />)
    expect(screen.getByText('Card of item one')).toBeTruthy()
    expect(screen.queryByText('Live part of page two')).toBeNull()
    await press('Enter')
    expect(onSave.mock.calls[0][2]).toEqual({ card: 'item-one' })
  })
})

describe('a URL pasted over words', () => {
  const URL_ = 'https://app.example/item/one'
  const doc = (...content: JSONContent[]): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph', content }] })
  const editing = (body: JSONContent) => ({ body, onSave: async (): Promise<SendAnswer> => ({ accepted: true }), onCancel: () => {} })

  /** Selects `from`–`to` (1 is the paragraph's start; 'all' selects everything) and pastes `text`, in one act so the box's
   * opening focus (a frame later) cannot collapse the selection in between. */
  async function pasteOver(from: number | 'all', to: number, text: string) {
    await act(async () => {
      const editor = editorOf()
      if (from === 'all') editor.commands.selectAll()
      else editor.commands.setTextSelection({ from, to })
      const event = { clipboardData: { getData: (type: string) => (type === 'text/plain' ? text : '') }, preventDefault: () => {} } as unknown as ClipboardEvent
      const slice = new Slice(Fragment.from(editor.state.schema.text(text)), 0, 0)
      editor.view.someProp('handlePaste', (handle) => handle(editor.view, event, slice))
    })
  }
  const runs = () =>
    ((editorOf().getJSON() as JSONContent).content?.[0].content ?? []).map((n) => {
      const link = n.marks?.find((m) => m.type === 'link')
      return link ? `link:${n.text}>${link.attrs?.href}` : `${n.type}:${n.text ?? ''}`
    })

  it('links the words, and what is typed after them is not linked', async () => {
    render(<Box edit={editing(doc({ type: 'text', text: 'see the plan now' }))} />)
    await pasteOver(5, 13, URL_)
    expect(runs()).toEqual(['text:see ', `link:the plan>${URL_}`, 'text: now'])
    await act(async () => {
      editorOf().chain().setTextSelection(13).insertContent('!').run()
    })
    expect(runs()).toEqual(['text:see ', `link:the plan>${URL_}`, 'text:! now'])
  })

  it('leaves the caret after the linked words, so the selection strip stays shut and one Enter sends (COMM-8)', async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} />)
    await type('see the plan')
    await pasteOver(5, 13, URL_)
    expect(editorOf().state.selection.empty).toBe(true)
    expect(editorOf().state.selection.from).toBe(13)
    expect(screen.queryByRole('textbox', { name: /link/i })).toBeNull()
    await press('Enter')
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('select-all over one line links all its words, without the full stop copied after the URL', async () => {
    render(<Box edit={editing(doc({ type: 'text', text: 'the plan' }))} />)
    await pasteOver('all', 0, `${URL_}.`)
    expect(runs()).toEqual([`link:the plan>${URL_}`])
  })

  it('words holding a bracket keep their words, and the URL goes in after them', async () => {
    render(<Box edit={editing(doc({ type: 'text', text: 'see [the] plan' }))} />)
    await pasteOver(5, 15, URL_)
    expect(runs()).toEqual([`text:see [the] plan ${URL_}`])
  })

  it('words across a line break keep their words, and the URL goes in after them', async () => {
    render(<Box edit={editing(doc({ type: 'text', text: 'one' }, { type: 'hardBreak' }, { type: 'text', text: 'two' }))} />)
    await pasteOver(1, 8, URL_)
    expect(runs()).toEqual(['text:one', 'hardBreak:', `text:two ${URL_}`])
  })

  it('a URL a message cannot carry on words, with a parenthesis, goes in after the words', async () => {
    render(<Box edit={editing(doc({ type: 'text', text: 'the spec' }))} />)
    await pasteOver(1, 9, 'https://wiki.example/Nostr_(protocol)')
    expect(runs()).toEqual(['text:the spec https://wiki.example/Nostr_(protocol)'])
  })
})

describe('what an app adds around the box', () => {
  const bar = () => document.querySelector('[data-composer-editor]')?.hasAttribute('data-marked')
  const URGENT = { type: 'urgentMention', attrs: { id: 'one', label: 'Person one' } }

  it('draws the bar down the text while an urgent mention is in the box, and drops it when the mention goes', async () => {
    render(<Box />)
    expect(bar()).toBe(false)
    await act(async () => {
      editorOf().chain().focus('end').insertContent([URGENT, { type: 'text', text: ' look' }]).run()
    })
    expect(bar()).toBe(true)
    await act(async () => {
      editorOf().commands.clearContent(true)
    })
    expect(bar()).toBe(false)
  })

  it("draws the bar while the app's own mark holds, in the edit box too", async () => {
    const marked = (editor: Editor) => editor.getText().includes('!!')
    const body: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'plain' }] }] }
    render(<Box marked={marked} edit={{ body, onSave: async () => ({ accepted: true }), onCancel: () => {} }} />)
    expect(bar()).toBe(false)
    await type(' !!')
    expect(bar()).toBe(true)
  })

  it("hands the box's editor out, so a launcher inserts into it and the words are sent; and null once it goes", async () => {
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    let handed: Editor | null = null
    const { unmount } = render(<Box send={send} onEditor={(editor) => (handed = editor)} />)
    await act(async () => {
      handed!.chain().focus('end').insertContent('from the launcher').run()
    })
    await press('Enter')
    expect(textOf(send.mock.calls[0][0])).toBe('from the launcher')
    unmount()
    expect(handed).toBeNull()
  })
})

describe('a box built ahead', () => {
  /** Runs what waits for an idle moment at once, as a page with nothing to do would. */
  function idleNow() {
    const queued: IdleRequestCallback[] = []
    window.requestIdleCallback = ((callback: IdleRequestCallback) => queued.push(callback)) as typeof window.requestIdleCallback
    return () => {
      while (queued.length) queued.shift()!({ didTimeout: false, timeRemaining: () => 50 })
    }
  }

  /** An app's own extension that counts the editors built with it. */
  function counted() {
    const built: Editor[] = []
    const extensions = [Extension.create({ name: 'appOwn', onBeforeCreate: ({ editor }) => void built.push(editor as Editor) })]
    return { built, extensions }
  }

  it("takes the editor built while the page was idle, labelled as this box, and it sends with this box's send", async () => {
    const flush = idleNow()
    const { built, extensions } = counted()
    keepCommentBoxWarm({ extensions })
    flush()
    expect(built).toHaveLength(1)
    let handed: Editor | null = null
    const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
    render(<Box send={send} extensions={extensions} onEditor={(editor) => (handed = editor)} />)
    expect(handed).toBe(built[0])
    expect(screen.getByRole('textbox', { name: 'Write' })).toBeTruthy()
    await type('ahead')
    await press('Enter')
    expect(textOf(send.mock.calls[0][0])).toBe('ahead')
    // …and the next spare is built for the next box.
    flush()
    expect(built).toHaveLength(2)
  })

  it('a box opening with a draft, or with other extensions, builds its own and leaves the spare', async () => {
    const flush = idleNow()
    const { built, extensions } = counted()
    keepCommentBoxWarm({ extensions })
    flush()
    let handed: Editor | null = null
    const kept: CommentBoxDraft = { read: () => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'kept' }] }] }), write: () => {}, clear: () => {} }
    render(<Box draft={kept} extensions={extensions} onEditor={(editor) => (handed = editor)} />)
    expect(built).toHaveLength(2)
    expect(handed).not.toBe(built[0])
    expect(editorOf().getText()).toBe('kept')
    cleanup()
    render(<Box onEditor={(editor) => (handed = editor)} />)
    expect(handed).not.toBe(built[0])
  })

  it('works again, with what was typed, after a loading page hides the box and shows it again', async () => {
    // The box lets its editor go a moment after it is hidden: that moment is this clock's.
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    try {
      let kept: JSONContent | undefined
      const draft: CommentBoxDraft = { read: () => kept, write: (body) => void (kept = body), clear: () => void (kept = undefined) }
      const send = vi.fn<CommentBoxProps['send']>(async () => ({ accepted: true }))
      const loading = later<void>()
      function Loading() {
        use(loading.promise)
        return null
      }
      function Page({ more }: { more: boolean }) {
        return (
          <Suspense fallback={<p>Loading</p>}>
            <Box send={send} draft={draft} />
            {more && <Loading />}
          </Suspense>
        )
      }
      const { rerender } = render(<Page more={false} />)
      await type('typed before')
      await act(async () => rerender(<Page more />))
      expect(screen.getByText('Loading')).toBeTruthy()
      act(() => vi.advanceTimersByTime(50))
      await act(async () => {
        loading.answer()
        await loading.promise
      })
      expect(screen.queryByText('Loading')).toBeNull()
      expect(screen.queryByRole('textbox', { name: 'Write' })).not.toBeNull()
      expect(editorOf().getText()).toBe('typed before')
      await press('Enter')
      expect(textOf(send.mock.calls[0][0])).toBe('typed before')
    } finally {
      vi.useFakeTimers({ toFake: ['Date'] })
    }
  })
})

describe('a long draft', () => {
  const said: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Said before' }] }] }

  it('scrolls in the package’s ScrollArea, capped at half the window, in the send box and the edit box — not with the browser’s bar', () => {
    for (const props of [{}, { edit: { body: said, onSave: async () => ({ accepted: true as const }), onCancel: () => {} } }]) {
      const { unmount } = render(<Box {...props} />)
      const text = document.querySelector('.ProseMirror') as HTMLElement
      // The text itself never scrolls: that is the browser's bar (Katerina, 21 Oct).
      expect(text.className).not.toMatch(/(^|\s)overflow(-[xy])?-(auto|scroll)(\s|$)/)
      expect(text.className).not.toContain('max-h-')
      // ScrollArea's viewport (its overscroll rule is its mark) holds the text, with the cap.
      const viewport = text.parentElement?.closest('[class*="overscroll-y-contain"]') as HTMLElement | null
      expect(viewport).not.toBeNull()
      expect(viewport!.className.split(' ')).toContain('max-h-[50vh]')
      // The region reaches into the box's right padding and its content gives it back: the bar at the box's edge, the text where it was.
      expect(viewport!.parentElement!.className.split(' ')).toContain('-mr-3')
      expect((viewport!.firstElementChild as HTMLElement).className.split(' ')).toContain('pr-3')
      expect(viewport!.closest('[data-composer-editor]')).not.toBeNull()
      unmount()
    }
  })
})
