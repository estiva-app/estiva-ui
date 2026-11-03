import { Extension, type Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/** Where an asked block's card is drawn: beside its words, or under them at phone width. */
export type AskedSlot = 'beside' | 'under'

/** The blocks that ask, and where each one's card is drawn. */
interface AskedState {
  ids: readonly string[]
  /** The element one asked block's card is drawn into, there: the editor's, kept for as long as it asks. */
  slot: ((id: string, where: AskedSlot) => HTMLElement) | null
}

const askedBlocksKey = new PluginKey<AskedState>('askedBlocks')

/**
 * A block both people changed: marked by a bar in the accent colour at its edge, with the card that holds your version
 * beside its words, which wrap beside it and keep the next block below both. At phone width the card sits under the
 * block instead (the story `Project changes`, approved 2 November).
 */
export const ASKED_BLOCK_CLASSES = {
  block: '-ml-3 flow-root border-l-2 border-accent-primary pl-2.5',
  beside: 'hidden md:float-right md:ml-3 md:block md:w-64',
  under: 'mt-2 block md:hidden',
} as const

/** Each block with a `blockId` the editor holds, and where it is. */
export function blockAt(doc: ProseMirrorNode, id: string): { node: ProseMirrorNode; pos: number } | null {
  let found: { node: ProseMirrorNode; pos: number } | null = null
  doc.descendants((node, pos) => {
    if (found) return false
    if (node.attrs.blockId === id) {
      found = { node, pos }
      return false
    }
    return true
  })
  return found
}

/**
 * The blocks a refused save asks about (`DocumentEditor`'s `DocumentAsks`), drawn as decorations so a save never
 * carries them: the bar at the block's edge, and a slot at its end that the editor draws "Your version" into.
 */
export const AskedBlocks = Extension.create({
  name: 'askedBlocks',

  addProseMirrorPlugins() {
    return [
      new Plugin<AskedState>({
        key: askedBlocksKey,
        state: {
          init: () => ({ ids: [], slot: null }),
          apply(tr, previous) {
            return (tr.getMeta(askedBlocksKey) as AskedState | undefined) ?? previous
          },
        },
        props: {
          decorations(state) {
            const { ids, slot } = askedBlocksKey.getState(state) ?? { ids: [], slot: null }
            if (!slot || ids.length === 0) return null
            const drawn: Decoration[] = []
            for (const id of ids) {
              const at = blockAt(state.doc, id)
              if (!at) continue
              const end = at.pos + at.node.nodeSize
              drawn.push(Decoration.node(at.pos, end, { class: ASKED_BLOCK_CLASSES.block, 'data-asked-block': id }))
              // The same element each time, so the card drawn into it stays as the text around it changes. Beside: first in
              // the block, so its words wrap from its top; under: last.
              const widget = { ignoreSelection: true, stopEvent: () => true }
              drawn.push(Decoration.widget(at.pos + 1, () => slot(id, 'beside'), { ...widget, key: `asked-${id}-beside`, side: -1 }))
              drawn.push(Decoration.widget(end - 1, () => slot(id, 'under'), { ...widget, key: `asked-${id}-under`, side: 1 }))
            }
            return drawn.length ? DecorationSet.create(state.doc, drawn) : null
          },
        },
      }),
    ]
  },
})

/** Draw these blocks as asking, with their cards in `slot`; none, to draw nothing. */
export function setAskedBlocks(editor: Editor, ids: readonly string[], slot: (id: string, where: AskedSlot) => HTMLElement) {
  if (editor.isDestroyed) return
  editor.view.dispatch(editor.state.tr.setMeta(askedBlocksKey, { ids, slot }))
}
