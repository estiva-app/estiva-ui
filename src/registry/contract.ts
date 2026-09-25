/**
 * The usage-page contract, checked against an app's catalogue (UIG-19).
 *
 * Every part an app classifies **reusable** (or **promote-candidate**) has a
 * page beside it — `<PartName>.mdx` in the component's own folder — that opens
 * with a line saying what the part is, then `When`, `When not`, `How` (with
 * code) and `What it owns`, in that order. And it is drawn somewhere: a story
 * of its own, or a **Seen in** line on its page naming the stories that draw
 * it, or saying why none can (Katerina, 21 and 23 September 2026). A one-off
 * needs only its class and a purpose line, which the catalogue already refuses
 * to build without.
 *
 * This is the one copy. Peek and Ship each used to carry their own, pasted into
 * their `scripts/gates-checks.mjs` and run only by `gates:status`, so a page
 * could lose its `When not` and still merge. `estiva-ui check` runs this in
 * every app's `gate` job (docs/GATES.md §23: one copy, in the package).
 *
 * The package's own pages keep the fuller contract in `src/pages.test.ts`,
 * which also reads `What it owns` back against the lint rule.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Registry } from './schema'

/** The four headings, in the order a page carries them. */
export const PAGE_SECTIONS = ['When', 'When not', 'How', 'What it owns'] as const

/** The classes that owe a page and a picture. */
export const CONTRACT_KINDS = ['reusable', 'promote-candidate'] as const

/** The line that stands in for a story of the part's own. */
const SEEN_IN = /^\*\*Seen in\*\*/m

/**
 * Why a page breaks the contract, or null when it keeps it.
 *
 * Read on normalised text: the apps are checked out with CRLF on Windows.
 */
