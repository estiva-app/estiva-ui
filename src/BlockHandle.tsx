import { useCallback, useEffect, useRef, useState, type DragEvent, type MouseEvent, type ReactNode } from 'react'
import type { BaseUIEvent } from '@base-ui/react/types'
import { IconGripVertical } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Menu, MenuSeparator } from './Menu'

/** The block the pointer is on: its §13.3 id, its element, and — in an editor — where it starts. */
export interface HandleBlock {
  /** `undefined` only for a block that has none yet, which nothing can address. */
  id: string | undefined
  element: HTMLElement
  /** Position before the block in the editor's document; absent when reading. */
  pos?: number
}

/** What `EditorBlockHandle` hands this part to make it edit. A reading surface leaves it off. */
export interface BlockHandleEditing {
  /** The block level with `y`, in the editor's own document. */
  find: (y: number) => HandleBlock | null
  /** The editing rows, before the caller's. */
  rows: (block: HandleBlock) => ReactNode
  /** Starts the browser's drag of the block; the handle is draggable only with this. */
  startDrag: (block: HandleBlock, event: globalThis.DragEvent) => void
  endDrag: () => void
  /** Calls back when the document changes, so a block found before is found again. Returns the unsubscribe. */
  onChange: (changed: () => void) => () => void
}

export interface BlockHandleProps {
  /** The caller's own rows — a link to the block, a comment on it. Reading, they are the whole menu; with none, no handle is drawn. */
  actions?: (block: HandleBlock) => ReactNode
  /** Given by `EditorBlockHandle` (from `@estiva-app/ui/editor`). Leave it off to read. */
  editing?: BlockHandleEditing
  /** What the blocks are drawn in. Reading: a surface whose top-level elements carry `data-block-id`, as `RichText` draws. */
  children: ReactNode
  className?: string
}

/** A block's id as a reading surface writes it: on the element, or on the first inside it (a table's wrapper). */
function readId(element: HTMLElement): string | undefined {
  const own = element.getAttribute('data-block-id') ?? element.querySelector('[data-block-id]')?.getAttribute('data-block-id')
  return own || undefined
}

/** The last of `blocks` whose top is at or above `y` — the gap between two blocks belongs to the one before. */
export function blockAtY(blocks: readonly HandleBlock[], y: number): HandleBlock | null {
  let found: HandleBlock | null = null
  for (const block of blocks) {
    if (block.element.getBoundingClientRect().top > y) break
    found = block
  }
  return found ?? blocks[0] ?? null
}

/** The top-level blocks of a reading surface: its root's children that carry an id. */
function readingBlocks(root: Element | null): HandleBlock[] {
  if (!root) return []
  return Array.from(root.children)
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .map((element) => ({ id: readId(element), element }))
    .filter((b) => b.id !== undefined)
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

/**
 * The handle at the left of the block under the pointer, and the block's menu
 * behind it. Reading, the menu is the caller's rows only, so someone who
 * cannot edit can still point at one block — copy a link to it, comment on
 * it. In an editor, `EditorBlockHandle` adds the drag, Turn into, Duplicate
 * and Delete.
 *
 * It sits in the gutter left of the content, 28px out, so wrapping the content
 * moves nothing. The gutter counts as the block's, as in Notion: the handle
 * stays while the pointer crosses to it.
 */
export function BlockHandle({ actions, editing, children, className }: BlockHandleProps) {
  const frame = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [block, setBlock] = useState<HandleBlock | null>(null)
  const [top, setTop] = useState(0)
  const [open, setOpen] = useState(false)

  const follow = useCallback(
    (y: number) => {
      if (!content.current || !frame.current) return
      const found = editing ? editing.find(y) : blockAtY(readingBlocks(content.current.firstElementChild), y)
      setBlock(found)
      if (found) setTop(found.element.getBoundingClientRect().top - frame.current.getBoundingClientRect().top + firstLineOffset(found.element))
    },
    [editing],
  )

  // A block moved or deleted under the handle would leave its rows acting on a stale position.
  useEffect(() => {
    if (!editing) return
    return editing.onChange(() => {
      if (!open) setBlock(null)
    })
  }, [editing, open])

  const rows = editing && block ? editing.rows(block) : null
  const own = actions && block ? actions(block) : null

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
      {/* The gutter is the frame's own, so the pointer on its way from the text to the handle never leaves it. */}
      <div aria-hidden className="absolute inset-y-0 -left-7 w-7" />
      {block && (rows || own) && (
        // The top is the block's, measured: it depends on the document, not on a size of ours.
        <div className={cn('absolute -left-7', rows && 'cursor-grab active:cursor-grabbing')} style={{ top }}>
          <Menu
            open={open}
            onOpenChange={setOpen}
            trigger={
              <IconButton
                aria-label="Block menu"
                tooltip={rows ? 'Drag to move, click for the menu' : 'Menu'}
                draggable={!!rows}
                // Base UI opens a menu on the press, so a drag flashed it open.
                // The handle's menu opens on the click instead, as Notion's does:
                // a press that becomes a drag never clicks.
                onMouseDown={(e: BaseUIEvent<MouseEvent<HTMLButtonElement>>) => e.preventBaseUIHandler()}
                onClick={(e: BaseUIEvent<MouseEvent<HTMLButtonElement>>) => {
                  e.preventBaseUIHandler()
                  setOpen((was) => !was)
                }}
                onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                  if (!editing || !rows) return
                  setOpen(false)
                  editing.startDrag(block, e.nativeEvent)
                }}
                onDragEnd={() => {
                  editing?.endDrag()
                  setBlock(null)
                }}
              >
                <IconGripVertical size={16} stroke={1.5} />
              </IconButton>
            }
          >
            {rows}
            {rows && own && <MenuSeparator />}
            {own}
          </Menu>
        </div>
      )}
    </div>
  )
}
