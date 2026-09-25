/// <reference types="node" />
/**
 * The hand-written map of a Storybook, held against the Storybook it describes
 * (moved here from Peek's own status checks, audit A3; widened by the re-review
 * after it, R16).
 *
 * A repository may keep two maps of its sidebar: the order of its top-level
 * headings in `.storybook/preview.tsx` — a `const HEADINGS = [...]` list read by
 * a `storySort` function (Peek), or `storySort: { order: [...] }` (Ship, this
 * package) — and the Introduction page, which names each heading, in a table row
 * (`| **Folders** | … |`, Peek) or a bullet (`- **Primitives · Inputs** — …`,
 * Ship), and in an app states how many parts are worth reusing. Both are written
 * by hand and both describe something that moves, so both rot: Peek's named a
 * Huddles heading for a day after its stories were deleted and said 49 reusable
 * parts when the catalogue built 41; Ship's named a Feedback heading it does not
 * have and left out four it does.
 *
 * The real headings are read from Storybook's own index when the command has
 * one, so a title written any way at all counts; otherwise from the story files.
 * Every check runs only when the repository states the thing it checks.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Registry } from './schema'

const PREVIEW = '.storybook/preview.tsx'
const INTRODUCTIONS = ['src/stories/Introduction.mdx', 'stories/Introduction.mdx']
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
  walk(join(root, 'stories'))
  return out
}

/** Every top-level heading the sidebar has, read from the story files: the first segment of each title. */
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

/** The top-level headings of Storybook's own index (`storybook index`): the first segment of every entry's title. */
export function indexHeadings(entries: Record<string, { title?: string }>): Set<string> {
  return new Set(Object.values(entries).flatMap((e) => (e.title ? [e.title.split('/')[0].trim()] : [])))
}

/** The strings at the top level of the array that starts at `open` (the index of its `[`), skipping nested arrays. */
function topLevelStrings(text: string, open: number): string[] {
  const out: string[] = []
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const c = text[i]
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      if (end < 0) break
      i = end + 1
    } else if (c === '/' && text[i + 1] === '/') i = text.indexOf('\n', i)
    else if (c === '[') depth++
    else if (c === ']') {
      if (--depth === 0) return out
    } else if (c === "'" || c === '"') {
      const end = text.indexOf(c, i + 1)
      if (depth === 1) out.push(text.slice(i + 1, end))
      i = end
    }
    if (i < 0) break
  }
  return out
}

/** The headings the preview orders — a `HEADINGS` list or `storySort: { order: [...] }` — or null when it keeps no order. */
export function orderedHeadings(previewText: string): string[] | null {
  const list = /const HEADINGS = \[/.exec(previewText) ?? /\border:\s*\[/.exec(previewText)
  if (!list) return null
  return topLevelStrings(previewText, list.index + list[0].length - 1)
}

/**
 * The headings the Introduction names: a table row that opens with a bold name,
 * or a bullet that opens with bold names joined by " · ".
 */
export function introductionHeadings(introText: string): Set<string> {
  const rows = [...introText.matchAll(/^\|\s*\*\*([^*]+)\*\*\s*\|/gm)].map((m) => m[1])
  const bullets = [...introText.matchAll(/^[-*]\s+\*\*([^*]+)\*\*\s*[—–-]/gm)].flatMap((m) => m[1].split('·'))
  return new Set([...rows, ...bullets].map((h) => h.trim()).filter(Boolean))
}

/** The number the Introduction states, or null when it states none. */
export function introductionCount(introText: string): number | null {
  const said = introText.match(/\*\*(\d+) parts worth reusing\*\*/)
  return said ? Number(said[1]) : null
}

/**
 * What is wrong with the repository's hand-written map of its Storybook; empty
 * when nothing is. `real` is the sidebar's top-level headings from Storybook's
 * index, when the caller has it; `registry` is needed only for an app's count.
 */
export function storyMapProblems(root: string, { registry, real = sidebarHeadings(root) }: { registry?: Registry; real?: Set<string> } = {}): string[] {
  const problems: string[] = []
  const previewPath = join(root, PREVIEW)
  if (existsSync(previewPath)) {
    const ordered = orderedHeadings(readFileSync(previewPath, 'utf8'))
    if (ordered) {
      const unordered = [...real].filter((r) => !ordered.includes(r))
      const empty = ordered.filter((o) => !real.has(o))
      if (unordered.length) problems.push(`${PREVIEW}: not in the heading order, so they fall to the bottom of the sidebar: ${unordered.join(', ')}`)
      if (empty.length) problems.push(`${PREVIEW}: in the heading order but no story uses them: ${empty.join(', ')}`)
    }
  }
  const intro = INTRODUCTIONS.find((p) => existsSync(join(root, p)))
  if (intro) {
    const text = readFileSync(join(root, intro), 'utf8')
    const named = introductionHeadings(text)
    if (named.size) {
      const missing = [...real].filter((r) => !named.has(r))
      const stale = [...named].filter((n) => !real.has(n))
      if (missing.length) problems.push(`${intro}: the sidebar has, the page does not name: ${missing.join(', ')}`)
      if (stale.length) problems.push(`${intro}: the page names, the sidebar does not have: ${stale.join(', ')}`)
    }
    const said = introductionCount(text)
    if (said !== null && registry) {
      const reusable = registry.entries.filter((entry) => WORTH_REUSING.includes(entry.app?.class ?? '')).length
      if (said !== reusable) problems.push(`${intro}: says ${said} parts worth reusing; the catalogue builds ${reusable}`)
    }
  }
  return problems
}
