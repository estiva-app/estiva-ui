import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'

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
/**
 * Where each named list was left, in this tab: how far it was scrolled, and the open row it last brought into sight. A
 * list drawn again under the same name (the same column on another page) goes back there, and does not show again a
 * row it already showed (Katerina, 17 November: "I have scrolled down a little and then click on something and it
 * scrolls up back to top").
 */
const places = new Map<string, { top?: number; shown?: string }>()

/** For tests: every list forgets where it was. */
export function forgetListPlaces(): void {
  places.clear()
}

/** How long a list drawn again keeps trying to reach where it was left, while its rows are still being drawn. */
export const RESTORE_MS = 2000

/** A named list's place, for the reveal inside it: its name, and whether it is still going back to where it was. */
export interface ListPlace {
  name?: string
  restoring: RefObject<boolean>
}

/** The list a row is revealed in: a `ListColumn` gives its name to the tree inside it, which reveals nothing itself. */
export const ListPlaceContext = createContext<ListPlace | null>(null)

/**
 * Goes back to where the named list was left, and keeps note of where the reader leaves it. Its rows may still be
 * drawing (a skeleton, a fold that reads its own rows): it tries again as the list grows, until it is there, the reader
 * scrolls, something else moves it (a row brought into sight), or `RESTORE_MS` has passed.
 */
export function useListPlace(box: RefObject<HTMLElement | null>, name: string | undefined): ListPlace {
  const restoring = useRef(false)
  useLayoutEffect(() => {
    const el = box.current
    if (!el || !name) return
    const want = places.get(name)?.top ?? 0
    restoring.current = want > 0
    let set = el.scrollTop
    const keep = () => places.set(name, { ...places.get(name), top: el.scrollTop })
    const finish = () => {
      restoring.current = false
    }
    const restore = () => {
      if (!restoring.current) return
      el.scrollTop = want
      set = el.scrollTop
      if (Math.abs(el.scrollTop - want) < 1) finish()
    }
    restore()
    const grows = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(restore)
    if (el.firstElementChild) grows?.observe(el.firstElementChild)
    const until = setTimeout(finish, RESTORE_MS)
    // The reader takes over.
    const took = () => finish()
    const scrolled = () => {
      // Moved by anything but the restore: what moved it stands.
      if (restoring.current && Math.abs(el.scrollTop - set) > 1) finish()
      if (!restoring.current) keep()
    }
    const takes = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    el.addEventListener('scroll', scrolled, { passive: true })
    for (const type of takes) el.addEventListener(type, took, { passive: true })
    return () => {
      el.removeEventListener('scroll', scrolled)
      for (const type of takes) el.removeEventListener(type, took)
      grows?.disconnect()
      clearTimeout(until)
      if (!restoring.current) keep()
      restoring.current = false
    }
  }, [box, name])
  // One object per name: the reveal and the tree inside take it, and look again only when the name changes.
  return useMemo(() => ({ name, restoring }), [name])
}

export function useRevealCurrentRow(box: RefObject<HTMLElement | null>, current?: string, place?: ListPlace): void {
  const shown = useRef<string | undefined>(undefined)
  // Inside a `ListColumn`, the column brings its rows into sight: a tree in it reveals nothing itself.
  const within = useContext(ListPlaceContext)
  const deferred = !place && within !== null
  useEffect(() => {
    const root = box.current
    if (!root || deferred) return
    // The open row it last showed: the named list's, which outlives the column being drawn again; else this one's.
    const was = () => (place?.name ? places.get(place.name)?.shown : shown.current)
    const showing = (key: string) => {
      if (place?.name) places.set(place.name, { ...places.get(place.name), shown: key })
      else shown.current = key
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const look = () => {
      timer = undefined
      const row = root.querySelector<HTMLElement>('[aria-current="page"]')
      if (!row) return
      const key = current ?? row.getAttribute('href') ?? row.textContent ?? ''
      // The row it showed last: the list goes back to where it was left, and the row stays where the reader put it.
      if (was() === key) return
      // Not drawn yet, or inside a fold that is shut: whatever opens it changes the list, and it is looked for again.
      if (row.getBoundingClientRect().height === 0) return
      // A new open row wins at once, the reader asked for it: going back to where the list was left stops here, even
      // when that place can no longer be reached (a fold that was open is shut).
      if (place) place.restoring.current = false
      showing(key)
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
  }, [box, current, place, deferred])
}
