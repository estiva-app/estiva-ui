import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import { TextSelection, type Command } from '@tiptap/pm/state'
import { addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, deleteColumn, deleteRow, deleteTable } from '@tiptap/pm/tables'
import { IconColumnInsertLeft, IconColumnInsertRight, IconGripHorizontal, IconGripVertical, IconPlus, IconRowInsertBottom, IconRowInsertTop, IconTrash } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { FLOATING_SURFACE_CLASSES } from './looks'
import { Menu, MenuItem, MenuSeparator } from './Menu'

export interface EditorTableControlsProps {
  /** The editor, with TableKit (`@tiptap/extension-table`) in its extensions. Not editable, or not there yet: no controls. */
  editor: Editor | null
  /** The `EditorContent`. */
  children: ReactNode
  className?: string
}

/** The cell the pointer is on, and the table and row it is in. */
interface Hovered {
  table: HTMLTableElement
  row: HTMLTableRowElement
  cell: HTMLTableCellElement
}

/** Where the controls go, measured from the frame: they depend on the document, not on a size of ours. */
interface Placed {
  tableBox: { top: number; left: number; width: number; height: number }
  rowBox: { top: number; height: number }
  columnBox: { left: number; width: number }
}

/*
  Every row runs the table command with the caret in a cell, as the command
  expects — the hovered cell's, or for a ➕ bar the last row's or the last
  column's — and leaves the editor focused there, as the block menu does: the
  person is still in the field, so an editor that saves when they leave it
  saves this too.
*/

/** Puts the caret in `cell` and runs `command` there. */
function inCell(editor: Editor, cell: HTMLTableCellElement, command: Command): boolean {
  const { view } = editor
  if (!view.dom.contains(cell)) return false
  const at = view.posAtDOM(cell, 0)
  view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(at))))
  const done = command(view.state, view.dispatch, view)
  editor.commands.focus()
  return done
}

/** The table's last row, or the whole table when it is its only one: a table holds at least one row (prosemirror-tables refuses to delete it). */
export function deleteTableRow(editor: Editor, cell: HTMLTableCellElement): boolean {
  const table = cell.closest('table')
  return inCell(editor, cell, table && table.rows.length > 1 ? deleteRow : deleteTable)
}

/** The same for a column: the last one deletes the table. */
export function deleteTableColumn(editor: Editor, cell: HTMLTableCellElement): boolean {
  const row = cell.closest('tr')
  return inCell(editor, cell, row && row.cells.length > 1 ? deleteColumn : deleteTable)
}

/** A row after the last one: the ➕ under the table. */
export function appendTableRow(editor: Editor, table: HTMLTableElement): boolean {
  const last = table.rows[table.rows.length - 1]?.cells[0]
  return !!last && inCell(editor, last, addRowAfter)
}

/** A column after the last one: the ➕ right of the table. */
export function appendTableColumn(editor: Editor, table: HTMLTableElement): boolean {
  const first = table.rows[0]
  const last = first?.cells[first.cells.length - 1]
  return !!last && inCell(editor, last, addColumnAfter)
}

function place(frame: HTMLElement, { table, row, cell }: Hovered): Placed {
  const at = frame.getBoundingClientRect()
  const t = table.getBoundingClientRect()
  const r = row.getBoundingClientRect()
  const c = cell.getBoundingClientRect()
  return {
    tableBox: { top: t.top - at.top, left: t.left - at.left, width: t.width, height: t.height },
    rowBox: { top: r.top - at.top, height: r.height },
    columnBox: { left: c.left - at.left, width: c.width },
  }
}

const ICON = { size: 16, stroke: 1.5, className: 'text-text-secondary' } as const

/**
 * A ➕ press keeps the focus where it is, as the selection toolbar's buttons do:
 * the person never left the field, so an editor that saves when they leave it
 * does not save half-way, and History gets one line for the edit, not one per
 * press. (A handle's menu takes the focus, as every menu does.)
 */
const keepFocus = (e: MouseEvent) => e.preventDefault()

/** What a handle and a ➕ bar sit in: the elevated surface's border and fill, opaque over the table's lines, with no shadow at this size. */
const HANDLE_BOX = cn(FLOATING_SURFACE_CLASSES, 'shadow-none')

/**
 * A table's own controls in an editor, as in Notion: point at a cell and a
 * handle sits on its row's left edge and on its column's top edge; press one
 * for Insert above and below (left and right), Delete, and Delete table. On
 * the last row a ➕ bar under the table adds a row, and on the last column one
 * right of it adds a column. Tab in
 * the last cell adds a row too — that is TableKit's own.
 *
 * Deleting a table's only row or only column deletes the table, which cannot
 * be left with none.
 *
 * Built on the editor library's own table commands; the controls are ours.
 * Wrap the `EditorContent` in it, inside an `EditorBlockHandle` if there is
 * one: the block handle stays the table's, in the gutter.
 */
