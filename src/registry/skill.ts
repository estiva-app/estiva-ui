/// <reference types="node" />
/**
 * The Claude skill (UIG-20): search the catalogue before building anything.
 *
 * Its text lives once, in this package, as `skill/estiva-ui.md` (Katerina,
 * 17 September 2026: the same gate text pasted into two repositories is a
 * defect). Claude Code only loads a skill from a `SKILL.md` under a folder's
 * `.claude/skills/`, and no plugin source can point into `node_modules`, so each
 * repository commits a loader: the trigger below, and one line that reads the
 * installed package's text into the skill when it opens (`` !`…` `` runs before
 * Claude sees the skill). `estiva-ui skill` writes it; `estiva-ui check` fails
 * when a repository's loader is missing or is not what this writes.
 *
 * Measured with fresh sessions of Claude Code 2.1.215 (UIG-20), three things
 * shape that line and the settings beside it:
 *
 * - An injected command runs without a prompt only when Claude Code can read it
 *   statically as read-only: a plain `cat` of a plain path. A path with `..`
 *   ("may follow a symlink outside the working directory"), a `$(…)`, or a
 *   `node -e` are all refused, and a refused command stops the skill opening.
 *   So the path starts at `${CLAUDE_PROJECT_DIR}`, the folder the session
 *   started in, as the editor gate's hook does: a session started above or
 *   below the repository gets neither.
 * - An `allowed-tools` line makes opening the skill itself ask for permission
 *   ("Execute skill"). So the search is allowed in the repository's committed
 *   `.claude/settings.json` instead, and the skill carries no `allowed-tools`.
 * - Claude reads a skill's description before it opens the skill, so the
 *   trigger is written into the loader; it is the one part that cannot be
 *   pulled in later.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

export const SKILL_NAME = 'estiva-ui'

/** When Claude opens the skill by itself. Kept under Claude Code's 1,536 characters. */
export const SKILL_DESCRIPTION =
  'Use before building, adding or changing anything on screen in an app that uses @estiva-app/ui, or in @estiva-app/ui itself: ' +
  'a screen, panel, list, row, header, dialog, menu, empty state, a new component, or how something looks. ' +
  'Also when someone asks for a component in plain words ("I need a…", "add a…", "is there a…"). ' +
  "It searches every catalogue at once, the package's and each app's Storybook, for a part that already does the job, " +
  'and lists the mistakes this codebase keeps making.'

/** The search, allowed without a prompt in the folder's committed `.claude/settings.json`. */
export const SEARCH_RULES = ['Bash(npm run ui:find *)', 'Bash(npm --prefix * run ui:find *)', 'PowerShell(npm run ui:find *)', 'PowerShell(npm --prefix * run ui:find *)']

/** The skill's text, inside a package folder. */
export const skillTextPath = (packageRoot: string) => join(packageRoot, 'skill', `${SKILL_NAME}.md`)

/** Where a folder keeps its loader. */
export const loaderPath = (folder: string) => join(folder, '.claude', 'skills', SKILL_NAME, 'SKILL.md')

/** Where a folder keeps the settings that allow the search. */
export const settingsPath = (folder: string) => join(folder, '.claude', 'settings.json')

/** The loader for `folder`, reading the text from `packageRoot`, from where a session in `folder` starts. */
export function loaderText(folder: string, packageRoot: string): string {
  const fromTop = relative(folder, skillTextPath(packageRoot)).split(sep).join('/')
  return [
    '---',
    `name: ${SKILL_NAME}`,
    `description: ${JSON.stringify(SKILL_DESCRIPTION)}`,
    '---',
    '',
    '<!-- Written by `estiva-ui skill` from @estiva-app/ui; `estiva-ui check` fails when it differs. The text is the installed package’s, read in below. -->',
    '',
    `!\`cat "\${CLAUDE_PROJECT_DIR}/${fromTop}"\``,
    '',
  ].join('\n')
}

type Settings = { permissions?: { allow?: string[] } & Record<string, unknown> } & Record<string, unknown>

const readSettings = (folder: string): Settings | null => {
  const path = settingsPath(folder)
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Settings
  } catch {
    return null
  }
}

/** `folder`'s settings with the search allowed, everything else as it was; null when they cannot be read. */
export function settingsWithSearch(folder: string): string | null {
  const settings = readSettings(folder)
  if (!settings) return null
  const allow = settings.permissions?.allow ?? []
  const missing = SEARCH_RULES.filter((rule) => !allow.includes(rule))
  if (!missing.length && existsSync(settingsPath(folder))) return null
  settings.permissions = { ...settings.permissions, allow: [...allow, ...missing] }
  return `${JSON.stringify(settings, null, 2)}\n`
}

/** The repository `from` is in: the nearest folder with `.git`, or `from` when there is none. */
export function repositoryOf(from: string): string {
  let at = resolve(from)
  for (;;) {
    if (existsSync(join(at, '.git'))) return at
    const up = dirname(at)
    if (up === at) return resolve(from)
    at = up
  }
}

/** What is wrong with `folder`'s loader, or null when it is what `loaderText` writes. */
export function loaderProblem(folder: string, packageRoot: string): string | null {
  const path = loaderPath(folder)
  const shown = relative(process.cwd(), path).split(sep).join('/') || path
  if (!existsSync(path)) return `${shown} is missing: run "estiva-ui skill" and commit it`
  if (readFileSync(path, 'utf8').replace(/\r\n/g, '\n') !== loaderText(folder, packageRoot)) return `${shown} is not what the package writes: run "estiva-ui skill" and commit it`
  if (!existsSync(skillTextPath(packageRoot))) return `${shown} reads ${skillTextPath(packageRoot)}, which is not there`
  const allow = readSettings(folder)?.permissions?.allow ?? []
  const missing = SEARCH_RULES.filter((rule) => !allow.includes(rule))
  if (missing.length) return `.claude/settings.json does not allow the search (${missing.join(', ')}): run "estiva-ui skill" and commit it`
  return null
}
