// @vitest-environment jsdom
/**
 * The shared comment box (COMM-2): what its page says it owns — the keys,
 * sending held or shown at once, a refusal putting the words back, the edit
 * mode, drafts, files and the read-only line.
 */
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/react'
import { CommentBox, commentBoxRows, type CommentBoxDraft, type CommentBoxEdit, type CommentBoxProps, type SendAnswer, type UploadAnswer } from './CommentBox'
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

  it('a refused save keeps the words and says it was not saved', async () => {
    render(<Box edit={{ body, onSave: async () => ({ accepted: false, reason: 'gone' }), onCancel: () => {} }} />)
    await press('Enter')
    await settle()
    expect(screen.getByText('Not saved: gone. Your changes are still in the box.')).toBeTruthy()
    expect(editorOf().getText()).toBe('Said before')
  })

  it('/ offers no File and no Urgent in an edit', async () => {
    render(<Box upload={async () => ({ accepted: true, value: 1 })} edit={{ body, onSave: async () => ({ accepted: true }), onCancel: () => {} }} />)
    await type(' /')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(rows.some((r) => r.startsWith('Mention'))).toBe(true)
    expect(rows.some((r) => r.startsWith('File') || r.startsWith('Urgent'))).toBe(false)
    // Closed here: the editor is destroyed on a timer, and a list it closes then would hold the next test's Enter.
    await press('Escape')
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
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    })
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

  it('an upload that arrives after the box opened offers File in /', async () => {
    const { rerender } = render(<Box />)
    rerender(<Box upload={async () => ({ accepted: true, value: 1 })} />)
    await type('/')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(rows.some((r) => r.startsWith('File'))).toBe(true)
    await press('Escape')
  })

  it('no upload: no paperclip and no File row', async () => {
    render(<Box />)
    expect(screen.queryByRole('button', { name: 'Attach a file' })).toBeNull()
    await type('/')
    const rows = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(rows.some((r) => r.startsWith('File'))).toBe(false)
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
