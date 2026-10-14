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
      if (layout) cards.push({ uri: String(child.attrs.uri ?? ''), layout })
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

/** The chip the person has selected, with what it names and its card — or null. */
export function referenceAtSelection(state: EditorState): { pos: number; uri: string; layout: ReferenceCardLayout } | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'reference') return null
  return { pos: selection.from, uri: String(selection.node.attrs.uri ?? ''), layout: layoutOf(selection.node.attrs.embed) ?? 'none' }
}

/** Sets the card of the selected chip. `none` removes it. The chip stays selected. */
export function setReferenceCard(editor: Editor, layout: ReferenceCardLayout): boolean {
  const at = referenceAtSelection(editor.state)
  if (!at) return false
  const node = editor.state.doc.nodeAt(at.pos)
  if (!node) return false
  const tr = editor.state.tr.setNodeMarkup(at.pos, undefined, { ...node.attrs, embed: layout === 'none' ? null : layout })
  tr.setSelection(NodeSelection.create(tr.doc, at.pos))
  editor.view.dispatch(tr)
  return true
}
