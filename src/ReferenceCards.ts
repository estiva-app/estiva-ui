/**
 * The cards a block document's writer chose, drawn after the line that holds
 * each reference — SPEC §13.3, "A reference's card".
 *
 * The choice is `embed` on the `reference` node (`ReferenceNode`), so the card
 * moves and goes with its chip. What a card looks like is the app's — it knows
 * how to resolve an object and draw its row or its card — so this extension
 * draws nothing itself: after every textblock whose chips ask for a card it
 * places one empty, non-editable slot, and `useReferenceCards` hands the app
 * those slots to portal its cards into. A portal, rather than a React root per
 * slot, keeps the app's providers around the card.
 *
 * **A slot keeps its element while its block lives.** It is keyed by the
 * nearest block id (the `blockId` attribute), so typing above a card does not
 * re-make its element, and the card does not reload on every keystroke.
 *
 * The slot sits at the end of the textblock, inside it: a paragraph's card is
 * under the paragraph, a list item's under the item at its indent, a table
 * cell's in the cell.
 */
import { Extension, type Editor } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, type EditorState } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useEffect, useState } from 'react'

/** A layout a writer can choose; `none` is no card. */
export type ReferenceCardLayout = 'none' | 'compact' | 'detailed'

/** One card to draw: the reference's `nostr:` URI and how much to show. */
export interface ReferenceCard {
  uri: string
  layout: Exclude<ReferenceCardLayout, 'none'>
}

/** One slot: where an app draws the cards of one line. */
export interface ReferenceCardSlot {
  key: string
  element: HTMLElement
  cards: ReferenceCard[]
}

interface Placement {
  key: string
  /** The end of the textblock's content, where the slot goes. */
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

interface ReferenceCardsStorage {
  /** One element per slot key, made once and reused, so the app's portal stays put. */
  elements: Map<string, HTMLElement>
}

const key = new PluginKey<DecorationSet>('referenceCards')

function elementFor(storage: ReferenceCardsStorage, slotKey: string): HTMLElement {
  let element = storage.elements.get(slotKey)
  if (!element) {
    element = document.createElement('div')
    element.setAttribute('data-reference-cards', slotKey)
    element.setAttribute('contenteditable', 'false')
    storage.elements.set(slotKey, element)
  }
  return element
}

function storageOf(editor: Editor): ReferenceCardsStorage | undefined {
  return (editor.storage as unknown as { referenceCards?: ReferenceCardsStorage }).referenceCards
}

/**
 * Places a slot after each line whose chips ask for a card. Pair it with
 * `ReferenceNode`, and draw the cards with `useReferenceCards`.
 */
export const ReferenceCards = Extension.create<Record<string, never>, ReferenceCardsStorage>({
  name: 'referenceCards',
  addStorage() {
    return { elements: new Map() }
  },
  addProseMirrorPlugins() {
    const storage = this.storage
    const decorate = (doc: PmNode) =>
      DecorationSet.create(
        doc,
        referenceCardPlacements(doc).map((p) =>
          Decoration.widget(p.pos, () => elementFor(storage, p.key), {
            key: p.key,
            side: 1,
            ignoreSelection: true,
            // A click on a card is the card's, not a caret placement in the line.
            stopEvent: () => true,
          }),
        ),
      )
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: (_, state) => decorate(state.doc),
          apply: (tr, set) => (tr.docChanged ? decorate(tr.doc) : set),
        },
        props: { decorations: (state) => key.getState(state) },
      }),
    ]
  },
})

/**
 * The slots to draw cards into, kept current as the document changes. Draw
 * each with `createPortal(<cards/>, slot.element)`, keyed by `slot.key`.
 */
export function useReferenceCards(editor: Editor | null): ReferenceCardSlot[] {
  const [slots, setSlots] = useState<ReferenceCardSlot[]>([])
  useEffect(() => {
    if (!editor) return
    const storage = storageOf(editor)
    if (!storage) return
    let last = ''
    const read = () => {
      if (editor.isDestroyed) return
      const next = referenceCardPlacements(editor.state.doc).map((p) => ({ key: p.key, element: elementFor(storage, p.key), cards: p.cards }))
      // Only a change in what is drawn re-renders the app; typing does not.
      const signature = JSON.stringify(next.map((s) => [s.key, s.cards]))
      if (signature === last) return
      last = signature
      const live = new Set(next.map((s) => s.key))
      for (const k of storage.elements.keys()) if (!live.has(k)) storage.elements.delete(k)
      setSlots(next)
    }
    read()
    editor.on('transaction', read)
    return () => {
      editor.off('transaction', read)
    }
  }, [editor])
  return slots
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
