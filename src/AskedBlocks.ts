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
 * A block both people changed: marked by a bar in the accent colour at its edge, as long as its words and no longer,
 * with the card that holds your version beside them; its words wrap beside the card, and the next block starts below
 * both. At phone width the card sits under the block, outside the bar (the story `Project changes`, approved 2 November).
 * The block holds the card (the editor's blocks are a flex column's), so the bar is an element of its own, as tall as
 * the block's words as the plugin measures them: a widget, whose changes the editor leaves alone.
 */
export const ASKED_BLOCK_CLASSES = {
  block: 'relative -ml-3 pl-3',
  bar: 'absolute left-0 top-0 h-full w-0.5 bg-accent-primary',
  beside: 'hidden md:float-right md:ml-3 md:block md:w-64',
  under: 'mt-2 block md:hidden',
} as const

const newBar = () => {
  const bar = document.createElement('span')
  bar.className = ASKED_BLOCK_CLASSES.bar
  bar.dataset.askedBar = ''
  bar.contentEditable = 'false'
  return bar
}

/** How far down a block its words reach, leaving out the card drawn in it; `null` when it has none to measure. */
function wordsHeight(block: HTMLElement): number | null {
  const top = block.getBoundingClientRect().top
  let bottom: number | null = null
  const range = document.createRange()
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    if (text.parentElement?.closest('.ProseMirror-widget')) continue
    range.selectNodeContents(text)
    const box = range.getBoundingClientRect()
    if (box.height > 0) bottom = Math.max(bottom ?? box.bottom, box.bottom)
  }
  return bottom === null ? null : bottom - top
}

/** Each asked block's bar as tall as its words; where nothing can be measured, as tall as the block. */
function measureWords(root: HTMLElement) {
  for (const block of root.querySelectorAll<HTMLElement>('[data-asked-block]')) {
    const bar = block.querySelector<HTMLElement>('[data-asked-bar]')
    if (!bar) continue
    const height = typeof document.createRange().getBoundingClientRect === 'function' ? wordsHeight(block) : null
    const next = height === null ? '' : `${height}px`
    if (bar.style.height !== next) bar.style.height = next
  }
}

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
              // the block, so its words wrap from its top; under: after the block, outside the bar.
              const widget = { ignoreSelection: true, stopEvent: () => true }
              const widgetAt = (pos: number, where: AskedSlot, side: number) =>
                Decoration.widget(pos, () => slot(id, where), { ...widget, key: `asked-${id}-${where}`, side })
              drawn.push(
                Decoration.widget(at.pos + 1, newBar, { ...widget, key: `asked-${id}-bar`, side: -2 }),
                widgetAt(at.pos + 1, 'beside', -1),
                widgetAt(end, 'under', 1),
              )
            }
            return drawn.length ? DecorationSet.create(state.doc, drawn) : null
          },
        },
        // The bar's height, again whenever the text, the editor's width or a card (drawn after the block) changes it.
        view(view) {
          const measure = () => measureWords(view.dom)
          const resized = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
          const watch = () => {
            if (!resized) return
            resized.disconnect()
            resized.observe(view.dom)
            for (const block of view.dom.querySelectorAll('[data-asked-block]')) resized.observe(block)
          }
          watch()
          return {
            update() {
              watch()
              measure()
            },
            destroy: () => resized?.disconnect(),
          }
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