export function pageProblem(source: string): string | null {
  const text = source.replace(/\r\n/g, '\n')
  const heads = [...text.matchAll(/^##+\s+(.+?)\s*$/gm)].map((m) => m[1])
  const at = PAGE_SECTIONS.map((s) => heads.indexOf(s))
  const missing = PAGE_SECTIONS.filter((_, i) => at[i] < 0)
  if (missing.length) return `no ${missing.map((s) => `"${s}"`).join(', ')} section`
  if (at.some((i, n) => n > 0 && i < at[n - 1])) return `sections out of order: they go ${PAGE_SECTIONS.join(', ')}`
  // The opening line: the first paragraph under the title that is not markup.
  const opening = text
    .split(/^# .*$/m)[1]
    ?.split(/^##\s/m)[0]
    ?.split(/\n\s*\n/)
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('<') && !s.startsWith('import '))
  if (!opening) return 'no opening line under the title saying what the part is'
  // Only the How section: the code block must sit under How, not in a later section
  // (a page with none under How and one under What it owns passed, R18).
  const how = text.split(/^##\s+How\s*$/m)[1]?.split(/^##\s/m)[0] ?? ''
  if (!/```tsx?\n/.test(how)) return 'no code under "How"'
  return null
}

/** Whether a page records where the part is drawn, in place of a story of its own. */
export function hasSeenIn(source: string): boolean {
  return SEEN_IN.test(source.replace(/\r\n/g, '\n'))
}

/**
 * Every catalogue link that names a story or a docs page its Storybook does not
 * have (UIG-19: a dead link is a build failure, not a dead end found six weeks
 * later). `ids` is every entry id in the Storybook's own index — what
 * `storybook index` writes — so this is Storybook's answer, not a guess at how
 * it builds an id.
 */
export function linkProblems(registry: Registry, ids: ReadonlySet<string>): string[] {
  const problems: string[] = []
  for (const entry of registry.entries) {
    for (const key of ['storyId', 'docsId'] as const) {
      const id = entry[key]
      if (id && !ids.has(id)) problems.push(`${entry.name} (${entry.sourceFile}) links to ${key === 'storyId' ? 'a story' : 'a docs page'} its Storybook does not have: ${id}`)
    }
  }
  return problems
}

/**
 * Every way an app's catalogue breaks the contract, one line each, naming the
 * part, its file and what to do. Empty when it keeps it.
 *
 * `root` is the app's own folder: the one its catalogue's paths are relative to.
 */
export function contractProblems(registry: Registry, root: string): string[] {
  const problems: string[] = []
  for (const entry of registry.entries) {
    const cls = entry.app?.class
    if (!cls || !(CONTRACT_KINDS as readonly string[]).includes(cls)) continue
    // Where the page must be: beside the component, named after the part —
    // the same place the catalogue looks (src/registry/app.ts).
    const page = join(entry.sourceFile.replace(/[^/\\]+$/, ''), `${entry.name}.mdx`).replace(/\\/g, '/')
    const where = `${entry.name} (${cls}, ${entry.sourceFile})`
    if (!existsSync(join(root, page))) {
      problems.push(`${where} has no usage page: write ${page}, with an opening line, then ${PAGE_SECTIONS.join(', ')}`)
      continue
    }
    const text = readFileSync(join(root, page), 'utf8')
    const problem = pageProblem(text)
    if (problem) problems.push(`${where}: ${page} has ${problem}`)
    if (entry.storyId === null && !hasSeenIn(text)) {
      problems.push(`${where} is drawn nowhere: give it a story, or write a "**Seen in**" line on ${page} naming the stories that draw it, or why none can`)
    }
    // A reusable part links to its page or a story (Katerina's ruling B10, 25 September):
    // the catalogue reads the page's `<Meta title>`, so a page without one leaves it unlinked.
    if (entry.storyId === null && entry.docsId === null) {
      problems.push(`${where} links to nothing in Storybook: give ${page} a \`<Meta title="…" />\`, or give the part a story`)
    }
  }
  return problems
}

/** Storybook's id for a title: lower case, every run of other characters one hyphen. */
const toStoryId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The names a page's section writes as a part: bold or in backticks, starting with a capital. */
function namedParts(section: string): string[] {
  return [...section.matchAll(/\*\*([A-Z][A-Za-z0-9]+)\*\*|`([A-Z][A-Za-z0-9]+)`/g)].map((m) => m[1] ?? m[2])
}

/**
 * What an app's usage pages name that is not there (the re-review after the audit
 * before UIG-26, R14): a part named under When or When not that no catalogue has —
 * Peek's StartTopicDialog sent readers to CreateTopicDialog, deleted by FOL-23 —
 * and a story a **Seen in** line names that no Storybook has. `known` is every part
 * of the package and the app; `titles` is the app's Storybook titles, when there
 * is an index to read them from; `packageIds` the package's story and docs ids, so
 * a page may send readers to the package's Storybook too.
 */
export function nameProblems(registry: Registry, root: string, { known, titles, packageIds = [] }: { known: Set<string>; titles?: Set<string>; packageIds?: string[] }): string[] {
  const problems: string[] = []
  for (const entry of registry.entries) {
    if (!entry.docPage || !existsSync(join(root, entry.docPage))) continue
    const text = readFileSync(join(root, entry.docPage), 'utf8').replace(/\r\n/g, '\n')
    for (const heading of ['When', 'When not']) {
      const section = text.split(new RegExp(`^##\\s+${heading}\\s*$`, 'm'))[1]?.split(/^##\s/m)[0] ?? ''
      for (const name of new Set(namedParts(section).filter((n) => !known.has(n)))) {
        problems.push(`${entry.docPage}: "${heading}" names ${name}, which is no part of the package or this app`)
      }
    }
    if (!titles) continue
    const seenIn = text.match(/^\*\*Seen in\*\*[^\n]*(?:\n(?!\n)[^\n]*)*/m)?.[0] ?? ''
    for (const [, raw] of seenIn.matchAll(/\*([A-Z][^*/]*\/[^*]+)\*/g)) {
      // A title may wrap across lines, and a line may break after its slash.
      const title = raw.replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/').trim()
      const id = toStoryId(title)
      if (titles.has(title) || packageIds.some((p) => p.startsWith(`${id}--`))) continue
      problems.push(`${entry.docPage}: "Seen in" names ${title}, which no Storybook has`)
    }
  }
  return problems
}
