/**
 * Where a reference in a block document sits, and so how it draws — SPEC §13.3,
 * "A reference's card" (C22, C24): its chip in a sentence, its row alone on its
 * line, and its card in the row's place when its writer chose one.
 *
 * The rule is the protocol's (`documentLineDrawOf` in `@estiva-app/protocol`),
 * read here off the editor's own tree so it can be asked on every keystroke
 * without writing the document out. `linkPlaces.test.ts` runs the same
 * documents through both and holds them to one answer.
 *
 * - **Alone on its line**: a top-level paragraph, or a list item's, whose line
 *   (up to a hard break) holds this reference and nothing but spaces besides.
 *   A heading, a quote, a callout and a table cell are sentences, and so is
 *   anything inside a block this rule does not name.
 * - **A marker around it** (bold, italic, code…) makes it a sentence.
 * - **A person or a Folder** alone on its line stays a chip.
 * - **Its card** is `embed` `detailed`; anything else (none, `compact`, a value
 *   this version does not know) draws the row.
 *
 * `LinkPlaces` puts each reference's place on a node decoration, which
 * `ReferenceNode`'s view reads and hands to the app's view as `place`.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-link-on-words-counts-toward-the-card.md
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-lone-links-chip-menu-offers-row-or-card.md
 */
import { Extension } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { thingKindOf } from './KindIcon'
import type { LinkedKind } from './linked'

/** How a reference draws: its chip, its row, or its card in the row's place. */
export type LinkPlace = 'chip' | 'row' | 'card'

/** The blocks a line may sit inside and still be alone: a list and its items. */
const CONTAINERS = new Set(['bulletList', 'orderedList', 'listItem'])

const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

/** The 5-bit words of a bech32 string's data part, checksum dropped, or null. */
function bech32Words(text: string): number[] | null {
  const at = text.lastIndexOf('1')
  if (at < 1 || text.length - at < 7) return null
  const words: number[] = []
  for (const char of text.slice(at + 1, -6)) {
    const word = BECH32.indexOf(char)
    if (word < 0) return null
    words.push(word)
  }
  return words
}

/** An `naddr`'s kind (TLV type 3), or null when it does not hold one. */
function naddrKind(naddr: string): number | null {
  const words = bech32Words(naddr)
  if (!words) return null
  const bytes: number[] = []
  let acc = 0
  let bits = 0
  for (const word of words) {
    acc = (acc << 5) | word
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((acc >> bits) & 0xff)
    }
  }
  for (let i = 0; i + 1 < bytes.length; ) {
    const type = bytes[i]
    const length = bytes[i + 1]
    if (type === 3 && length === 4 && i + 6 <= bytes.length) return ((bytes[i + 2] << 24) | (bytes[i + 3] << 16) | (bytes[i + 4] << 8) | bytes[i + 5]) >>> 0
    i += 2 + length
  }
  return null
}

/** A Folder's kind. */
const FOLDER = 39000

/** A document's kind: it draws a page, as `linkedFrom` draws it. */
const PAGE = 30842

/**
 * What a `nostr:` reference names, by the icon it draws, read off its address
 * alone: a message (`nevent`, `note`), a file by its kind (`naddr`, a document
 * a page), or undefined for what has no kind icon (a person, anything else).
 */
export function linkedKindOfReference(uri: string): LinkedKind | undefined {
  const bare = uri.toLowerCase().replace(/^nostr:/, '')
  if (bare.startsWith('nevent1') || bare.startsWith('note1')) return 'message'
  if (!bare.startsWith('naddr1')) return undefined
  const kind = naddrKind(bare)
  if (kind === null) return undefined
  return kind === PAGE ? 'page' : thingKindOf(kind)
}

/**
 * Whether what `uri` names stays a chip alone on its line: a person (`npub`,
 * `nprofile`) or a Folder (an `naddr` of kind 39000).
 */
export function staysChip(uri: string): boolean {
  const bare = uri.toLowerCase().replace(/^nostr:/, '')
  if (bare.startsWith('npub1') || bare.startsWith('nprofile1')) return true
  return bare.startsWith('naddr1') && naddrKind(bare) === FOLDER
}

/** Whether the textblock holding `pos` keeps the line rule: a paragraph at the top, or a list item's. */
function keepsLineRule(doc: PmNode, pos: number): boolean {
  const $pos = doc.resolve(pos)
  if ($pos.parent.type.name !== 'paragraph' && $pos.parent.type.name !== 'listItem') return false
  for (let depth = 1; depth < $pos.depth; depth++) if (!CONTAINERS.has($pos.node(depth).type.name)) return false
  return true
}

/** Whether the reference at `index` of `block` is alone on its line: only spaces beside it, up to a hard break either side. */
function aloneOnLine(block: PmNode, index: number): boolean {
  for (const step of [-1, 1]) {
    for (let i = index + step; i >= 0 && i < block.childCount; i += step) {
      const child = block.child(i)
      if (child.type.name === 'hardBreak') break
      if (!child.isText || (child.text ?? '').trim() !== '') return false
    }
  }
  return true
}

/** How the reference node at `pos` draws. Anything that is not a reference with a `uri` draws as a chip. */
export function linkPlaceAt(doc: PmNode, pos: number): LinkPlace {
  const node = doc.nodeAt(pos)
  if (!node || node.type.name !== 'reference') return 'chip'
  const uri = String(node.attrs.uri ?? '')
  // A URL chip whose URL is not resolved yet names nothing: it reads as the URL.
  if (!uri || staysChip(uri)) return 'chip'
  if (Array.isArray(node.attrs.marks) && node.attrs.marks.length > 0) return 'chip'
  if (!keepsLineRule(doc, pos)) return 'chip'
  const $pos = doc.resolve(pos)
  if (!aloneOnLine($pos.parent, $pos.index())) return 'chip'
  return node.attrs.embed === 'detailed' ? 'card' : 'row'
}

/** Every reference that does not draw as its chip, with its place. */
export function linkPlaces(doc: PmNode): { pos: number; size: number; place: Exclude<LinkPlace, 'chip'> }[] {
  const out: { pos: number; size: number; place: Exclude<LinkPlace, 'chip'> }[] = []
  doc.descendants((node, pos) => {
    if (node.type.name !== 'reference') return true
    const place = linkPlaceAt(doc, pos)
    if (place !== 'chip') out.push({ pos, size: node.nodeSize, place })
    return false
  })
  return out
}

/** The place a node view's decorations give it; `chip` without one. */
export function placeOf(decorations: readonly Decoration[] | undefined): LinkPlace {
  for (const decoration of decorations ?? []) {
    const place = (decoration.spec as { linkPlace?: LinkPlace }).linkPlace
    if (place) return place
  }
  return 'chip'
}

const key = new PluginKey<DecorationSet>('linkPlaces')

/**
 * Marks each reference that draws as its row or its card, for `ReferenceNode`'s
 * view. Without it every reference is a chip, as in a message's box.
 */
export const LinkPlaces = Extension.create({
  name: 'linkPlaces',
  addProseMirrorPlugins() {
    const decorate = (doc: PmNode) =>
      DecorationSet.create(
        doc,
        linkPlaces(doc).map(({ pos, size, place }) => Decoration.node(pos, pos + size, { 'data-link-place': place }, { linkPlace: place })),
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