export function EditorTableControls({ editor, children, className }: EditorTableControlsProps) {
  const frame = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<Hovered | null>(null)
  const [placed, setPlaced] = useState<Placed | null>(null)
  // A menu that is up keeps its row and column, wherever the pointer goes.
  const [menu, setMenu] = useState<'row' | 'column' | null>(null)
  const editable = !!editor && editor.isEditable

  const follow = useCallback(
    (target: EventTarget | null) => {
      if (!editor || !frame.current || !(target instanceof Element)) return
      // On a control of ours: keep what it was drawn for.
      if (target.closest('[data-table-control]')) return
      const cell = target.closest<HTMLTableCellElement>('td, th')
      const row = cell?.closest('tr')
      const table = row?.closest('table')
      if (!cell || !row || !table || !editor.view.dom.contains(table)) {
        setHovered(null)
        return
      }
      if (hovered?.cell === cell) return
      const next = { table, row, cell }
      setHovered(next)
      setPlaced(place(frame.current, next))
    },
    [editor, hovered],
  )

  // A row added or deleted moves everything under the controls: they go until the pointer moves again.
  useEffect(() => {
    if (!editor) return
    const changed = () => {
      if (!menu) setHovered(null)
    }
    editor.on('update', changed)
    return () => {
      editor.off('update', changed)
    }
  }, [editor, menu])

  const shown = editable && hovered && placed ? { ...hovered, ...placed } : null
  const run = (act: () => boolean) => () => {
    if (editor) act()
    setMenu(null)
    setHovered(null)
  }

  return (
    <div
      ref={frame}
      className={cn('relative', className)}
      onMouseMove={(e) => {
        if (!menu) follow(e.target)
      }}
      onMouseLeave={() => {
        if (!menu) setHovered(null)
      }}
    >
      {children}
      {shown && editor && (
        <>
          {/* The row's handle, centred on the table's left edge: the box is ours, so the table's line does not show through it. */}
          <div data-table-control className={cn(HANDLE_BOX, 'absolute -translate-x-1/2 -translate-y-1/2')} style={{ left: shown.tableBox.left, top: shown.rowBox.top + shown.rowBox.height / 2 }}>
            <Menu
              open={menu === 'row'}
              onOpenChange={(open) => setMenu(open ? 'row' : null)}
              trigger={
                <IconButton aria-label="Row menu" tooltip="Row" className="h-6 w-4 p-0">
                  <IconGripVertical size={14} stroke={1.5} />
                </IconButton>
              }
            >
              <MenuItem label="Insert above" leading={<IconRowInsertTop {...ICON} />} onClick={run(() => inCell(editor, shown.cell, addRowBefore))} />
              <MenuItem label="Insert below" leading={<IconRowInsertBottom {...ICON} />} onClick={run(() => inCell(editor, shown.cell, addRowAfter))} />
              <MenuSeparator />
              <MenuItem label="Delete row" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={run(() => deleteTableRow(editor, shown.cell))} />
              <MenuItem label="Delete table" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={run(() => inCell(editor, shown.cell, deleteTable))} />
            </Menu>
          </div>
          {/* The column's handle, centred on the table's top edge. */}
          <div data-table-control className={cn(HANDLE_BOX, 'absolute -translate-x-1/2 -translate-y-1/2')} style={{ left: shown.columnBox.left + shown.columnBox.width / 2, top: shown.tableBox.top }}>
            <Menu
              open={menu === 'column'}
              onOpenChange={(open) => setMenu(open ? 'column' : null)}
              trigger={
                <IconButton aria-label="Column menu" tooltip="Column" className="h-4 w-6 p-0">
                  <IconGripHorizontal size={14} stroke={1.5} />
                </IconButton>
              }
            >
              <MenuItem label="Insert left" leading={<IconColumnInsertLeft {...ICON} />} onClick={run(() => inCell(editor, shown.cell, addColumnBefore))} />
              <MenuItem label="Insert right" leading={<IconColumnInsertRight {...ICON} />} onClick={run(() => inCell(editor, shown.cell, addColumnAfter))} />
              <MenuSeparator />
              <MenuItem label="Delete column" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={run(() => deleteTableColumn(editor, shown.cell))} />
              <MenuItem label="Delete table" destructive leading={<IconTrash size={16} stroke={1.5} className="text-error-default" />} onClick={run(() => inCell(editor, shown.cell, deleteTable))} />
            </Menu>
          </div>
          {/*
            The ➕ bars, flush with the table so the pointer reaches them from a
            cell without leaving it — the row's from the last row, the column's
            from the last column. Anywhere else the one under the table would
            lie over the top of the next block for nothing.
          */}
          {shown.row === shown.table.rows[shown.table.rows.length - 1] && (
            <div data-table-control className={cn(HANDLE_BOX, 'absolute flex h-3')} style={{ left: shown.tableBox.left, top: shown.tableBox.top + shown.tableBox.height, width: shown.tableBox.width }}>
              <IconButton aria-label="Add row" tooltip="Add row" className="h-full w-full p-0" onMouseDown={keepFocus} onClick={run(() => appendTableRow(editor, shown.table))}>
                <IconPlus size={12} stroke={1.5} />
              </IconButton>
            </div>
          )}
          {shown.cell === shown.row.cells[shown.row.cells.length - 1] && (
            <div data-table-control className={cn(HANDLE_BOX, 'absolute flex w-3')} style={{ left: shown.tableBox.left + shown.tableBox.width, top: shown.tableBox.top, height: shown.tableBox.height }}>
              <IconButton aria-label="Add column" tooltip="Add column" className="h-full w-full p-0" onMouseDown={keepFocus} onClick={run(() => appendTableColumn(editor, shown.table))}>
                <IconPlus size={12} stroke={1.5} />
              </IconButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
