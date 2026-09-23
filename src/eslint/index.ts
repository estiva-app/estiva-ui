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
import { componentHasAPage, componentHasAStory } from './has-a-page-and-a-story'
import { noHandRolledBehaviour } from './no-hand-rolled-behaviour'
import { noHandmadeHeader } from './no-handmade-header'
import { noRawElement } from './no-raw-element'
import { noRebuiltBehaviour } from './no-rebuilt-behaviour'
import { noRestyledPart } from './no-restyled-part'
import { rawElementOutsideAWrapper } from './raw-element-outside-a-wrapper'

export { ESCAPE_MARKER, MIN_REASON, SETTINGS_KEY, isEscaped, type EstivaSettings } from './escape'
export { OWNED_BEHAVIOURS, type OwnedBehaviour } from './no-rebuilt-behaviour'
export { PART_LOOK_PROPS, PLACEMENT } from './no-restyled-part'

const { version } = createRequire(import.meta.url)('../../package.json') as { version: string }

/** The name the configs register the plugin under, so every rule id is `estiva/<rule>`. */
export const PLUGIN_KEY = 'estiva'

/**
 * The rules an **app** runs: they say an app must not build what the package
 * already has — a raw control (UIG-7), or a behaviour one of its parts owns
 * (UIG-8) — nor restyle a part it uses (UIG-9). `recommended` and `strict`
 * carry these and only these.
 */
const appRules = {
  'no-raw-element': noRawElement,
  'no-rebuilt-behaviour': noRebuiltBehaviour,
  'no-restyled-part': noRestyledPart,
  'no-handmade-header': noHandmadeHeader,
}

/**
 * The rules the **package itself** runs, pointed inward (UIG-5): don't bury a
 * raw element inside a component, don't rebuild what Base UI owns, don't ship a
 * component without a page or a story.
 *
 * They are in `configs.package`, never in `recommended`, on purpose. Peek and
 * Ship spread `recommended`, so a rule added here must not arrive in an app
 * with the next version bump: an app's components are not primitives, so
 * "buried inside a component" means nothing there (`no-raw-element` is the
 * app's version, UIG-7), and an app has no `.mdx` pages at all. `index.test.ts` holds the
 * apps' list to exactly the app rules.
 *
 * One rule is in both sets: `no-restyled-part` (UIG-9). The package restyles
 * none of its own parts either (Katerina, 17 September).
 */
const packageRules = {
  'raw-element-outside-a-wrapper': rawElementOutsideAWrapper,
  'no-hand-rolled-behaviour': noHandRolledBehaviour,
  'component-has-a-page': componentHasAPage,
  'component-has-a-story': componentHasAStory,
  'no-restyled-part': noRestyledPart,
  'no-handmade-header': noHandmadeHeader,
}

const rules = { ...appRules, ...packageRules }

const plugin = {
  meta: { name: '@estiva-app/ui/eslint', version },
  rules,
  configs: {} as { recommended: Linter.Config; strict: Linter.Config; package: Linter.Config },
} satisfies ESLint.Plugin

/** The ids `recommended` and `strict` carry — what an app's gate runs and counts. */
export const APP_RULE_IDS = Object.keys(appRules).map((name) => `${PLUGIN_KEY}/${name}`)
/** The ids `package` carries — what this package's own gate runs and counts (UIG-5). */
export const PACKAGE_RULE_IDS = Object.keys(packageRules).map((name) => `${PLUGIN_KEY}/${name}`)

/**
 * `recommended` switches every **app** rule on at the level it was ruled at: an
 * error blocks, a warning is reported and never blocks. `strict` makes every app
 * rule an error. With every app rule an error, the two are the same today; they part
 * when the first warning-level rule arrives (UIG-25).
 *
 * `package` is the inward set (UIG-5), which only this package runs.
 */
plugin.configs.recommended = {
  name: '@estiva-app/ui/recommended',
  plugins: { [PLUGIN_KEY]: plugin },
  rules: {
    [`${PLUGIN_KEY}/no-raw-element`]: 'error',
    [`${PLUGIN_KEY}/no-rebuilt-behaviour`]: 'error',
    [`${PLUGIN_KEY}/no-restyled-part`]: 'error',
    [`${PLUGIN_KEY}/no-handmade-header`]: 'error',
  },
}
plugin.configs.strict = {
  name: '@estiva-app/ui/strict',
  plugins: { [PLUGIN_KEY]: plugin },
  rules: Object.fromEntries(APP_RULE_IDS.map((id) => [id, 'error'])),
}
plugin.configs.package = {
  name: '@estiva-app/ui/package',
  plugins: { [PLUGIN_KEY]: plugin },
  rules: Object.fromEntries(PACKAGE_RULE_IDS.map((id) => [id, 'error'])),
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
 *
 * `seed` is which rules the count lists when they found nothing, and it is the
 * app rules unless a caller says otherwise: an app's count file must not gain
 * rows for the inward rules (UIG-5) that its gate does not run. This package's
 * own count script passes `PACKAGE_RULE_IDS`.
 */
export function countGates(results: ESLint.LintResult[], seed: readonly string[] = APP_RULE_IDS): GateCount {
  const counts: Record<string, GateRuleCount> = Object.fromEntries(seed.map((id) => [id, { errors: 0, warnings: 0, escapes: 0 }]))
  const disabled: GateCount['disabled'] = []
  const ours = (ruleId: string | null | undefined): ruleId is string => typeof ruleId === 'string' && ruleId.startsWith(`${PLUGIN_KEY}/`)
  for (const result of results) {
    for (const message of result.messages) {
      // Seeded or not: every rule of this plugin that reported is counted, so a
      // lint of a set the caller did not name is still counted in full.
      if (!ours(message.ruleId)) continue
      const count = (counts[message.ruleId] ??= { errors: 0, warnings: 0, escapes: 0 })
      if (message.messageId === 'escaped') count.escapes += 1
      else if (message.severity === 2) count.errors += 1
      else count.warnings += 1
    }
    for (const message of result.suppressedMessages ?? []) {
      if (ours(message.ruleId)) disabled.push({ filePath: result.filePath, line: message.line, ruleId: message.ruleId })
    }
  }
  return { rules: counts, disabled }
}
