import type { ComponentType, MouseEvent } from 'react'
import { Extension, InputRule, Node, type Editor } from '@tiptap/core'
import { DOMSerializer, type Node as ProseMirrorNode, type Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state'
import { Mapping, ReplaceAroundStep } from '@tiptap/pm/transform'
import type { EditorView, NodeView } from '@tiptap/pm/view'
import { NodeViewWrapper, ReactNodeViewRenderer, ReactRenderer, type ReactNodeViewProps } from '@tiptap/react'
import { Checkbox, type CheckboxProps } from './Checkbox'
import { calloutLook } from './RichText'
import { placeOf, type LinkPlace } from './LinkPlaces'
import { referenceMenuClick } from './ReferenceMenu'

/*
 * The four nodes an editor of a block document needs that a stock schema does
 * not have (SPEC §13.3) — moved here from Ship's `editorSchema.tsx` (RIC-14,
 * SHI-2) when Peek became the second editor of the same documents (MAN-9).
 *
 * They are one half of a pair. The other half is `@estiva-app/protocol`'s
 * `toEditorDocument` / `fromEditorDocument`, which turn a stored document into
 * the JSON these nodes read and back: the node names (`unknownBlock`,
 * `reference`, `attachment`) and the `blockId` attribute are that translation's,
 * and must not drift from it. This package does not import protocol, as
 * `RichText` does not: the translation hands over everything a view draws.
 *
 * Everything else a document can contain is already a ProseMirror node of the
 * same name — StarterKit's and TableKit's — which is why this file is short.
 */

/**
 * The block types §13.3 puts an id on, as the editor's node names —
 * protocol's `EDITOR_BLOCK_TYPES`, less `unknownBlock`, which declares its own.
 */
const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  // A table and everything inside it (UIG-18): a row or a cell whose id was
  // re-minted on each save would detach any comment anchored to it.
  'table',
  'tableRow',
  'tableHeader',
  'tableCell',
  // Without this an attachment's id is re-minted on every save, and every
  // comment anchored to it stops resolving.
  'attachment',
]
const BLOCK_TYPE_SET = new Set(BLOCK_TYPES)

/** protocol's `newBlockId`: six random bytes as hex. */
function newBlockId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Whether anything typed or inserted is inside — protocol's `holdsText`. An empty paragraph is not; a lone line break is. */
function holdsText(node: ProseMirrorNode): boolean {
  let found = false
  node.descendants((child) => {
    if (found) return false
    if ((child.isText && child.text !== '') || child.type.name === 'hardBreak' || child.type.name === 'reference') found = true
    return !found
  })
  return found
}

interface Claim {
  pos: number
  node: ProseMirrorNode
  /** An unknown block: the translation hands its source back untouched, so re-minting it here would be undone on save. */
  fixed: boolean
}

/** Every block that claims an id, by id, in document order. */
function claimsIn(doc: ProseMirrorNode): Map<string, Claim[]> {
  const claims = new Map<string, Claim[]>()
  doc.descendants((node, pos, parent) => {
    const fixed = node.type.name === 'unknownBlock'
    if (!fixed && !BLOCK_TYPE_SET.has(node.type.name)) return
    // A list inside a list item is no block (MAN-13): an id it arrived with is
    // cleared, never a claim that could take a real block's.
    if (parent?.type.name === 'listItem' && LISTS.has(node.type.name)) return
    const id = node.attrs.blockId
    if (typeof id !== 'string' || id === '') return
    const copies = claims.get(id)
    if (copies) copies.push({ pos, node, fixed })
    else claims.set(id, [{ pos, node, fixed }])
  })
  return claims
}

/**
 * The copy the block that was there before carried on into: where the start
 * of its content landed. Enter at the very start pushes that content into the
 * lower half; a split anywhere else leaves it in the upper; a pasted copy,
 * above or below, never moves it out of the original.
 */
function carriedOn(copies: Claim[], before: Claim, mapping: Mapping): Claim | undefined {
  if (before.node.isLeaf) {
    const at = mapping.map(before.pos, 1)
    return copies.find((c) => c.pos === at)
  }
  const at = mapping.map(textStart(before), 1)
  return copies.find((c) => c.pos < at && at < c.pos + c.node.nodeSize)
}

