/// <reference types="node" />
/**
 * Where the UI Guardrails' rules apply, written once (docs/GATES.md §23).
 *
 * Until UIG-10 every repo wrote this itself: `eslint.gates.js` (the rules and
 * where they apply) and `eslint.gates.config.js` (the gate: those rules alone)
 * in Peek, in Ship's `web/`, and here pointed inward. The rules were always the
 * package's; these two files were copies. Now they are two functions.
 *
 * Where: every `.ts` and `.tsx` under `src`, stories included (a story is what
 * people read and copy), tests not (a test mounts markup to test it) —
 * Katerina's rulings of 13 September; `.ts` since UIG-8. This package's own
 * inward set reads `.tsx` only, as it always has.
 *
 * A place that keeps something says why, on the line above:
 * `// @estiva-escape: <reason>`, or `{/* @estiva-escape: <reason> *\/}` as a
 * JSX child. Never `eslint-disable`: the count refuses it.
 */
import type { ESLint, Linter } from 'eslint'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { parser as typescriptParser } from 'typescript-eslint'
import estiva from '../eslint/index'
import { TOKEN_LINT_IGNORES } from './token-lint'

export interface GateConfigOptions {
  /** `app` (the default) runs `configs.recommended`; `package` runs this package's inward set. */
  audience?: 'app' | 'package'
  /**
   * Plugins whose `eslint-disable` directives appear in the source, registered
   * here with every rule off. ESLint refuses a directive for a rule it does not
   * know, so without them the gate would fail on another lint's comments.
   * The token lint's names are registered already.
   */
  quiet?: Record<string, ESLint.Plugin>
  /** Folders the gate never reads, beside build output. */
  ignores?: string[]
}

/**
 * The rules and where they apply — one config object, to add beside
 * everything else an app's `eslint.config.js` runs, so an editor shows a
 * refusal where the element is typed.
 */
export function gateLint({ audience = 'app' }: Pick<GateConfigOptions, 'audience'> = {}): Linter.Config {
  return {
    ...(audience === 'package' ? estiva.configs.package : estiva.configs.recommended),
    files: audience === 'package' ? ['src/**/*.tsx'] : ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  }
}

/**
 * The gate: the rules on their own — `npm run lint:rules`, CI's job `gate`, and
 * the config the editor hook lints a proposed write with. It fails on a gate
 * rule and on nothing else, so a backlog in the full lint never blocks it.
 */
export function gateConfig({ audience = 'app', quiet = {}, ignores = [] }: GateConfigOptions = {}): Linter.Config[] {
  return [
    { ignores: [...TOKEN_LINT_IGNORES, ...ignores] },
    {
      plugins: {
        ...quiet,
        'better-tailwindcss': betterTailwindcss,
        'token-values': betterTailwindcss,
        'token-spacing': betterTailwindcss,
      },
      // Every other config's directives are unused here, because their rules are
      // off here. Reporting them would be this config complaining about the
      // others' business.
      linterOptions: { reportUnusedDisableDirectives: 'off' },
    },
    gateLint({ audience }),
  ]
}
