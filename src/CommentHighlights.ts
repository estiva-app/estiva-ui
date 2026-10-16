import type { Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/**
 * Comments on a selection, drawn where they are, from Katerina's Leaf prototype
 * (9 October), with a run, whole blocks and changed words added for LEAF-7.
 *
 * A comment's place is the one SPEC §13.6 gives it: a run of blocks, and the
 * words where the selection starts and where it ends as a quote. Words inside
 * one block are quoted whole; a selection across blocks quotes its start in
 * the first block and its end in the last; a selection of whole blocks quotes
 * nothing and is about the blocks. Nothing is written into the document: the
 * highlight is a decoration, so a save never carries it.
 *
 * Three places a comment can be in, as `@estiva-app/protocol`'s
 * `resolveCommentAnchor` reads them:
 * - **resolved** — its words are found (drawn on them), or it quotes none
 *   (drawn on its whole blocks);
 * - **reworded** — its blocks are there and its words are not: nothing is
 *   drawn, and the comment stands beside its first block;
 * - **detached** — none of its blocks is left.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-comment-remembers-where-its-selection-starts-and-ends.md
 */

/** The words a comment quotes: §13.6's `quote` tag. */
export interface CommentQuote {
  /** The selection's words in one block, or its first words when it runs across blocks. */
  start: string
  /** Its last words, in the run's last block. Absent: `start` is the whole selection. */
  end?: string
  /** A few characters before `start`, only when the words repeat in their block. */
  prefix?: string
  /** A few characters after the end, only when the words repeat in their block. */
  suffix?: string
}

/** One comment's place: the blocks it is anchored to and the words it is about. */
export interface CommentAnchor {
  /** The thread's id. Clicks report it; `active` names it. */
  id: string
  /** The run: the §13.3 block ids the comment's `block` tag lists, in order. */
  blocks: readonly string[]
  /** The words, as they were when the comment was written. Absent: the whole blocks. */
  quote?: CommentQuote
}

/** Where a comment is now, in document positions. */
export type CommentPlace =
  /** Drawn: on its words (`words`), or on its whole blocks. */
  | { state: 'resolved'; from: number; to: number; words: boolean }
  /** Its blocks (`from`–`to`) are there, its words are not. Draw nothing; show the quote as the commenter's. */
  | { state: 'reworded'; from: number; to: number }
  /** None of its blocks is left. */
  | { state: 'detached' }

interface HighlightState {
  anchors: readonly CommentAnchor[]
  active: string | null
}

const commentHighlightsKey = new PluginKey<HighlightState>('commentHighlights')

/**
 * The highlight's two looks: every commented selection, and the one being
 * read. A block carries the same classes as words do: its underline reaches
 * every line of its text.
 */
const COMMENT_HIGHLIGHT_CLASSES = {
  rest: 'cursor-pointer rounded-sm bg-warning-muted',
  active: 'cursor-pointer rounded-sm bg-warning-muted underline decoration-warning-default decoration-2 underline-offset-4',
} as const

/** Up to this many characters, a selection in one block is quoted whole (§13.6). */
const QUOTE_WHOLE_MAX = 1000
/** Otherwise about this many at each end, cut at a word. */
const QUOTE_END_LENGTH = 150
/** How much of the text around repeated words is kept to tell them apart. */
const QUOTE_CONTEXT_LENGTH = 32

/** A block with an id: where it is, where its parent's content starts, and its index there. */
interface Place {
  node: ProseMirrorNode
  pos: number
  parent: number
  index: number
}

/** Every block carrying an id, by id. */
function placesIn(doc: ProseMirrorNode): Map<string, Place> {
  const places = new Map<string, Place>()
  const walk = (parent: ProseMirrorNode, parentPos: number) => {
    parent.forEach((node, offset, index) => {
      const pos = parentPos + offset
      const id = node.attrs.blockId
      if (typeof id === 'string' && id && !places.has(id)) places.set(id, { node, pos, parent: parentPos, index })
      if (!node.isTextblock && !node.isLeaf) walk(node, pos + 1)
    })
  }
  walk(doc, 0)
  return places
}

/**
 * A block's text, and the document position where each of its characters
 * starts and ends. A chip counts as its `nostr:` text, as on the wire.
 */
function textOf(block: Place): { text: string; starts: number[]; ends: number[] } {
  let text = ''
  const starts: number[] = []
  const ends: number[] = []
  block.node.descendants((node, offset) => {
    const at = block.pos + 1 + offset
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) (starts.push(at + i), ends.push(at + i + 1))
      text += node.text
    } else if (node.isInline && node.isLeaf) {
      const wire = typeof node.attrs.uri === 'string' ? node.attrs.uri : ''
      for (let i = 0; i < wire.length; i++) (starts.push(at), ends.push(at + node.nodeSize))
      text += wire
    }
    return true
  })
  return { text, starts, ends }
}