/** The start of a block's text, inside the paragraph a list item or quote wraps it in. */
function textStart({ pos, node }: { pos: number; node: ProseMirrorNode }): number {
  let start = pos + 1
  if (!node.isTextblock) {
    let found = false
    node.descendants((child, at) => {
      if (found) return false
      if (child.isTextblock) {
        start = pos + 1 + at + 1
        found = true
      }
      return !found
    })
  }
  return start
}

/**
 * Where a block claims an id another block keeps — see {@link BlockId}. An
 * unknown block always keeps its id; otherwise the copy the original carried
 * on into, and failing that protocol's rule: the first that holds text, or
 * the first.
 */
function repeatedBlockIds(doc: ProseMirrorNode, before: ProseMirrorNode, mapping: Mapping): number[] {
  const claims = claimsIn(doc)
  let previous: Map<string, Claim[]> | undefined
  const losers: number[] = []
  for (const [id, copies] of claims) {
    if (copies.length < 2) continue
    previous ??= claimsIn(before)
    const original = previous.get(id)?.[0]
    const owner =
      copies.find((c) => c.fixed) ??
      (original && carriedOn(copies, original, mapping)) ??
      copies.find((c) => holdsText(c.node)) ??
      copies[0]
    for (const copy of copies) if (copy !== owner && !copy.fixed) losers.push(copy.pos)
  }
  return losers
}

/**
 * The blocks a save turns into blocks — exactly what protocol's
 * `blockFromEditor` walks — so a list, a table and its rows and cells are
 * walked into, and a list item or a quote is not: the save flattens their
 * paragraph wrappers into inline runs, so an id there would be dropped.
 */
const BLOCK_CONTAINERS = new Set(['bulletList', 'orderedList', 'table', 'tableRow', 'tableHeader', 'tableCell'])

/** The wrappers the save flattens: their paragraphs become inline runs of theirs. */
const FLATTENED = new Set(['listItem', 'blockquote'])

/**
 * The lists Tab puts inside a list item (MAN-13). §13.3 keeps a list flat and
 * marks an item's depth, so the save walks into such a list for its items and
 * writes no block for the list itself: its items get ids, it gets none.
 */
const LISTS = new Set(['bulletList', 'orderedList'])

/** The lists inside a list item, with where each starts. */
function innerLists(item: ProseMirrorNode, pos: number): { pos: number; node: ProseMirrorNode }[] {
  const out: { pos: number; node: ProseMirrorNode }[] = []
  item.forEach((child, offset) => {
    if (LISTS.has(child.type.name)) out.push({ pos: pos + 1 + offset, node: child })
  })
  return out
}

const idOf = (node: ProseMirrorNode): string | undefined => {
  const id = node.attrs.blockId
  return typeof id === 'string' && id !== '' ? id : undefined
}

/** Every block the save turns into a block, in document order. */
function addressedBlocks(doc: ProseMirrorNode): { pos: number; node: ProseMirrorNode }[] {
  const out: { pos: number; node: ProseMirrorNode }[] = []
  const visit = (node: ProseMirrorNode, pos: number) => {
    if (!BLOCK_TYPE_SET.has(node.type.name)) return
    out.push({ pos, node })
    if (BLOCK_CONTAINERS.has(node.type.name)) node.forEach((child, offset) => visit(child, pos + 1 + offset))
    if (node.type.name === 'listItem') {
      for (const list of innerLists(node, pos)) list.node.forEach((child, offset) => visit(child, list.pos + 1 + offset))
    }
  }
  doc.forEach((node, offset) => visit(node, offset))
  return out
}

/** Where a block the save would give an id has none, so it would get a new one on every save. */
function unnamedBlocks(doc: ProseMirrorNode): number[] {
  return addressedBlocks(doc)
    .filter((b) => idOf(b.node) === undefined)
    .map((b) => b.pos)
}

/**
 * Where a paragraph inside a list item or a quote claims an id, or a list
 * inside a list item does — both of which the save drops.
 */
