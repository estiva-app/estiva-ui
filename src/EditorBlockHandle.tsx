import { useMemo, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { IconCopy, IconTrash } from '@tabler/icons-react'
import { BlockHandle, blockAtY, type BlockHandleEditing, type HandleBlock } from './BlockHandle'
import { Selection } from '@tiptap/pm/state'
import { MenuItem, MenuSub } from './Menu'
import { DOCUMENT_FORMATS, FORMATS, applyFormat, type FormatId } from './ComposerTriggers'

/** A row of the block menu's Turn into: what the block becomes. */
export interface BlockTurnInto {
  label: string
  /**
   * Turns the block. The handle puts the caret in a block of text first, so a
   * row for one can act at the caret; `pos` is where the block starts, for a
   * list or a quote, whose row acts on the whole block.
   */
  run: (editor: Editor, pos: number) => void
  /** Whether the block already is this — drawn as the selected row. */
  active?: (node: ProseMirrorNode) => boolean
}

export interface EditorBlockHandleProps {
  /** The editor. Not editable, or not there yet, and the handle reads: the caller's rows only. */
  editor: Editor | null
  /**
   * Turn into's rows for a block. By default `turnIntoRows`, the same in every
   * app: a block of text, a list and a quote each get theirs. A list of rows
   * instead is offered for a block of text only; `[]` offers none.
   */
  turnInto?: readonly BlockTurnInto[] | ((node: ProseMirrorNode, editor: Editor) => readonly BlockTurnInto[])
  /** The caller's own rows, after the editing ones. */
  actions?: (block: HandleBlock) => ReactNode
  /** The `EditorContent`. */
  children: ReactNode
  className?: string
}

/** The editor's top-level blocks, where each starts and what it is. */
function editorBlocks(view: EditorView): HandleBlock[] {
  const out: HandleBlock[] = []
  view.state.doc.forEach((node, pos) => {
    const element = view.nodeDOM(pos)
    if (element instanceof HTMLElement) out.push({ id: (node.attrs.blockId as string | null) || undefined, element, pos })
  })
  return out
}

/*
  Duplicate and Delete leave the editor focused, as Turn into and a drop do: the
  person is still in the field, so an editor that saves when they leave it saves
  these too — and one that loads someone else's edit while unfocused does not
  load it over them.
*/

/** A copy of the block straight after it, the caret in the copy. `BlockId` gives the copy a fresh id; the original keeps its own. */
export function duplicateBlock(editor: Editor, pos: number): boolean {
  const node = editor.state.doc.nodeAt(pos)
  if (!node) return false
  editor.view.dispatch(editor.state.tr.insert(pos + node.nodeSize, node).scrollIntoView())
  editor.commands.focus(pos + node.nodeSize + 1)
  return true
}

/** Removes the block, the caret where it was. The last block of a document becomes an empty paragraph, since a document holds at least one. */
export function deleteBlock(editor: Editor, pos: number): boolean {
  const { state } = editor
  const node = state.doc.nodeAt(pos)
  if (!node) return false
  const tr = state.doc.childCount === 1 ? state.tr.replaceWith(pos, pos + node.nodeSize, state.schema.nodes.paragraph.create()) : state.tr.delete(pos, pos + node.nodeSize)
  editor.view.dispatch(tr)
  editor.commands.focus(Math.min(pos + 1, editor.state.doc.content.size))
  return true
}

/**
 * Moves the block at `from` to `to` (a position between top-level blocks), the
 * caret in it: what a drop in the gutter does, where the editor has no drop of
 * its own. The node moves whole, attributes and all, so it keeps its id, as
 * ProseMirror's drop keeps it.
 */
export function moveBlock(editor: Editor, from: number, to: number): boolean {
  const node = editor.state.doc.nodeAt(from)
  if (!node || (to >= from && to <= from + node.nodeSize)) return false
  const tr = editor.state.tr.delete(from, from + node.nodeSize)
  const at = tr.mapping.map(to)
  editor.view.dispatch(tr.insert(at, node).scrollIntoView())
  editor.commands.focus(at + 1)
  return true
}

/**
 * Starts the browser's own drag of the block, as ProseMirror starts one of a
 * selected node: the block selected, its slice on `view.dragging` with `move`,
 * and its HTML on the transfer. ProseMirror's drop then deletes the selection
 * and inserts the slice with its attributes — so the block arrives with the
 * id it left with, and every comment anchored to it still finds it.
 */
export function startBlockDrag(editor: Editor, pos: number, event: Pick<globalThis.DragEvent, 'dataTransfer'>, image?: Element) {
  editor.commands.setNodeSelection(pos)
  const { view } = editor
  const slice = view.state.selection.content()
  const { dom, text } = view.serializeForClipboard(slice)
  const transfer = event.dataTransfer
  if (transfer) {
    transfer.clearData()
    transfer.setData('text/html', dom.innerHTML)
    transfer.setData('text/plain', text)
    transfer.effectAllowed = 'copyMove'
    if (image) transfer.setDragImage(image, 0, 0)
  }
  view.dragging = { slice, move: true }
}

/**
 * The drop line a dragged block shows, in the package's accent instead of the
 * editor's default (the text's colour). Give it to the editor's StarterKit:
 * `StarterKit.configure({ dropcursor: blockDropCursor })`.
 */
export const blockDropCursor = { color: false, class: 'bg-accent-primary' } as const

const NOTHING_YET: BlockHandleEditing = { find: () => null, rows: () => null, startDrag: () => {}, drop: () => {}, endDrag: () => {}, onChange: () => () => {} }

/**
 * `BlockHandle` in an editor: drag the handle to move the block, and the menu
 * gains Turn into, Duplicate and Delete before the caller's rows.
 */
export function EditorBlockHandle({ editor, turnInto = turnIntoRows, actions, children, className }: EditorBlockHandleProps) {
  const editing = useMemo<BlockHandleEditing>(() => {
    // Before the editor exists there is no block to find — not the editor's whole element read as one.
    if (!editor) return NOTHING_YET
    // Where the block being dragged starts.
    let dragged: number | undefined
    return {
      find: (y) => blockAtY(editorBlocks(editor.view), y),
      rows: (block) => {
        const pos = block.pos
        // Not editable: the caller's rows only, and no drag.
        if (!editor.isEditable) return null
        const node = pos === undefined ? null : editor.state.doc.nodeAt(pos)
        if (pos === undefined || !node) return null
        const turnRows = typeof turnInto === 'function' ? turnInto(node, editor) : node.isTextblock ? turnInto : []
        return (
          <>
            {turnRows.length > 0 && (
              <MenuSub label="Turn into">
                {turnRows.map((row) => (
                  <MenuItem
                    key={row.label}
                    label={row.label}
                    selected={row.active?.(node) ?? false}
                    onClick={() => {
                      // Inside a block of text, so a row's command at the caret turns this block and no other.
                      if (node.isTextblock) editor.chain().focus().setTextSelection(pos + 1).run()
                      row.run(editor, pos)
                    }}
                  />
                ))}
              </MenuSub>
            )}
            <MenuItem label="Duplicate" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => duplicateBlock(editor, pos)} />
            <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => deleteBlock(editor, pos)} />
          </>
        )
      },
      startDrag: (block, event) => {
        dragged = block.pos
        if (block.pos !== undefined) startBlockDrag(editor, block.pos, event, block.element)
      },
      drop: (target, after) => {
        const node = target.pos === undefined ? null : editor.state.doc.nodeAt(target.pos)
        if (dragged === undefined || target.pos === undefined || !node) return
        moveBlock(editor, dragged, after ? target.pos + node.nodeSize : target.pos)
      },
      // ProseMirror clears `dragging` on its own dragend, which a drag started outside its element never reaches.
      endDrag: () => setTimeout(() => (editor.view.dragging = null), 50),
      onChange: (changed) => {
        editor.on('update', changed)
        return () => {
          editor.off('update', changed)
        }
      },
    }
  }, [editor, turnInto])

  return (
    <BlockHandle editing={editing} actions={actions} className={className}>
      {children}
    </BlockHandle>
  )
}

