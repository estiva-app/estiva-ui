/// <reference types="node" />
/**
 * The editor gate: before Claude writes a `.ts` or `.tsx` under `src/`, lint the
 * text it is about to write with the gate, and refuse the write on an error.
 * Written once (docs/GATES.md §23): until UIG-10 Peek, Ship and this package
 * each carried their own copy of this script.
 *
 * A `PreToolUse` hook in the repository's committed `.claude/settings.json`
 * runs it. Claude Code documents exit 2 as blocking the tool call, with stderr
 * handed back to Claude; exit 0 raises no objection. It reads
 * `$CLAUDE_PROJECT_DIR`, the project root where the session started — a session
 * started in a folder above or below the repository gets no hook (UIG-3,
 * UIG-4 findings).
 *
 * It runs the gate's own config and reimplements nothing: a hook and a lint
 * that could disagree would be worse than neither. Tests are not checked
 * (Katerina, 13 September); stories are. This package's inward gate reads `.tsx`
 * only, as its lint does.
 *
 * Input, from Claude Code on stdin: `tool_name` and `tool_input` — `file_path`
 * and `content` for Write; `file_path`, `old_string`, `new_string` and
 * `replace_all` for Edit. An Edit carries no whole file, so the edit is applied
 * to the file on disk here. Anything it cannot read passes, and the tool itself
 * reports its own failure.
 *
 * **Search first** (UIG-20). A Write that would create a new file drawing a new
 * part, and that the gate lets through, is stopped once: the hook runs
 * `estiva-ui find` on the part's name and hands the matches back, so a session
 * sees what already exists before it adds another. The same file written again
 * in the same session goes through. The skill asks for the search; this makes
 * sure it happened. A search that cannot run stops nothing.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ESLint as ESLintClass } from 'eslint'
import { countGates } from '../eslint/index'
import { repositoryOf } from '../registry/skill'

export interface HookOptions {
  /** The repository's top folder. Defaults to `$CLAUDE_PROJECT_DIR`, then the tool call's `cwd`. */
  root?: string
  /** The folder that holds the app, relative to `root`: `.` unless it sits in a folder of its own. */
  app?: string
  /** `package` gates `.tsx` only, as this package's inward lint does. */
  audience?: 'app' | 'package'
  /** The hook's input, when not read from stdin (tests). */
  input?: unknown
  /** Where a session's searches are remembered. Defaults to a folder in the system's temp. */
  seen?: string
}

export interface HookResult {
  /** 0 lets the write through; 2 refuses it. */
  code: 0 | 2
  /** What goes to stderr when refused. */
  message: string
}

interface ToolCall {
  tool_name?: string
  session_id?: string
  cwd?: string
  tool_input?: { file_path?: unknown; content?: unknown; old_string?: unknown; new_string?: unknown; replace_all?: unknown }
}

const PASS: HookResult = { code: 0, message: '' }
/** An app's source the gate reads: every script type, with or without JSX. */
const APP_SOURCE = /^src\/.+\.[cm]?[jt]sx?$/

export async function runHook({ root, app = '.', audience = 'app', input, seen }: HookOptions = {}): Promise<HookResult> {
  let call: ToolCall
  try {
    call = (input ?? JSON.parse(readFileSync(0, 'utf8'))) as ToolCall
  } catch {
    return PASS
  }
  const args = call.tool_input ?? {}
  if (typeof args.file_path !== 'string') return PASS

  const top = root ?? process.env.CLAUDE_PROJECT_DIR ?? call.cwd ?? process.cwd()
  const appDir = resolve(top, app)
  const file = isAbsolute(args.file_path) ? args.file_path : resolve(call.cwd ?? top, args.file_path)
  const rel = relative(appDir, file).split(sep).join('/')
  // Every script under an app's src/, as the gate reads it (a raw <button> in a .jsx passed
  // before, the re-review after the audit before UIG-26); the package's own gate is .tsx only.
  const source = audience === 'package' ? /^src\/.+\.tsx$/ : APP_SOURCE
  if (rel.startsWith('../') || isAbsolute(rel) || !source.test(rel) || /\.test\.[cm]?[jt]sx?$/.test(rel) || /\.d\.[cm]?ts$/.test(rel)) return PASS

  const text = proposed(call.tool_name, args, file)
  if (text === null) return PASS

  // ESLint from the app's own install: in Ship the top folder has none.
  const resolved = createRequire(join(appDir, 'package.json')).resolve('eslint')
  const { ESLint } = (await import(pathToFileURL(resolved).href)) as { ESLint: typeof ESLintClass }
  const config = join(appDir, 'eslint.gates.config.js')
  const eslint = new ESLint({ cwd: appDir, overrideConfigFile: config })
  const results = await eslint.lintText(text, { filePath: file })
  // A rule's errors only. Code that does not parse yet (one edit of several) is
  // the typecheck's to judge; the gate looks again at the edit that completes it.
  const errors = results.flatMap((r) => r.messages.filter((m) => m.severity === 2 && m.ruleId))
  const { disabled } = countGates(results)
  if (errors.length === 0 && disabled.length === 0) return searchFirst(call, file, text, appDir, top, seen) ?? PASS

  const shown = (p: string) => relative(top, p).split(sep).join('/')
  const lines = [`${shown(file)} was not written: the UI Guardrails refuse it (${shown(config)}).`]
  for (const m of errors) lines.push(`  ${m.line}:${m.column}  ${m.message}${m.ruleId ? `  (${m.ruleId})` : ''}`)
  const keep = audience === 'package' ? 'Keep it only' : 'Keep the element only'
  for (const d of disabled) lines.push(`  ${d.line}  an eslint-disable switches ${d.ruleId} off. ${keep} with its reason on the line above: // @estiva-escape: <reason>`)
  return { code: 2, message: `${lines.join('\n')}\n` }
}