function hiddenIds(doc: ProseMirrorNode): number[] {
  const out: number[] = []
  doc.descendants((node, pos) => {
    if (!FLATTENED.has(node.type.name)) return
    node.forEach((child, offset) => {
      const inner = child.isTextblock || (node.type.name === 'listItem' && LISTS.has(child.type.name))
      if (inner && idOf(child) !== undefined) out.push(pos + 1 + offset)
    })
  })
  return out
}

/**
 * The id each block a wrap or a lift brought in takes over — see
 * {@link BlockId}. An id the save addressed before the change and does not
 * now goes to the innermost new block its text was carried into: the quote or
 * the list item around a paragraph, or the paragraph lifted out of one.
 * A block the change deleted hands nothing on. What it asks is whether the
 * block's own opening survived, the token left of its text, not its first
 * character: the `/` menu and a typed `> ` or `- ` delete what was typed at
 * the very start of the text in the same change as the wrap.
 */
function handedOver(doc: ProseMirrorNode, before: ProseMirrorNode, mapping: Mapping, unnamed: number[]): Map<number, string> {
  const out = new Map<number, string>()
  if (unnamed.length === 0) return out
  const now = new Set(addressedBlocks(doc).map((b) => idOf(b.node)))
  // By where their text starts, and of a list and its item around the same text, the item first.
  const gone = addressedBlocks(before)
    .filter((b) => !b.node.isLeaf && idOf(b.node) !== undefined && !now.has(idOf(b.node)))
    .map((b) => ({ ...b, start: textStart(b) }))
    .sort((a, b) => a.start - b.start || b.pos - a.pos)
  for (const old of gone) {
    const id = idOf(old.node)!
    const { pos: at, deleted } = mapping.mapResult(old.start, -1)
    if (deleted) continue
    let inner: number | undefined
    for (const pos of unnamed) {
      if (out.has(pos)) continue
      if (pos < at && at < pos + doc.nodeAt(pos)!.nodeSize && (inner === undefined || pos > inner)) inner = pos
    }
    if (inner !== undefined) {
      out.set(inner, id)
      now.add(id)
    }
  }
  return out
}

/**
 * Whether a change could have made a repeat or a block without an id: only a
 * step that brings in blocks can, or one that wraps or lifts them — lifting
 * the paragraph out of a quote or a one-item list brings in nothing, yet
 * leaves a block the save addresses with the wrapper's missing id. Typing,
 * deleting and marks do neither, so most keystrokes skip the walk.
 */
function bringsInBlocks(transactions: readonly Transaction[]): boolean {
  return transactions.some((tr) =>
    tr.steps.some((step) => {
      if (step instanceof ReplaceAroundStep) return true
      const slice = (step as { slice?: Slice }).slice
      let blocks = false
      slice?.content.forEach((node) => {
        if (node.isBlock) blocks = true
      })
      return blocks
    }),
  )
}

/**
 * `id` on every block, carried as the `blockId` attribute.
 *
 * A global attribute rather than one per node type, because §13.3 puts an id
 * on **every** block and a type that quietly lacked one would mint a fresh id
 * on every save — detaching each anchored comment on it (RFC 0.4 §6) with
 * nothing on screen to say so.
 *
 * Rendered as `data-block-id`, which is what `RichText` already emits, so the
 * reading and the editing surface address a block the same way.
 *
 * **A split gives the new half its own id, the moment it happens** (MAN-10).
 * ProseMirror copies a split node's attrs to both halves, so Enter leaves two
 * blocks claiming one id. Enter at the very start of a paragraph puts the
 * copy *above* it — and once something is typed there, nothing at save time
 * can tell which half was the original, so protocol's `fromEditorDocument`
 * gave the id, and every comment anchored to it, to the new line. Settled
 * here instead, in the same transaction, where the change itself says which
 * copy the original carried on into — so a copy pasted above a block does
 * not take its id either. The others get fresh ids. `fromEditorDocument`
 * keeps its own rule (the copy that holds text) as the backstop for an
 * editor without this extension; where the change says nothing, this falls
 * back to that rule too.
 *
 * **A block that arrives without an id gets one, the moment it arrives**
 * (MAN-11): a paste, a `/` menu insert, the empty paragraph a new editor
 * starts with and the one StarterKit keeps at the end. `fromEditorDocument`
 * mints an id for such a block on every save and the editor never sees it, so
 * each save gave it a different one — a blur with no edit published again, and
 * a comment anchored to it in between was detached. The editor's first
 * document is filled in when it is created, outside the undo history and
 * without an update, so opening a description is not an edit.
 *
 * **A wrap or a lift hands the id on** (MAN-12). Turning a paragraph into a
 * quote or a list wraps it, and ProseMirror leaves its attrs on the paragraph
 * inside — where the save flattens it and drops the id, so the quote or list
 * item was published under a new one and every comment anchored to the
 * paragraph was detached. The quote or the list item takes the paragraph's id
 * instead, and the list around it a fresh one; lifting the text back out hands
 * the id to the paragraph again. The paragraph inside keeps no id, as one
 * loaded from a stored document has none.
 */
