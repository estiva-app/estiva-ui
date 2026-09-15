/// <reference types="node" />
/**
 * `@estiva-app/ui/eslint` — the UI Guardrails' lint rules, as a plugin (UIG-3,
 * seam S1 in docs/GATES.md §16).
 *
 * A plugin rather than config, so every app — Peek, Ship, Leaf — gets a new
 * rule through an ordinary version bump, and an app's editor hook runs the
 * very rule code its CI runs.
 *
 *     import estiva from '@estiva-app/ui/eslint'
 *     export default [{ files: ['src/**\/*.tsx'], ...estiva.configs.recommended }]
 *
 * Register it under `estiva` (the configs do): the rule ids are
 * `estiva/<rule>`, and `countGates` counts those ids.
 *
 * Built on its own by build.mjs, for Node, into `dist/eslint/`; nothing here
 * reaches the components' browser bundle.
 */
import { createRequire } from 'node:module'
import type { ESLint, Linter } from 'eslint'
import { noRawButton } from './no-raw-button'

export { ESCAPE_MARKER, MIN_REASON, SETTINGS_KEY, isEscaped, type EstivaSettings } from './escape'

const { version } = createRequire(import.meta.url)('../../package.json') as { version: string }

/** The name the configs register the plugin under, so every rule id is `estiva/<rule>`. */
export const PLUGIN_KEY = 'estiva'

const rules = {
  'no-raw-button': noRawButton,
}

const plugin = {
  meta: { name: '@estiva-app/ui/eslint', version },
  rules,
  configs: {} as { recommended: Linter.Config; strict: Linter.Config },
} satisfies ESLint.Plugin

const ruleIds = Object.keys(rules).map((name) => `${PLUGIN_KEY}/${name}`)

/**
 * `recommended` switches every rule on at the level it was ruled at: an error
 * blocks, a warning is reported and never blocks. `strict` makes every rule an
 * error. With one rule, an error, the two are the same today; they part when
 * the first warning-level rule arrives (UIG-25).
 */
plugin.configs.recommended = {
  name: '@estiva-app/ui/recommended',
  plugins: { [PLUGIN_KEY]: plugin },
  rules: { [`${PLUGIN_KEY}/no-raw-button`]: 'error' },
}
plugin.configs.strict = {
  name: '@estiva-app/ui/strict',
  plugins: { [PLUGIN_KEY]: plugin },
  rules: Object.fromEntries(ruleIds.map((id) => [id, 'error'])),
}

export default plugin

export interface GateRuleCount {
  errors: number
  warnings: number
  escapes: number
}

export interface GateCount {
  /** Per rule id, including rules with nothing to report. */
  rules: Record<string, GateRuleCount>
  /**
   * Reports of these rules that an `eslint-disable` directive silenced. Not
   * an escape: a gate fails on any of these (docs/GATES.md §16, S4).
   */
  disabled: { filePath: string; line: number; ruleId: string }[]
}

/**
 * Count what a lint of these rules found, for `.gates-count.json` (seam S3).
 *
 * Run the lint with `settings: { estiva: { reportEscapes: true } }` for the
 * escapes to be counted; without it they are silent and count 0. A marker
 * with no reason, or inside a directive, counts as an error of its rule.
 */
export function countGates(results: ESLint.LintResult[]): GateCount {
  const counts: Record<string, GateRuleCount> = Object.fromEntries(ruleIds.map((id) => [id, { errors: 0, warnings: 0, escapes: 0 }]))
  const disabled: GateCount['disabled'] = []
  for (const result of results) {
    for (const message of result.messages) {
      const count = message.ruleId ? counts[message.ruleId] : undefined
      if (!count) continue
      if (message.messageId === 'escaped') count.escapes += 1
      else if (message.severity === 2) count.errors += 1
      else count.warnings += 1
    }
    for (const message of result.suppressedMessages ?? []) {
      if (message.ruleId && counts[message.ruleId]) disabled.push({ filePath: result.filePath, line: message.line, ruleId: message.ruleId })
    }
  }
  return { rules: counts, disabled }
}
