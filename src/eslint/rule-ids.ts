/**
 * The names of the app rules, with nothing imported.
 *
 * `create-estiva-app` needs these names to write a new app's count at zero, and
 * nothing else of the plugin. It runs from `npx` in an empty folder, where only
 * this package's own dependencies are installed, so it must never load the
 * rules themselves: since `no-copied-look` (UIG-25, 0.34.0) they import
 * TypeScript, and that import stopped the command before it wrote a file
 * (UIG-10, reopened 27 September). `index.ts` holds its rule table to exactly
 * these names, so the two cannot drift.
 */

/** The name the configs register the plugin under, so every rule id is `estiva/<rule>`. */
export const PLUGIN_KEY = 'estiva'

export const APP_RULE_NAMES = [
  'no-raw-element',
  'no-rebuilt-behaviour',
  'no-restyled-part',
  'no-handmade-header',
  'no-handmade-empty-state',
  'no-native-title',
  'no-copied-look',
] as const

export type AppRuleName = (typeof APP_RULE_NAMES)[number]

/** The ids `recommended` and `strict` carry — what an app's gate runs and counts. */
export const APP_RULE_IDS = APP_RULE_NAMES.map((name) => `${PLUGIN_KEY}/${name}`)