export const BlockId = Extension.create({
  name: 'blockId',
  onCreate() {
    const { state, view } = this.editor
    const unnamed = unnamedBlocks(state.doc)
    if (unnamed.length === 0) return
    const tr = state.tr
    for (const pos of unnamed) tr.setNodeAttribute(pos, 'blockId', newBlockId())
    view.dispatch(tr.setMeta('addToHistory', false).setMeta('preventUpdate', true))
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockIdSplit'),
        appendTransaction: (transactions, old, state) => {
          if (!bringsInBlocks(transactions)) return null
          const mapping = new Mapping()
          for (const tr of transactions) mapping.appendMapping(tr.mapping)
          const unnamed = unnamedBlocks(state.doc)
          const handed = handedOver(state.doc, old.doc, mapping, unnamed)
          const ids = new Map<number, string | null>()
          for (const pos of repeatedBlockIds(state.doc, old.doc, mapping)) ids.set(pos, newBlockId())
          for (const pos of unnamed) ids.set(pos, handed.get(pos) ?? newBlockId())
          for (const pos of hiddenIds(state.doc)) ids.set(pos, null)
          if (ids.size === 0) return null
          const tr = state.tr
          for (const [pos, id] of ids) tr.setNodeAttribute(pos, 'blockId', id)
          return tr
        },
      }),
    ]
  },
  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element: HTMLElement) => element.getAttribute('data-block-id'),
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.blockId ? { 'data-block-id': String(attributes.blockId) } : {},
          },
        },
      },
    ]
  },
})

/** An http(s) URL, or null. */
const webUrl = (raw: string | null): string | null => (raw && /^https?:\/\/\S+$/i.test(raw) ? raw : null)

/** What a reference's view is handed: the `nostr:` URI it stands for, and the URL a URL chip was written as. */
export interface ReferenceViewProps {
  uri: string
  href?: string
  /**
   * Where it sits, so how it draws: `chip` in a sentence, `row` alone on its
   * line, `card` in the row's place (`LinkPlaces`, §13.3). Always `chip` in an
   * editor without `LinkPlaces`.
   */
  place?: LinkPlace
  /** Being edited: a click opens its menu rather than it, so a row or card shows no hover preview. */
  editing?: boolean
}

export interface ReferenceNodeOptions {
  /**
   * Draws the reference as the thing it points at — the app's own chip, which
   * knows how to resolve it. Without one, the URI is drawn as text.
   */
  view: ComponentType<ReferenceViewProps> | null
}

/**
 * A `nostr:` reference, drawn as the thing it points at — SPEC §13.1.
 *
 * An **atom**: it has no editable interior, because its text is the URI and
 * nobody edits half a `naddr`. Selecting it selects the whole reference, which
 * is also how deleting one works. `marks` carries the run's other marks, so a
 * bold reference comes back bold.
 *
 * `embed` is the card its writer chose — `detailed`, drawn in the row's place
 * when the reference is alone on its line, or null for its row (SPEC §13.3, "A
 * reference's card"; older writers wrote `compact`, which draws the row) — and
 * `extra` every key of the mark this version does not know. Both are declared
 * so that ProseMirror keeps them: an undeclared attribute is dropped when the
 * node is made, and the card with it. With `LinkPlaces`, the view is told where
 * the reference sits (`place`) and draws its chip, row or card.
 *
 * `href` makes it a **URL chip**: an app URL that reads as the chip of what it
 * names, and is that URL on the wire (§13.3). `uri` is what it names, filled in
 * by `LinkChips` once the app has resolved it; until then it draws as the URL.
 */
