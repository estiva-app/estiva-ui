import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/defaults'
import { defineConfig, globalIgnores } from 'eslint/config'
import { parser as typescriptParser } from 'typescript-eslint'

/**
 * The token contract as a machine rule (`npm run lint`, run in CI).
 *
 * Three things a class list may not do here, each of which has shipped a
 * silent defect before:
 *
 * 1. Name a class Tailwind does not generate. The token names are doubled in
 *    the class (`bg-bg-surface`, not `bg-surface`); the shorter spelling
 *    compiles to nothing and is dropped without a word. Ship's sign-in screen
 *    rendered transparent that way. `no-unknown-classes` reads
 *    tailwind.config.js, so it knows exactly what the preset generates,
 *    including the `signal:` and `ship:` variants.
 * 2. Reach for Tailwind's own type ramp or palette (`text-sm`, `bg-gray-100`,
 *    `text-white`). Those are not tokens, so they do not follow the theme.
 * 3. Write a raw colour into an arbitrary value: `text-[#fff]`,
 *    `bg-[rgba(...)]`, and a shadow or glow that carries an `rgba(...)`. A
 *    colour with no token is a missing token; it goes into tokens.css. A
 *    deliberate exception carries an `eslint-disable` comment that says why.
 *
 * Where the plugin looks: every `className` attribute, every `cn()` / `clsx()`
 * argument, and, added here, the values of a class map: a `const` whose name
 * ends in `Styles` / `_STYLES` or `Classes` / `_CLASSES` (`typeStyles`, `TONE_STYLES`).
 * A class map named any other way is invisible to the lint, so name it that
 * way.
 *
 * `no-conflicting-classes` is not enabled: the plugin supports it on
 * Tailwind 4 only (its README, 2026-09-06), and this package is on 3.4.
 *
 * Opacity modifiers on token colours (`bg-bg-inset/40`) are rejected too: the
 * tokens are plain `var()` values, so the modifier compiles to nothing, and a
 * transparent colour is a token of its own (D16).
 *
 * Only the class rules run. The TypeScript rule sets are a separate decision,
 * so that the commit that adds the lint changes no component.
 */
export default defineConfig([
  globalIgnores(['dist/', 'storybook-static/', 'node_modules/']),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': {
        tailwindConfig: 'tailwind.config.js',
        selectors: [
          ...getDefaultSelectors(),
          {
            kind: 'variable',
            name: '^(?:[A-Z][A-Z0-9_]*_(?:STYLES|CLASSES)|[a-z][a-zA-Z0-9]*(?:Styles|Classes))$',
            match: [{ type: 'strings' }, { type: 'objectValues' }],
          },
        ],
      },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            {
              pattern: '^(?:[a-z0-9-]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl)$',
              message: "Tailwind's type ramp is not a token. Use the ramp in tailwind-preset.js: text-body-2, text-caption, text-h3, text-btn-default...",
            },
            {
              pattern:
                '^(?:[a-z0-9-]+:)*(?:text|bg|border|ring|outline|fill|stroke|decoration|divide|placeholder|from|via|to|accent|caret|shadow)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\\d{2,3})?(?:/\\d{1,3})?$',
              message: "Tailwind's palette is not a token. Use a colour from tailwind-preset.js (bg-bg-surface, text-text-primary, border-border-subtle...); a colour with no token is a missing token.",
            },
            {
              pattern: '^(?:[a-z0-9-]+:)*[a-z-]+-\\[[^\\]]*(?:#[0-9a-fA-F]{3}|rgba?\\(|hsla?\\(|oklch\\()',
              message: 'A raw colour is a missing token: add it to tokens.css in every theme block and to the preset, or say why not in an eslint-disable comment.',
            },
            {
              pattern: '^(?:[a-z0-9-]+:)*(?:text|bg|border|ring|outline|fill|stroke|decoration|divide|placeholder|from|via|to|accent|caret|shadow)-(?:bg|text|border|accent|info|warning|success|error)-[a-z-]+/\\d{1,3}$',
              message: 'An opacity modifier on a token colour compiles to nothing. A transparent colour is a token of its own (D16): add it to tokens.css in every theme block and to the preset.',
            },
          ],
        },
      ],
    },
  },
])