/** Where `words` sits in `text` at or after `from`: the occurrence whose context matches, else the first. */
function find(text: string, words: string, from: number, context: (at: number) => boolean): number {
  let first = -1
  for (let at = text.indexOf(words, from); at !== -1; at = text.indexOf(words, at + 1)) {
    if (first === -1) first = at
    if (context(at)) return at
  }
  return first
}

/**
 * The run as §13.3 reads it: the parent holding most of its listed blocks, and
 * every block there from the earliest listed one to the latest. Null when none
 * is left.
 */
function runIn(doc: ProseMirrorNode, places: Map<string, Place>, ids: readonly string[]): Place[] | null {
  const present = ids.map((id) => places.get(id)).filter((p): p is Place => !!p)
  if (present.length === 0) return null
  const byParent = new Map<number, Place[]>()
  for (const p of present) byParent.set(p.parent, [...(byParent.get(p.parent) ?? []), p])
  const group = [...byParent.values()].reduce((best, one) => (one.length > best.length ? one : best))
  const low = Math.min(...group.map((p) => p.index))
  const high = Math.max(...group.map((p) => p.index))
  // `parent` is where the parent's content starts: 0 for the document itself.
  const contentStart = group[0].parent
  const parent = contentStart === 0 ? doc : doc.nodeAt(contentStart - 1)
  if (!parent) return group
  const run: Place[] = []
  parent.forEach((node, offset, index) => {
    if (index >= low && index <= high) run.push({ node, pos: contentStart + offset, parent: contentStart, index })
  })
  return run
}

/** Where a comment is in this document. */
function placeOf(doc: ProseMirrorNode, anchor: CommentAnchor, places = placesIn(doc)): CommentPlace {
  const run = runIn(doc, places, anchor.blocks)
  if (!run) return { state: 'detached' }
  const from = run[0].pos
  const to = run[run.length - 1].pos + run[run.length - 1].node.nodeSize
  const { quote } = anchor
  if (!quote) return { state: 'resolved', from, to, words: false }

  const reworded: CommentPlace = { state: 'reworded', from, to }
  const firstId = anchor.blocks[0]
  const lastId = anchor.blocks[anchor.blocks.length - 1]
  const first = run.findIndex((p) => p.node.attrs.blockId === firstId)
  const last = run.findIndex((p) => p.node.attrs.blockId === lastId)
  if (first === -1 || last === -1 || last < first) return reworded
  const a = textOf(run[first])
  const b = first === last ? a : textOf(run[last])
  // Context longer than a writer ever sends is a stranger's, and ignored, as the protocol's `resolveCommentAnchor` does.
  const prefix = quote.prefix && quote.prefix.length <= QUOTE_CONTEXT_LENGTH ? quote.prefix : undefined
  const suffix = quote.suffix && quote.suffix.length <= QUOTE_CONTEXT_LENGTH ? quote.suffix : undefined
  const before = (text: string, i: number) => !prefix || text.slice(Math.max(0, i - prefix.length), i) === prefix
  const after = (text: string, i: number) => !suffix || text.slice(i, i + suffix.length) === suffix

  if (quote.end === undefined) {
    const at = find(a.text, quote.start, 0, (i) => before(a.text, i) && after(a.text, i + quote.start.length))
    if (at === -1 || quote.start === '') return reworded
    return { state: 'resolved', from: a.starts[at], to: a.ends[at + quote.start.length - 1], words: true }
  }
  const startAt = find(a.text, quote.start, 0, (i) => before(a.text, i))
  if (startAt === -1 || quote.start === '') return reworded
  const endFrom = first === last ? startAt + quote.start.length : 0
  const endAt = find(b.text, quote.end, endFrom, (i) => after(b.text, i + quote.end!.length))
  if (endAt === -1 || quote.end === '') return reworded
  return { state: 'resolved', from: a.starts[startAt], to: b.ends[endAt + quote.end.length - 1], words: true }
}

