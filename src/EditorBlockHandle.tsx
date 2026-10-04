import { useMemo, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { IconCopy, IconTrash } from '@tabler/icons-react'
import { BlockHandle, blockAtY, type BlockHandleEditing, type HandleBlock } from './BlockHandle'
import { MenuItem, MenuSub } from './Menu'

/** A row of the block menu's Turn into: what the block becomes. */
export interface BlockTurnInto {
  label: string
  /** Turns the block the caret is in. The handle puts the caret there first. */
  run: (editor: Editor) => void
  /** Whether the block already is this — drawn as the selected row. */
  active?: (node: ProseMirrorNode) => boolean
}

export interface EditorBlockHandleProps {
  /** The editor. Not editable, or not there yet, and the handle reads: the caller's rows only. */
  editor: Editor | null
  /** Turn into's rows. Offered for a block of text — a paragraph, a heading, code. */
  turnInto?: readonly BlockTurnInto[]
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
export function EditorBlockHandle({ editor, turnInto = [], actions, children, className }: EditorBlockHandleProps) {
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
        return (
          <>
            {node.isTextblock && turnInto.length > 0 && (
              <MenuSub label="Turn into">
                {turnInto.map((row) => (
                  <MenuItem
                    key={row.label}
                    label={row.label}
                    selected={row.active?.(node) ?? false}
                    onClick={() => {
                      // Inside the block's text, so the row's command turns this block and no other.
                      editor.chain().focus().setTextSelection(pos + 1).run()
                      row.run(editor)
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
