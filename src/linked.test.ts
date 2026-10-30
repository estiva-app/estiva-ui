// @vitest-environment jsdom
/**
 * The device's memory of links it could not show: kept across a reload, so
 * the next open draws "not available." from the first paint, and forgotten
 * when the link can be read again or at sign-out.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cardShapeMemory, unavailableMemory } from './linked'

afterEach(() => localStorage.clear())

describe('cardShapeMemory', () => {
  const SHAPE = { subtitle: true, summary: true, rows: 2, latest: false, ring: true, footer: 'pickers' as const, height: 180 }

  it('remembers the shape a card drew at across a reload, and nothing for one never drawn', () => {
    cardShapeMemory('test.shapes').note('a', SHAPE)
    expect(cardShapeMemory('test.shapes').of('a', 'issue')).toEqual(SHAPE)
    expect(cardShapeMemory('test.shapes').of('b', 'issue')).toBeUndefined()
  })

  it('answers the app’s first shape for a kind it has not drawn yet', () => {
    const memory = cardShapeMemory('test.shapes', { firstDraw: { issue: { summary: false, footer: 'pickers' } } })
    expect(memory.of('b', 'issue')).toEqual({ summary: false, footer: 'pickers' })
    expect(memory.of('b', 'project')).toBeUndefined()
  })

  it('keeps only the parts a placeholder draws, and a bad stored value draws no page of bars', () => {
    localStorage.setItem('test.shapes', JSON.stringify([['a', { rows: 9999, footer: 'nonsense', height: -4, extra: 'x' }], ['b', 'not a shape'], 'junk']))
    expect(cardShapeMemory('test.shapes').of('a', 'issue')).toEqual({ subtitle: false, summary: false, rows: 10, latest: false, ring: false, footer: 'line' })
    expect(cardShapeMemory('test.shapes').of('b', 'issue')).toBeUndefined()
  })

  it('keeps only the newest, up to its limit, and forgets everything at sign-out', () => {
    const memory = cardShapeMemory('test.shapes', { limit: 2 })
    memory.note('a', SHAPE)
    memory.note('b', SHAPE)
    memory.note('c', SHAPE)
    const next = cardShapeMemory('test.shapes', { limit: 2 })
    expect(next.of('a', 'issue')).toBeUndefined()
    expect(next.of('c', 'issue')).toEqual(SHAPE)
    next.clear()
    expect(cardShapeMemory('test.shapes').of('c', 'issue')).toBeUndefined()
  })
})

describe('unavailableMemory', () => {
  it('remembers a link it could not show across a reload', () => {
    unavailableMemory('test.unavailable').note('a', false)
    // A new page: a fresh memory reads what the last one wrote.
    expect(unavailableMemory('test.unavailable').has('a')).toBe(true)
    expect(unavailableMemory('test.unavailable').has('b')).toBe(false)
  })

  it('forgets it once it can be read again', () => {
    const memory = unavailableMemory('test.unavailable')
    memory.note('a', false)
    memory.note('a', true)
    expect(unavailableMemory('test.unavailable').has('a')).toBe(false)
  })

  it('keeps what another memory on the same key wrote since it was read', () => {
    const one = unavailableMemory('test.unavailable')
    const two = unavailableMemory('test.unavailable')
    expect(two.has('a')).toBe(false)
    one.note('a', false)
    two.note('b', false)
    const next = unavailableMemory('test.unavailable')
    expect([next.has('a'), next.has('b')]).toEqual([true, true])
  })

  it('keeps each app’s memory apart', () => {
    unavailableMemory('one.unavailable').note('a', false)
    expect(unavailableMemory('two.unavailable').has('a')).toBe(false)
  })

  it('forgets everything at sign-out', () => {
    const memory = unavailableMemory('test.unavailable')
    memory.note('a', false)
    memory.clear()
    expect(memory.has('a')).toBe(false)
    expect(unavailableMemory('test.unavailable').has('a')).toBe(false)
  })

  it('keeps only the newest, up to its limit', () => {
    const memory = unavailableMemory('test.unavailable', 2)
    memory.note('a', false)
    memory.note('b', false)
    memory.note('c', false)
    const next = unavailableMemory('test.unavailable', 2)
    expect([next.has('a'), next.has('b'), next.has('c')]).toEqual([false, true, true])
  })
})
