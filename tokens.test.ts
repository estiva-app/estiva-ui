import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import preset from './tailwind-preset.js'

/**
 * The contract, checked: every token the preset names has a value in every
 * theme, and no theme defines a token the preset does not name.
 *
 * A theme that skipped a token would inherit `:root` (light) for it and show
 * a light value on a dark surface — visible only on the one component that
 * uses it, in the one theme that forgot. A token defined in a theme but not
 * in the preset is unreachable from Tailwind and is either a typo or a
 * missing name.
 */

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

/** Every `var(--x)` the preset resolves, flattened out of its nested theme. */
function tokensInPreset(): string[] {
  const names = new Set<string>()
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      for (const m of value.matchAll(/var\((--[\w-]+)\)/g)) names.add(m[1])
    } else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  walk(preset.theme)
  return [...names].sort()
}

/** The theme blocks in tokens.css: selector → the tokens it defines. */
function themesInCss(): Map<string, Set<string>> {
  const themes = new Map<string, Set<string>>()
  const blocks = css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+?)\s*\{([^}]*)\}/g)
  for (const [, selector, body] of blocks) {
    const defined = new Set<string>()
    for (const m of body.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1])
    themes.set(selector.trim().replace(/\s+/g, ' '), defined)
  }
  return themes
}

const EXPECTED_THEMES = [':root', '.dark, :root[data-theme=\'dark\']', ':root[data-theme=\'ship\']']

describe('tokens.css against tailwind-preset.js', () => {
  const wanted = tokensInPreset()
  const themes = themesInCss()

  it('has the three themes and nothing else', () => {
    expect([...themes.keys()]).toEqual(EXPECTED_THEMES)
  })

  it('names at least the bg, text, border, accent, semantic and shadow families', () => {
    expect(wanted).toEqual(expect.arrayContaining(['--bg-base', '--text-primary', '--border-subtle', '--accent-primary', '--error-muted', '--shadow-lg']))
    expect(wanted.length).toBe(31) // 8 bg + 5 text + 4 border + 3 accent + 8 semantic + 3 shadow
  })

  for (const selector of EXPECTED_THEMES) {
    it(`${selector} defines every token the preset names, and no other`, () => {
      const defined = [...(themes.get(selector) ?? [])].sort()
      expect(defined).toEqual(wanted)
    })
  }
})
