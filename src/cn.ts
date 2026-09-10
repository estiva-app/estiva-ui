import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The preset's type ramp, by name, so tailwind-merge can classify the token
 * classes as sizes. Stock tailwind-merge has never heard of `text-body-2`,
 * files it under text-COLOUR, and lets `text-text-primary` in the same
 * merged list knock it out — the trap Katerina's Tabs review confirmed by
 * measurement (2026-09-01), and the reason shared components used to spell
 * sizes as arbitrary values. Naming the ramp here retires that rule for
 * everything using this cn — the package and, since the 2026-09-01 dedupe,
 * both apps.
 *
 * Must match `tailwind-preset.js` `fontSize` key for key; `cn.test.ts`
 * asserts it (the preset imports node-only modules, so it cannot be
 * imported here without dragging them into the browser bundle).
 */
const FONT_SIZE_TOKENS = [
  'h1', 'h2', 'h3', 'h4', 'h5',
  'body-1', 'body-2', 'body-2-strong', 'caption', 'menu',
  'btn-default', 'btn-small', 'input-label', 'input-value', 'input-helper', 'chip',
]

/**
 * The preset's box-shadow and drop-shadow keys, for the same reason: stock
 * tailwind-merge files an unknown `shadow-x` under shadow-COLOUR, so
 * `shadow-focus-ring` beside `shadow-glow-warning` lost one of them, and
 * `shadow-glow-warning` beside `shadow-md` kept both (measured 2026-09-06).
 * `cn.test.ts` pins these to the preset too.
 */
const BOX_SHADOW_TOKENS = ['sm', 'md', 'lg', 'focus-ring', 'glow-warning', 'glow-success', 'glow-accent', 'highlight-inset']
const DROP_SHADOW_TOKENS = ['glow-success', 'glow-accent', 'glow-warning']

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZE_TOKENS }],
      shadow: [{ shadow: BOX_SHADOW_TOKENS }],
      'drop-shadow': [{ 'drop-shadow': DROP_SHADOW_TOKENS }],
    },
  },
})

/** Merge class names, last-one-wins on conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { FONT_SIZE_TOKENS as _fontSizeTokens, BOX_SHADOW_TOKENS as _boxShadowTokens, DROP_SHADOW_TOKENS as _dropShadowTokens }
