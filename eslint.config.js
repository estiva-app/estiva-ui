import { defineConfig, globalIgnores } from 'eslint/config'
import { gateLint, tokenLint, tokenValues } from './dist/gates/index.js'

/**
 * The token contract's settings are the package's own gate piece, `tokenLint`
 * and `tokenValues` from `src/gates/token-lint.ts` (UIG-10, docs/GATES.md §23):
 * the one copy a made app imports (Peek and Ship move onto it in UIG-32), built
 * into `dist/gates/` by `prelint`.
 * Here they speak to the package (`audience: 'package'`): a missing token goes
 * into `tokens.css` and the preset.
 */
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
  tokenLint({ audience: 'package' }),
  tokenValues({ audience: 'package' }),
  // The UI Guardrails' inward rules (UIG-5), so an editor shows them where the
  // element is typed. `npm run lint:rules` runs these alone, and that is the CI
  // gate. They come from `dist/`, which `prelint` builds.
  gateLint({ audience: 'package' }),
])
