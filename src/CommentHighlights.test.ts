// @vitest-environment jsdom
/**
 * Where a comment on a selection is anchored (§13.6), and where an anchor is
 * found again: what `anchorOfSelection` hands the app to write on the
 * comment, and what `commentPlace` says when the page has changed since.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { BlockId } from './BlockNodes'
import { CommentHighlights, anchorOfSelection, commentPlace } from './CommentHighlights'

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

const paragraph = (blockId: string, text: string) => ({ type: 'paragraph', attrs: { blockId }, content: [{ type: 'text', text }] })

/** Two paragraphs: "alpha beta gamma" (text at 1–17) and "delta epsilon" (text at 19–32). */
function open(content: object[] = [paragraph('p1', 'alpha beta gamma'), paragraph('p2', 'delta epsilon')]) {
  editor = new Editor({ extensions: [StarterKit, BlockId, CommentHighlights], content: { type: 'doc', content } })
  return editor
}

describe('anchorOfSelection', () => {
  it('quotes the first word of a paragraph, not the whole paragraph', () => {
    const e = open()
    e.commands.setTextSelection({ from: 1, to: 6 })
    expect(anchorOfSelection(e)).toEqual({ blocks: ['p1'], quote: { start: 'alpha' } })
  })

  it('quotes the last word of a paragraph, not the whole paragraph', () => {
    const e = open()
    e.commands.setTextSelection({ from: 12, to: 17 })
    expect(anchorOfSelection(e)).toEqual({ blocks: ['p1'], quote: { start: 'gamma' } })
  })

  it('anchors a selection of a whole paragraph to the block, with no words', () => {
    const e = open()
    e.commands.setTextSelection({ from: 1, to: 17 })
    expect(anchorOfSelection(e)).toEqual({ blocks: ['p1'] })
  })

  it('quotes where a selection across blocks starts and where it ends', () => {
    const e = open()
    e.commands.setTextSelection({ from: 7, to: 24 })
    expect(anchorOfSelection(e)).toEqual({ blocks: ['p1', 'p2'], quote: { start: 'beta gamma', end: 'delta' } })
  })

  it('anchors nothing when only the edge between two blocks is selected', () => {
    const e = open()
    e.commands.setTextSelection({ from: 17, to: 19 })
    expect(anchorOfSelection(e)).toBeNull()
  })

  it('anchors two lines of a quote to the quote', () => {
    const e = open([
      { type: 'blockquote', attrs: { blockId: 'q1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one line' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'two line' }] }] },
    ])
    // The quote opens at 0, its first line's text at 2–10, the second's at 12–20.
    e.commands.setTextSelection({ from: 6, to: 15 })
    // The quote's lines are joined with '\n', as the protocol reads the quote's text.
    expect(anchorOfSelection(e)).toEqual({ blocks: ['q1'], quote: { start: 'line\ntwo' } })
  })

  it('quotes a line break inside a paragraph as a new line', () => {
    const e = open([{ type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'A line' }, { type: 'hardBreak' }, { type: 'text', text: 'broken here' }] }])
    // "A line" at 1–7, the break at 7, "broken here" at 8–19.
    e.commands.setTextSelection({ from: 3, to: 14 })
    expect(anchorOfSelection(e)).toEqual({ blocks: ['p1'], quote: { start: 'line\nbroken' } })
  })

  it('keeps the words around a quote only when the quoted words repeat', () => {
    const e = open([paragraph('p1', 'see it, then see it again')])
    e.commands.setTextSelection({ from: 14, to: 20 })
    expect(anchorOfSelection(e)).toEqual({ blocks: ['p1'], quote: { start: 'see it', prefix: 'see it, then ', suffix: ' again' } })
  })
})

describe('commentPlace', () => {
  it('finds quoted words on the words', () => {
    const e = open()
    expect(commentPlace(e, { id: 'c', blocks: ['p1'], quote: { start: 'beta' } })).toEqual({ state: 'resolved', from: 7, to: 11, words: true })
  })

  it('draws a comment with no words on its whole blocks', () => {
    const e = open()
    expect(commentPlace(e, { id: 'c', blocks: ['p1', 'p2'] })).toEqual({ state: 'resolved', from: 0, to: 33, words: false })
  })

  it('says reworded when the blocks are there and the words are not', () => {
    const e = open()
    expect(commentPlace(e, { id: 'c', blocks: ['p1'], quote: { start: 'omega' } })).toEqual({ state: 'reworded', from: 0, to: 18 })
  })

  it('finds words across two lines of a quote, as the protocol writes them', () => {
    const e = open([
      { type: 'blockquote', attrs: { blockId: 'q1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one line' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'two line' }] }] },
    ])
    expect(commentPlace(e, { id: 'c', blocks: ['q1'], quote: { start: 'line\ntwo' } })).toEqual({ state: 'resolved', from: 6, to: 15, words: true })
  })

  it('finds words across a line break, as the protocol writes them', () => {
    const e = open([{ type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'A line' }, { type: 'hardBreak' }, { type: 'text', text: 'broken here' }] }])
    expect(commentPlace(e, { id: 'c', blocks: ['p1'], quote: { start: 'line\nbroken' } })).toEqual({ state: 'resolved', from: 3, to: 14, words: true })
  })

  it('says detached when none of the blocks is left', () => {
    const e = open()
    expect(commentPlace(e, { id: 'c', blocks: ['gone'], quote: { start: 'alpha' } })).toEqual({ state: 'detached' })
  })

  it('picks the repeated words whose context matches', () => {
    const e = open([paragraph('p1', 'see it, then see it again')])
    expect(commentPlace(e, { id: 'c', blocks: ['p1'], quote: { start: 'see it', suffix: ' again' } })).toEqual({ state: 'resolved', from: 14, to: 20, words: true })
  })
})