const LISTS = ['bulletList', 'orderedList']
const isList = (node: ProseMirrorNode) => LISTS.includes(node.type.name)

/** Every item of a list, the ones nested under an item too — the editor nests what §13.3 keeps flat (MAN-13). */
function listItems(list: ProseMirrorNode, at: number): { node: ProseMirrorNode; pos: number }[] {
  const out: { node: ProseMirrorNode; pos: number }[] = []
  list.descendants((node, pos) => {
    if (node.type.name === 'listItem') out.push({ node, pos: at + 1 + pos })
  })
  return out
}

/** Whether every item of the list is a checklist item. */
const isChecklist = (list: ProseMirrorNode) => listItems(list, 0).every(({ node }) => typeof node.attrs.checked === 'boolean')

const hasExtension = (editor: Editor, name: string) => editor.extensionManager.extensions.some((e) => e.name === name)

/** The caret back in the block, the editor still focused — as Duplicate and Delete leave it, so a save on leaving saves this too. */
function caretInto(editor: Editor, pos: number) {
  const { state } = editor
  editor.view.dispatch(state.tr.setSelection(Selection.near(state.doc.resolve(Math.min(pos + 1, state.doc.content.size)))))
  editor.commands.focus()
}

export type ListKind = 'bulletList' | 'orderedList' | 'checklist' | 'text'

