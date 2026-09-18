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
  /**
   * The props the query named **by name**, so the answer shows those rather
   * than all of them. A prop whose note merely carries one of the words counts
   * towards the score and is not shown: on "floating panel", six of `Popover`'s
   * notes say "panel", and printing all six buries the answer.
   */
  props: string[]
}

/**
 * Words that are in nearly every sentence, and so tell a search nothing.
 *
 * Measured: `ui:find "truncate a long link"` printed `Link`'s `external` prop,
 * because its note says "in **a** new tab" and the one-letter word matched
 * itself exactly. The minimum length in `alike` only guards a *prefix* match;
 * an exact match short-circuits it, which is right for `tab` and useless for `a`.
 */
const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'for', 'from', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'no', 'not', 'of',
  'on', 'or', 'our', 'so', 'that', 'the', 'their', 'them', 'then', 'there', 'they', 'this', 'to', 'up', 'was', 'we', 'what', 'when', 'which', 'with', 'you', 'your',
])

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
  return findInRegistries([registry], query, { limit })
}

/**
 * Search several catalogues as one: the package's, the app's own, and any app
 * beside it (UIG-13).
 *
 * An app's pass-on is not a result of its own — it is the package's part, and
 * the package's entry answers for it, saying which apps hand it on. At the
 * same strength the package's part comes first: it is the one to reach for.
 */
export function findInRegistries(registries: Registry[], query: string, { limit = 5 }: { limit?: number } = {}): Finding[] {
  const all = words(query)
  // Drop the words that mean nothing. If the question was only those, keep them
  // rather than answer nothing at all.
  const carrying = all.filter((word) => word.length >= 3 && !STOP.has(word))
  const asked = carrying.length ? carrying : all
  if (asked.length === 0) return []

  const findings: Finding[] = []
  const entries = registries.flatMap((registry) => registry.entries).filter((entry) => entry.app?.class !== 're-export')
  for (const entry of entries) {
    let score = 0
    let matched = 0
    const where = new Set<string>()
    const byName = new Set<string>()
    const byNote = new Set<string>()
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
          byName.add(variant.prop)
        }
      }
      // What it can do. "does Link already truncate?" is the question this
      // answers, and answering it is what stops the thing being built twice.
      for (const prop of entry.props) {
        // A prop the question named by name is the answer; one whose note
        // happens to carry the word is a hint. Named ones go first, so a short
        // answer shows the right lines.
        if (hit(word, prop.name)) {
          best = Math.max(best, 14)
          where.add('prop')
          byName.add(prop.name)
        } else if (prop.note !== null && hit(word, prop.note)) {
          best = Math.max(best, 10)
          where.add('prop')
          byNote.add(prop.name)
        }
      }
      if (best > 0) matched += 1
      score += best
    }
    if (matched > 0) findings.push({ entry, matched, score, where: [...where], props: [...byName] })
  }

  const fromPackage = (finding: Finding) => (finding.entry.app === null ? 0 : 1)
  findings.sort((a, b) => b.matched - a.matched || b.score - a.score || fromPackage(a) - fromPackage(b) || a.entry.name.localeCompare(b.entry.name))
  return findings.slice(0, limit)
}

/** `http://localhost:6008/?path=/docs/overlays-popover--docs`, or `null` where the entry has no page. */
export function docsLink(registry: Registry, entry: RegistryEntry): string | null {
  if (!entry.docsId) return null
  return registry.storybook.devUrl + registry.storybook.docsPath.replace('{docsId}', entry.docsId)
}

/** What an app's part is, in the words the search prints. */
const CLASS_WORDS: Record<string, string> = {
  'one-off': 'used in one place',
  reusable: 'used in several places',
  'promote-candidate': 'used in several places; could move into the package',
  unused: 'used nowhere in the app',
}

/** What the command prints: the import line first, because that is what the reader came for. */
export function formatFindings(searched: Registry | Registry[], findings: Finding[], query: string): string {
  const registries = Array.isArray(searched) ? searched : [searched]
  if (findings.length === 0) {
    return [
      `Nothing in ${registries.map((registry) => registry.builtFrom.repo).join(', ')} matches "${query}".`,
      'If nothing here does what you need, say so and ask — do not invent a component.',
    ].join('\n')
  }
  const registryOf = (entry: RegistryEntry) => registries.find((registry) => registry.builtFrom.repo === entry.repo) ?? registries[0]
  // Which apps hand a package part on, and from where: in Peek, `Button` is
  // imported from `@/components/ui/Button`, and the answer should say so.
  const handedOn = new Map<string, string[]>()
  for (const registry of registries) {
    for (const entry of registry.entries) {
      if (entry.app?.class !== 're-export' || entry.app.handsOn === null) continue
      handedOn.set(entry.app.handsOn, [...(handedOn.get(entry.app.handsOn) ?? []), `${entry.repo} hands it on${entry.name === entry.app.handsOn ? '' : ` as ${entry.name}`} from ${entry.importPath}`])
    }
  }

  const blocks = findings.map((finding) => {
    const { entry } = finding
    const facts = entry.app
    const lines = [
      `${entry.name}  ·  ${facts ? CLASS_WORDS[facts.class] ?? facts.class : entry.kind}  ·  ${entry.repo}  (matched ${finding.where.join(', ')})`,
      `  ${entry.purpose}`,
      facts?.defaultExport ? `  import ${entry.name} from '${entry.importPath}'` : `  import { ${entry.name} } from '${entry.importPath}'`,
    ]
    if (!facts) for (const said of handedOn.get(entry.name) ?? []) lines.push(`  ${said}`)
    if (facts?.packageNamesake) lines.push(`  the package has a ${facts.packageNamesake} too: check it first`)
    if (facts && facts.usedIn.length) lines.push(`  used in ${facts.usedIn.slice(0, 2).join(', ')}${facts.usedIn.length > 2 ? ` and ${facts.usedIn.length - 2} more` : ''}`)
    if (entry.ownsBehaviours.length) lines.push(`  owns: ${entry.ownsBehaviours.map((owned) => owned.behaviour).join(' · ')}`)
    if (entry.variants.length) lines.push(`  ${entry.variants.map((variant) => `${variant.prop}: ${variant.values.join(' | ')}`).join('   ')}`)
    // The props the question named, with their own line — not all of them. A
    // component with twenty props would bury its own answer.
    const shown = finding.props
      .filter((name) => !entry.variants.some((variant) => variant.prop === name))
      .slice(0, 3)
      .map((name) => entry.props.find((prop) => prop.name === name))
    for (const prop of shown) {
      if (prop) lines.push(`  ${prop.name}: ${prop.takes}${prop.note ? ` — ${prop.note}` : ''}`)
    }
    if (entry.props.length) lines.push(`  ${entry.props.length} props in all; see ${entry.docsId ? 'the page' : entry.sourceFile} for the rest`)
    const link = docsLink(registryOf(entry), entry)
    if (link) lines.push(`  ${link}`)
    return lines.join('\n')
  })

  return blocks.join('\n\n')
}