/** The part a Write would add in a new file, or null: a capitalised export, in a file that draws. */
export function newPart(tool: string | undefined, file: string, text: string): string | null {
  if (tool !== 'Write' || existsSync(file) || !file.endsWith('.tsx') || /\.stories\.tsx$/.test(file)) return null
  if (!/<\/[A-Za-z]|\/>/.test(text)) return null
  const named = /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)/.exec(text)?.[1]
  if (named) return named
  return /export\s+default\s+function\s*\(/.test(text) ? basename(file, '.tsx') : null
}

/** `PanelHeader` → `panel header`: the words the search is asked. */
export const wordsOf = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').toLowerCase()

/** The catalogue command: beside this file once built, or the built one from source (tests). */
function findCommand(): string | null {
  for (const at of ['../registry/cli.js', '../../dist/registry/cli.js']) {
    const path = fileURLToPath(new URL(at, import.meta.url))
    if (existsSync(path)) return path
  }
  return null
}

/** Stop a new part's first Write with what already exists; null lets it through. */
function searchFirst(call: ToolCall, file: string, text: string, appDir: string, top: string, seen?: string): HookResult | null {
  const part = newPart(call.tool_name, file, text)
  const command = findCommand()
  if (!part || !command) return null
  const folder = seen ?? join(tmpdir(), 'estiva-ui-search-first')
  const mark = join(folder, createHash('sha1').update(`${call.session_id ?? ''}\n${resolve(file)}`).digest('hex'))
  if (existsSync(mark)) return null
  const words = wordsOf(part)
  const repo = basename(repositoryOf(appDir))
  const run = spawnSync(process.execPath, [command, 'find', ...words.split(' '), '--root', appDir, '--repo', repo, '--limit', '5'], { encoding: 'utf8', timeout: 60_000 })
  if (run.status !== 0 || !run.stdout.trim()) return null
  try {
    mkdirSync(folder, { recursive: true })
    writeFileSync(mark, '')
  } catch {
    return null
  }
  const shown = relative(top, file).split(sep).join('/')
  return {
    code: 2,
    message:
      `${shown} was not written yet: it adds a new part, ${part}. Search before building (UIG-20). What already exists for "${words}":\n\n` +
      `${run.stdout.trim()}\n\n` +
      `If one of these does the job, use it, and read its page first. If the words were wrong, run \`npm run ui:find <other words>\`. ` +
      `If nothing fits, tell the person, then write the file again: it goes through.\n`,
  }
}

/** The file as it will be after this tool call, or null when that cannot be known. */
function proposed(tool: string | undefined, args: NonNullable<ToolCall['tool_input']>, file: string): string | null {
  if (tool === 'Write') return typeof args.content === 'string' ? args.content : null
  if (tool !== 'Edit' || typeof args.old_string !== 'string' || typeof args.new_string !== 'string') return null
  const { old_string: from, new_string: to } = args
  const current = existsSync(file) ? readFileSync(file, 'utf8') : ''
  // A checkout on Windows has CRLF on disk; an edit is written with LF.
  for (const text of [current, current.replace(/\r\n/g, '\n')]) {
    if (!text.includes(from)) continue
    return args.replace_all === true ? text.split(from).join(to) : text.replace(from, () => to)
  }
  return null
}