export const ReferenceNode = Node.create<ReferenceNodeOptions>({
  name: 'reference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addOptions() {
    return { view: null }
  },
  addAttributes() {
    return {
      // A pasted URL chip keeps only its URL: what it names is the editor's to resolve (`LinkChips`), never
      // the clipboard's, which could show one object while saving another URL (security review).
      uri: { default: '', parseHTML: (element: HTMLElement) => (webUrl(element.getAttribute('data-href')) ? '' : (element.getAttribute('data-reference') ?? '')) },
      marks: { default: [] as string[] },
      embed: { default: null as string | null, parseHTML: (element: HTMLElement) => element.getAttribute('data-embed') },
      extra: { default: null as Record<string, unknown> | null, parseHTML: () => null },
      // An http(s) URL only: `LinkChips` makes no other, and a pasted `javascript:` must not reach a saved link.
      href: { default: null as string | null, parseHTML: (element: HTMLElement) => webUrl(element.getAttribute('data-href')) },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-reference]' }]
  },
  renderHTML({ node }) {
    // A copy to the clipboard as HTML, and the whole drawing when no view is given.
    // The card goes along, so a paste keeps it; a URL chip copies as its URL.
    const embed = typeof node.attrs.embed === 'string' ? { 'data-embed': node.attrs.embed } : {}
    // Only a web address: the document's `href` is whatever its writer saved, and this attribute is read back by a paste.
    const web = webUrl(typeof node.attrs.href === 'string' ? node.attrs.href : null)
    const href = web ? { 'data-href': web } : {}
    return ['span', { 'data-reference': String(node.attrs.uri), ...embed, ...href }, String(node.attrs.href || node.attrs.uri)]
  },
  renderText({ node }) {
    return String(node.attrs.href || node.attrs.uri)
  },
  addNodeView() {
    const View = this.options.view
    if (!View) return null
    return ReactNodeViewRenderer(({ node, editor, getPos, decorations }: ReactNodeViewProps) => {
      const uri = String(node.attrs.uri ?? '')
      const href = typeof node.attrs.href === 'string' && node.attrs.href ? node.attrs.href : undefined
      const place = placeOf(decorations)
      return (
        <NodeViewWrapper
          as="span"
          // A row or a card is the whole line.
          className={place === 'chip' ? 'inline' : 'block w-full'}
          // While editing, a click opens the chip's menu (`ReferenceMenu`) rather than following the chip.
          onClickCapture={(event: MouseEvent) => {
            // A click in something the view portals out — a picker's list, a hover card — reaches here through React's
            // tree, not the page's: it is that thing's, not a click on the link.
            const pos = getPos()
            if (typeof pos !== 'number') return
            // (`Node` here is Tiptap's; a click's target is an Element.)
            const own = editor.view.nodeDOM(pos)
            if (!(event.target instanceof Element) || !own || !own.contains(event.target)) return
            // A card's own controls — its status, its owner — change it from the card, while editing too.
            if (place === 'card' && event.target.closest('button, input, select, [role="combobox"]')) return
            if (!referenceMenuClick(editor, pos)) return
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          {/* A URL chip not resolved yet reads as the URL it was written as. */}
          {uri ? <View uri={uri} {...(href ? { href } : {})} place={place} editing={editor.isEditable} /> : <span>{href}</span>}
        </NodeViewWrapper>
      )
    }, {
      // Words typed beside a link leave its node as it was, and Tiptap then skips the redraw; its place has changed (code review).
      update: ({ oldNode, newNode, oldDecorations, newDecorations, updateProps }) => {
        if (oldNode !== newNode || placeOf(oldDecorations) !== placeOf(newDecorations)) updateProps()
        return true
      },
    })
  },
})

/**
 * A block this editor has no design for, kept whole.
 *
 * §13.3: a reader MUST render an unknown block's inline text and MUST NOT drop
 * it silently. **An editor is the dangerous case** — ProseMirror discards a
 * node its schema does not know, and the save after that would delete somebody
 * else's block with no error anywhere on the way. So the block's own JSON
 * rides in `source`, and protocol's `fromEditorDocument` hands it back
 * untouched; `text` is its inline text, worked out by `toEditorDocument`.
 *
 * Not editable, deliberately: an affordance that lets a person change
 * something they cannot see is worse than one that says the content is there
 * and belongs to another surface.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/the-block-editor-kit-lives-in-protocol-and-ui.md
 */
export const UnknownBlock = Node.create({
  name: 'unknownBlock',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      blockId: { default: null },
      source: { default: null },
      text: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-unknown-block]' }]
  },
  renderHTML({ node }) {
    return ['div', { 'data-unknown-block': String(node.attrs.blockId ?? '') }, String(node.attrs.text ?? '')]
  },
  addNodeView() {
    return ReactNodeViewRenderer(UnknownBlockView)
  },
})

