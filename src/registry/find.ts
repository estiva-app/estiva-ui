/**
 * The catalogue's reader (UIG-12): `ui:find <words>`.
 *
 * It exists to prove the format. A schema nobody consumes is a schema nobody
 * has tested, and the questions it has to answer are regression tests, not the
 * scope: "floating panel" must find `Popover`, "scrolling" `ScrollArea`,
 * "empty" `EmptyState`.
 *
 * It is also the answer to "what do we have for this?", which is the question
 * the wall cannot answer: a lint rule refuses the wrong thing, and this is
 * where the right one is named (UIG-20 makes a session ask it first).
 */
import type { Registry, RegistryEntry } from './schema'

export interface Finding {
  entry: RegistryEntry
  /** How many of the query's words matched anywhere. Ranked on this first. */
  matched: number
  score: number
  /** Which fields matched, for the reader to say why. */
  where: string[]
}

/**
 * The words of a piece of text, with names taken apart.
 *
 * `CommandPalette` is kept whole *and* split, so "palette" reaches it and
 * "commandpalette" still does. Prose is already words; this costs it nothing.
 */
function words(text: string): string[] {
  const found: string[] = []
  for (const token of text.match(/[A-Za-z0-9]+/g) ?? []) {
    found.push(token.toLowerCase())
    const parts = token.split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/)
    if (parts.length > 1) found.push(...parts.map((part) => part.toLowerCase()))
  }
  return found
}

/**
 * Whether a word of the query means a word of the text.
 *
 * Either being a prefix of the other covers "scroll" against "scrolling"; the
 * five-letter key covers "scrolls" against "scrolling", where neither is. Crude
 * on purpose — a stemmer is a dependency and a surprise, and the failure here
 * is an extra row in a list of five, not a wrong answer.
 *
 * **Three letters at least**, or a prefix match is no match at all: `person's`
 * puts the word "s" in the text, and every query on earth starts with some
 * letter. Measured — before this, "scrolling" found `Avatar`.
 */
function alike(query: string, text: string): boolean {
  if (query === text) return true
  if (Math.min(query.length, text.length) < 3) return false
  if (text.startsWith(query) || query.startsWith(text)) return true
  return query.slice(0, 5) === text.slice(0, 5)
}

const hit = (query: string, text: string) => words(text).some((word) => alike(query, word))

/**
 * Search name, purpose, behaviours and variants.
 *
 * A row that answers more of the question comes first, whatever it scored:
 * "floating panel" has to reach `Popover`, whose purpose carries both words,
 * over `MenuPanel`, whose name carries one of them loudly.
 */
export function findInRegistry(registry: Registry, query: string, { limit = 5 }: { limit?: number } = {}): Finding[] {
  const asked = words(query)
  if (asked.length === 0) return []

  const findings: Finding[] = []
  for (const entry of registry.entries) {
    let score = 0
    let matched = 0
    const where = new Set<string>()
    for (const word of asked) {
      let best = 0
      if (entry.name.toLowerCase() === word) {
        best = 100
        where.add('name')
      } else if (hit(word, entry.name)) {
        best = 40
        where.add('name')
      }
      if (hit(word, entry.purpose)) {
        best = Math.max(best, 20)
        where.add('purpose')
      }
      for (const owned of entry.ownsBehaviours) {
        if (hit(word, owned.behaviour) || hit(word, owned.id)) {
          best = Math.max(best, 15)
          where.add('behaviour')
        }
      }
      for (const variant of entry.variants) {
        if (variant.values.some((value) => hit(word, value)) || hit(word, variant.prop)) {
          best = Math.max(best, 8)
          where.add('variant')
        }
      }
      if (best > 0) matched += 1
      score += best
    }
    if (matched > 0) findings.push({ entry, matched, score, where: [...where] })
  }

  findings.sort((a, b) => b.matched - a.matched || b.score - a.score || a.entry.name.localeCompare(b.entry.name))
  return findings.slice(0, limit)
}

/** `http://localhost:6008/?path=/docs/overlays-popover--docs`, or `null` where the entry has no page. */
export function docsLink(registry: Registry, entry: RegistryEntry): string | null {
  if (!entry.docsId) return null
  return registry.storybook.devUrl + registry.storybook.docsPath.replace('{docsId}', entry.docsId)
}

/** What the command prints: the import line first, because that is what the reader came for. */
export function formatFindings(registry: Registry, findings: Finding[], query: string): string {
  if (findings.length === 0) {
    return [
      `Nothing in ${registry.builtFrom.repo} matches "${query}".`,
      'If nothing here does what you need, say so and ask — do not invent a component.',
    ].join('\n')
  }

  const blocks = findings.map((finding) => {
    const { entry } = finding
    const lines = [
      `${entry.name}  ·  ${entry.kind}  ·  ${entry.repo}  (matched ${finding.where.join(', ')})`,
      `  ${entry.purpose}`,
      `  import { ${entry.name} } from '${entry.importPath}'`,
    ]
    if (entry.ownsBehaviours.length) lines.push(`  owns: ${entry.ownsBehaviours.map((owned) => owned.behaviour).join(' · ')}`)
    if (entry.variants.length) lines.push(`  ${entry.variants.map((variant) => `${variant.prop}: ${variant.values.join(' | ')}`).join('   ')}`)
    const link = docsLink(registry, entry)
    if (link) lines.push(`  ${link}`)
    return lines.join('\n')
  })

  return blocks.join('\n\n')
}
