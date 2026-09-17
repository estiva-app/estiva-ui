/// <reference types="node" />
/**
 * The token contract as lint settings, written once (docs/GATES.md §23).
 *
 * Until UIG-10 this block was pasted into every repo: `eslint.config.js` here,
 * `eslint.tokens.js` in Peek, `eslint.config.js` in Ship. Katerina ruled on 17 September that a
 * gate piece ships in the package and an app imports it, so this is that one
 * copy. Peek and Ship move onto it in UIG-32.
 *
 * Two configs, as the copies had:
 *
 * - `tokenLint` — a class Tailwind does not generate (the doubled token name,
 *   `bg-bg-surface`), Tailwind's own type ramp or palette, a raw colour, an
 *   opacity modifier on a token colour.
 * - `tokenValues` — UIG-28: type, corners and shadows written by hand, and an
 *   inline style that sets a colour (errors); heights, spacing and border
 *   widths written by hand (warnings, never blocking).
 *
 * The patterns are the same for everyone. Only the words differ: an app is told
 * to use "the package", the package is told to add the token to `tokens.css`.
 * Measured on 17 September: the UIG-28 block was byte for byte the same in Peek
 * and Ship, and this repository's had the same patterns with seven messages
 * worded for the package.
 *
 * Where the plugin looks: every `className`, every `cn()` / `clsx()` argument,
 * and the values of a class map whose name ends in `Styles` / `_STYLES` or
 * `Classes` / `_CLASSES`. A class map named any other way is invisible to it.
 *
 * Tests are out of `tokenValues` (ruling of 13 September): a test mounts markup
 * to test it. A kept hand-written value says why:
 * `// eslint-disable-next-line <rule> -- @estiva-escape: <reason>` (A2).
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { Linter } from 'eslint'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/defaults'
import { parser as typescriptParser } from 'typescript-eslint'

/** Who reads the messages. */
export type TokenAudience = 'app' | 'package'

export interface TokenLintOptions {
  /** The Tailwind config the unknown-class rule reads, relative to where ESLint runs. */
  tailwindConfig?: string
  /** `app` (the default) names the package; `package` names `tokens.css` and the preset. */
  audience?: TokenAudience
}

/** What the token lint never reads: build output. */
export const TOKEN_LINT_IGNORES = ['dist/', 'storybook-static/', 'node_modules/']

const CLASS_MAP_SELECTOR = {
  kind: 'variable',
  name: '^(?:[A-Z][A-Z0-9_]*_(?:STYLES|CLASSES)|[a-z][a-zA-Z0-9]*(?:Styles|Classes))$',
  match: [{ type: 'strings' }, { type: 'objectValues' }],
}

const WORDS = {
  app: {
    ramp: "Tailwind's type ramp is not a token. Use the ramp from the package: text-body-2, text-caption, text-h3, text-btn-default...",
    palette: "Tailwind's palette is not a token. Use a colour from the package (bg-bg-surface, text-text-primary, border-border-subtle...); a colour with no token is a missing token.",
    raw: 'A raw colour is a missing token: add it to the package (tokens.css in every theme block, and the preset), or say why not in an eslint-disable comment.',
    opacity: 'An opacity modifier on a token colour compiles to nothing. A transparent colour is a token of its own (D16): add it to the package.',
    type: '$0 is type written by hand. A token from the package sets the size, line height, letter spacing and weight together (text-body-2, text-caption, text-h5...); if none fits, add one to the package, or say why not in an eslint-disable comment.',
    corner: '$0 is a corner written by hand, and no token has it. Use a corner from the package (rounded-sm 4px, rounded-md 6px, rounded-lg 8px...), or say why not in an eslint-disable comment.',
    shadow: '$0 is a shadow written by hand. Use a shadow from the package (shadow-sm, shadow-md, shadow-focus-ring, drop-shadow-glow-success...); a shadow with no token is a missing token.',
  },
  package: {
    ramp: "Tailwind's type ramp is not a token. Use the ramp in tailwind-preset.js: text-body-2, text-caption, text-h3, text-btn-default...",
    palette: "Tailwind's palette is not a token. Use a colour from tailwind-preset.js (bg-bg-surface, text-text-primary, border-border-subtle...); a colour with no token is a missing token.",
    raw: 'A raw colour is a missing token: add it to tokens.css in every theme block and to the preset, or say why not in an eslint-disable comment.',
    opacity: 'An opacity modifier on a token colour compiles to nothing. A transparent colour is a token of its own (D16): add it to tokens.css in every theme block and to the preset.',
    type: '$0 is type written by hand. A token from tailwind-preset.js sets the size, line height, letter spacing and weight together (text-body-2, text-caption, text-h5...); if none fits, add one to the preset and to cn.ts, or say why not in an eslint-disable comment.',
    corner: '$0 is a corner written by hand, and no token has it. Use a corner from tailwind-preset.js (rounded-sm 4px, rounded-md 6px, rounded-lg 8px...), or say why not in an eslint-disable comment.',
    shadow: '$0 is a shadow written by hand. Use a shadow from tailwind-preset.js (shadow-sm, shadow-md, shadow-focus-ring, drop-shadow-glow-success...); a shadow with no token is a missing token.',
  },
} satisfies Record<TokenAudience, Record<string, string>>

