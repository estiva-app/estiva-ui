/// <reference types="node" />
/**
 * Write `.gates-count.json`: what the gate finds, per rule — errors, warnings
 * and escapes (seam S3 in docs/GATES.md §16). Written once (§23): until UIG-10
 * Peek, Ship and this package each carried the same script, differing only in
 * the repo's name and which rules it seeded.
 *
 * Runs after the gate lint (npm's `postlint:rules`), so CI runs it too. The
 * file is committed: nothing compares it yet, and the later ratchet needs the
 * history to start at the first commit. It lints with the gate's own config,
 * with escapes reported, so an escape is counted rather than silent. The file
 * is rewritten only when a count changes, so running the lint does not leave a
 * changed file behind every time.
 *
 * It fails when an `eslint-disable` switched a gate rule off: that is not an
 * escape, and the escape count cannot see it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ESLint as ESLintClass } from 'eslint'
import { APP_RULE_IDS, countGates, PACKAGE_RULE_IDS, type GateCount } from '../eslint/index'

export interface CountOptions {
  /** The folder the gate lints from, where `.gates-count.json` is written. */
  root?: string
  /** The name written into the file: `peek`, `ship`, `estiva-ui`, or the app's. */
  repo: string
  /** `app` seeds the app rules; `package` this package's inward set (UIG-5). */
  audience?: 'app' | 'package'
  /** The gate's config file, relative to `root`. */
  config?: string
}

export interface CountResult extends GateCount {
  changed: boolean
  /** What to print, line by line. */
  lines: string[]
  /** What to print to stderr when a rule was switched off; empty when none was. */
  failures: string[]
}

/** ESLint from where the gate lints, never from beside this file: an app's own install. */
async function eslintFrom(root: string): Promise<typeof ESLintClass> {
  const resolved = createRequire(join(root, 'package.json')).resolve('eslint')
  return ((await import(pathToFileURL(resolved).href)) as { ESLint: typeof ESLintClass }).ESLint
}

export async function writeGateCount({ root = process.cwd(), repo, audience = 'app', config = 'eslint.gates.config.js' }: CountOptions): Promise<CountResult> {
  const out = join(root, '.gates-count.json')
  const ESLint = await eslintFrom(root)
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: join(root, config),
    overrideConfig: { settings: { estiva: { reportEscapes: true } } },
  })
  // The set the gate runs, so a rule with nothing to report still has its row.
  const { rules, disabled } = countGates(await eslint.lintFiles(['.']), audience === 'package' ? PACKAGE_RULE_IDS : APP_RULE_IDS)

  const previous = existsSync(out) ? (JSON.parse(readFileSync(out, 'utf8')) as { rules?: unknown }) : null
  const changed = JSON.stringify(previous?.rules) !== JSON.stringify(rules)
  if (changed) {
    const count = { schemaVersion: 1, repo, generatedAt: new Date().toISOString(), rules }
    writeFileSync(out, `${JSON.stringify(count, null, 2)}\n`)
  }
  const lines = [changed ? '.gates-count.json: written' : '.gates-count.json: unchanged']
  for (const [id, c] of Object.entries(rules)) lines.push(`  ${id}: ${c.errors} errors, ${c.warnings} warnings, ${c.escapes} escapes`)

  const failures: string[] = []
  if (disabled.length > 0) {
    failures.push('', 'An eslint-disable switched a gate rule off. Write the reason above the element instead, naming the rule: // @estiva-escape(<rule>): <reason>')
    for (const d of disabled) failures.push(`  ${relative(root, d.filePath)}:${d.line}  ${d.ruleId}`)
  }
  return { rules, disabled, changed, lines, failures }
}
