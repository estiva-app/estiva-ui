import { describe, expect, it } from 'vitest'
import preset from '../tailwind-preset.js'
import { cn, _boxShadowTokens, _dropShadowTokens, _fontSizeTokens } from './cn'

describe('cn knows the type ramp', () => {
  it('lists exactly the preset fontSize keys', () => {
    const presetKeys = Object.keys((preset as { theme: { extend: { fontSize: Record<string, unknown> } } }).theme.extend.fontSize)
    expect([..._fontSizeTokens].sort()).toEqual([...presetKeys].sort())
  })

  it('keeps a token size beside a colour — the trap this fix retires', () => {
    for (const token of _fontSizeTokens) {
      expect(cn(`text-${token} text-text-primary`)).toBe(`text-${token} text-text-primary`)
    }
  })

  it('still resolves conflicts, last one wins', () => {
    expect(cn('text-body-2', 'text-[12px]')).toBe('text-[12px]')
    expect(cn('text-[14px]', 'text-caption')).toBe('text-caption')
    expect(cn('text-body-2', 'text-caption')).toBe('text-caption')
    expect(cn('text-text-secondary', 'text-text-primary')).toBe('text-text-primary')
  })

  it('leaves non-ramp text utilities alone', () => {
    expect(cn('text-left text-body-2 text-text-primary')).toBe('text-left text-body-2 text-text-primary')
  })
})

describe('cn knows the shadow tokens', () => {
  it('lists exactly the preset boxShadow and dropShadow keys', () => {
    const extend = (preset as { theme: { extend: { boxShadow: Record<string, unknown>; dropShadow: Record<string, unknown> } } }).theme.extend
    expect([..._boxShadowTokens].sort()).toEqual(Object.keys(extend.boxShadow).sort())
    expect([..._dropShadowTokens].sort()).toEqual(Object.keys(extend.dropShadow).sort())
  })

  it('treats a shadow token as a shadow: two of them conflict, the last wins', () => {
    expect(cn('shadow-glow-warning', 'shadow-md')).toBe('shadow-md')
    expect(cn('shadow-focus-ring', 'shadow-glow-warning')).toBe('shadow-glow-warning')
    expect(cn('drop-shadow-glow-success', 'drop-shadow-glow-accent')).toBe('drop-shadow-glow-accent')
  })

  it('keeps a shadow token beside a colour, and under a variant', () => {
    expect(cn('signal:shadow-glow-warning text-text-primary')).toBe('signal:shadow-glow-warning text-text-primary')
    expect(cn('signal:border-warning-outline', 'text-warning-default')).toBe('signal:border-warning-outline text-warning-default')
  })
})
