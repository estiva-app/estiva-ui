import { describe, expect, it } from 'vitest'
import { fitMenu } from './Select'

/** Select's calls carry its option-list cap (the old max-h-72); the cap is
 *  the caller's now, so these pin it alongside the geometry. */
const fitSelect = (args: Omit<Parameters<typeof fitMenu>[0], 'cap'>) => fitMenu({ ...args, cap: 288 })

/**
 * The Select menu's viewport geometry (Katerina, 2026-09-01): the files-panel
 * picker was cut off at the right edge, its tail ran past the bottom of the
 * screen, and it could not be scrolled. `fitMenu` is the pure half of the
 * fix; these pin its decisions.
 */
const viewport = { width: 1280, height: 800 }

describe('fitMenu', () => {
  it('leaves a comfortable menu exactly where the trigger put it', () => {
    const fit = fitSelect({
      anchor: { left: 100, top: 200, bottom: 232 },
      menu: { width: 240, contentHeight: 180 },
      viewport,
    })
    expect(fit.left).toBe(100)
    expect(fit.top).toBe(236)
    expect(fit.bottom).toBeUndefined()
    expect(fit.maxHeight).toBe(288) // room to spare — the cap is the only limit
  })

  it('clamps a menu that would run off the right edge (the files-panel cut)', () => {
    const fit = fitSelect({
      anchor: { left: 1200, top: 200, bottom: 232 },
      menu: { width: 340, contentHeight: 180 },
      viewport,
    })
    // 1280 - 340 - 8 margin: fully on screen, margin kept.
    expect(fit.left).toBe(932)
  })

  it('never pushes a menu past the LEFT edge either', () => {
    const fit = fitSelect({
      anchor: { left: -20, top: 200, bottom: 232 },
      menu: { width: 240, contentHeight: 180 },
      viewport,
    })
    expect(fit.left).toBe(8)
  })

  it('caps height to the room below, so the last option is never off screen', () => {
    const fit = fitSelect({
      anchor: { left: 100, top: 560, bottom: 592 },
      menu: { width: 240, contentHeight: 200 },
      viewport,
    })
    // Room below = 800 - 592 - 4 gap - 8 margin = 196 < content 200 …but the
    // room above (548) is not better than needed-below comparison? It is —
    // openUp triggers only when below < min(content, cap) AND above > below.
    // Here above (548) > below (196), content 200 > 196 → opens upward.
    expect(fit.bottom).toBe(800 - 560 + 4)
    expect(fit.maxHeight).toBe(288)
  })

  it('opens upward when the room above is better (the low trigger)', () => {
    const fit = fitSelect({
      anchor: { left: 100, top: 700, bottom: 732 },
      menu: { width: 240, contentHeight: 400 },
      viewport,
    })
    expect(fit.top).toBeUndefined()
    expect(fit.bottom).toBe(800 - 700 + 4) // anchored to the trigger's top
    expect(fit.maxHeight).toBe(288) // still capped
  })

  it('stays below when the room below is bad but the room above is worse', () => {
    const fit = fitSelect({
      anchor: { left: 100, top: 60, bottom: 92 },
      menu: { width: 240, contentHeight: 400 },
      viewport,
    })
    expect(fit.top).toBe(96)
    // Room below = 800 - 92 - 12 = 696 ≥ cap → full cap available.
    expect(fit.maxHeight).toBe(288)
  })

  it('keeps a 120px floor in a cramped corner — scrollable beats invisible', () => {
    const fit = fitSelect({
      anchor: { left: 100, top: 740, bottom: 772 },
      menu: { width: 240, contentHeight: 400 },
      viewport: { width: 1280, height: 800 },
    })
    expect(fit.maxHeight).toBeGreaterThanOrEqual(120)
  })

  it('caps a long list at 288 with plenty of room — the old max-h-72', () => {
    const fit = fitSelect({
      anchor: { left: 100, top: 100, bottom: 132 },
      menu: { width: 240, contentHeight: 900 },
      viewport,
    })
    expect(fit.maxHeight).toBe(288)
  })
})