function UnknownBlockView({ node }: ReactNodeViewProps) {
  const source = node.attrs.source as { id?: string; type?: string } | null
  const text = String(node.attrs.text ?? '')
  return (
    <NodeViewWrapper
      data-block-id={source?.id}
      data-block-type={source?.type}
      className="rounded-md border border-border-default bg-bg-inset px-2 py-1 text-text-secondary"
    >
      {text || `A ${source?.type ?? 'block'} this app cannot edit yet.`}
    </NodeViewWrapper>
  )
}

/** What an attachment's view is handed: the block's `imeta` fields. */
export interface AttachmentViewProps {
  attrs: Record<string, unknown>
}

export interface AttachmentNodeOptions {
  /** Draws the file — the app's own attachment card. Without one, its name is drawn as text. */
  view: ComponentType<AttachmentViewProps> | null
}

/**
 * A file placed in a document — SPEC §13.3's `attachment` block (SHI-2).
 *
 * An atom: the file is the block, there is nothing inside it to edit, and a
 * caret that could sit "inside" an image is a way to produce documents no
 * reader has a rule for. Selectable and deletable, so removing one is Backspace
 * like anything else.
 *
 * Its attributes are the `imeta` fields exactly, because that is what §13.3
 * specifies. Each is declared, and that is not boilerplate: ProseMirror **drops
 * an attribute its schema does not name**, so an undeclared `thumb` would
 * survive the editor and vanish on save — the silent deletion `UnknownBlock`
 * exists to prevent.
 */
export const AttachmentNode = Node.create<AttachmentNodeOptions>({
  name: 'attachment',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addOptions() {
    return { view: null }
  },
  addAttributes() {
    return {
      url: { default: '' },
      m: { default: '' },
      x: { default: '' },
      size: { default: 0 },
      dim: { default: null },
      thumb: { default: null },
      alt: { default: null },
      filename: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-attachment-block]' }]
  },
  renderHTML({ node }) {
    // A copy to the clipboard, and the whole drawing when no view is given.
    return ['div', { 'data-attachment-block': String(node.attrs.x ?? '') }, String(node.attrs.filename ?? 'attachment')]
  },
  addNodeView() {
    const View = this.options.view
    if (!View) return null
    return ReactNodeViewRenderer(({ node }: ReactNodeViewProps) => (
      <NodeViewWrapper className="my-2">
        <View attrs={node.attrs} />
      </NodeViewWrapper>
    ))
  },
})

const TICK = 'checklistTick'

/**
 * Whether a change is a click on a checklist item's box. The click does not
 * focus the editor, so no blur follows it: an editor that saves on blur saves
 * a tick straight away instead (RIC-19, Miky 2026-10-13: one click ticks).
 */
export function isChecklistTick(transaction: Transaction): boolean {
  return transaction.getMeta(TICK) === true
}

