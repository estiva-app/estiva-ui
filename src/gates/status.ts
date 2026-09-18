/// <reference types="node" />
/**
 * gates:status — where the UI Guardrails project stands, read from the code.
 *
 *   estiva-gates status              one row per ticket
 *   estiva-gates status --detail     every check under every row
 *   estiva-gates status --json       machine output, read by estiva-ui's run
 *   estiva-gates status --app web    the app sits in `web/`, as Ship's does
 *
 * Every row is decided by checks on real files, a real lint run or a real
 * GitHub setting. Nothing here reads a list that someone ticks by hand.
 *
 * **One copy, in the package** (docs/GATES.md §23). Until UIG-10 this engine was
 * `scripts/gates-status.mjs`, the same file copied by hand into estiva-ui, Peek
 * and Ship, with estiva-ui warning when the copies drifted. Now it ships here,
 * and a repo runs it with `estiva-gates status`. A repo still carrying its own
 * copy is named as one when estiva-ui runs it; UIG-32 moves Peek and Ship off
 * theirs.
 *
 * What differs per repo is `scripts/gates-checks.mjs`, beside the app: its
 * checks, or the checks every app runs (`appChecks`) plus its own. It sits with
 * the app because it imports the package — `web/scripts/` in Ship, whose app,
 * and whose install, are in `web/` (UIG-32).
 *
 * The rows and the reasons for each check are in estiva-ui docs/GATES.md §15
 * and §17.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ESLint as ESLintClass } from 'eslint'

export type CheckResult = { result: 'pass' | 'fail' | 'part' | 'unknown'; detail: string }
type Maybe<T> = T | Promise<T>

export interface LintProbe {
  /** The folder ESLint runs from, relative to the repo: `web` in Ship. */
  cwd?: string
  /** The config file, relative to `cwd`. */
  config: string
  /** The path the text is linted as, relative to `cwd`. Nothing is written. */
  file: string
  code: string
  expect: 'error' | 'warning' | 'none'
  /** Words the expected message must contain. */
  mentions?: string
}

/** The helpers a checks file is written with. */
export interface GateHelpers {
  PASS(detail: string): CheckResult
  FAIL(detail: string): CheckResult
  PART(detail: string): CheckResult
  UNKNOWN(detail: string): CheckResult
  exists(rel: string): boolean
  read(rel: string): string
  listFiles(rel: string, test: (name: string, path: string) => boolean): string[]
  file(rel: string): CheckResult
  committed(rel: string): CheckResult
  contains(rel: string, needle: string | RegExp, label?: string): CheckResult
  lacks(rel: string, needle: string | RegExp, label?: string): CheckResult
  script(pkgRel: string, name: string): CheckResult
  loads(rel: string): Promise<CheckResult>
  ci(script: string | RegExp): CheckResult
  ciJob(job: string, script: string): CheckResult
  hook(settingsRel: string, needle: string): CheckResult
  json(rel: string, test?: (data: unknown) => boolean, label?: string): CheckResult
  lint(probe: LintProbe): Promise<CheckResult>
  protectedBranch(pattern: RegExp): CheckResult
  gh(args: string[], label: string): CheckResult
  share(files: string[], test: (file: string) => boolean, label: string): CheckResult
  /** Build the catalogue of the app in `appDir` (UIG-13): passes when every part is described and sorted. */
  catalogue(appDir: string): Promise<CheckResult>
}

export interface GateCheck {
  what: string
  run: () => Maybe<CheckResult>
  aggregate?: boolean
}
export interface GateTicket {
  ref: string
  title?: string
  owner: boolean
  checks: GateCheck[]
}
export interface TicketListEntry {
  ref: string
  owner: string
  title: string
  parts?: string[]
  aggregate?: boolean
}
export interface GateSpec {
  repo: string
  tickets: GateTicket[]
  /** estiva-ui only: every ticket, and the repos it joins in. */
  all?: TicketListEntry[]
  /** estiva-ui only: the repos beside it. `app` is the folder its app sits in: `web` in Ship. */
  siblings?: { name: string; path: string; env: string; app?: string }[]
}