/**
 * The class rules. `no-unknown-classes` reads the app's own Tailwind config, so
 * it knows exactly what the preset and the app generate.
 */
export function tokenLint({ tailwindConfig = 'tailwind.config.js', audience = 'app' }: TokenLintOptions = {}): Linter.Config {
  const words = WORDS[audience]
  return {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': {
        tailwindConfig,
        selectors: [...getDefaultSelectors(), CLASS_MAP_SELECTOR],
      },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            { pattern: '^(?:[a-z0-9-]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl)$', message: words.ramp },
            {
              pattern:
                '^(?:[a-z0-9-]+:)*(?:text|bg|border|ring|outline|fill|stroke|decoration|divide|placeholder|from|via|to|accent|caret|shadow)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-[0-9]{2,3})?(?:/[0-9]{1,3})?$',
              message: words.palette,
            },
            { pattern: '^(?:[a-z0-9-]+:)*[a-z-]+-\\[[^\\]]*(?:#[0-9a-fA-F]{3}|rgba?\\(|hsla?\\(|oklch\\()', message: words.raw },
            {
              pattern: '^(?:[a-z0-9-]+:)*(?:text|bg|border|ring|outline|fill|stroke|decoration|divide|placeholder|from|via|to|accent|caret|shadow)-(?:bg|text|border|accent|info|warning|success|error)-[a-z-]+/[0-9]{1,3}$',
              message: words.opacity,
            },
          ],
        },
      ],
    },
  }
}

// UIG-28's patterns. The variant part reads arbitrary variants too
// (`[&_pre]:`, `data-[state]:`, `group-hover/row:`). A colour inside `text-[…]`
// is left to the raw-colour rule of `tokenLint`.
const V = '^(?:(?:[^:\\[\\]\\s]|\\[[^\\]]*\\])+:)*!?'
const NOT_COLOUR = '(?!color:|#|rgba?\\(|hsla?\\(|oklch\\(|var\\()'
const HAND_WRITTEN = {
  type: `${V}(?:text-\\[${NOT_COLOUR}|text-\\[length:|leading-\\[|tracking-\\[)[^\\]]+\\](?:/\\S*)?$`,
  corner: `${V}rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?-\\[[^\\]]+\\]$`,
  shadow: `${V}(?:shadow|drop-shadow)-\\[(?!color:)[^\\]]+\\]$`,
  spacing: `${V}-?(?:w|h|size|min-w|min-h|max-w|max-h|p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|translate-[xy]|basis|indent|scroll-[mp][xytrblse]?|border-spacing(?:-[xy])?)-\\[[^\\]]+\\]$`,
  width: `${V}(?:border(?:-[xytrblse])?|divide-[xy]|outline|ring|ring-offset)-\\[(?:length:)?-?[0-9.]+(?:px|rem|em)?\\]$`,
}

