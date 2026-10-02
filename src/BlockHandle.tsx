import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { IconCopy, IconGripVertical, IconTrash } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuSeparator, MenuSub } from './Menu'

/** The block the pointer is on: its §13.3 id, its element, and — in an editor — where it starts. */
export interface HandleBlock {
  /** `undefined` only for a block that has none yet, which nothing can address. */
  id: string | undefined
  element: HTMLElement
  /** Position before the block in the editor's document; absent when reading. */
  pos?: number
}

/** A row of the block menu's Turn into: what the block becomes. */
export interface BlockTurnInto {
  label: string
  /** Turns the block the caret is in. The handle puts the caret there first. */
  run: (editor: Editor) => void
  /** Whether the block already is this — drawn as the selected row. */
  active?: (node: ProseMirrorNode) => boolean
}

export interface BlockHandleProps {
  /** The editor, when the person can edit — drag, Turn into, Duplicate and Delete need it. Leave it off to read. */
  editor?: Editor | null
  /** Turn into's rows. Offered for a block of text — a paragraph, a heading, code — and only while editing. */
  turnInto?: readonly BlockTurnInto[]
  /** The caller's own rows, after the editing ones — a link to the block, a comment on it. */
  actions?: (block: HandleBlock) => ReactNode
  /** What the blocks are drawn in: an `EditorContent`, or a reading surface whose top-level elements carry `data-block-id`. */
  children: ReactNode
  className?: string
}

/** Where a top-level block's element is, and what it is, in an editor's document. */
function editorBlocks(view: EditorView): { pos: number; node: ProseMirrorNode; element: HTMLElement }[] {
  const out: { pos: number; node: ProseMirrorNode; element: HTMLElement }[] = []
  view.state.doc.forEach((node, pos) => {
    const element = view.nodeDOM(pos)
    if (element instanceof HTMLElement) out.push({ pos, node, element })
  })
  return out
}

/** A block's id as the reading surface writes it: on the element, or on the first that has one inside it (a table's wrapper). */
function readId(element: HTMLElement): string | undefined {
  const own = element.getAttribute('data-block-id') ?? element.querySelector('[data-block-id]')?.getAttribute('data-block-id')
  return own || undefined
}

/** The top-level block level with `y`, or the nearest above it — the gap between two blocks belongs to the one before. */
export function blockAtY(container: HTMLElement, y: number, editor?: Editor | null): HandleBlock | null {
  const candidates: HandleBlock[] = editor
    ? editorBlocks(editor.view).map(({ pos, node, element }) => ({ id: (node.attrs.blockId as string | null) || undefined, element, pos }))
    : Array.from(container.children)
        .filter((el): el is HTMLElement => el instanceof HTMLElement)
        .map((element) => ({ id: readId(element), element }))
        .filter((b) => b.id !== undefined)
  let found: HandleBlock | null = null
  for (const block of candidates) {
    if (block.element.getBoundingClientRect().top > y) break
    found = block
  }
  return found ?? candidates[0] ?? null
}

/** The handle's 24px, against the block's first line. */
const HANDLE = 24

/**
 * How far down the block the handle starts, so it is centred on the first
 * line: a heading's line is taller than a paragraph's. A table's or a list's
 * first line is its first descendant's.
 */
function firstLineOffset(element: HTMLElement): number {
  const text = element.querySelector<HTMLElement>('p, h1, h2, h3, pre, li') ?? element
  const line = parseFloat(getComputedStyle(text).lineHeight)
  if (!Number.isFinite(line)) return 0
  const inset = text === element ? 0 : text.getBoundingClientRect().top - element.getBoundingClientRect().top
  return inset + (line - HANDLE) / 2
}

/** A copy of the block straight after it. `BlockId` gives the copy a fresh id; the original keeps its own. */
export function duplicateBlock(editor: Editor, pos: number): boolean {
  const node = editor.state.doc.nodeAt(pos)
  if (!node) return false
  editor.view.dispatch(editor.state.tr.insert(pos + node.nodeSize, node).scrollIntoView())
  return true
}

/** Removes the block. The last block of a document becomes an empty paragraph, since a document holds at least one. */
export function deleteBlock(editor: Editor, pos: number): boolean {
  const { state } = editor
  const node = state.doc.nodeAt(pos)
  if (!node) return false
  const tr = state.doc.childCount === 1 ? state.tr.replaceWith(pos, pos + node.nodeSize, state.schema.nodes.paragraph.create()) : state.tr.delete(pos, pos + node.nodeSize)
  editor.view.dispatch(tr)
  return true
}

