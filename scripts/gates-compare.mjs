#!/usr/bin/env node
/**
 * gates:compare — prove the checks every app runs (`appChecks`) are Peek's and
 * Ship's, by comparison rather than by eye (UIG-10; docs/GATES.md §23).
 *
 *   npm run gates:compare                      Peek and Ship as merged (origin/main)
 *   npm run gates:compare -- --ref <ref>       at another ref of both
 *
 * Nothing is run. Each checks file is loaded with a recording set of helpers,
 * every check is run against it, and what the check *does* is written down:
 * which helper, with which arguments — the probe's code, its config, its path.
 * Ship's app is in `web/`; its paths are read without that prefix. Each app's
 * real page is read as `<page>`.
 *
 * Every check of Peek's and Ship's then lands in exactly one group, or this
 * fails and names it:
 *
 * - **the same** — `appChecks` has a check that does exactly this;
 * - **carried inside** — a check of `appChecks` does this and more (where Peek
 *   and Ship wrote one check two ways, the check runs both);
 * - **its own code** — it reads a file of that app's, or imports one: an app's
 *   own wrappers, what its adoption removed, its launcher. A new app has none of
 *   that code; the app keeps these checks in its own list.
 *
 * And every check of `appChecks` must come from Peek or Ship: a check in the
 * package that neither app runs fails it too.
 *
 * Peek and Ship are read from git (`GATES_PEEK`, `GATES_SHIP`, or the checkouts
 * beside this one), at the ref, so a checkout that lags its remote reads right.
 * Only this test reads them; the command that makes an app never does.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { appChecks } from '../dist/gates/index.js'

const ROOT = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const ref = args.includes('--ref') ? args[args.indexOf('--ref') + 1] : 'origin/main'
const APP_PAGE = 'src/pages/HomePage.tsx'

const HELPERS = ['file', 'committed', 'contains', 'lacks', 'script', 'loads', 'ci', 'ciJob', 'hook', 'json', 'lint', 'protectedBranch', 'gh', 'share', 'exists', 'read', 'listFiles']

function recorder(calls, has) {
  const pass = (detail) => ({ result: 'pass', detail })
  const h = { PASS: pass, FAIL: (detail) => ({ result: 'fail', detail }), PART: pass, UNKNOWN: pass }
  for (const fn of HELPERS) {
    h[fn] = (...a) => {
      calls.push({ fn, args: a })
      if (fn === 'exists') return has(a[0])
      if (fn === 'read') return `<<read ${a[0]}>>`
      if (fn === 'listFiles') return []
      return pass(fn)
    }
  }
  // A helper the engine gained and this test does not know would pass silently: refuse it.
  return new Proxy(h, { get: (target, key) => { if (typeof key === 'string' && !(key in target)) throw new Error(`a check calls h.${key}, which gates:compare does not record`); return target[key] } })
}

function normalise(value, strip, page) {
  const text = (s) => {
    let t = strip && s.startsWith(strip) ? s.slice(strip.length) : s
    if (strip) t = t.split(`<<read ${strip}`).join('<<read ')
    if (page) t = t.split(page).join('<page>')
    return t
  }
  if (typeof value === 'string') return text(value)
  if (value instanceof RegExp) return `/${value.source}/${value.flags}`
  if (typeof value === 'function') return 'fn'
  if (Array.isArray(value)) return value.map((v) => normalise(v, strip, page))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (k === 'cwd') continue
      out[k] = normalise(v, strip, page)
    }
    return out
  }
  return value
}

async function record(define, { strip = '', has }) {
  const spec = define(recorder([], has))
  const checks = []
  for (const ticket of spec.tickets) {
    for (const [i, c] of ticket.checks.entries()) {
      const calls = []
      const again = define(recorder(calls, has)).tickets.find((t) => t.ref === ticket.ref).checks[i]
      await again.run()
      const page = calls.find((k) => k.fn === 'read' && /(^|\/)src\/pages\/[^/]+\.tsx$/.test(k.args[0]))?.args[0]?.replace(strip, '')
      const shown = calls.map((k) => ({ fn: k.fn, args: normalise(k.args, strip, page) }))
      checks.push({ ref: ticket.ref, owner: ticket.owner, what: c.what, calls: shown, sig: shown.filter((k) => k.fn !== 'exists').map((k) => JSON.stringify(k)) })
    }
  }
  return checks
}

function gitRead(repo, path) {
  return execFileSync('git', ['-C', repo, 'show', `${ref}:${path}`], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 }).toString()
}
function gitHas(repo, path) {
  try {
    execFileSync('git', ['-C', repo, 'cat-file', '-e', `${ref}:${path}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function loadRepo(name, env, fallback) {
  const repo = resolve(ROOT, process.env[env] ?? fallback)
  const dir = mkdtempSync(join(tmpdir(), `gates-compare-${name}-`))
  const file = join(dir, 'gates-checks.mjs')
  writeFileSync(file, gitRead(repo, 'scripts/gates-checks.mjs'))
  const define = (await import(pathToFileURL(file).href)).default
  rmSync(dir, { recursive: true, force: true })
  const commit = execFileSync('git', ['-C', repo, 'rev-parse', '--short', ref]).toString().trim()
  return { name, repo, commit, define }
}

const isSubsequence = (small, big) => {
  let i = 0
  for (const s of big) if (s === small[i]) i += 1
  return i === small.length
}

// An app's own code: a source file of its own (present, or one its adoption deleted and a check keeps deleted), or an
// import of one. The probes' made-up paths and the real page are not.
function ownPaths(check) {
  const paths = new Set()
  for (const call of check.calls) {
    for (const a of [call.args].flat(2)) {
      if (typeof a === 'string' && /^src\/.+\.(tsx?|mdx)$/.test(a) && !a.includes('__gates_probe__')) paths.add(a)
      if (a && typeof a === 'object') {
        if (typeof a.code === 'string') for (const m of a.code.matchAll(/from '(@\/[^']+)'/g)) paths.add(m[1])
      }
    }
  }
  return [...paths]
}

const peek = await loadRepo('peek', 'GATES_PEEK', '../peek')
const ship = await loadRepo('ship', 'GATES_SHIP', '../ship')
const sources = [
  { ...peek, strip: '', has: (p) => gitHas(peek.repo, p) },
  { ...ship, strip: 'web/', has: (p) => gitHas(ship.repo, p) || gitHas(ship.repo, `web/${p}`) },
]
const app = await record((h) => ({ repo: 'app', tickets: appChecks(h, { page: APP_PAGE }) }), { has: () => false })

const groups = { same: [], inside: [], own: [], unplaced: [] }
const used = new Set()
for (const source of sources) {
  const checks = await record(source.define, { strip: source.strip, has: source.has })
  for (const check of checks) {
    const row = { repo: source.name, ref: check.ref, what: check.what }
    if (check.sig.length) {
      const same = (a) => JSON.stringify(a.sig) === JSON.stringify(check.sig)
      const sameRef = app.findIndex((a) => a.ref === check.ref && same(a))
      const equal = sameRef !== -1 ? sameRef : app.findIndex(same)
      if (equal !== -1) { groups.same.push(row); used.add(equal); continue }
      const within = app.findIndex((a) => isSubsequence(check.sig, a.sig))
      if (within !== -1) { groups.inside.push({ ...row, in: `${app[within].ref} ${app[within].what}` }); used.add(within); continue }
    }
    // A ticket the app owns, other than its gate chain, is about the app's own components (UIG-17, UIG-18, UIG-29).
    const ownTicket = check.owner && !['UIG-3', 'UIG-4'].includes(check.ref)
    const own = ownPaths(check)
    if (own.length || ownTicket) groups.own.push({ ...row, reads: own.join(', ') || `a ticket ${source.name} owns` })
    else groups.unplaced.push({ ...row, calls: check.sig.join(' ; ').slice(0, 300) })
  }
}
// A check for a ticket whose work is to bring Peek and Ship onto the package (UIG-32) is in the
// package before it is in either app. It is listed, not failed; every other check must come from them.
const NOT_IN_THE_APPS_YET = new Set(['UIG-32'])
const unused = app.filter((_, i) => !used.has(i)).map((a) => ({ ref: a.ref, what: a.what }))
const extra = unused.filter((a) => !NOT_IN_THE_APPS_YET.has(a.ref))
const waiting = unused.filter((a) => NOT_IN_THE_APPS_YET.has(a.ref))

const out = []
out.push(`gates:compare · Peek ${peek.commit} and Ship ${ship.commit} (${ref}) against the package's appChecks`)
out.push('')
out.push(`${groups.same.length} the same · ${groups.inside.length} carried inside a check that does more · ${groups.own.length} about the app's own code · ${groups.unplaced.length} with nowhere to go`)
out.push(`appChecks: ${app.length} checks, ${extra.length} that neither app runs`)
const list = (title, rows, fmt) => { if (rows.length) out.push('', title, ...rows.map(fmt)) }
list('Carried inside:', groups.inside, (r) => `  ${r.repo} ${r.ref} ${r.what}  →  ${r.in}`)
list("About the app's own code (the app keeps these in its own list):", groups.own, (r) => `  ${r.repo} ${r.ref} ${r.what}  (${r.reads})`)
list('With nowhere to go — add them to appChecks, or show they are the app\'s own:', groups.unplaced, (r) => `  ${r.repo} ${r.ref} ${r.what}\n      ${r.calls}`)
list('In appChecks, but neither app runs them:', extra, (r) => `  ${r.ref} ${r.what}`)
list('In appChecks for a ticket that brings Peek and Ship onto the package, so not in them yet:', waiting, (r) => `  ${r.ref} ${r.what}`)
if (args.includes('--same')) list('The same:', groups.same, (r) => `  ${r.repo} ${r.ref} ${r.what}`)
console.log(out.join('\n'))
process.exitCode = groups.unplaced.length || extra.length ? 1 : 0