declare module '@tiptap/core' {
  interface EditorEvents {
    /** A comment's highlight was clicked: `editor.on('commentSelect', ({ id }) => …)`. */
    commentSelect: { id: string }
  }
}

export interface CommentHighlightsOptions {
  /** A highlight was clicked: the thread to show. Or listen for the editor's `commentSelect`. */
  onSelect: ((id: string) => void) | null
}

/** The extension an editor registers to draw comments where they are. */
export const CommentHighlights = Extension.create<CommentHighlightsOptions>({
  name: 'commentHighlights',

  addOptions() {
    return { onSelect: null }
  },

  addProseMirrorPlugins() {
    const options = this.options
    const editor = this.editor
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
            const places = placesIn(state.doc)
            const drawn = anchors.flatMap((anchor) => {
              const place = placeOf(state.doc, anchor, places)
              if (place.state !== 'resolved') return []
              const attrs = { class: anchor.id === active ? COMMENT_HIGHLIGHT_CLASSES.active : COMMENT_HIGHLIGHT_CLASSES.rest, 'data-comment-id': anchor.id }
              if (place.words) return [Decoration.inline(place.from, place.to, attrs)]
              // Whole blocks: each block of the run carries the look itself.
              const blocks: Decoration[] = []
              state.doc.nodesBetween(place.from, place.to, (node, pos) => {
                if (pos < place.from || pos + node.nodeSize > place.to) return true
                blocks.push(Decoration.node(pos, pos + node.nodeSize, attrs))
                return false
              })
              return blocks
            })
            return drawn.length ? DecorationSet.create(state.doc, drawn) : null
          },
          handleClick(view, pos) {
            const { anchors } = commentHighlightsKey.getState(view.state) ?? { anchors: [] }
            const places = placesIn(view.state.doc)
            // The narrowest drawn comment under the click: words before the paragraph around them.
            let hit: { id: string; size: number } | null = null
            for (const anchor of anchors) {
              const place = placeOf(view.state.doc, anchor, places)
              if (place.state !== 'resolved' || pos < place.from || pos >= place.to) continue
              const size = place.to - place.from
              if (!hit || size < hit.size) hit = { id: anchor.id, size }
            }
            if (hit) {
              options.onSelect?.(hit.id)
              editor.emit('commentSelect', { id: hit.id })
            }
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

/** Where a comment is now: on its words or blocks, beside its blocks with its words gone, or detached. */
export function commentPlace(editor: Editor, anchor: CommentAnchor): CommentPlace {
  return placeOf(editor.state.doc, anchor)
}

/**
 * What a comment's card stands beside: its drawn highlight, or — its words
 * gone — its first block. Null when it is detached.
 */
export function commentElement(editor: Editor, anchor: CommentAnchor): HTMLElement | null {
  const drawn = editor.view.dom.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(anchor.id)}"]`)
  if (drawn) return drawn
  const place = placeOf(editor.state.doc, anchor)
  if (place.state === 'detached') return null
  const dom = editor.view.nodeDOM(place.from)
  return dom instanceof HTMLElement ? dom : null
}

/** A quote in one line, as a card says it: its start and end words around an ellipsis. */
export function quoteText(quote: CommentQuote): string {
  return quote.end ? `${quote.start} … ${quote.end}` : quote.start
}

/** At most `length` characters from the front of `text`, cut back to a word when one is near. */
function headOf(text: string, length: number): string {
  if (text.length <= length) return text
  const cut = text.lastIndexOf(' ', length)
  return text.slice(0, cut > length / 2 ? cut : length)
}

/** At most `length` characters from the back of `text`, cut forward to a word when one is near. */
function tailOf(text: string, length: number): string {
  if (text.length <= length) return text
  const from = text.length - length
  const cut = text.indexOf(' ', from)
  return text.slice(cut !== -1 && cut < from + length / 2 ? cut + 1 : from)
}

function occurrences(text: string, words: string): number {
  let count = 0
  for (let at = text.indexOf(words); words && at !== -1; at = text.indexOf(words, at + 1)) count++
  return count
}

/** How many characters of `block`'s text come before document position `pos`. */
function offsetIn(block: { starts: number[] }, pos: number): number {
  const at = block.starts.findIndex((start) => start >= pos)
  return at === -1 ? block.starts.length : at
}

/** What a comment on the selection would carry: its run, and its words unless it covers whole blocks. */
export interface SelectionAnchor {
  blocks: string[]
  quote?: CommentQuote
}

/**
 * The anchor a comment on the selection carries, as §13.6 writes it: the
 * selected blocks, and the selected words in one block or the words where it
 * starts and ends across several. No quote when whole blocks are selected.
 * Null when nothing is selected or a selected block has no id.
 */
export function anchorOfSelection(editor: Editor): SelectionAnchor | null {
  const { doc, selection } = editor.state
  if (selection.empty) return null
  const { $from, $to } = selection
  const places = placesIn(doc)
  // The block with an id at or around `depth`: the lines of a quote or a list
  // item are paragraphs with no id of their own, and belong to it.
  const around = (depth: number): Place | undefined => {
    for (let d = depth; d > 0; d--) {
      const id = $from.node(d).attrs.blockId
      if (typeof id === 'string' && id && places.has(id)) return places.get(id)
    }
    return undefined
  }
  // The blocks the selection runs across: children of the deepest node holding
  // both ends, or — both ends in one textblock, or in blocks with no ids — the
  // block with an id around them.
  let run: Place[]
  if ($from.parent === $to.parent && $from.parent.isTextblock) {
    const found = around($from.depth)
    if (!found) return null
    run = [found]
  } else {
    const depth = $from.sharedDepth($to.pos)
    const low = $from.index(depth)
    const high = $to.pos >= $to.end(depth) ? $from.node(depth).childCount - 1 : $to.index(depth)
    run = []
    for (let i = low; i <= high; i++) {
      const id = $from.node(depth).child(i).attrs.blockId
      const place = typeof id === 'string' ? places.get(id) : undefined
      if (!place) {
        const found = around(depth)
        if (!found) return null
        run = [found]
        break
      }
      run.push(place)
    }
  }
  let firstText = textOf(run[0])
  let lastText = run.length === 1 ? firstText : textOf(run[run.length - 1])
  let start = offsetIn(firstText, selection.from)
  let end = offsetIn(lastText, selection.to)
  // A block the selection only touches at its edge holds none of it: it is not
  // in the run. The same rule as the protocol's `selectionAnchorTags`.
  if (run.length > 1 && start >= firstText.text.length) ((run = run.slice(1)), (firstText = textOf(run[0])), (start = 0))
  if (run.length > 1 && end <= 0) ((run = run.slice(0, -1)), (lastText = textOf(run[run.length - 1])), (end = lastText.text.length))
  if (run.length === 1) lastText = firstText
  // Between two blocks, with no character selected: nothing to comment on.
  if (run.length === 1 && firstText.text && start >= end) return null
  const blocks = run.map((p) => p.node.attrs.blockId as string)
  if (start === 0 && end >= lastText.text.length) return { blocks }

  const single = run.length === 1
  const quote: CommentQuote = { start: '' }
  if (single && end - start <= QUOTE_WHOLE_MAX) {
    quote.start = firstText.text.slice(start, end)
  } else {
    const startWords = single ? firstText.text.slice(start, end) : firstText.text.slice(start)
    const endWords = single ? startWords : lastText.text.slice(0, end)
    quote.start = headOf(startWords, QUOTE_END_LENGTH)
    quote.end = tailOf(endWords, QUOTE_END_LENGTH)
  }
  if (!quote.start || quote.end === '') return { blocks }
  const prefix = firstText.text.slice(Math.max(0, start - QUOTE_CONTEXT_LENGTH), start)
  const suffix = lastText.text.slice(end, end + QUOTE_CONTEXT_LENGTH)
  if (prefix && occurrences(firstText.text, quote.start) > 1) quote.prefix = prefix
  if (suffix && occurrences(lastText.text, quote.end ?? quote.start) > 1) quote.suffix = suffix
  return { blocks, quote }
}