/** A list or quote command by name: StarterKit's declare them, and this package builds without StarterKit. */
type Chain = ReturnType<Editor['chain']>
function named(chain: Chain, command: string, ...args: unknown[]): Chain {
  const own = (chain as unknown as Record<string, ((...a: unknown[]) => Chain) | undefined>)[command]
  return own ? own(...args) : chain
}

/** The list item the caret's paragraph is the first line of, if it is. */
function itemAtCaret(state: EditorState): { node: ProseMirrorNode; pos: number } | null {
  const { $from } = state.selection
  if ($from.depth < 2) return null
  const item = $from.node(-1)
  if (item.type.name !== 'listItem' || $from.index(-1) !== 0) return null
  return { node: item, pos: $from.before(-1) }
}

const sameAttrs = (a: ProseMirrorNode, b: ProseMirrorNode) =>
  Object.keys({ ...a.attrs, ...b.attrs }).every((key) => a.attrs[key] === b.attrs[key])

/**
 * A list item, drawn with a box before it when it is a checklist item. The box
 * is the package's `Checkbox`, as `RichText` draws it, and the item's own
 * text and inner lists follow it in a `div`. Any change to the item's
 * attributes draws it again, which is what a tick is.
 *
 * The box is named by the item's words, and follows them as they are typed.
 * Whether it ticks follows the editor's `editable`, read again on every
 * update — `setEditable` sends one — not only when the item was drawn
 * (Katerina, review of #170). Not editable, it is a picture, and the box around
 * it says done or not to a screen reader, as `RichText`'s does.
 */
function listItemView(editor: Editor, node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined): NodeView {
  const toDOM = node.type.spec.toDOM
  const { dom, contentDOM } = toDOM ? DOMSerializer.renderSpec(document, toDOM(node)) : { dom: document.createElement('li'), contentDOM: undefined }
  const checked = node.attrs.checked
  if (typeof checked !== 'boolean') return { dom, contentDOM: contentDOM ?? dom, update: (next) => next.type === node.type && sameAttrs(next, node) }

  const li = dom as HTMLElement
  const box = document.createElement('span')
  box.contentEditable = 'false'
  box.setAttribute('data-checklist-box', '')
  const body = document.createElement('div')
  li.replaceChildren(box, body)
  const tick = (next: boolean) => {
    const pos = getPos()
    if (pos === undefined || !view.editable) return
    view.dispatch(view.state.tr.setNodeAttribute(pos, 'checked', next).setMeta(TICK, true))
  }
  let words = node.firstChild?.textContent.trim() || 'Item'
  const props = (): CheckboxProps => ({ checked, onChange: view.editable ? tick : undefined, 'aria-label': words })
  const renderer = new ReactRenderer<unknown, CheckboxProps>(Checkbox, { editor, props: props(), as: 'span' })
  box.appendChild(renderer.element)
  // What the box last drew: an update that changes neither leaves it alone, so typing does not draw every box again.
  let drawn = ''
  const sync = () => {
    const now = `${view.editable}:${words}`
    if (now === drawn) return
    drawn = now
    renderer.updateProps(props())
    for (const [name, value] of Object.entries({ role: 'checkbox', 'aria-checked': String(checked), 'aria-readonly': 'true', 'aria-label': words })) {
      if (view.editable) box.removeAttribute(name)
      else box.setAttribute(name, value)
    }
  }
  sync()
  editor.on('update', sync)
  return {
    dom: li,
    contentDOM: body,
    update: (next) => {
      if (next.type !== node.type || !sameAttrs(next, node)) return false
      words = next.firstChild?.textContent.trim() || 'Item'
      sync()
      return true
    },
    stopEvent: (event) => box.contains(event.target as globalThis.Node),
    ignoreMutation: (mutation) => box.contains(mutation.target),
    destroy: () => {
      editor.off('update', sync)
      renderer.destroy()
    },
  }
}

