// @vitest-environment jsdom
/**
 * The device's memory of links it could not show: kept across a reload, so
 * the next open draws "not available." from the first paint, and forgotten
 * when the link can be read again or at sign-out.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { unavailableMemory } from './linked'

afterEach(() => localStorage.clear())

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
