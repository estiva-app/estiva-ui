/**
 * The catalogue's shape (UIG-12, seam S2 in docs/GATES.md §16).
 *
 * A **data source read by machines first** and rendered second — not a
 * documentation generator. The skill (UIG-20), the copy detector (UIG-25) and
 * the merged search (UIG-19) all read this and nothing else, so the field
 * names are the contract and `schemaVersion` is what makes a change to them
 * detectable.
 *
 * Names are plain and ours. Open-sourcing is far off; when it comes, a
 * renaming pass is one version bump, and guessing at a public vocabulary now
 * would cost every reader between here and there.
 */

/**
 * Raise this whenever a field is added, removed or given a new meaning. A
 * reader that knows version N and is handed N+1 must be able to say so rather
 * than silently read a field that moved.
 */
export const SCHEMA_VERSION = 2

/** What a name is, which decides how a reader offers it. */
export type EntryKind =
  /** Draws something. Used in JSX. */
  | 'component'
  /** A React hook: `use…`, callable only inside a component. */
  | 'hook'
  /** A function or a constant. Neither of the above. */
  | 'helper'

/** Where an entry's one-line purpose was read from. */
export type PurposeSource =
  /** The `.mdx` page's opening paragraph — the name has a page of its own. */
  | 'page'
  /** The doc comment above the export — the name is documented on a sibling's page. */
  | 'comment'
  /** An app's file that holds this one part: the comment at the top of the file (UIG-13). */
  | 'file'
  /** An app's pass-on: the part is the package's, and says so (UIG-13). */
  | 'package'

/**
 * Which of four kinds an app's part is (UIG-13), or that nothing uses it.
 *
 * Worked out from the code, never from the folder a file sits in: Peek's
 * `components/ui` holds one-line pass-ons beside 187-line components.
 */
export type EntryClass =
  /** Its file only hands a package part on, so the app keeps its own import path. */
  | 're-export'
  /** Used in two or more places in the app. Gets a usage page (UIG-17, UIG-18). */
  | 'reusable'
  /** Used in one place. Needs only its purpose line. */
  | 'one-off'
  /** Reusable, and everything it uses is already in the package: it could move there. Katerina rules. */
  | 'promote-candidate'
  /** No file of the app uses it: only its stories or tests, or nothing. Listed, never deleted by the catalogue. */
  | 'unused'

/**
 * What the catalogue knows about a part that lives in an app (UIG-13). `null`
 * on the package's own entries.
 */
export interface AppFacts {
  class: EntryClass
  /** Why it has that class, in words: the evidence, or the written reason. */
  reason: string
  /**
   * `true` when the class is written beside the part (`@registry <class>: <reason>`
   * in its comment) rather than worked out — "general, though one screen uses it yet".
   */
  written: boolean
  /** A pass-on's part, as `Name` for the package's and `Name from <package>` for another's. `null` otherwise. */
  handsOn: string | null
  /**
   * The app's files that use it, relative to the app: every file that imports it,
   * and its own file when something else there draws it. Stories and tests are not
   * uses — a part only they reach is unused.
   */
  usedIn: string[]
  /**
   * What ties it to this app: each import that is neither in the package's own
   * dependencies nor an app file that is itself untied. Empty means it could
   * live in the package as it is.
   */
  tiedTo: string[]
  /** The package part with the same name, when there is one: the reader should see both. */
  packageNamesake: string | null
  /** Imported as `import X from …` rather than `import { X } from …`. */
  defaultExport: boolean
}

/** A file in an app's target set that holds no part, and why, in words. */
export interface FileWithoutPart {
  file: string
  reason: string
}

export type EntryStatus = 'stable' | 'migrating' | 'deprecated'

/** A prop that takes one of a known set of words, and the set. */
export interface EntryVariant {
  prop: string
  values: string[]
}

/**
 * One prop a component declares itself.
 *
 * **Itself**, not what it inherits: a component that extends
 * `ComponentPropsWithRef<'div'>` would otherwise drag in every DOM attribute,
 * which is noise in a catalogue whose whole point is a short answer.
 */
