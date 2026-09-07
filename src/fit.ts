/**
 * The last of the hand-written viewport geometry.
 *
 * This module existed because the same failure kept recurring one floating
 * surface at a time: the files-panel picker was cut off at the right edge
 * (Select, 2026-09-01), then a reply menu's highlight submenu was cut the
 * same way and the identity menu vanished under a z-indexed header
 * (2026-09-03). Stage 4 handed that job to Floating UI, so `Menu`, `MenuSub`
 * and `Select` no longer call any of it, and `clampBox` and `fitSubmenu` are
 * gone with them.
 *
 * **`fitMenu` survives for exactly one caller: `ChipInput`**, whose suggestion
 * list is still hand-placed. It goes when `ChipInput` moves onto Base UI's
 * `Combobox` at stage 5, and this file goes with it. `PLAN.md` §6 said the
 * geometry had three callers and could be deleted at stage 4; it had four.
 */
const MARGIN = 8
const GAP = 4

/**
 * Where a list of this size goes, given its anchor and the viewport.
 *
 * Left is clamped inside the viewport with an 8px margin. Height is capped at
 * `cap` — `ChipInput` passes 240, its old `max-h-[240px]` — but never taller
 * than the room there is; when the room below the anchor is smaller than both
 * the content and the room above, the list opens UPWARD (anchored to the
 * trigger's top via `bottom`). The 120px floor keeps it usable even in a
 * cramped corner — scrollable beats invisible.
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
