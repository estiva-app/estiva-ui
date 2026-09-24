/// <reference types="node" />
/**
 * The hand-written map of an app's Storybook, held against the Storybook it
 * describes (moved here from Peek's own status checks, audit A3).
 *
 * An app may keep two maps of its sidebar: the order of its top-level headings
 * (`const HEADINGS = [...]` in `.storybook/preview.tsx`, read by `storySort`),
 * and the Introduction page (`src/stories/Introduction.mdx`), which names each
 * heading in a table row and states how many parts are worth reusing. Both are
 * written by hand and both describe something that moves, so both rot: Peek's
 * named a Huddles heading for a day after its stories were deleted, and said 49
 * reusable parts when the catalogue built 41. Its own checks saw it, but they
 * ran only in `gates:status`, never in CI.
 *
 * Every check here runs only when the app states the thing it checks: an app
 * with no `HEADINGS` list, or no Introduction, has nothing to rot.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Registry } from './schema'

const PREVIEW = '.storybook/preview.tsx'
const INTRODUCTION = 'src/stories/Introduction.mdx'
/** The classes an app's Introduction counts as "worth reusing". */
const WORTH_REUSING = ['reusable', 'promote-candidate']

function storyFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name.endsWith('.stories.tsx') || entry.name.endsWith('.mdx')) out.push(path)
    }
  }
  walk(join(root, 'src'))
  return out
}

/** Every top-level heading the sidebar has: the first segment of each story file's or page's title. */
export function sidebarHeadings(root: string): Set<string> {
  const real = new Set<string>()
  for (const file of storyFiles(root)) {
    const text = readFileSync(file, 'utf8')
    const start = text.indexOf('const meta')
    const meta = start === -1 ? '' : text.slice(start, text.indexOf('satisfies Meta', start) + 1 || undefined)
    const title = meta.match(/\btitle: *['"]([^'"]+)['"]/) ?? text.match(/<Meta\s+title=['"]([^'"]+)['"]/)
    if (title) real.add(title[1].split('/')[0].trim())
  }
  return real
}

/** The headings `preview.tsx` orders, or null when it keeps no list. */
export function orderedHeadings(previewText: string): string[] | null {
  const block = previewText.match(/const HEADINGS = \[([\s\S]*?)\]/)
  if (!block) return null
  // Comments first: the list is commented per heading, and an apostrophe in a
  // comment would open a string that swallows the rest.
  const listed = block[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  return [...listed.matchAll(/'([^']+)'/g)].map((m) => m[1])
}

/** The headings the Introduction names, one per table row that opens with a bold name. */
export function introductionHeadings(introText: string): Set<string> {
  return new Set([...introText.matchAll(/^\|\s*\*\*([^*]+)\*\*\s*\|/gm)].map((m) => m[1].trim()))
}

/** The number the Introduction states, or null when it states none. */
export function introductionCount(introText: string): number | null {
  const said = introText.match(/\*\*(\d+) parts worth reusing\*\*/)
  return said ? Number(said[1]) : null
}

/** What is wrong with the app's hand-written map of its Storybook; empty when nothing is. */
export function storyMapProblems(registry: Registry, root: string): string[] {
  const problems: string[] = []
  const real = sidebarHeadings(root)
  const previewPath = join(root, PREVIEW)
  if (existsSync(previewPath)) {
    const ordered = orderedHeadings(readFileSync(previewPath, 'utf8'))
    if (ordered) {
      const unordered = [...real].filter((r) => !ordered.includes(r))
      const empty = ordered.filter((o) => !real.has(o))
      if (unordered.length) problems.push(`${PREVIEW}: not named in HEADINGS, so they fall to the bottom of the sidebar: ${unordered.join(', ')}`)
      if (empty.length) problems.push(`${PREVIEW}: named in HEADINGS but no story uses them: ${empty.join(', ')}`)
    }
  }
  const introPath = join(root, INTRODUCTION)
  if (existsSync(introPath)) {
    const intro = readFileSync(introPath, 'utf8')
    const named = introductionHeadings(intro)
    if (named.size) {
      const missing = [...real].filter((r) => !named.has(r))
      const stale = [...named].filter((n) => !real.has(n))
      if (missing.length) problems.push(`${INTRODUCTION}: the sidebar has, the page does not name: ${missing.join(', ')}`)
      if (stale.length) problems.push(`${INTRODUCTION}: the page names, the sidebar does not have: ${stale.join(', ')}`)
    }
    const said = introductionCount(intro)
    if (said !== null) {
      const reusable = registry.entries.filter((entry) => WORTH_REUSING.includes(entry.app?.class ?? '')).length
      if (said !== reusable) problems.push(`${INTRODUCTION}: says ${said} parts worth reusing; the catalogue builds ${reusable}`)
    }
  }
  return problems
}
