import { describe, expect, it } from 'vitest'
import { clampBox, fitMenu, fitSubmenu } from './fit'

/**
 * The Menu shell's viewport geometry (Katerina, 2026-09-03): the identity
 * menu vanished under a z-indexed panel header, and a reply menu's highlight
 * submenu was cut off by the right screen edge — its hand-rolled flip read a
 * ref that was never attached, so it measured nothing. The portal fixes the
 * covering; these pin the pure half of the fitting.
 */
const viewport = { width: 1280, height: 800 }

describe('fitMenu without a cap (the Menu shell)', () => {
  it('lets a tall panel stand at its full height when the room is there — no scrollbar', () => {
    // The identity panel: ~450px tall on a 900px screen. With Select's 288
    // cap it grew a scrollbar at full height; without one it just stands.
    const fit = fitMenu({
      anchor: { left: 1100, top: 20, bottom: 56 },
      menu: { width: 288, contentHeight: 450 },
      viewport: { width: 1440, height: 900 },
    })
    expect(fit.maxHeight).toBeGreaterThanOrEqual(450)
  })

  it('still caps to the room when the screen truly runs out', () => {
    const fit = fitMenu({
      anchor: { left: 100, top: 20, bottom: 56 },
      menu: { width: 288, contentHeight: 1200 },
      viewport: { width: 1440, height: 900 },
    })
    expect(fit.maxHeight).toBe(900 - 56 - 4 - 8)
  })
})

describe('clampBox', () => {
  it('leaves a well-placed box exactly where the caller put it', () => {
    const fit = clampBox({ box: { left: 100, top: 200, width: 300, height: 400 }, viewport })
    expect(fit).toEqual({ left: 100, top: 200, maxHeight: 400 })
  })

  it('slides a box back inside the right edge, margin kept', () => {
    const fit = clampBox({ box: { left: 1100, top: 200, width: 300, height: 400 }, viewport })
    expect(fit.left).toBe(1280 - 300 - 8)
  })

  it('never pushes a box past the left edge either', () => {
    const fit = clampBox({ box: { left: -40, top: 200, width: 300, height: 400 }, viewport })
    expect(fit.left).toBe(8)
  })

  it('slides a box up so its tail stays on screen', () => {
    const fit = clampBox({ box: { left: 100, top: 700, width: 300, height: 400 }, viewport })
    expect(fit.top).toBe(800 - 400 - 8)
  })

  it('caps a box taller than the viewport and pins it to the top margin', () => {
    const fit = clampBox({ box: { left: 100, top: 100, width: 300, height: 900 }, viewport })
    expect(fit.maxHeight).toBe(800 - 16)
    expect(fit.top).toBe(8)
  })

  it('keeps the 120px floor — scrollable beats invisible', () => {
    const fit = clampBox({ box: { left: 100, top: 200, width: 300, height: 40 }, viewport })
    expect(fit.maxHeight).toBeGreaterThanOrEqual(120)
  })
})

describe('fitSubmenu', () => {
  const panel = { width: 160, height: 200 }

  it('opens to the right of a row with room', () => {
    const fit = fitSubmenu({ row: { left: 500, right: 740, top: 300 }, panel, viewport })
    expect(fit).toEqual({ left: 744, top: 300 })
  })

  it('flips to the left at the right screen edge (the highlight submenu cut)', () => {
    const fit = fitSubmenu({ row: { left: 1000, right: 1240, top: 300 }, panel, viewport })
    expect(fit.left).toBe(1000 - 4 - 160)
  })

  it('never lands past the left edge even when flipped from a narrow spot', () => {
    const fit = fitSubmenu({ row: { left: 60, right: 1240, top: 300 }, panel, viewport })
    expect(fit.left).toBe(8)
  })

  it('slides up when the tail would run past the bottom', () => {
    const fit = fitSubmenu({ row: { left: 500, right: 740, top: 700 }, panel, viewport })
    expect(fit.top).toBe(800 - 200 - 8)
  })
})
