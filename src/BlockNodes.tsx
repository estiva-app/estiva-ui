import type { ComponentType } from 'react'
import { Extension, Node } from '@tiptap/core'
import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state'
import { Mapping } from '@tiptap/pm/transform'
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'

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
  doc.descendants((node, pos) => {
    const fixed = node.type.name === 'unknownBlock'
    if (!fixed && !BLOCK_TYPE_SET.has(node.type.name)) return
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
  // The start of its text, inside the paragraph a list item or quote wraps it in.
  let start = before.pos + 1
  if (!before.node.isTextblock) {
    let found = false
    before.node.descendants((node, pos) => {
      if (found) return false
      if (node.isTextblock) {
        start = before.pos + 1 + pos + 1
        found = true
      }
      return !found
    })
  }
  const at = mapping.map(start, 1)
  return copies.find((c) => c.pos < at && at < c.pos + c.node.nodeSize)
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

/** Where a block the save would give an id has none, so it would get a new one on every save. */
function unnamedBlocks(doc: ProseMirrorNode): number[] {
  const out: number[] = []
  const visit = (block: ProseMirrorNode, at: number) => {
    if (!BLOCK_TYPE_SET.has(block.type.name)) return
    const id = block.attrs.blockId
    if (typeof id !== 'string' || id === '') out.push(at)
    if (BLOCK_CONTAINERS.has(block.type.name)) block.forEach((child, offset) => visit(child, at + 1 + offset))
  }
  doc.forEach((node, offset) => visit(node, offset))
  return out
}

/**
 * Whether a change could have made a repeat or a block without an id: only a
 * step that brings in blocks can. Typing, deleting and marks bring in none,
 * so most keystrokes skip the walk.
 */
function bringsInBlocks(transactions: readonly Transaction[]): boolean {
  return transactions.some((tr) =>
    tr.steps.some((step) => {
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
          const renamed = [...repeatedBlockIds(state.doc, old.doc, mapping), ...unnamedBlocks(state.doc)]
          if (renamed.length === 0) return null
          const tr = state.tr
          for (const pos of renamed) tr.setNodeAttribute(pos, 'blockId', newBlockId())
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

/** What a reference's view is handed: the `nostr:` URI it stands for. */
export interface ReferenceViewProps {
  uri: string
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
      uri: { default: '' },
      marks: { default: [] as string[] },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-reference]' }]
  },
  renderHTML({ node }) {
    // A copy to the clipboard as HTML, and the whole drawing when no view is given.
    return ['span', { 'data-reference': String(node.attrs.uri) }, String(node.attrs.uri)]
  },
  addNodeView() {
    const View = this.options.view
    if (!View) return null
    return ReactNodeViewRenderer(({ node }: ReactNodeViewProps) => (
      <NodeViewWrapper as="span" className="inline">
        <View uri={String(node.attrs.uri ?? '')} />
      </NodeViewWrapper>
    ))
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
