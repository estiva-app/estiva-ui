import { useEffect, useRef, type RefObject } from 'react'

/**
 * Showing where the open page lives in a list: its row (`aria-current="page"`, what `NavItem`'s `active` sets) brought
 * into the column's sight, once for each new current row, whenever it is drawn and shown (Katerina, 17 November: "the
 * selected [row] could be somewhere above or below the fold … a general problem we need to fix").
 *
 * However late: a row a fold reads only once it opens, a group sliding open, rows that arrive with a read. The list is
 * watched for what changes in it, not for its own draws, so a row drawn by a part inside it is seen too (a team's Files
 * fold, which reads its files itself, never drew the tree again: its open file stayed below the fold).
 *
 * Once: a row brought into sight is not brought back after the reader scrolls away, while it stays the current one;
 * a new current row is.
 */

/** How long it waits to look, after the list changes: a group above the row slides open in 150ms. */
export const REVEAL_MS = 200

/**
 * Scroll the column the row is in, and only that box — never the page, nor a
 * drawer that is shut — so the row is in sight. A row in sight stays put.
 * A group taller than the column keeps its top in sight, as the browser's
 * `block: 'nearest'` does (a row is never that tall).
 */
export function scrollToRow(row: HTMLElement) {
  let box = row.parentElement
  while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) box = box.parentElement
  if (!box || box === document.documentElement || box === document.body) return
  const at = row.getBoundingClientRect()
  const view = box.getBoundingClientRect()
  if (at.top < view.top) box.scrollTop -= view.top - at.top
  else if (at.bottom > view.bottom) box.scrollTop += Math.min(at.bottom - view.bottom, at.top - view.top)
}

/**
 * Brings the current row inside `box` into sight, once per current row. `current` names it when the caller knows it
 * (`NavTree`'s `selected`); without it, the row is known by its link.
 */
export function useRevealCurrentRow(box: RefObject<HTMLElement | null>, current?: string): void {
  const shown = useRef<string | undefined>(undefined)
  useEffect(() => {
    const root = box.current
    if (!root) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const look = () => {
      timer = undefined
      const row = root.querySelector<HTMLElement>('[aria-current="page"]')
      if (!row) return
      const key = current ?? row.getAttribute('href') ?? row.textContent ?? ''
      if (shown.current === key) return
      // Not drawn yet, or inside a fold that is shut: whatever opens it changes the list, and it is looked for again.
      if (row.getBoundingClientRect().height === 0) return
      shown.current = key
      scrollToRow(row)
    }
    // One look a moment after the list changes, however often it does: a live list changes all the time.
    const soon = () => {
      if (timer === undefined) timer = setTimeout(look, REVEAL_MS)
    }
    const watch = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(soon)
    watch?.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-current', 'hidden'] })
    soon()
    return () => {
      watch?.disconnect()
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [box, current])
}
