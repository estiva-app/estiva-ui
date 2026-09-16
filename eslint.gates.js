import { parser as typescriptParser } from 'typescript-eslint'
import estiva from './dist/eslint/index.js'

/**
 * The UI Guardrails' rules, pointed inward at this package (UIG-5; UIG-3 built
 * the same chain in Peek and UIG-4 in Ship).
 *
 * The apps run `estiva.configs.recommended`, which says an app must not build
 * what this package already has. This is the other set, `configs.package`,
 * which only this package runs:
 *
 * - a raw element buried inside a component, rather than the component's own
 *   outermost element or one handed to a Base UI `render` prop;
 * - behaviour Base UI owns, written by hand — a portal, a global listener (D6);
 * - a component with no page, or no story.
 *
 * The rules are code in `src/eslint/`, built into `dist/eslint/` by `build.mjs`
 * — the very file published as `@estiva-app/ui/eslint`. So the rule this repo
 * runs on itself is the rule the apps install, and `npm run lint:rules` builds
 * it first.
 *
 * Where: every `.tsx` under `src`, stories included (a story is what people read
 * and copy), tests not (a test mounts markup to test it) — Katerina's rulings of
 * 13 September.
 *
 * A place that keeps one says why, on the line above: `// @estiva-escape:
 * <reason>`, or `{/* @estiva-escape: <reason> *\/}` as a JSX child, or at the
 * top of the file where the rule is about the file itself. Never
 * `eslint-disable`: the count refuses it.
 */

// The same folders `eslint.config.js` ignores.
export const GATE_LINT_IGNORES = ['dist/', 'storybook-static/', 'node_modules/']

export const gateLint = {
  ...estiva.configs.package,
  files: ['src/**/*.tsx'],
  ignores: ['**/*.test.ts', '**/*.test.tsx'],
  languageOptions: {
    parser: typescriptParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
}
