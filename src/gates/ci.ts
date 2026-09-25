/// <reference types="node" />
/**
 * `estiva-gates ci` — CI's job `gate`, as one command (Katerina's ruling R13,
 * 25 September). Until 0.36.0 each repo listed the gate's steps in its own
 * workflow, and the lists had drifted: Peek ran `lint:tokens`, Ship the whole
 * `lint`, and no repo checked the two things below. Now the steps live here,
 * and a repo's `gate` job runs this and nothing else of the gate's.
 *
 * 1. The gate lint (`npm run lint:rules`), which writes `.gates-count.json`.
 * 2. The count is committed (B2): a pull request that changes what the gate
 *    finds and leaves the old count behind fails, so the file is the truth.
 * 3. The token contract (`npm run lint:tokens`, or `npm run lint` where a repo
 *    has no token lint of its own).
 * 4. The catalogue (`npm run registry:check`).
 * 5. The wall's own settings (B13): the committed `.claude/settings.json` runs
 *    the editor hook before every Write and Edit, and that hook refuses a raw
 *    button; every folder the gate skips is named on the debt page, with why.
 *
 * Every step runs, so one red step does not hide the others.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TOKEN_LINT_IGNORES } from './token-lint'

export interface CiOptions {
  /** The repository's top folder, where the gate lints from. */
  root?: string
  /** `package` is this package's own gate: its skipped folders are named in docs/GATES.md. */
  audience?: 'app' | 'package'
  /** Print as the steps run. Defaults to stdout. */
  print?: (line: string) => void
}

/** The part a CI run writes to the probe: a raw button, which every gate refuses. */
const PROBE = '/** A probe CI writes to check the editor hook; never on disk. */\nexport function GateProbe() {\n  return <button type="button">x</button>\n}\n'

const npm = (root: string, script: string) => spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: true }).status === 0

/** `.gates-count.json` as the gate lint left it matches the committed file; the lines that say otherwise. */
export function countCommitted(root: string): string[] {
  const run = spawnSync('git', ['status', '--porcelain', '--', '.gates-count.json'], { cwd: root, encoding: 'utf8' })
  if (run.status !== 0) return [`git could not read .gates-count.json's state: ${run.stderr.trim()}`]
  if (!run.stdout.trim()) return []
  const diff = spawnSync('git', ['diff', '--', '.gates-count.json'], { cwd: root, encoding: 'utf8' }).stdout.trim()
  return [
    'The gate found something other than the committed count: run `npm run lint:rules` and commit `.gates-count.json` with the change that moved it.',
    ...(diff ? diff.split('\n').filter((l) => /^[+-]\s/.test(l)).map((l) => `  ${l}`) : ['  .gates-count.json is not committed at all']),
  ]
}

interface HookEntry {
  matcher?: string
  hooks?: { type?: string; command?: string }[]
}

/** The committed hook runs before every Write and Edit and refuses a raw button; the lines that say otherwise. */
export function hookRuns(root: string): string[] {
  const file = join(root, '.claude', 'settings.json')
  if (!existsSync(file)) return ['.claude/settings.json is missing: the editor hook is not switched on (docs/GATES.md §23).']
  let entries: HookEntry[]
  try {
    entries = ((JSON.parse(readFileSync(file, 'utf8')) as { hooks?: { PreToolUse?: HookEntry[] } }).hooks?.PreToolUse ?? [])
  } catch (error) {
    return [`.claude/settings.json does not read as JSON: ${error instanceof Error ? error.message : String(error)}`]
  }
  const covers = (matcher: string | undefined, tool: string) => {
    if (!matcher || matcher === '*') return true
    try {
      return new RegExp(`^(?:${matcher})$`).test(tool)
    } catch {
      return false
    }
  }
  const input = JSON.stringify({ tool_name: 'Write', session_id: 'estiva-gates-ci', cwd: root, tool_input: { file_path: join(root, 'src', 'GateProbe.tsx'), content: PROBE } })
  const tried: string[] = []
  for (const entry of entries) {
    if (!covers(entry.matcher, 'Write') || !covers(entry.matcher, 'Edit')) continue
    for (const hook of entry.hooks ?? []) {
      if (hook.type !== 'command' || !hook.command) continue
      // The project folder, written in: a Windows shell does not expand `$VAR`.
      const command = hook.command.replace(/\$\{?CLAUDE_PROJECT_DIR\}?/g, root.split('\\').join('/'))
      const run = spawnSync(command, { cwd: root, input, encoding: 'utf8', shell: true, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, timeout: 120_000 })
      if (run.status === 2 && /UI Guardrails/.test(run.stderr)) return []
      tried.push(`  ${hook.command}  → exit ${run.status ?? 'none'}${run.stderr.trim() ? `: ${run.stderr.trim().split('\n')[0]}` : ''}`)
    }
  }
  return [
    tried.length
      ? 'The editor hook let a raw button through: no PreToolUse hook in .claude/settings.json refused it.'
      : 'No PreToolUse hook in .claude/settings.json runs before both Write and Edit: the editor gate is off.',
    ...tried,
  ]
}