export interface EntryProp {
  name: string
  /**
   * What it takes, in a word a person reads: `true/false`, `number`, `text`,
   * `anything`, `a handler`, the words themselves for a set (`left | right`),
   * or the type as written where none of those fit.
   */
  takes: string
  required: boolean
  /** The first sentence of the prop's own comment, where it has one. */
  note: string | null
}

/** A behaviour this component owns, from UIG-8's enumeration. */
export interface EntryBehaviour {
  /** `OwnedBehaviour.id` — `portal`, `walking`, `scroll`… */
  id: string
  /** What a person notices it doing, in words. */
  behaviour: string
}

export interface RegistryEntry {
  /** The exported name, exactly as `index.ts` exports it. */
  name: string
  /** Which library it came from: `estiva-ui`, or the app that owns it. */
  repo: string
  kind: EntryKind
  /** What a caller actually types. */
  importPath: string
  /** The file the name is declared in, relative to the repo. Several names share one file. */
  sourceFile: string
  /** One line: what it is for. Never empty — the build fails instead. */
  purpose: string
  purposeFrom: PurposeSource
  /**
   * Every prop it declares itself — what it can do. This is the field a reader
   * asks "does it already do X?" of, before writing X by hand.
   */
  props: EntryProp[]
  /**
   * The subset of `props` that takes one of a known set of words, structured.
   * Kept beside `props` because it is what a search ranks well on, and what a
   * caller most often needs named back at them.
   */
  variants: EntryVariant[]
  /** What it owns, so a caller never rebuilds it (UIG-8). Empty for most. */
  ownsBehaviours: EntryBehaviour[]
  status: EntryStatus
  /**
   * Which migration stage plans to change it.
   *
   * Always `null` here. The migration's plan lives in `K:/Estiva/migration
   * docs`, which is not in this repo and is not in CI — and a copy kept here by
   * hand is the drifting list this whole project exists to remove. The field
   * stays in the schema because a later ticket may have a source a build can
   * read; until then a reader gets an honest `null` rather than a stale number.
   */
  migrationStage: number | null
  /** The `.mdx` page's Storybook id, or `null` where the name has no page of its own. */
  docsId: string | null
  /** A story that shows it, by Storybook id. `null` where nothing renders it alone. */
  storyId: string | null
  /** The `.mdx` path, relative to the repo, or `null`. */
  docPage: string | null
  /** An app's part: its class and the evidence for it (UIG-13). `null` on the package's own entries. */
  app: AppFacts | null
}

/** A name that is exported and deliberately not an entry. Empty today; the count still has to reconcile. */
export interface RegistryExclusion {
  name: string
  reason: string
}

export interface Registry {
  schemaVersion: number
  builtFrom: {
    /**
     * `package`: the package's catalogue, committed and shipped. `app`: one app's,
     * built fresh from its code each time and never committed — Peek and Ship are
     * private, the package is public (Katerina, 18 September 2026).
     */
    kind: 'package' | 'app'
    repo: string
    /** The package the entries are imported from, or the app's own name. */
    package: string
    packageVersion: string
    /**
     * The package: value exports counted in `index.ts`. An app: parts found in its
     * files. `entries + excluded` must equal it.
     */
    exports: number
    /** Type-only exports, which are not entries. Recorded so the count reconciles. `0` for an app. */
    typeExports: number
    /**
     * An app only: its `.tsx` files outside stories and tests. Each one either holds
     * an entry or is in `filesWithoutParts`. `null` for the package.
     */
    files: number | null
  }
  /**
   * How to turn an id into a link. There is no Storybook on the internet yet
   * (UIG-19), so an absolute URL committed here would resolve nowhere: the
   * reader joins its own base to these.
   */
  storybook: {
    docsPath: string
    storyPath: string
    devUrl: string
  }
  entries: RegistryEntry[]
  excluded: RegistryExclusion[]
  /** An app's `.tsx` files that hold no part, each with its reason. Empty for the package. */
  filesWithoutParts: FileWithoutPart[]
}