/**
 * A checklist item — SPEC §13.3's `checked` on a list item (RIC-19): `true`
 * ticked, `false` not, absent a plain item. Add it beside `BlockId`.
 *
 * - **The box ticks with one click**, where the description is read, and the
 *   change says so (`isChecklistTick`), so the app saves it at once.
 * - **`[ ] ` or `[] ` at the start of a line** makes it, `[x] ` ticked; in a
 *   list it turns that item into one.
 * - **Enter** starts the next item unticked: a new item never takes the tick
 *   of the one it was split from. At the start of an item, the text moves down
 *   with its tick and the empty item above is unticked. On an empty item Enter
 *   leaves the list, as in any list.
 * - **Backspace** at the start of a checklist item takes its box away first;
 *   the next one joins it to the item above, as in any list.
 *
 * An editor without it drops `checked` on save and keeps the item and its text.
 */
export const Checklist = Extension.create({
  name: 'checklist',
  // Before the list item's own Enter and Backspace.
  priority: 101,
  addGlobalAttributes() {
    return [
      {
        types: ['listItem'],
        attributes: {
          checked: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element: HTMLElement) => {
              const value = element.getAttribute('data-checked')
              return value === 'true' ? true : value === 'false' ? false : null
            },
            renderHTML: (attributes: Record<string, unknown>) =>
              typeof attributes.checked === 'boolean' ? { 'data-checked': String(attributes.checked) } : {},
          },
        },
      },
    ]
  },
  addInputRules() {
    return [
      new InputRule({
        find: /^\[([ xX]?)\]\s$/,
        handler: ({ state, range, match, chain }) => {
          const checked = match[1].toLowerCase() === 'x'
          const inList = itemAtCaret(state) !== null
          // Without a bullet list to make, the typed text stays as it was typed.
          if (!inList && !(chain() as unknown as Record<string, unknown>).toggleBulletList) return null
          const deleted = chain().deleteRange(range)
          const listed = inList ? deleted : named(deleted, 'toggleBulletList')
          listed.updateAttributes('listItem', { checked }).run()
        },
      }),
    ]
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor
        const item = itemAtCaret(state)
        const { $from, empty } = state.selection
        if (!item || typeof item.node.attrs.checked !== 'boolean') return false
        // Over a selection: the selection goes and the next item is unticked, as for a caret in the text.
        if (!empty) return this.editor.chain().deleteSelection().splitListItem('listItem', { checked: false }).run()
        // An empty item: the list item's own Enter, which leaves the list.
        if ($from.parent.content.size === 0) return false
        if ($from.parentOffset > 0) return this.editor.commands.splitListItem('listItem', { checked: false })
        return this.editor
          .chain()
          .splitListItem('listItem', { checked: item.node.attrs.checked })
          .command(({ tr }) => {
            tr.setNodeAttribute(tr.mapping.map(item.pos), 'checked', false)
            return true
          })
          .run()
      },
      Backspace: () => {
        const { state } = this.editor
        const item = itemAtCaret(state)
        const { $from, empty } = state.selection
        if (!item || !empty || $from.parentOffset > 0 || typeof item.node.attrs.checked !== 'boolean') return false
        this.editor.view.dispatch(state.tr.setNodeAttribute(item.pos, 'checked', null))
        return true
      },
    }
  },
  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: new PluginKey('checklist'),
        props: { nodeViews: { listItem: (node, view, getPos) => listItemView(editor, node, view, getPos) } },
      }),
    ]
  },
})

/**
 * A callout — SPEC §13.3's `tone` on a quote (RIC-19): a quote drawn to stand
 * out, in one of GitHub's alert kinds (`note`, `tip`, `important`, `warning`,
 * `caution`). Its look is `RichText`'s, by `data-tone`; a tone it does not
 * know looks like `note`, and the editor keeps it as written. Add it beside
 * `BlockId`.
 */
export const Callout = Extension.create({
  name: 'callout',
  addGlobalAttributes() {
    return [
      {
        types: ['blockquote'],
        attributes: {
          tone: {
            default: null,
            parseHTML: (element: HTMLElement) => element.getAttribute('data-tone'),
            // As `RichText` draws it: the tone as written, and the look it is drawn in.
            renderHTML: (attributes: Record<string, unknown>) =>
              typeof attributes.tone === 'string' ? { 'data-tone': attributes.tone, 'data-callout': calloutLook(attributes.tone) } : {},
          },
        },
      },
    ]
  },
})