interface Row {
  ref: string
  title?: string
  owner?: boolean
  ownerRepo?: string
  checks: (CheckResult & { repo: string; what: string })[]
  status?: string
  aggregate?: boolean
}
interface Report {
  schema: 1
  repo: string
  branch: string | null
  commit: string | null
  engine: string
  rows: Row[]
}

const { version } = createRequire(import.meta.url)('../../package.json') as { version: string }
/** What a report says ran it. A copy of the old script reports a hash instead. */
export const ENGINE = `@estiva-app/ui@${version}`

const PASS = (detail: string): CheckResult => ({ result: 'pass', detail })
const FAIL = (detail: string): CheckResult => ({ result: 'fail', detail })
const PART = (detail: string): CheckResult => ({ result: 'part', detail })
const UNKNOWN = (detail: string): CheckResult => ({ result: 'unknown', detail })
const said = (e: unknown) => {
  const err = e as { stdout?: unknown; stderr?: unknown; message?: string; code?: string }
  return { text: `${err.stdout ?? ''}${err.stderr ?? ''}`, message: String(err.message ?? e), code: err.code }
}

/** The helpers, bound to one repository. */
export function helpers(ROOT: string): GateHelpers {
  const abs = (rel: string) => resolve(ROOT, rel)
  const exists = (rel: string) => existsSync(abs(rel))
  const read = (rel: string) => readFileSync(abs(rel), 'utf8')
  const git = (...a: string[]) => {
    try {
      return execFileSync('git', a, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return null
    }
  }
  const listFiles = (rel: string, test: (name: string, path: string) => boolean) => {
    const out: string[] = []
    const walk = (dir: string) => {
      if (!existsSync(dir)) return
      for (const name of readdirSync(dir)) {
        if (['node_modules', '.git', 'dist', 'storybook-static', '.verify-shots'].includes(name)) continue
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (test(name, p)) out.push(relative(ROOT, p).replace(/\\/g, '/'))
      }
    }
    walk(abs(rel))
    return out
  }
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return {
    PASS, FAIL, PART, UNKNOWN, exists, read, listFiles,
    // The registry bundle's own builder, loaded only when a check asks for it:
    // it reads TypeScript with TypeScript, which the other checks never need.
    async catalogue(appDir) {
      try {
        const { buildAppRegistry, validateRegistry } = await import('../registry/index')
        const registry = buildAppRegistry({ root: abs(appDir) })
        const problems = validateRegistry(registry)
        if (problems.length) return FAIL(`${problems.length} problems, the first: ${problems[0]}`)
        return PASS(`${registry.entries.length} parts in ${registry.builtFrom.files} files, each described and sorted`)
      } catch (error) {
        const lines = String(error instanceof Error ? error.message : error).split('\n')
        return FAIL(lines.length > 1 ? `${lines.length - 1} problems, the first: ${lines[1].trim()}` : lines[0])
      }
    },

    file(rel) {
      return exists(rel) ? PASS(`${rel} exists`) : FAIL(`${rel} does not exist`)
    },

    committed(rel) {
      if (!exists(rel)) return FAIL(`${rel} does not exist`)
      return git('ls-files', '--error-unmatch', rel) ? PASS(`${rel} is committed`) : FAIL(`${rel} exists but is not committed`)
    },

    contains(rel, needle, label) {
      if (!exists(rel)) return FAIL(`${rel} does not exist`)
      const hit = typeof needle === 'string' ? read(rel).includes(needle) : needle.test(read(rel))
      return hit ? PASS(label ?? `${rel} has ${needle}`) : FAIL(label ? `not yet: ${label}` : `${rel} has no ${needle}`)
    },

    lacks(rel, needle, label) {
      if (!exists(rel)) return FAIL(`${rel} does not exist`)
      const hit = typeof needle === 'string' ? read(rel).includes(needle) : needle.test(read(rel))
      return hit ? FAIL(`${rel} still has ${needle}`) : PASS(label ?? `${rel} has no ${needle}`)
    },

    script(pkgRel, name) {
      if (!exists(pkgRel)) return FAIL(`${pkgRel} does not exist`)
      const cmd = (JSON.parse(read(pkgRel)) as { scripts?: Record<string, string> }).scripts?.[name]
      return cmd ? PASS(`${pkgRel} runs "${name}": ${cmd}`) : FAIL(`${pkgRel} has no "${name}" script`)
    },

    async loads(rel) {
      if (!exists(rel)) return FAIL(`${rel} does not exist`)
      try {
        const mod = (await import(pathToFileURL(abs(rel)).href)) as { default?: unknown }
        return mod.default ? PASS(`${rel} loads`) : FAIL(`${rel} has no default export`)
      } catch (e) {
        return FAIL(`${rel} does not load: ${said(e).message.split('\n')[0]}`)
      }
    },

    /** A workflow step that runs `npm run <script>`; a regex matches the script name. */
    ci(script) {
      const files = listFiles('.github/workflows', (n) => /\.ya?ml$/.test(n))
      const name = typeof script === 'string' ? escape(script) : script.source
      const step = new RegExp(`npm run (${name})(?![\\w:-])`)
      for (const f of files) {
        const m = read(f).match(step)
        if (m) return PASS(`${f} runs npm run ${m[1]}`)
      }
      return FAIL(`no workflow runs npm run ${script}`)
    },

    /**
     * A workflow job, by its id, with a step that runs `npm run <script>`. Branch
     * protection requires a whole job by its name, so a required check needs the
     * job, not the step somewhere (UIG-6). A job is a key two spaces in under
     * `jobs:`, and ends at the next line that is not indented further; a comment
     * line does not count.
     */
    ciJob(job, script) {
      const files = listFiles('.github/workflows', (n) => /\.ya?ml$/.test(n))
      const header = new RegExp(`^  ${escape(job)}:\\s*(#.*)?$`)
      const step = new RegExp(`^(?!\\s*#).*npm run ${escape(script)}(?![\\w:-])`, 'm')
      for (const f of files) {
        const lines = read(f).split(/\r?\n/)
        const from = lines.findIndex((l) => /^jobs:\s*$/.test(l))
        const start = from === -1 ? -1 : lines.findIndex((l, i) => i > from && header.test(l))
        if (start === -1) continue
        const end = lines.findIndex((l, i) => i > start && /^ {0,2}\S/.test(l))
        const body = lines.slice(start + 1, end === -1 ? undefined : end).join('\n')
        return step.test(body) ? PASS(`${f}: the job ${job} runs npm run ${script}`) : FAIL(`${f}: the job ${job} does not run npm run ${script}`)
      }
      return FAIL(`no workflow has a job ${job}`)
    },

    hook(settingsRel, needle) {
      if (!exists(settingsRel)) return FAIL(`${settingsRel} does not exist`)
      let s: { hooks?: { PreToolUse?: { hooks?: { command?: string }[] }[] } }
      try {
        s = JSON.parse(read(settingsRel))
      } catch {
        return FAIL(`${settingsRel} is not valid JSON`)
      }
      const commands = (s.hooks?.PreToolUse ?? []).flatMap((m) => (m.hooks ?? []).map((x) => x.command ?? ''))
      const hit = commands.find((c) => c.includes(needle))
      if (hit) return PASS(`${settingsRel} has a PreToolUse hook running ${needle}`)
      return FAIL(commands.length ? `${settingsRel} has PreToolUse hooks, none running ${needle}` : `${settingsRel} has no PreToolUse hook`)
    },

    json(rel, test = () => true, label) {
      if (!exists(rel)) return FAIL(`${rel} does not exist`)
      let data: unknown
      try {
        data = JSON.parse(read(rel))
      } catch {
        return FAIL(`${rel} is not valid JSON`)
      }
      if (!git('ls-files', '--error-unmatch', rel)) return FAIL(`${rel} is not committed`)
      return test(data) ? PASS(label ?? `${rel} is committed and parses`) : FAIL(`${rel} parses, but ${label ?? 'fails its test'}`)
    },

    /** Lints a line of code that is never written to disk, the way the hook will. */
    async lint({ cwd = '.', config, file, code, expect, mentions }) {
      const cfg = join(cwd, config)
      if (!exists(cfg)) return FAIL(`${cfg} does not exist`)
      let ESLint: typeof ESLintClass
      try {
        const req = createRequire(join(abs(cwd), 'package.json'))
        ;({ ESLint } = (await import(pathToFileURL(req.resolve('eslint')).href)) as { ESLint: typeof ESLintClass })
      } catch (e) {
        return UNKNOWN(`could not load eslint from ${cwd}: ${said(e).message.split('\n')[0]}`)
      }
      let results: ESLintClass.LintResult[]
      try {
        const eslint = new ESLint({ cwd: abs(cwd), overrideConfigFile: config })
        results = await eslint.lintText(code, { filePath: join(abs(cwd), file), warnIgnored: true })
      } catch (e) {
        return UNKNOWN(`${cfg} could not lint ${file}: ${said(e).message.split('\n')[0]}`)
      }
      const messages = results.flatMap((r) => r.messages)
      const ignored = messages.some((m) => /ignored/i.test(m.message) && !m.ruleId)
      const fatal = messages.find((m) => m.fatal && !/ignored/i.test(m.message))
      if (fatal) return UNKNOWN(`${file} did not parse: ${fatal.message}`)
      const want = expect === 'error' ? 2 : expect === 'warning' ? 1 : 0
      if (want === 0) {
        const any = messages.filter((m) => m.ruleId && m.severity === 2)
        return any.length ? FAIL(`${file} gets an error it should not: ${any[0].message}`) : PASS(`${file}: no error${ignored ? ' (not linted)' : ''}`)
      }
      if (ignored) return FAIL(`${cfg} does not lint ${file}`)
      const hit = messages.find((m) => m.ruleId && m.severity === want && (!mentions || m.message.includes(mentions)))
      const kind = want === 2 ? 'error' : 'warning'
      return hit ? PASS(`${file} gets ${want === 2 ? 'an' : 'a'} ${kind}: ${hit.message}`) : FAIL(`${file} gets no ${kind}${mentions ? ` naming ${mentions}` : ''}`)
    },

    /**
     * A GitHub setting, not a file, so it is asked of GitHub: the checks a merge
     * into the default branch must pass, from the rulesets in force on it
     * (`rules/branches/<branch>`, which anyone who can read the repository may
     * see) and from classic protection as `branches/<branch>` reports it. Not
     * `branches/<branch>/protection`: GitHub answers "Not Found" there to anyone
     * who is not an admin, and it knows nothing of rulesets (UIG-6).
     */
    protectedBranch(pattern) {
      const url = git('remote', 'get-url', 'origin')
      const slug = url?.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1]
      if (!slug) return UNKNOWN('no GitHub remote')
      const branch = (git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD') ?? 'origin/main').replace(/^origin\//, '')
      const ask = (path: string) => JSON.parse(execFileSync('gh', ['api', path], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }).toString())
      let rules: { type: string; parameters?: { required_status_checks?: { context: string }[] } }[]
      let classic: { contexts?: string[]; checks?: { context: string }[] } | undefined
      try {
        rules = ask(`repos/${slug}/rules/branches/${branch}`)
        classic = ask(`repos/${slug}/branches/${branch}`).protection?.required_status_checks
      } catch (e) {
        const s = said(e)
        return UNKNOWN(`could not ask GitHub (${s.code === 'ENOENT' ? 'gh is not installed' : s.text.split('\n')[0] || s.message})`)
      }
      const names = [
        ...rules.filter((r) => r.type === 'required_status_checks').flatMap((r) => r.parameters?.required_status_checks ?? []).map((c) => c.context),
        ...(classic?.contexts ?? []),
        ...(classic?.checks ?? []).map((c) => c.context),
      ]
      const hit = names.find((n) => pattern.test(n))
      if (hit) return PASS(`${slug} ${branch} requires "${hit}"`)
      return FAIL(names.length ? `${slug} ${branch} requires ${names.map((n) => `"${n}"`).join(', ')}, none matching ${pattern}` : `${slug} ${branch} requires no check to merge`)
    },

    gh(args, label) {
      try {
        execFileSync('gh', args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 })
        return PASS(label)
      } catch (e) {
        const s = said(e)
        if (/could not resolve|not found|HTTP 404/i.test(s.text)) return FAIL(`not yet: ${label}`)
        return UNKNOWN(`could not ask GitHub (${s.code === 'ENOENT' ? 'gh is not installed' : s.text.split('\n')[0] || s.message})`)
      }
    },

    /** How many of `files` pass `test`: all is a pass, some is a part. */
    share(files, test, label) {
      if (!files.length) return FAIL(`no files to check for: ${label}`)
      const ok = files.filter(test).length
      const detail = `${ok} of ${files.length}: ${label}`
      return ok === files.length ? PASS(detail) : ok ? PART(detail) : FAIL(detail)
    },
  }
}