/**
 * Turns the whole list at `pos`, every item, the nested ones too.
 *
 * - **Bulleted, Numbered:** the list's own type changes and its attributes
 *   stay, so it keeps its id; every item's tick goes. Not Tiptap's
 *   `toggleList`, which makes the list anew — a fresh id, detaching every
 *   comment anchored to it — and then joins it into a list of that type next
 *   to it.
 * - **Checklist:** a bulleted list whose every item is a checklist item; an
 *   item already one keeps its tick.
 * - **Text:** each item becomes a paragraph that takes the item's id, as
 *   lifting an item out does (MAN-12). The list's own id goes with the list.
 *
 * `false` when there is no list at `pos`.
 */
export function turnListInto(editor: Editor, pos: number, kind: ListKind): boolean {
  const { state } = editor
  const list = state.doc.nodeAt(pos)
  if (!list || !isList(list)) return false
  const tr = state.tr
  if (kind === 'text') {
    const blocks: ProseMirrorNode[] = []
    for (const { node: item } of listItems(list, pos)) {
      item.forEach((child, _offset, index) => {
        // Its nested list's items are in `listItems` already.
        if (isList(child)) return
        // The item's first block takes its id; any other gets one of its own from `BlockId`.
        blocks.push(child.type.create({ ...child.attrs, blockId: index === 0 ? item.attrs.blockId : null }, child.content, child.marks))
      })
    }
    tr.replaceWith(pos, pos + list.nodeSize, blocks)
  } else {
    const type = state.schema.nodes[kind === 'orderedList' ? 'orderedList' : 'bulletList']
    // The list and the lists nested in it, one type throughout: §13.3's indented items are their list's type.
    tr.setNodeMarkup(pos, type, list.attrs)
    list.descendants((node, at) => {
      if (isList(node)) tr.setNodeMarkup(pos + 1 + at, type, node.attrs)
    })
    for (const { node, pos: at } of listItems(list, pos)) {
      const checked = kind === 'checklist' ? (typeof node.attrs.checked === 'boolean' ? node.attrs.checked : false) : null
      if (node.attrs.checked !== checked) tr.setNodeAttribute(at, 'checked', checked)
    }
  }
  editor.view.dispatch(tr.scrollIntoView())
  caretInto(editor, pos)
  return true
}

export type QuoteKind = 'quote' | 'note' | 'warning' | 'text'

/**
 * Turns the quote at `pos`: a plain quote, a Note or Warning callout (the
 * tone changes, the id stays), or its text, whose first paragraph takes the
 * quote's id, as lifting it out does (MAN-12). `false` when there is no quote
 * at `pos`.
 */