/** A glob as the words a page would name it by: `demo-scenarios/**` → `demo-scenarios`. */
const plain = (glob: string) => glob.replace(/\/\*\*.*$|\/$/, '')

/** The folders a gate config skips beyond the package's own three, from the config itself. */
export async function skippedFolders(root: string): Promise<string[]> {
  const found = new Set<string>()
  for (const name of ['eslint.gates.config.js', 'eslint.tokens.config.js']) {
    const file = join(root, name)
    if (!existsSync(file)) continue
    // The file as it is now: Node keeps a module it has imported once, by its URL.
    const loaded = (await import(`${pathToFileURL(file).href}?at=${statSync(file).mtimeMs}`)) as { default?: unknown }
    const configs = [loaded.default].flat(Infinity) as { ignores?: string[]; [key: string]: unknown }[]
    for (const c of configs) {
      // Only a config with nothing but `ignores` skips a folder for every rule.
      if (!c || typeof c !== 'object' || !Array.isArray(c.ignores) || Object.keys(c).some((k) => k !== 'ignores' && k !== 'name')) continue
      for (const glob of c.ignores) if (!TOKEN_LINT_IGNORES.includes(glob)) found.add(glob)
    }
  }
  return [...found]
}

/** Every skipped folder is named on the debt page; the lines that say otherwise. */
export async function skipsListed(root: string, audience: 'app' | 'package'): Promise<string[]> {
  const page = audience === 'package' ? 'docs/GATES.md' : 'docs/GATES-DEBT.md'
  const skipped = await skippedFolders(root)
  if (!skipped.length) return []
  const text = existsSync(join(root, page)) ? readFileSync(join(root, page), 'utf8') : ''
  const missing = skipped.filter((glob) => !text.includes(plain(glob)))
  if (!missing.length) return []
  return [`The gate skips folders ${page} does not name. Name each there, with why it is not checked (B11):`, ...missing.map((g) => `  ${g}`)]
}

export async function runCi({ root = process.cwd(), audience = 'app', print = (line) => process.stdout.write(`${line}\n`) }: CiOptions = {}): Promise<number> {
  const scripts = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }).scripts ?? {}
  const tokens = scripts['lint:tokens'] ? 'lint:tokens' : 'lint'
  const failed: string[] = []
  const step = async (title: string, run: () => boolean | string[] | Promise<string[]>) => {
    print(`\n▸ ${title}`)
    const result = await run()
    const problems = result === true ? [] : result === false ? [`${title}: failed (above)`] : result
    if (problems.length) {
      failed.push(title)
      for (const line of problems) print(process.env.GITHUB_ACTIONS && !line.startsWith(' ') ? `::error::${line}` : line)
    } else print('  ✓')
  }

  await step('The gate lint (npm run lint:rules)', () => npm(root, 'lint:rules'))
  await step('The count is committed (.gates-count.json)', () => countCommitted(root))
  await step(`The token contract (npm run ${tokens})`, () => npm(root, tokens))
  await step('The catalogue (npm run registry:check)', () => npm(root, 'registry:check'))
  await step('The editor hook refuses a raw button (.claude/settings.json)', () => hookRuns(root))
  await step('Every folder the gate skips is named on the debt page', () => skipsListed(root, audience))

  print(failed.length ? `\nThe gate failed: ${failed.join('; ')}.` : '\nThe gate passed.')
  return failed.length ? 1 : 0
}
