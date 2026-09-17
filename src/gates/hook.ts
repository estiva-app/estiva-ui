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
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ESLint as ESLintClass } from 'eslint'
import { countGates } from '../eslint/index'

export interface HookOptions {
  /** The repository's top folder. Defaults to `$CLAUDE_PROJECT_DIR`, then the tool call's `cwd`. */
  root?: string
  /** The folder that holds the app, relative to `root`: `web` in Ship, `.` elsewhere. */
  app?: string
  /** `package` gates `.tsx` only, as this package's inward lint does. */
  audience?: 'app' | 'package'
  /** The hook's input, when not read from stdin (tests). */
  input?: unknown
}

export interface HookResult {
  /** 0 lets the write through; 2 refuses it. */
  code: 0 | 2
  /** What goes to stderr when refused. */
  message: string
}

interface ToolCall {
  tool_name?: string
  cwd?: string
  tool_input?: { file_path?: unknown; content?: unknown; old_string?: unknown; new_string?: unknown; replace_all?: unknown }
}

const PASS: HookResult = { code: 0, message: '' }

export async function runHook({ root, app = '.', audience = 'app', input }: HookOptions = {}): Promise<HookResult> {
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
  const source = audience === 'package' ? /^src\/.+\.tsx$/ : /^src\/.+\.tsx?$/
  if (rel.startsWith('../') || isAbsolute(rel) || !source.test(rel) || /\.test\.tsx?$/.test(rel) || /\.d\.ts$/.test(rel)) return PASS

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
  if (errors.length === 0 && disabled.length === 0) return PASS

  const shown = (p: string) => relative(top, p).split(sep).join('/')
  const lines = [`${shown(file)} was not written: the UI Guardrails refuse it (${shown(config)}).`]
  for (const m of errors) lines.push(`  ${m.line}:${m.column}  ${m.message}${m.ruleId ? `  (${m.ruleId})` : ''}`)
  const keep = audience === 'package' ? 'Keep it only' : 'Keep the element only'
  for (const d of disabled) lines.push(`  ${d.line}  an eslint-disable switches ${d.ruleId} off. ${keep} with its reason on the line above: // @estiva-escape: <reason>`)
  return { code: 2, message: `${lines.join('\n')}\n` }
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
