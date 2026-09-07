import { describe, expect, it } from 'vitest'
import { fitMenu } from './fit'

/**
 * The last hand-written geometry in the package, and its one remaining
 * caller's.
 *
 * These were the Menu shell's tests (Katerina, 2026-09-03: the identity menu
 * vanished under a z-indexed panel header, and a reply menu's highlight
 * submenu was cut off by the right screen edge — its hand-rolled flip read a
 * ref that was never attached, so it measured nothing). Stage 4 gave that job
 * to Floating UI, so the `clampBox` and `fitSubmenu` blocks are gone with the
 * functions, and what is left is `fitMenu` as **`ChipInput`** uses it: a
 * suggestion list under a text field, capped at 240.
 *
 * When `ChipInput` moves onto Base UI's `Combobox` at stage 5, this file and
 * `fit.ts` go together.
 */
const viewport = { width: 1280, height: 800 }
/** ChipInput's call: 48px rows, and the old `max-h-[240px]`. */
const fitList = (args: Omit<Parameters<typeof fitMenu>[0], 'cap'>) => fitMenu({ ...args, cap: 240 })

describe('fitMenu, as ChipInput calls it', () => {
  it('leaves a comfortable list exactly where the field put it', () => {
    const fit = fitList({
      anchor: { left: 100, top: 200, bottom: 232 },
      menu: { width: 240, contentHeight: 144 },
      viewport,
    })
    expect(fit.left).toBe(100)
    expect(fit.top).toBe(236)
    expect(fit.bottom).toBeUndefined()
  })

  it('clamps a list that would run off the right edge', () => {
    const fit = fitList({
      anchor: { left: 1200, top: 200, bottom: 232 },
      menu: { width: 340, contentHeight: 144 },
      viewport,
    })
    // 1280 - 340 - 8 margin: fully on screen, margin kept.
    expect(fit.left).toBe(932)
  })

  it('never pushes a list past the LEFT edge either', () => {
    const fit = fitList({
      anchor: { left: -20, top: 200, bottom: 232 },
      menu: { width: 240, contentHeight: 144 },
      viewport,
    })
    expect(fit.left).toBe(8)
  })

  it('opens upward when the room above is better — the field low on the screen', () => {
    const fit = fitList({
      anchor: { left: 100, top: 700, bottom: 732 },
      menu: { width: 240, contentHeight: 480 },
      viewport,
    })
    expect(fit.top).toBeUndefined()
    expect(fit.bottom).toBe(800 - 700 + 4) // anchored to the field's top
    expect(fit.maxHeight).toBe(240) // still capped
  })

  it('stays below when the room below is bad but the room above is worse', () => {
    const fit = fitList({
      anchor: { left: 100, top: 60, bottom: 92 },
      menu: { width: 240, contentHeight: 480 },
      viewport,
    })
    expect(fit.top).toBe(96)
    expect(fit.maxHeight).toBe(240)
  })

  it('caps a long list at 240 with plenty of room — the old max-h-[240px]', () => {
    const fit = fitList({
      anchor: { left: 100, top: 100, bottom: 132 },
      menu: { width: 240, contentHeight: 900 },
      viewport,
    })
    expect(fit.maxHeight).toBe(240)
  })

  it('keeps a 120px floor in a cramped corner — scrollable beats invisible', () => {
    const fit = fitList({
      anchor: { left: 100, top: 740, bottom: 772 },
      menu: { width: 240, contentHeight: 480 },
      viewport,
    })
    expect(fit.maxHeight).toBeGreaterThanOrEqual(120)
  })

  it('with no cap, a tall list stands at its full height when the room is there', () => {
    const fit = fitMenu({
      anchor: { left: 1100, top: 20, bottom: 56 },
      menu: { width: 288, contentHeight: 450 },
      viewport: { width: 1440, height: 900 },
    })
    expect(fit.maxHeight).toBeGreaterThanOrEqual(450)
  })
})