const KINDS: EntryKind[] = ['component', 'hook', 'helper']
const STATUSES: EntryStatus[] = ['stable', 'migrating', 'deprecated']
const SOURCES: PurposeSource[] = ['page', 'comment', 'file', 'package']
export const CLASSES: EntryClass[] = ['re-export', 'reusable', 'one-off', 'promote-candidate', 'unused']

const isString = (v: unknown): v is string => typeof v === 'string'
const isFilledString = (v: unknown): v is string => isString(v) && v.trim().length > 0

/**
 * Check a registry against this schema. Returns every problem, not the first:
 * a build that reports one missing purpose per run costs one run per entry.
 *
 * An empty list is the only pass. CI runs this on the committed file.
 */
export function validateRegistry(value: unknown): string[] {
  const problems: string[] = []
  const fail = (message: string) => problems.push(message)

  if (typeof value !== 'object' || value === null) return ['the registry is not an object']
  const registry = value as Partial<Registry>

  if (registry.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion is ${String(registry.schemaVersion)}, expected ${SCHEMA_VERSION}`)

  const built = registry.builtFrom
  let isApp = false
  if (typeof built !== 'object' || built === null) fail('builtFrom is missing')
  else {
    if (built.kind !== 'package' && built.kind !== 'app') fail(`builtFrom.kind is ${String(built.kind)}, expected package or app`)
    isApp = built.kind === 'app'
    if (!isFilledString(built.repo)) fail('builtFrom.repo is missing')
    if (!isFilledString(built.package)) fail('builtFrom.package is missing')
    if (!isFilledString(built.packageVersion)) fail('builtFrom.packageVersion is missing')
    if (typeof built.exports !== 'number') fail('builtFrom.exports is not a number')
    if (typeof built.typeExports !== 'number') fail('builtFrom.typeExports is not a number')
    if (isApp ? typeof built.files !== 'number' : built.files !== null) fail(`builtFrom.files is ${String(built.files)}: a number for an app, null for the package`)
  }

  const book = registry.storybook
  if (typeof book !== 'object' || book === null) fail('storybook is missing')
  else {
    for (const key of ['docsPath', 'storyPath', 'devUrl'] as const) {
      if (!isFilledString(book[key])) fail(`storybook.${key} is missing`)
    }
    if (isString(book.docsPath) && !book.docsPath.includes('{docsId}')) fail('storybook.docsPath does not carry {docsId}')
    if (isString(book.storyPath) && !book.storyPath.includes('{storyId}')) fail('storybook.storyPath does not carry {storyId}')
  }

  const entries = registry.entries
  const excluded = registry.excluded
  const withoutParts = registry.filesWithoutParts
  if (!Array.isArray(entries)) return [...problems, 'entries is not an array']
  if (!Array.isArray(excluded)) return [...problems, 'excluded is not an array']
  if (!Array.isArray(withoutParts)) return [...problems, 'filesWithoutParts is not an array']
  // An app with no part of its own yet is still an app: only the package must have entries.
  if (entries.length === 0 && !isApp) fail('entries is empty')

  // The package's names are unique; an app may have two parts of one name in two
  // files, and the catalogue says which is which rather than refusing the app.
  const seen = new Set<string>()
  const seenNames = new Set<string>()
  for (const [i, raw] of entries.entries()) {
    const at = (field: string) => `entries[${i}] (${isString((raw as RegistryEntry)?.name) ? (raw as RegistryEntry).name : '?'}).${field}`
    if (typeof raw !== 'object' || raw === null) {
      fail(`entries[${i}] is not an object`)
      continue
    }
    const entry = raw as Partial<RegistryEntry>
    const key = isApp ? `${String(entry.sourceFile)}#${String(entry.name)}` : String(entry.name)
    if (!isFilledString(entry.name)) fail(at('name') + ' is missing')
    else if (seen.has(key)) fail(`${entry.name} appears twice${isApp ? ` in ${String(entry.sourceFile)}` : ''}`)
    else {
      seen.add(key)
      seenNames.add(entry.name)
    }

    if (!isFilledString(entry.repo)) fail(at('repo') + ' is missing')
    if (!isFilledString(entry.importPath)) fail(at('importPath') + ' is missing')
    if (!isFilledString(entry.sourceFile)) fail(at('sourceFile') + ' is missing')
    // The reason this schema exists: an entry with no purpose is an entry the
    // search cannot find and the skill cannot quote.
    if (!isFilledString(entry.purpose)) fail(at('purpose') + ' is empty')
    if (!KINDS.includes(entry.kind as EntryKind)) fail(at('kind') + ` is ${String(entry.kind)}`)
    if (!SOURCES.includes(entry.purposeFrom as PurposeSource)) fail(at('purposeFrom') + ` is ${String(entry.purposeFrom)}`)
    if (!STATUSES.includes(entry.status as EntryStatus)) fail(at('status') + ` is ${String(entry.status)}`)
    if (!(entry.migrationStage === null || typeof entry.migrationStage === 'number')) fail(at('migrationStage') + ' is neither a number nor null')
    if (!Array.isArray(entry.props)) fail(at('props') + ' is not an array')
    else
      for (const prop of entry.props) {
        if (!isFilledString(prop?.name) || !isFilledString(prop?.takes) || typeof prop?.required !== 'boolean') fail(at('props') + ' has a malformed entry')
        else if (!(prop.note === null || isFilledString(prop.note))) fail(at('props') + `.${prop.name}.note is neither a string nor null`)
      }
    if (!Array.isArray(entry.variants)) fail(at('variants') + ' is not an array')
    else
      for (const variant of entry.variants) {
        if (!isFilledString(variant?.prop) || !Array.isArray(variant?.values) || variant.values.length === 0) fail(at('variants') + ' has a malformed entry')
        // variants is a view of props, never a second source that can disagree.
        else if (Array.isArray(entry.props) && !entry.props.some((prop) => prop?.name === variant.prop)) fail(at('variants') + `.${variant.prop} is not one of its props`)
      }
    if (!Array.isArray(entry.ownsBehaviours)) fail(at('ownsBehaviours') + ' is not an array')
    else for (const behaviour of entry.ownsBehaviours) {
      if (!isFilledString(behaviour?.id) || !isFilledString(behaviour?.behaviour)) fail(at('ownsBehaviours') + ' has a malformed entry')
    }
    for (const key of ['docsId', 'storyId', 'docPage'] as const) {
      const held = entry[key]
      if (!(held === null || isFilledString(held))) fail(at(key) + ' is neither a string nor null')
    }
    // "Every storyUrl resolves, or is recorded as absent with a reason" — the
    // reason is enforced rather than written down: only something that draws
    // nothing may have nowhere to be looked at. A component with no story is
    // already an error of UIG-5's component-has-a-story; this stops the
    // catalogue quietly carrying one.
    //
    // The package only. An app's parts are described before they are drawn:
    // absence of a story says nothing about whether a part is reused, and UIG-19
    // is where a reusable one must have one.
    if (!isApp && entry.kind === 'component' && (entry.docsId === null || entry.storyId === null)) {
      fail(at('docsId') + ' is null, and only a helper or a hook may have no page or story')
    }

    if (!isApp) {
      if (entry.app !== null) fail(at('app') + ' is set on a package entry')
    } else {
      problems.push(...validateAppFacts(entry, at))
    }
  }

  for (const [i, raw] of excluded.entries()) {
    const gap = raw as Partial<RegistryExclusion>
    if (!isFilledString(gap?.name)) fail(`excluded[${i}].name is missing`)
    if (!isFilledString(gap?.reason)) fail(`excluded[${i}].reason is missing`)
    if (!isApp && isString(gap?.name) && seenNames.has(gap.name)) fail(`${gap.name} is both an entry and excluded`)
  }

  // Completeness (the ticket's acceptance): every value export is either an
  // entry or an exclusion with a reason. Averaging the difference away is the
  // failure this check exists to make impossible.
  const counted = entries.length + excluded.length
  if (typeof built === 'object' && built !== null && typeof built.exports === 'number' && counted !== built.exports) {
    fail(`${entries.length} entries + ${excluded.length} excluded = ${counted}, but ${isApp ? 'the app has' : 'index.ts exports'} ${built.exports} ${isApp ? 'parts' : 'values'}`)
  }

  // And an app's files: every one either holds a part or says why it does not.
  const fileProblems: string[] = []
  const withParts = new Set(entries.map((entry) => (entry as RegistryEntry).sourceFile))
  for (const [i, raw] of withoutParts.entries()) {
    const gap = raw as Partial<FileWithoutPart>
    if (!isFilledString(gap?.file)) fileProblems.push(`filesWithoutParts[${i}].file is missing`)
    else if (withParts.has(gap.file)) fileProblems.push(`${gap.file} holds a part and is listed as holding none`)
    if (!isFilledString(gap?.reason)) fileProblems.push(`filesWithoutParts[${i}].reason is missing`)
  }
  if (!isApp && withoutParts.length) fileProblems.push('filesWithoutParts is for an app; the package lists its exports instead')
  if (isApp && typeof built === 'object' && built !== null && typeof built.files === 'number' && withParts.size + withoutParts.length !== built.files) {
    fileProblems.push(`${withParts.size} files hold a part + ${withoutParts.length} hold none = ${withParts.size + withoutParts.length}, but the app has ${built.files} files`)
  }
  problems.push(...fileProblems)

  return problems
}

