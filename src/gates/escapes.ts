/// <reference types="node" />
/**
 * Every escape in a repository, listed (Katerina's ruling B1, 25 September):
 * where it is, which rules it keeps off, why, and how old it is.
 *
 * The count (`.gates-count.json`) holds numbers per rule; the plan asked for
 * escapes "listed in a report, reviewed", and the hand-written debt pages had
 * drifted from the count in all three repos. This reads the markers themselves,
 * both forms:
 *
 * - the gate's, `// @estiva-escape(<rule>): <reason>` (or in a JSX comment);
 * - the token lint's, `// eslint-disable-next-line <rule> -- @estiva-escape: <reason>`
 *   (ruling A2, 15 September), which no count sees.
 *
 * Age comes from git (the day the marker's line was last written), so it cannot
 * be forgotten or faked. Review is by age, monthly: `gates:status` shows every
 * escape older than {@link REVIEW_AFTER_DAYS} days, and Katerina keeps it (with
 * a new reason) or it gets fixed.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { readMarker } from '../eslint/escape'

/** An escape older than this many days is shown for review. */
export const REVIEW_AFTER_DAYS = 30

export interface Escape {
  file: string
  line: number
  /** The rules it keeps off, as the marker names them. */
  rules: string[]
  reason: string
  /** Whole days since the marker's line was written, or null outside git. */
  days: number | null
  /** `gate` for the gate's marker, `token` for the token lint's directive. */
  kind: 'gate' | 'token'
}

const SOURCE = /\.[cm]?[jt]sx?$/
const SKIP = new Set(['node_modules', 'dist', '.git', 'storybook-static', 'coverage'])
const DIRECTIVE = /eslint-disable(?:-next-line|-line)?\s+(.*?)\s+--\s+@estiva-escape\s*:?\s*(.*)$/

function sourceFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) sourceFiles(path, out)
    else if (SOURCE.test(name) && !/\.test\.[cm]?[jt]sx?$/.test(name)) out.push(path)
  }
  return out
}

/** The day each line of a file was last written, from `git blame`, in seconds since 1970. */
function lineTimes(root: string, file: string): Map<number, number> {
  const times = new Map<number, number>()
  try {
    const out = execFileSync('git', ['blame', '--line-porcelain', '--', relative(root, file)], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString()
    let line = 0
    for (const row of out.split('\n')) {
      const header = /^[0-9a-f]{40} \d+ (\d+)/.exec(row)
      if (header) line = Number(header[1])
      else if (row.startsWith('author-time ')) times.set(line, Number(row.slice(12)))
    }
  } catch {
    // Not in git, or a file git does not track yet: its escapes have no age.
  }
  return times
}

/** Every escape under `src`, and in any other folder named, oldest first. */
export function listEscapes(root: string, { folders = ['src'], now = Date.now() }: { folders?: string[]; now?: number } = {}): Escape[] {
  const found: Escape[] = []
  for (const file of folders.flatMap((f) => sourceFiles(join(root, f)))) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const hits: Omit<Escape, 'days'>[] = []
    lines.forEach((text, i) => {
      if (!text.includes('@estiva-escape')) return
      const rel = relative(root, file).split('\\').join('/')
      // A real marker opens its comment; documentation mentions one mid-sentence, or with a placeholder.
      if (/<(reason|why|rule)\b/.test(text)) return
      const directive = /^\s*(?:\/\/|\{?\/\*)\s*eslint-disable/.test(text) ? DIRECTIVE.exec(text) : null
      if (directive) {
        hits.push({ file: rel, line: i + 1, rules: directive[1].split(/[\s,]+/).filter(Boolean), reason: directive[2].replace(/\*\/\s*}?\s*$/, '').trim(), kind: 'token' })
        return
      }
      if (!/^\s*(?:\/\/+|\{?\/\*+)?\s*@estiva-escape(?:\s*\(|\s*:)/.test(text)) return
      const marker = readMarker(text)
      if (!marker) return
      hits.push({ file: rel, line: i + 1, rules: marker.rules, reason: marker.reason.replace(/\*\/\s*}?\s*$/, '').trim(), kind: 'gate' })
    })
    if (!hits.length) continue
    const times = lineTimes(root, file)
    for (const hit of hits) {
      const at = times.get(hit.line)
      found.push({ ...hit, days: at === undefined ? null : Math.floor((now - at * 1000) / 86_400_000) })
    }
  }
  return found.sort((a, b) => (b.days ?? -1) - (a.days ?? -1) || a.file.localeCompare(b.file) || a.line - b.line)
}

/** The lines `gates:status` prints: a total, and every escape due for review (or every one, with `all`). */
export function escapeLines(escapes: Escape[], { all = false }: { all?: boolean } = {}): string[] {
  const due = escapes.filter((e) => (e.days ?? 0) > REVIEW_AFTER_DAYS)
  const shown = all ? escapes : due
  const gate = escapes.filter((e) => e.kind === 'gate').length
  const out = [`Escapes: ${escapes.length} (${gate} of the gate's, ${escapes.length - gate} of the token lint's) · ${due.length} older than ${REVIEW_AFTER_DAYS} days, to review: keep with a new reason, or fix${all ? '' : ' · every escape: add -- --escapes'}`]
  for (const e of shown) out.push(`  ${e.file}:${e.line}  ${e.rules.join(', ') || '(no rule named)'} · ${e.days === null ? 'not in git yet' : `${e.days} days`}\n      ${e.reason}`)
  return out
}
