// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Editor, type JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { PastedMarkdown } from './PastedMarkdown'

const TABLE_TEXT = '| Name | Since |\n| --- | --- |\n| Ada | 2026 |'
const paragraph = (text: string): JSONContent => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const cell = (type: string, text: string): JSONContent => ({ type, content: [paragraph(text)] })
const TABLE: JSONContent = {
  type: 'table',
  content: [
    { type: 'tableRow', content: [cell('tableHeader', 'Name'), cell('tableHeader', 'Since')] },
    { type: 'tableRow', content: [cell('tableCell', 'Ada'), cell('tableCell', '2026')] },
  ],
}

/*
  The reader an app passes — the protocol's, in Leaf and Ship. Its own reading
  of text is the protocol package's to test; here it answers the texts these
  tests paste, as that reader does.
*/
const READ: Record<string, JSONContent[]> = {
  [TABLE_TEXT]: [TABLE],
  [`Before\n\n${TABLE_TEXT}\n\nAfter`]: [paragraph('Before'), TABLE, paragraph('After')],
  '# Plan\n\n- one': [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Plan' }] }, { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('one')] }] }],
  world: [paragraph('world')],
}
const read = vi.fn((text: string) => (READ[text] ? { type: 'doc', content: READ[text] } : undefined))

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  read.mockClear()
})

function make(content: JSONContent, tables = true) {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, ...(tables ? [TableKit] : []), PastedMarkdown.configure({ read })],
    content,
  })
  return editor
}

/** A paste as the browser sends it, through ProseMirror's own handler. */
function paste(ed: Editor, text: string, html = '', { shift = false } = {}) {
  if (shift) ed.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', keyCode: 16, shiftKey: true, bubbles: true }))
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: { types: html ? ['text/plain', 'text/html'] : ['text/plain'], files: [], getData: (type: string) => (type === 'text/plain' ? text : type === 'text/html' ? html : '') },
  })
  ed.view.dom.dispatchEvent(event)
}

const shapeOf = (ed: Editor) => (ed.getJSON().content ?? []).map((block) => block.type)
const textOf = (ed: Editor) => ed.state.doc.textBetween(0, ed.state.doc.content.size, '\n')

describe('PastedMarkdown', () => {
  it('pastes a markdown table copied as plain text as a table, not pipes', () => {
    const ed = make({ type: 'doc', content: [{ type: 'paragraph' }] })
    paste(ed, TABLE_TEXT)
    expect(shapeOf(ed)).toContain('table')
    expect(textOf(ed)).not.toContain('|')
  })

  it('pastes the prose around a table as paragraphs, and the table between them', () => {
    const ed = make({ type: 'doc', content: [{ type: 'paragraph' }] })
    paste(ed, `Before\n\n${TABLE_TEXT}\n\nAfter`)
    expect(shapeOf(ed)).toEqual(['paragraph', 'table', 'paragraph'])
    expect(textOf(ed)).toMatch(/^Before\n[\s\S]*Ada[\s\S]*\nAfter$/)
  })

  it('pastes a heading and a list as a heading and a list', () => {
    const ed = make({ type: 'doc', content: [{ type: 'paragraph' }] })
    paste(ed, '# Plan\n\n- one')
    // StarterKit keeps an empty paragraph after a last block that is not one.
    expect(shapeOf(ed)).toEqual(['heading', 'bulletList', 'paragraph'])
  })

  it('pastes text that spells only paragraphs exactly as before, into the line it lands in', () => {
    const ed = make({ type: 'doc', content: [paragraph('Hello ')] })
    ed.commands.focus('end')
    paste(ed, 'world')
    expect(ed.getJSON().content).toEqual([paragraph('Hello world')])
  })

  it('leaves a paste that carries HTML to the HTML, without reading the text', () => {
    const ed = make({ type: 'doc', content: [{ type: 'paragraph' }] })
    paste(ed, TABLE_TEXT, '<p>| Name | Since |</p>')
    expect(read).not.toHaveBeenCalled()
    expect(shapeOf(ed)).not.toContain('table')
  })

  it('keeps the pipes as text on the plain-text paste, Ctrl/Cmd+Shift+V', () => {
    const ed = make({ type: 'doc', content: [{ type: 'paragraph' }] })
    paste(ed, TABLE_TEXT, '', { shift: true })
    expect(shapeOf(ed)).not.toContain('table')
    expect(textOf(ed)).toContain('| Name | Since |')
  })

  it('keeps a table pasted inside a table cell as text, never a table in a table', () => {
    const ed = make({ type: 'doc', content: [TABLE] })
    ed.commands.setTextSelection(4)
    paste(ed, TABLE_TEXT)
    expect(JSON.stringify(ed.getJSON().content?.[0].content)).not.toContain('"type":"table"')
    expect(textOf(ed)).toContain('| Name | Since |')
  })

  it('keeps the text in an editor that holds no tables', () => {
    const ed = make({ type: 'doc', content: [{ type: 'paragraph' }] }, false)
    paste(ed, TABLE_TEXT)
    expect(shapeOf(ed)).toEqual(['paragraph', 'paragraph', 'paragraph'])
    expect(textOf(ed)).toContain('| Ada | 2026 |')
  })
})
