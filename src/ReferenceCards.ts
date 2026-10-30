/**
 * The card a block document's writer chose for a reference — SPEC §13.3, "A
 * reference's card": `embed` on the `reference` node (`ReferenceNode`), so the
 * card moves and goes with its chip. `ReferenceMenu` writes it (Show as Row or
 * Card) and `LinkPlaces` draws it in the row's place.
 *
 * The extension that placed a slot after each line for the app's card, and its
 * hook, were deprecated by `LinkPlaces` and are gone (Katerina's widget review,
 * 30 Oct): no app used them. What stays reads and writes the choice.
 */
import type { Editor } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { NodeSelection, type EditorState } from '@tiptap/pm/state'

/** A layout a writer can choose; `none` is no card. */
export type ReferenceCardLayout = 'none' | 'compact' | 'detailed'

/** One card to draw: the reference's `nostr:` URI and how much to show. */
export interface ReferenceCard {
  uri: string
  layout: Exclude<ReferenceCardLayout, 'none'>
}

interface Placement {
  key: string
  /** The end of the textblock's content. */
  pos: number
  cards: ReferenceCard[]
}

/** `embed` as a node holds it: an unknown string draws as compact (§13.3), anything else is none. */
function layoutOf(raw: unknown): ReferenceCard['layout'] | undefined {
  if (typeof raw !== 'string' || raw === '' || raw === 'none') return undefined
  return raw === 'detailed' ? 'detailed' : 'compact'
}

/** Every line that asks for a card, in document order. */
export function referenceCardPlacements(doc: PmNode): Placement[] {
  const out: Placement[] = []
  const seen = new Map<string, number>()
  doc.descendants((node, pos, parent) => {
    if (!node.isTextblock) return true
    const cards: ReferenceCard[] = []
    node.forEach((child) => {
      if (child.type.name !== 'reference') return
      const layout = layoutOf(child.attrs.embed)
      // A URL chip whose URL is not resolved yet (`LinkChips`) has nothing to draw a card of, yet.
      if (layout && child.attrs.uri) cards.push({ uri: String(child.attrs.uri), layout })
    })
    if (cards.length) {
      // The textblock's own id, or its list item's or cell's: the nearest one.
      const id = node.attrs.blockId ?? parent?.attrs.blockId
      const base = id ? `b:${String(id)}` : `p:${pos}`
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      out.push({ key: n ? `${base}:${n}` : base, pos: pos + node.nodeSize - 1, cards })
    }
    return false
  })
  return out
}

/**
 * The chip the person has selected, with what it names and its card — or null.
 *
 * Selected as a node (a click, where a click on the chip does not follow its
 * link), or inside a selected range that holds that one chip and nothing but
 * spaces besides (Shift+arrow over it, or a drag across it): an app whose chip
 * is a link has no other way to select it.
 */
export function referenceAtSelection(state: EditorState): { pos: number; uri: string; layout: ReferenceCardLayout } | null {
  const { selection } = state
  let found: { pos: number; node: PmNode } | null = null
  if (selection instanceof NodeSelection) {
    if (selection.node.type.name === 'reference') found = { pos: selection.from, node: selection.node }
  } else if (!selection.empty) {
    let only = true
    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'reference') {
        if (found) only = false
        found = { pos, node }
        return false
      }
      if (node.isText) {
        const from = Math.max(selection.from, pos) - pos
        const to = Math.min(selection.to, pos + node.nodeSize) - pos
        if ((node.text ?? '').slice(from, to).trim() !== '') only = false
      }
      return true
    })
    if (!only) found = null
  }
  if (!found) return null
  const { pos, node } = found as { pos: number; node: PmNode }
  // A URL chip that names nothing yet has no card to choose.
  if (!node.attrs.uri) return null
  return { pos, uri: String(node.attrs.uri ?? ''), layout: layoutOf(node.attrs.embed) ?? 'none' }
}

/** Sets the card of the selected chip. `none` removes it. The selection stays as it was. */
export function setReferenceCard(editor: Editor, layout: ReferenceCardLayout): boolean {
  const at = referenceAtSelection(editor.state)
  return at ? setReferenceCardAt(editor, at.pos, layout) : false
}

/** Sets the card of the chip at `pos` — one that names something. `none` removes it. The selection stays as it was. */
export function setReferenceCardAt(editor: Editor, pos: number, layout: ReferenceCardLayout): boolean {
  const node = editor.state.doc.nodeAt(pos)
  if (!node || node.type.name !== 'reference' || !node.attrs.uri) return false
  const wasNode = editor.state.selection instanceof NodeSelection && editor.state.selection.from === pos
  // Same size, so a range maps onto itself; a node selection is made again, since the node is replaced.
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, embed: layout === 'none' ? null : layout })
  if (wasNode) tr.setSelection(NodeSelection.create(tr.doc, pos))
  editor.view.dispatch(tr)
  return true
}