/**
 * Starts the browser's own drag of the block, as ProseMirror starts one of a
 * selected node: the block selected, its slice on `view.dragging` with `move`,
 * and its HTML on the transfer. ProseMirror's drop then deletes the selection
 * and inserts the slice with its attributes — so the block arrives with the
 * id it left with, and every comment anchored to it still finds it.
 */
export function startBlockDrag(view: EditorView, pos: number, event: Pick<globalThis.DragEvent, 'dataTransfer'>, image?: Element) {
  const selection = NodeSelection.create(view.state.doc, pos)
  view.dispatch(view.state.tr.setSelection(selection))
  const slice = selection.content()
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
 * The handle at the left of the block under the pointer: drag it to move the
 * block, press it for the block's menu — Turn into, Duplicate and Delete while
 * editing, and whatever the caller adds. Reading, it offers only the caller's
 * rows, so someone who cannot edit can still point at one block.
 *
 * It sits in the gutter left of the content, 28px out, so wrapping the content
 * moves nothing.
 */
export function BlockHandle({ editor, turnInto = [], actions, children, className }: BlockHandleProps) {
  const frame = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [block, setBlock] = useState<HandleBlock | null>(null)
  const [top, setTop] = useState(0)
  const [open, setOpen] = useState(false)
  const editing = !!editor && editor.isEditable

  const follow = useCallback(
    (y: number) => {
      if (!content.current || !frame.current) return
      // An editor draws its blocks one level down, in the element ProseMirror owns.
      const root = editor ? editor.view.dom : (content.current.firstElementChild as HTMLElement | null) ?? content.current
      const found = blockAtY(root, y, editor)
      setBlock(found)
      if (found) setTop(found.element.getBoundingClientRect().top - frame.current.getBoundingClientRect().top + firstLineOffset(found.element))
    },
    [editor],
  )

  // A block moved or deleted under an open menu would leave it acting on a stale position.
  useEffect(() => {
    if (!editor) return
    const forget = () => {
      if (!open) setBlock(null)
    }
    editor.on('update', forget)
    return () => {
      editor.off('update', forget)
    }
  }, [editor, open])

  const node = editor && block?.pos !== undefined ? editor.state.doc.nodeAt(block.pos) : null
  const own = actions && block ? actions(block) : null
  const editingRows = editing && node && block?.pos !== undefined
  const canTurn = editingRows && node.isTextblock && turnInto.length > 0

  return (
    <div
      ref={frame}
      className={cn('relative', className)}
      onMouseMove={(e) => {
        if (!open) follow(e.clientY)
      }}
      onMouseLeave={() => {
        if (!open) setBlock(null)
      }}
    >
      <div ref={content}>{children}</div>
      {block && (editing || own) && (
        // The top is the block's, measured: it depends on the document, not on a size of ours.
        <div className={cn('absolute -left-7', editing && 'cursor-grab active:cursor-grabbing')} style={{ top }}>
          <Menu
            open={open}
            onOpenChange={setOpen}
            trigger={
              <IconButton
                aria-label="Block menu"
                tooltip={editing ? 'Drag to move, click for the menu' : 'Menu'}
                draggable={editing}
                onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                  if (!editor || block.pos === undefined) return
                  setOpen(false)
                  startBlockDrag(editor.view, block.pos, e.nativeEvent, block.element)
                }}
                onDragEnd={() => {
                  // ProseMirror clears this on its own dragend, which a drag started outside its element never reaches.
                  if (editor) setTimeout(() => (editor.view.dragging = null), 50)
                  setBlock(null)
                }}
              >
                <IconGripVertical size={16} stroke={1.5} />
              </IconButton>
            }
          >
            {canTurn && (
              <MenuSub label="Turn into">
                {turnInto.map((row) => (
                  <MenuItem
                    key={row.label}
                    label={row.label}
                    selected={row.active?.(node) ?? false}
                    onClick={() => {
                      // Inside the block's text, so the row's command turns this block and no other.
                      editor.chain().focus().setTextSelection(block.pos! + 1).run()
                      row.run(editor)
                    }}
                  />
                ))}
              </MenuSub>
            )}
            {editingRows && (
              <>
                <MenuItem label="Duplicate" leading={<IconCopy size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => duplicateBlock(editor, block.pos!)} />
                <MenuItem label="Delete" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={() => deleteBlock(editor, block.pos!)} />
              </>
            )}
            {editingRows && own && <MenuSeparator />}
            {own}
          </Menu>
        </div>
      )}
    </div>
  )
}
