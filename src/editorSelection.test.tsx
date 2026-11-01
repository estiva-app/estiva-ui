// @vitest-environment jsdom
/**
 * Every editor in the kit paints the words you select in `bg-selected`: the
 * colour the selection strip's kept selection paints them while its link field
 * has the focus (`KeptSelection`), so selected and kept look the same. Peek
 * painted it with a rule of its own over every editor (`.tiptap ::selection`,
 * PEE-19); Ship and Leaf painted nothing, and showed the browser's.
 *
 * jsdom draws no selection, so this pins the class that paints it on each
 * editor's text, as `heights.test.tsx` pins a class jsdom cannot measure. In
 * Chrome the selection's computed background is the token's value (the record).
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { JSONContent } from '@tiptap/react'
import { CommentBox } from './CommentBox'
import { DocumentEditor, type DocumentCodec } from './DocumentEditor'
import { InlineText } from './InlineText'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
})

afterEach(cleanup)

const PAINTS_SELECTION = 'selection:bg-bg-selected'
const paints = (name: string) => (screen.getByRole('textbox', { name }).getAttribute('class') ?? '').split(/\s+/).includes(PAINTS_SELECTION)

const codec: DocumentCodec = {
  read: (value) => JSON.parse(value) as JSONContent,
  write: (doc) => ({ value: JSON.stringify(doc) }),
}
const DOC = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Words' }] }] })

describe('an editor paints the words you select in the selected colour', () => {
  it('the comment box', () => {
    render(<CommentBox label="Box" placeholder="Write" people={[]} send={async () => ({ accepted: true })} />)
    expect(paints('Box')).toBe(true)
  })

  it('the document editor', () => {
    render(<DocumentEditor value={DOC} format="blocks" codec={codec} label="Document" onCommit={() => true} />)
    expect(paints('Document')).toBe(true)
  })

  it('a line of text edited in place', () => {
    render(<InlineText value="Item one" placeholder="Untitled" label="Title" onCommit={() => true} />)
    expect(paints('Title')).toBe(true)
  })
})