export function turnQuoteInto(editor: Editor, pos: number, kind: QuoteKind): boolean {
  const { state } = editor
  const quote = state.doc.nodeAt(pos)
  if (!quote || quote.type.name !== 'blockquote') return false
  const tr = state.tr
  if (kind === 'text') {
    const blocks: ProseMirrorNode[] = []
    quote.forEach((child) => blocks.push(blocks.length === 0 ? child.type.create({ ...child.attrs, blockId: quote.attrs.blockId }, child.content, child.marks) : child))
    tr.replaceWith(pos, pos + quote.nodeSize, blocks)
  } else {
    tr.setNodeAttribute(pos, 'tone', kind === 'quote' ? null : kind)
  }
  editor.view.dispatch(tr.scrollIntoView())
  caretInto(editor, pos)
  return true
}

function isFormat(node: ProseMirrorNode, id: FormatId): boolean {
  if (id === 'paragraph') return node.type.name === 'paragraph'
  if (id === 'heading') return node.type.name === 'heading' && node.attrs.level === 1
  if (id === 'subheading') return node.type.name === 'heading' && node.attrs.level === 2
  if (id === 'code') return node.type.name === 'codeBlock'
  return false
}

/**
 * The block menu's Turn into for one block, the same in every app (Miky,
 * LEAF-11's kickoff, 15 October):
 *
 * - **A block of text** — a paragraph, a heading, code: the `/` menu's Format
 *   rows, code as a block, and Checklist, Note and Warning where the editor
 *   has `Checklist` and `Callout`.
 * - **A list:** Bulleted list, Numbered list, Checklist (with `Checklist`), Text.
 * - **A quote:** Quote, Note, Warning (with `Callout`), Text.
 *
 * Anything else — a table, an attachment — none. Each keeps the block's text
 * and its id, and so the comments anchored to it.
 */
export function turnIntoRows(node: ProseMirrorNode, editor: Editor): readonly BlockTurnInto[] {
  const checklist = hasExtension(editor, 'checklist')
  const callout = hasExtension(editor, 'callout')
  if (node.isTextblock) {
    const document = DOCUMENT_FORMATS.filter((f) => (f.id === 'checklist' ? checklist : callout))
    return [...FORMATS, ...document].map((format) => ({
      label: format.label,
      run: (e) => void applyFormat(e, format.id, 'block'),
      active: (n) => isFormat(n, format.id),
    }))
  }
  if (isList(node)) {
    const rows: BlockTurnInto[] = [
      { label: 'Bulleted list', run: (e, pos) => void turnListInto(e, pos, 'bulletList'), active: (n) => n.type.name === 'bulletList' && !(checklist && isChecklist(n)) },
      { label: 'Numbered list', run: (e, pos) => void turnListInto(e, pos, 'orderedList'), active: (n) => n.type.name === 'orderedList' && !(checklist && isChecklist(n)) },
    ]
    if (checklist) rows.push({ label: 'Checklist', run: (e, pos) => void turnListInto(e, pos, 'checklist'), active: isChecklist })
    rows.push({ label: 'Text', run: (e, pos) => void turnListInto(e, pos, 'text') })
    return rows
  }
  if (node.type.name === 'blockquote') {
    const rows: BlockTurnInto[] = [{ label: 'Quote', run: (e, pos) => void turnQuoteInto(e, pos, 'quote'), active: (n) => !n.attrs.tone }]
    if (callout) {
      rows.push({ label: 'Note', run: (e, pos) => void turnQuoteInto(e, pos, 'note'), active: (n) => n.attrs.tone === 'note' })
      rows.push({ label: 'Warning', run: (e, pos) => void turnQuoteInto(e, pos, 'warning'), active: (n) => n.attrs.tone === 'warning' })
    }
    rows.push({ label: 'Text', run: (e, pos) => void turnQuoteInto(e, pos, 'text') })
    return rows
  }
  return []
}
