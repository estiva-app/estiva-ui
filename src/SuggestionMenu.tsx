import { useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { MenuItem, MenuSection, MenuSeparator, type MenuItemProps } from './Menu'
import { Popover } from './Popover'

/**
 * The list a text editor opens as you type — `/` for commands, `@` for people,
 * `[` for a reference. UIG-31: Peek's four type-ahead menus, made one part.
 *
 * **Why it is not a `Combobox` or a `Menu`.** Base UI's lists need a text field
 * of their own, and the text being completed is an editor, not an `<input>`.
 * So focus never leaves the text: the editor hands its arrow keys and Enter to
 * this list through `handle`, and the list tells the editor which row is
 * active (`aria-activedescendant`), the pattern Base UI's `Combobox` builds.
 * If Base UI ever adds a list that can be driven from outside its own field,
 * this part moves onto it.
 *
 * **What it owns**, all of it written once here instead of in every menu:
 *
 * - the box: the package `Popover`, anchored to the caret, above it and below
 *   when there is no room, clamped to the window, scrolling in the package's
 *   `ScrollArea` past `maxHeight`;
 * - the highlighted row: ↑ and ↓ (wrapping at the ends), Enter to choose, the
 *   pointer moving the highlight, a press choosing without taking focus from
 *   the text, the highlight back on the first row whenever the list changes,
 *   and the highlighted row scrolled into view;
 * - what a screen reader is told: the list is a `listbox`, each row an
 *   `option`, and the editor says it completes into this list and which row
 *   is active — all removed again when the list closes.
 *
 * What stays with the app: which rows exist, what choosing one does, and what
 * each row shows (its label, face, keys, hint) — `row` returns the package
 * `MenuItem`'s own props. With nothing to show there is no box at all.
 */
export interface SuggestionMenuRow {
  label: string
  description?: string
  leading?: ReactNode
  /** What you would type — drawn as keys at the right, e.g. `#` for a heading. */
  shortcut?: string
  /** Drawn at the right while the row is highlighted, e.g. `<EnterHint />`. */
  hint?: ReactNode
  /** `tall` for a row with a face and a second line — `MenuItem`'s own sizes. */
  size?: MenuItemProps['size']
}

export interface SuggestionMenuSection<T> {
  /** The section's heading. Without one, the rows stand alone. */
  label?: string
  items: readonly T[]
  /** On the heading row, as `MenuSection`'s. */
  className?: string
}

/** What the editor calls while the list is open. */
export interface SuggestionMenuHandle {
  /** ↑, ↓ and Enter. `true` when the list used the key, so the editor must not. */
  onKeyDown: (event: KeyboardEvent) => boolean
}

export interface SuggestionMenuProps<T> {
  /** The caret's rect, from the editor. `null` closes the box. */
  rect: DOMRect | null
  /** The editor's own element — told which row is active. Absent in a story. */
  editorElement?: HTMLElement | null
  /** Names the list — "Commands", "People". */
  ariaLabel: string
  /** The box's width, e.g. `w-[300px]`. */
  width: string
  /** The cap before the rows scroll, e.g. `max-h-[400px]`. */
  maxHeight: string
  sections: readonly SuggestionMenuSection<T>[]
  /** A stable key for a row. */
  itemKey: (item: T) => string
  /** What a row shows. */
  row: (item: T) => SuggestionMenuRow
  onSelect: (item: T) => void
  handle?: Ref<SuggestionMenuHandle>
}

export function SuggestionMenu<T>({ rect, editorElement, ariaLabel, width, maxHeight, sections, itemKey, row, onSelect, handle }: SuggestionMenuProps<T>) {
  const shown = useMemo(() => sections.filter((section) => section.items.length > 0), [sections])
  const items = useMemo(() => shown.flatMap((section) => section.items), [shown])
  const keys = items.map(itemKey).join('\n')
  const [highlight, setHighlight] = useState(0)
  const base = useId()
  const listboxId = `${base}-list`

  // The row the person arrowed to, by key — read as the list was when they
  // moved, so not re-run when `keys` changes.
  const chosen = useRef<string | null>(null)
  useEffect(() => void (chosen.current = highlight > 0 ? (keys.split('\n')[highlight] ?? null) : null), [highlight])

  // A new list is a new list: the old index may not exist in it. A row the
  // person arrowed to stays highlighted while it is still listed, so an answer
  // landing late does not move their pick under the Enter key.
  useEffect(() => {
    const at = chosen.current ? keys.split('\n').indexOf(chosen.current) : -1
    setHighlight(at > 0 ? at : 0)
  }, [keys])

  useImperativeHandle(handle, () => ({
    // The editor hands its arrow keys to this list: Base UI's lists need a text field of their own, and an editor is not one.
    onKeyDown: (event) => {
      if (!items.length) return false
      if (event.key === 'ArrowDown') {
        setHighlight((h) => (h + 1) % items.length)
        return true
      }
      if (event.key === 'ArrowUp') {
        setHighlight((h) => (h - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        const item = items[highlight]
        if (item !== undefined) onSelect(item)
        return true
      }
      return false
    },
  }), [items, highlight, onSelect])

  /*
   * The editor completes into this list while it is open: it says so, names
   * the list, and points at the active row. Removed on close — an editor left
   * saying it controls a list that is gone is worse than saying nothing.
   */
  const open = rect !== null && items.length > 0
  useEffect(() => {
    if (!editorElement || !open) return
    editorElement.setAttribute('aria-autocomplete', 'list')
    editorElement.setAttribute('aria-haspopup', 'listbox')
    editorElement.setAttribute('aria-controls', listboxId)
    return () => {
      for (const name of ['aria-autocomplete', 'aria-haspopup', 'aria-controls', 'aria-activedescendant']) editorElement.removeAttribute(name)
    }
  }, [editorElement, open, listboxId])
  useEffect(() => {
    if (!editorElement || !open) return
    editorElement.setAttribute('aria-activedescendant', `${base}-${highlight}`)
  }, [editorElement, open, base, highlight])
  // A press anywhere in the panel — its padding, its scrollbar — keeps focus in
  // the text, as a row's does: the editor ends its list when it loses focus.
  // On the list's own mount, because the panel portals in after it opens.
  const keepFocus = useCallback((list: HTMLDivElement | null) => {
    const panel = list?.closest('[role="dialog"]')
    if (!panel) return
    const keep = (event: Event) => event.preventDefault()
    panel.addEventListener('mousedown', keep)
    return () => panel.removeEventListener('mousedown', keep)
  }, [])

  const scrollRef = useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView({ block: 'nearest' })
  }, [])

  if (items.length === 0) return null

  const drawRow = (item: T) => {
    const index = items.indexOf(item)
    const selected = index === highlight
    const { label, description, leading, shortcut, hint, size } = row(item)
    return (
      // A row of a list the editor drives from its caret: focus stays in the text, so the row is no Tab stop.
      <MenuItem
        key={itemKey(item)}
        role="option"
        id={`${base}-${index}`}
        aria-selected={selected}
        tabIndex={-1}
        ref={selected ? scrollRef : undefined}
        size={size}
        label={label}
        description={description}
        leading={leading}
        shortcut={shortcut}
        hint={hint}
        selected={selected}
        onMouseEnter={() => setHighlight(index)}
        onMouseDown={(event) => {
          // Choosing must not take focus from the text.
          event.preventDefault()
          onSelect(item)
        }}
      />
    )
  }

  return (
    <Popover anchor={rect} open={rect !== null} side="top" align="left" className={width} maxHeight={maxHeight} ariaLabel={ariaLabel}>
      {/* The list the editor drives from its caret: a listbox, because Base UI's lists need a text field of their own.
          `gap-0.5`: 2px between rows, as a menu's — a section with a heading
          had them from `MenuSection`, and rows without one touched. */}
      <div ref={keepFocus} id={listboxId} role="listbox" aria-label={ariaLabel} className="flex flex-col gap-0.5">
        {shown.map((section, i) => (
          <div key={section.label ?? i} className="contents">
            {i > 0 && <MenuSeparator />}
            {section.label ? (
              <div role="group" aria-label={section.label}>
                <MenuSection label={section.label} className={section.className}>
                  {section.items.map(drawRow)}
                </MenuSection>
              </div>
            ) : (
              section.items.map(drawRow)
            )}
          </div>
        ))}
      </div>
    </Popover>
  )
}
