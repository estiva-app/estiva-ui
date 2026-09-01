import { describe, expect, it } from 'vitest'
import { initialsFor } from './Avatar'

describe('initialsFor', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFor('Ana Duarte')).toBe('AD')
  })

  it('gives a single-word name a single letter', () => {
    expect(initialsFor('Yael')).toBe('Y')
  })

  it('never shows a symbol — a parenthetical name gets one letter', () => {
    // The bot rendered "C(" in the members pill (Katerina, 2026-09-01).
    expect(initialsFor('Claude (steered by Katerina Kelepouri)')).toBe('C')
  })

  it('falls back to the first character when no word starts with a letter', () => {
    expect(initialsFor('(bot)')).toBe('(')
  })
})
