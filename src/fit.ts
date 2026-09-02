/**
 * Viewport geometry for everything that floats — pure, so the decisions are
 * testable without a browser.
 *
 * One module, because the failure it prevents keeps recurring one surface at
 * a time: the files-panel picker was cut off at the right edge (fixed in
 * Select, 2026-09-01), then a reply menu's highlight submenu was cut off the
 * same way and the identity menu vanished under a z-indexed header
 * (2026-09-03). A menu that hand-rolls its own geometry is a menu waiting to
 * be the next screenshot; the shell calls these instead.
 */

const MARGIN = 8
const GAP = 4

/**
 * Where a menu of this size goes, given its anchor and the viewport.
 *
 * Left is clamped inside the viewport with an 8px margin. Height is capped
 * at `cap` — Select's option list keeps the old `max-h-72` (288), a menu
 * panel passes none and uses all the room it opens into, so it scrolls only
 * when the screen truly has no space (the identity panel got Select's cap
 * by accident and grew a scrollbar at full height, 2026-09-03) — but never
 * taller than that room; when the room below the anchor is smaller than
 * both the content and the room above, the menu opens UPWARD (anchored to
 * the trigger's top via `bottom`). The 120px floor keeps a menu usable even
 * in a cramped corner — scrollable beats invisible.
 */
export function fitMenu({
  anchor,
  menu,
  viewport,
  cap = Number.POSITIVE_INFINITY,
}: {
  anchor: { left: number; top: number; bottom: number }
  menu: { width: number; contentHeight: number }
  viewport: { width: number; height: number }
  /** Tallest the menu may stand even with room to spare. Absent: the room is the only limit. */
  cap?: number
}): { left: number; top?: number; bottom?: number; maxHeight: number } {
  const left = Math.max(MARGIN, Math.min(anchor.left, viewport.width - menu.width - MARGIN))
  const below = viewport.height - anchor.bottom - GAP - MARGIN
  const above = anchor.top - GAP - MARGIN
  const openUp = below < Math.min(menu.contentHeight, cap) && above > below
  const maxHeight = Math.max(Math.min(cap, openUp ? above : below), 120)
  return openUp
    ? { left, bottom: viewport.height - anchor.top + GAP, maxHeight }
    : { left, top: anchor.bottom + GAP, maxHeight }
}

/**
 * Keep a box a caller has already placed fully on screen.
 *
 * For the menus whose caller measured a rect and chose the corner itself
 * (`position`): the caller's math stays authoritative, but its result can no
 * longer land off screen — it is slid inside the viewport, never flipped,
 * and capped to the viewport's height with the same 120px floor as fitMenu.
 */
export function clampBox({
  box,
  viewport,
}: {
  box: { left: number; top: number; width: number; height: number }
  viewport: { width: number; height: number }
}): { left: number; top: number; maxHeight: number } {
  const left = Math.max(MARGIN, Math.min(box.left, viewport.width - box.width - MARGIN))
  const maxHeight = Math.max(Math.min(box.height, viewport.height - 2 * MARGIN), 120)
  const top = Math.max(MARGIN, Math.min(box.top, viewport.height - maxHeight - MARGIN))
  return { left, top, maxHeight }
}

/**
 * Where a submenu goes, given its trigger row and the viewport.
 *
 * To the RIGHT of the row when it fits, flipped to the LEFT when it does not
 * — the measured flip two menus hand-rolled and one of them broke (the copy
 * dropped the ref its measurement read, so it measured nothing and always
 * opened rightward, off the screen). Top-aligned with the row, slid up when
 * the tail would run past the bottom edge.
 */
export function fitSubmenu({
  row,
  panel,
  viewport,
}: {
  row: { left: number; right: number; top: number }
  panel: { width: number; height: number }
  viewport: { width: number; height: number }
}): { left: number; top: number } {
  const fitsRight = row.right + GAP + panel.width <= viewport.width - MARGIN
  const left = Math.max(MARGIN, fitsRight ? row.right + GAP : row.left - GAP - panel.width)
  const top = Math.max(MARGIN, Math.min(row.top, viewport.height - panel.height - MARGIN))
  return { left, top }
}
