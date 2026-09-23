/// <reference types="node" />
/**
 * The apps beside this one, found rather than named (UIG-20).
 *
 * `estiva-ui find` with nothing else typed searches the package, the app it is
 * run in, and every app that sits beside it. Katerina's condition for having no
 * shared Storybook is that one search, run unasked from any repository, covers
 * every catalogue; a list of names written into each repository's script would
 * be the drifting copy the gates exist to remove, and would miss the next app.
 *
 * An app is a folder, or one folder inside it, whose `package.json` depends on
 * `@estiva-app/ui` and which has a `src` to read. A service that does not
 * install the package is not an app of this catalogue until it does.
 *
 * Each app is searched once. A second checkout of the same app (a worktree, or
 * somebody's copy) carries the same package name; the app the search runs in
 * wins, then the one whose top folder has the shortest name.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

export const PACKAGE_NAME = '@estiva-app/ui'

export interface Sibling {
  /** What its entries are called: its top folder's name. */
  name: string
  /** The folder the catalogue is built from. */
  folder: string
  /** Its `package.json` name, which says two checkouts are one app. */
  packageName: string
}

function manifest(folder: string): { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null {
  const file = join(folder, 'package.json')
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** The name of the app in `folder`, or null when the folder is not one. */
export function appName(folder: string): string | null {
  const m = manifest(folder)
  if (!m || m.name === PACKAGE_NAME) return null
  const uses = Boolean(m.dependencies?.[PACKAGE_NAME] ?? m.devDependencies?.[PACKAGE_NAME])
  return uses && existsSync(join(folder, 'src')) ? (m.name ?? basename(folder)) : null
}

const isDir = (path: string) => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * The folder that holds the repositories: the parent of the repository `from`
 * is in, or `from` itself when it is in none (a folder that only holds them).
 */
export function workspaceOf(from: string): string {
  let at = resolve(from)
  for (;;) {
    if (existsSync(join(at, '.git'))) return dirname(at)
    const up = dirname(at)
    if (up === at) return resolve(from)
    at = up
  }
}

/** Every app in `workspace`, one per package name, except those named in `skip`. */
export function findSiblings(workspace: string, { skip = [] }: { skip?: string[] } = {}): Sibling[] {
  let tops: string[]
  try {
    tops = readdirSync(workspace).filter((name) => !name.startsWith('.') && name !== 'node_modules' && isDir(join(workspace, name)))
  } catch {
    return []
  }
  const found: Sibling[] = []
  for (const top of tops) {
    const folder = join(workspace, top)
    const inside = readdirSync(folder).filter((name) => !name.startsWith('.') && name !== 'node_modules' && isDir(join(folder, name)))
    for (const candidate of [folder, ...inside.map((name) => join(folder, name))]) {
      const packageName = appName(candidate)
      if (packageName) found.push({ name: top, folder: candidate, packageName })
    }
  }
  const byPackage = new Map<string, Sibling>()
  for (const sibling of found.sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name))) {
    if (skip.includes(sibling.packageName) || byPackage.has(sibling.packageName)) continue
    byPackage.set(sibling.packageName, sibling)
  }
  return [...byPackage.values()].sort((a, b) => a.name.localeCompare(b.name))
}