/**
 * An app entry's class must be what its own evidence says, unless it is written
 * beside the part with a reason. A pass-on is a fact about the file, so it can
 * never be written, and only a pass-on hands a part on.
 */
function validateAppFacts(entry: Partial<RegistryEntry>, at: (field: string) => string): string[] {
  const problems: string[] = []
  const fail = (message: string) => problems.push(message)
  const facts = entry.app
  if (typeof facts !== 'object' || facts === null) return [at('app') + ' is missing on an app entry']
  if (!CLASSES.includes(facts.class)) fail(at('app.class') + ` is ${String(facts.class)}`)
  if (!isFilledString(facts.reason)) fail(at('app.reason') + ' is empty')
  if (typeof facts.written !== 'boolean') fail(at('app.written') + ' is not true/false')
  if (typeof facts.defaultExport !== 'boolean') fail(at('app.defaultExport') + ' is not true/false')
  if (!Array.isArray(facts.usedIn) || !facts.usedIn.every(isFilledString)) fail(at('app.usedIn') + ' is not a list of files')
  if (!Array.isArray(facts.tiedTo) || !facts.tiedTo.every(isFilledString)) fail(at('app.tiedTo') + ' is not a list')
  if (!(facts.handsOn === null || isFilledString(facts.handsOn))) fail(at('app.handsOn') + ' is neither a name nor null')
  if (!(facts.packageNamesake === null || isFilledString(facts.packageNamesake))) fail(at('app.packageNamesake') + ' is neither a name nor null')
  if (problems.length) return problems

  const passOn = facts.class === 're-export'
  if (passOn !== (facts.handsOn !== null)) fail(at('app.handsOn') + (passOn ? ' is missing on a pass-on' : ' is set on a part that is not a pass-on'))
  if (passOn !== (entry.purposeFrom === 'package')) fail(at('purposeFrom') + (passOn ? ' must be package on a pass-on' : ' is package on a part that is not a pass-on'))
  if (passOn && facts.written) fail(at('app.written') + ': a pass-on is read from the file, never written')
  if (!facts.written && !passOn) {
    const uses = facts.usedIn.length
    const expected: EntryClass = uses === 0 ? 'unused' : uses === 1 ? 'one-off' : facts.tiedTo.length ? 'reusable' : 'promote-candidate'
    if (facts.class !== expected) fail(at('app.class') + ` is ${facts.class}, but its evidence (${uses} uses, ${facts.tiedTo.length} ties) says ${expected}`)
  }
  return problems
}