// ── running the checks ─────────────────────────────────────────────────────

const STATUS: Record<string, string> = { done: '✅', started: '🚧', none: '⬜', unknown: '❔' }

function statusOf(checks: CheckResult[]) {
  const n = (r: CheckResult['result']) => checks.filter((c) => c.result === r).length
  const pass = n('pass'), part = n('part'), fail = n('fail'), unknown = n('unknown')
  if (!checks.length) return 'unknown'
  if (pass === checks.length) return 'done'
  if (pass + part > 0) return fail === 0 && unknown > 0 ? 'unknown' : 'started'
  return fail > 0 ? 'none' : 'unknown'
}

async function runRepo(ROOT: string, app: string, h: GateHelpers): Promise<{ spec: GateSpec; report: Report }> {
  // The checks file sits with the app, because it imports `appChecks` from the
  // package: in Ship that install is `web/node_modules`, not the repo's top
  // folder (UIG-32). Everything it names is still read from the repo's top.
  const checksFile = join(ROOT, app, 'scripts', 'gates-checks.mjs')
  const define = ((await import(pathToFileURL(checksFile).href)) as { default: (h: GateHelpers) => GateSpec }).default
  const spec = define(h)
  const git = (...a: string[]) => {
    try {
      return execFileSync('git', a, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return null
    }
  }
  const rows: Row[] = []
  for (const t of spec.tickets) {
    const checks: Row['checks'] = []
    for (const c of t.checks ?? []) {
      if (c.aggregate) continue
      let r: CheckResult
      try {
        r = await c.run()
      } catch (e) {
        r = UNKNOWN(`the check threw: ${said(e).message}`)
      }
      checks.push({ repo: spec.repo, what: c.what, ...r })
    }
    rows.push({ ref: t.ref, title: t.title, owner: t.owner, checks })
  }
  return { spec, report: { schema: 1, repo: spec.repo, branch: git('rev-parse', '--abbrev-ref', 'HEAD'), commit: git('rev-parse', '--short', 'HEAD'), engine: ENGINE, rows } }
}

/**
 * Another repository's report. A repo on the package's engine runs it from its
 * own install; a repo still carrying `scripts/gates-status.mjs` runs that copy.
 *
 * `app` is the folder that repo's app sits in — `web` in Ship — where its
 * install and its checks file are. The report is still of the whole repo.
 */
function runSibling(dir: string, app: string, shown: string): { report?: Report; error?: string } {
  const copy = join(dir, 'scripts', 'gates-status.mjs')
  const installed = createRequire(join(dir, app, 'package.json'))
  let script = copy
  const args = ['--json']
  if (!existsSync(copy)) {
    try {
      script = join(installed.resolve('@estiva-app/ui/package.json'), '..', 'dist', 'gates', 'cli.js')
      args.unshift('status')
      if (app !== '.') args.push('--app', app)
    } catch {
      return { error: `${shown} has neither its own gates-status.mjs nor @estiva-app/ui installed${app === '.' ? '' : ` in ${app}`}` }
    }
    if (!existsSync(script)) return { error: `${shown} has an @estiva-app/ui with no gates engine: install 0.21.0 or later` }
  }
  try {
    const out = execFileSync(process.execPath, [script, ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000, maxBuffer: 16 * 1024 * 1024 })
    return { report: JSON.parse(out.toString()) as Report }
  } catch (e) {
    const err = e as { stderr?: unknown; message?: string }
    return { error: `its gates:status failed: ${String(err.stderr ?? err.message).split('\n').filter(Boolean).slice(-1)[0]}` }
  }
}

function pad(s: string, n: number) {
  const len = [...s].length
  return len >= n ? s : s + ' '.repeat(n - len)
}

function printRows(rows: Row[], { showOwner, detail }: { showOwner: boolean; detail: boolean }) {
  const lines: string[] = []
  const width = Math.max(...rows.map((r) => [...(r.title ?? '')].length))
  for (const r of rows) {
    const pass = r.checks.filter((c) => c.result === 'pass').length
    const count = r.checks.length ? `${pass} of ${r.checks.length}` : 'no checks here'
    lines.push(`${STATUS[r.status ?? 'unknown']}  ${pad(r.ref, 7)} ${pad(r.title ?? '', width)}  ${showOwner ? pad(r.ownerRepo ?? '', 10) : ''}${count}`)
    if (detail || r.status === 'started' || r.status === 'unknown') {
      for (const c of r.checks) {
        const mark = { pass: '✓', part: '½', fail: '✗', unknown: '?' }[c.result]
        lines.push(`        ${mark} ${showOwner ? `${pad(c.repo, 10)} ` : ''}${c.what} — ${c.detail}`)
      }
    }
  }
  return lines.join('\n')
}

function summary(rows: Row[]) {
  const n = (s: string) => rows.filter((r) => r.status === s).length
  return `${STATUS.done} ${n('done')} done · ${STATUS.started} ${n('started')} started · ${STATUS.none} ${n('none')} not started · ${STATUS.unknown} ${n('unknown')} could not check`
}

export interface StatusOptions {
  /** The repository to report on. */
  root?: string
  /** The folder that holds the app, relative to `root`: `web` in Ship, `.` elsewhere. */
  app?: string
  json?: boolean
  detail?: boolean
}

/** Print where the project stands. Returns what was printed, or the JSON report. */
export async function runStatus({ root = process.cwd(), app = '.', json = false, detail = false }: StatusOptions = {}): Promise<string> {
  const ROOT = resolve(root)
  const h = helpers(ROOT)
  const shown = (dir: string) => (relative(ROOT, dir) || dir).replace(/\\/g, '/')
  const { spec, report } = await runRepo(ROOT, app, h)

  if (json) return JSON.stringify(report)

  const out: string[] = []
  out.push('UI Guardrails · gates:status', 'Read from the code. Nothing here is a hand-ticked list.', '')
  out.push(`${pad(spec.repo, 10)} ${report.branch} @ ${report.commit}`)

  if (!spec.all) {
    // A sibling repo on its own: its own rows, then its parts of rows owned elsewhere.
    const own = report.rows.filter((r) => r.owner).map((r) => ({ ...r, ownerRepo: spec.repo, status: statusOf(r.checks) }))
    const parts = report.rows.filter((r) => !r.owner).map((r) => ({ ...r, ownerRepo: '', status: statusOf(r.checks) }))
    out.push('', `Tickets ${spec.repo} owns (${own.length}):`, printRows(own, { showOwner: false, detail }))
    out.push('', `Parts of tickets another repo owns, checked here (${parts.length}):`, printRows(parts, { showOwner: false, detail }))
    out.push('', 'For every ticket across the repos, run npm run gates:status in estiva-ui.')
    return out.join('\n')
  }

  // estiva-ui: gather the sibling checkouts and join everything into one row per ticket.
  const reports: Report[] = [report]
  const found: { name: string; note: string; missing?: boolean }[] = []
  for (const s of spec.siblings ?? []) {
    const dir = resolve(ROOT, process.env[s.env] ?? s.path)
    if (!existsSync(join(dir, 'package.json'))) {
      found.push({ name: s.name, note: `not found at ${shown(dir)} (set ${s.env} to point at it)`, missing: true })
      continue
    }
    const r = runSibling(dir, s.app ?? '.', shown(dir))
    if (!r.report) {
      found.push({ name: s.name, note: r.error ?? 'no report', missing: true })
      continue
    }
    const copy = r.report.engine !== ENGINE ? (r.report.engine.startsWith('@estiva-app/ui@') ? ` · on ${r.report.engine}'s engine` : ' · runs its own copy of the status engine; UIG-32 moves it onto the package') : ''
    found.push({ name: s.name, note: `${r.report.branch} @ ${r.report.commit}, found at ${shown(dir)}${copy}` })
    reports.push(r.report)
  }
  for (const f of found) out.push(`${pad(f.name, 10)} ${f.note}`)

  const problems: string[] = []
  const known = new Set(spec.all.map((t) => t.ref))
  for (const rep of reports) {
    for (const r of rep.rows.filter((r) => !known.has(r.ref))) problems.push(`${rep.repo} reports ${r.ref}, which is not one of the tickets`)
  }
  const rows: Row[] = spec.all.map((t) => {
    const pieces = reports.flatMap((rep) => rep.rows.filter((r) => r.ref === t.ref).map((r) => ({ rep, r })))
    const claims = pieces.filter((p) => p.r.owner).map((p) => p.rep.repo)
    const ownerMissing = found.some((f) => f.name === t.owner && f.missing)
    if (!ownerMissing && (claims.length !== 1 || claims[0] !== t.owner)) {
      problems.push(`${t.ref}: should be owned by ${t.owner}, is claimed by ${claims.join(' and ') || 'no repo'}`)
    }
    for (const p of pieces.filter((p) => !p.r.owner && !(t.parts ?? []).includes(p.rep.repo))) {
      problems.push(`${t.ref}: ${p.rep.repo} checks a part of it, but the ticket list does not name ${p.rep.repo}`)
    }
    const checks = pieces.flatMap((p) => p.r.checks)
    for (const f of found.filter((f) => f.missing)) {
      if ((t.parts ?? []).includes(f.name) || t.owner === f.name) checks.push({ repo: f.name, what: `${f.name}'s part`, result: 'unknown', detail: f.note })
    }
    return { ref: t.ref, title: t.title, ownerRepo: t.owner, checks, aggregate: t.aggregate }
  })
  for (const row of rows) row.status = statusOf(row.checks)
  for (const row of rows.filter((r) => r.aggregate)) {
    const others = rows.filter((r) => r !== row)
    const done = others.filter((r) => r.status === 'done').length
    row.checks.push({ repo: 'all', what: 'every other ticket is done', ...(done === others.length ? PASS(`${done} of ${others.length} done`) : FAIL(`${done} of ${others.length} done`)) })
    row.status = statusOf(row.checks)
  }

  out.push('', printRows(rows, { showOwner: true, detail }), '', summary(rows))
  const owners = Object.entries(rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.ownerRepo ?? '']: (a[r.ownerRepo ?? ''] ?? 0) + 1 }), {}))
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')
  out.push(`${rows.length} tickets. Owned by ${owners}.`)
  const unchecked = found.filter((f) => f.missing && spec.all!.some((t) => t.owner === f.name)).map((f) => f.name)
  if (problems.length) out.push(`⚠️ Ownership does not add up:\n  ${problems.join('\n  ')}`)
  else if (unchecked.length) out.push(`❔ Ownership not fully checked: ${unchecked.join(' and ')} could not be read.`)
  else out.push('✅ Each ticket is owned by exactly one repo, and every repo agrees.')
  if (!detail) out.push('Add -- --detail to see every check.')
  return out.join('\n')
}
