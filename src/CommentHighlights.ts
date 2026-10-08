import type { Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/**
 * Comments on a few words, drawn on the words — PROTOTYPE (Leaf, 9 October),
 * not reviewed.
 *
 * SPEC §13.6 anchors a comment to one block. The words are carried beside the
 * block id as a quote, the way the W3C's TextQuoteSelector carries them, and
 * found again inside that block when the document is drawn. Nothing is written
 * into the document: the highlight is a decoration, so a save never carries it.
 *
 * A quote no longer in its block finds nothing and draws nothing: that is
 * §13.6's *detached*, and `commentRange` returning null is how a caller knows
 * to say so.
 */

/** One comment's place: the block it is anchored to and the words it is about. */
export interface CommentAnchor {
  /** The thread's id. Clicks report it; `active` names it. */
  id: string
  /** The §13.3 block id the comment's `block` tag carries. */
  block: string
  /** The words, as they were when the comment was written. */
  quote: string
}

interface HighlightState {
  anchors: readonly CommentAnchor[]
  active: string | null
}

const commentHighlightsKey = new PluginKey<HighlightState>('commentHighlights')

/** The highlight's two looks: every commented run, and the one being read. */
const COMMENT_HIGHLIGHT_CLASSES = {
  rest: 'cursor-pointer rounded-sm bg-warning-muted',
  active: 'cursor-pointer rounded-sm bg-warning-muted underline decoration-warning-default decoration-2 underline-offset-4',
} as const

/** The block in the document carrying this id, and where it starts. */
function findBlock(doc: ProseMirrorNode, blockId: string): { node: ProseMirrorNode; pos: number } | null {
  let found: { node: ProseMirrorNode; pos: number } | null = null
  doc.descendants((node, pos) => {
    if (found) return false
    if (node.attrs.blockId === blockId) {
      found = { node, pos }
      return false
    }
    return true
  })
  return found
}

/** Where the quote sits inside its block, in document positions — or null (detached). */
function rangeIn(doc: ProseMirrorNode, anchor: CommentAnchor): { from: number; to: number } | null {
  const block = findBlock(doc, anchor.block)
  if (!block || !anchor.quote) return null
  // The block's text, and the document position of each character in it.
  let text = ''
  const positions: number[] = []
  block.node.descendants((node, offset) => {
    if (!node.isText || !node.text) return true
    const start = block.pos + 1 + offset
    for (let i = 0; i < node.text.length; i++) positions.push(start + i)
    text += node.text
    return true
  })
  const at = text.indexOf(anchor.quote)
  if (at < 0) return null
  return { from: positions[at], to: positions[at + anchor.quote.length - 1] + 1 }
}

export interface CommentHighlightsOptions {
  /** A highlight was clicked: the thread to show. */
  onSelect: ((id: string) => void) | null
}

/** The extension an editor registers to draw comments on their words. */
export const CommentHighlights = Extension.create<CommentHighlightsOptions>({
  name: 'commentHighlights',

  addOptions() {
    return { onSelect: null }
  },

  addProseMirrorPlugins() {
    const options = this.options
    return [
      new Plugin<HighlightState>({
        key: commentHighlightsKey,
        state: {
          init: () => ({ anchors: [], active: null }),
          apply(tr, previous) {
            const meta = tr.getMeta(commentHighlightsKey) as HighlightState | undefined
            return meta ?? previous
          },
        },
        props: {
          decorations(state) {
            const { anchors, active } = commentHighlightsKey.getState(state) ?? { anchors: [], active: null }
            const found = anchors.flatMap((anchor) => {
              const range = rangeIn(state.doc, anchor)
              if (!range) return []
              const look = anchor.id === active ? COMMENT_HIGHLIGHT_CLASSES.active : COMMENT_HIGHLIGHT_CLASSES.rest
              return [Decoration.inline(range.from, range.to, { class: look, 'data-comment-id': anchor.id })]
            })
            return found.length ? DecorationSet.create(state.doc, found) : null
          },
          handleClick(view, pos) {
            const { anchors } = commentHighlightsKey.getState(view.state) ?? { anchors: [] }
            const hit = anchors.find((anchor) => {
              const range = rangeIn(view.state.doc, anchor)
              return range !== null && pos >= range.from && pos <= range.to
            })
            if (hit && options.onSelect) options.onSelect(hit.id)
            return false
          },
        },
      }),
    ]
  },
})

/** Draw these comments, `active` the one being read. */
export function setCommentAnchors(editor: Editor, anchors: readonly CommentAnchor[], active: string | null = null) {
  if (editor.isDestroyed) return
  editor.view.dispatch(editor.state.tr.setMeta(commentHighlightsKey, { anchors, active }))
}

/** Where a comment's words are now, or null when they are gone (§13.6 detached). */
export function commentRange(editor: Editor, anchor: CommentAnchor): { from: number; to: number } | null {
  return rangeIn(editor.state.doc, anchor)
}

/** The drawn highlight of a comment, for a panel to stand beside. */
export function commentElement(editor: Editor, id: string): HTMLElement | null {
  return editor.view.dom.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(id)}"]`)
}

/** What a comment on the selection would carry: its block and its words. */
export interface SelectionQuote {
  block: string
  quote: string
}

/**
 * The block the selection starts in and the selected words in it. A selection
 * across blocks keeps the part in its first block: a comment has one anchor.
 * Null when nothing is selected or the block has no id.
 */
export function quoteOfSelection(editor: Editor): SelectionQuote | null {
  const { from, to, empty } = editor.state.selection
  if (empty) return null
  const $from = editor.state.doc.resolve(from)
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    const id = node.attrs.blockId
    if (typeof id === 'string' && id) {
      const end = Math.min(to, $from.end(depth))
      const quote = editor.state.doc.textBetween(from, end, ' ').trim()
      return quote ? { block: id, quote } : null
    }
  }
  return null
}