const INLINE_STYLE_TOKEN_PROPERTIES =
  '/^(color|background|backgroundColor|backgroundImage|fill|stroke|fontSize|border|borderTop|borderRight|borderBottom|borderLeft|borderBlock|borderInline|borderStyle|boxShadow|textShadow)$|Color$/'

interface Preset {
  theme: { extend: { fontSize: Record<string, string | [string, unknown]>; borderRadius: Record<string, string> } }
}

/**
 * The preset, loaded the way Tailwind loads it: it imports `tailwindcss/plugin`,
 * which a plain `import` cannot resolve. Read from beside this module, so an app
 * and this repository read the one preset the package ships.
 */
function loadPreset(): Preset {
  const require = createRequire(import.meta.url)
  const loadConfig = require('tailwindcss/loadConfig') as (path: string) => Preset
  return loadConfig(fileURLToPath(new URL('../../tailwind-preset.js', import.meta.url)))
}

/**
 * UIG-28: the values the tokens already name, written by hand (Katerina's
 * rulings B11, B12, C3 of 13 September and R2 of 15 September). Register it
 * after `tokenLint`, whose parser and plugin settings it borrows. Under its own
 * rule names, `token-values` and `token-spacing` (the same plugin twice, so one
 * runs as errors and one as warnings): an escape for a hand-written size then
 * cannot also silence a raw colour on the same line.
 */
export function tokenValues({ audience = 'app' }: Pick<TokenLintOptions, 'audience'> = {}): Linter.Config {
  const words = WORDS[audience]
  const preset = loadPreset()
  // `text-[14px]` names the token of that size, read from the preset, so the
  // message stays true when the ramp changes.
  const tokensBySize: Record<string, string[]> = {}
  for (const [name, value] of Object.entries(preset.theme.extend.fontSize)) {
    const size = Array.isArray(value) ? value[0] : value
    ;(tokensBySize[size] ??= []).push(`text-${name}`)
  }
  const cornersBySize: Record<string, string[]> = {}
  for (const [name, size] of Object.entries(preset.theme.extend.borderRadius)) (cornersBySize[size] ??= []).push(name === 'DEFAULT' ? 'rounded' : `rounded-${name}`)

  return {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    plugins: { 'token-values': betterTailwindcss, 'token-spacing': betterTailwindcss },
    rules: {
      'token-values/no-restricted-classes': [
        'error',
        {
          restrict: [
            ...Object.entries(tokensBySize).map(([size, names]) => ({
              pattern: `${V}text-\\[${size.replace('.', '\\.')}\\](?:/\\S*)?$`,
              message: `$0 is the type ramp written by hand. Use ${names.join(' or ')}.`,
            })),
            {
              pattern: HAND_WRITTEN.type,
              message: words.type,
            },
            ...Object.entries(cornersBySize).map(([size, names]) => ({
              pattern: `${V}rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?-\\[${size.replace('.', '\\.')}\\]$`,
              message: `$0 is a corner written by hand. Use ${names.join(' or ')} (with the same side, if it has one).`,
            })),
            {
              pattern: HAND_WRITTEN.corner,
              message: words.corner,
            },
            {
              pattern: HAND_WRITTEN.shadow,
              message: words.shadow,
            },
          ],
        },
      ],
      'token-spacing/no-restricted-classes': [
        'warn',
        {
          restrict: [
            {
              pattern: HAND_WRITTEN.spacing,
              message: '$0 is a size or a space written by hand. Use a step of the spacing scale (p-3, h-9, gap-2...) if one fits. Reported, not blocked.',
            },
            {
              pattern: HAND_WRITTEN.width,
              message: '$0 is a border or ring width written by hand. Use border, border-2, ring-1... if one fits. Reported, not blocked.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=${INLINE_STYLE_TOKEN_PROPERTIES}]`,
          message: 'An inline style that sets a colour, a font size, a border or a shadow is outside the token contract: use a token class. If the value is computed (a palette, a size from a prop), say why in an eslint-disable comment. Width, height and transforms are fine.',
        },
      ],
    },
  }
}
