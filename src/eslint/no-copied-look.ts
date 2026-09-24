import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type { Rule } from 'eslint'
import type ts from 'typescript'
import { ESCAPE_MESSAGES, isEscaped } from './escape'
import { classUnits, componentsOf, copies, looksOf, parseForLooks, sharedLooksOf, type ClassUnit } from './looks-of'

/**
 * UIG-25: a component's look typed again by hand. **A warning, never an error**
 * (Katerina, 13 September): a copy is found by how alike two lists are, and
 * likeness is a judgement — a warning gets read, a guess that blocks gets
 * switched off.
 *
 * Every class list in the file (see `looks-of.ts` for where one is read) is
 * compared, by its look words alone, against the looks of every catalogued
 * part in another file. A list is a copy when it shares `MIN_SHARED` look words
 * with one of a part's looks, covering `MIN_COVER` of the shorter of the two.
 *
 * - **In an app**, the parts are the package's — read from the catalogue the
 *   installed package ships (`@estiva-app/ui/registry.json`, its `looks`) — and
 *   the app's own exported components, read from its `src`. So a part added to
 *   either is covered the day it is added, with no list kept here. The fix:
 *   use the part.
 * - **In the package**, the parts are its own. The fix: write the look once in
 *   `src/looks.ts` and use it in both.
 *
 * Left alone: a part's look in its own file, and a component named like the
 * part it wraps (Peek's `Avatar` over the package's). A constant imported from
 * another file is a look written once, not a copy. Peek and Ship copying each
 * other is not seen here — each app knows only itself and the package — and
 * is counted by `gates:status`.
 */

interface Look {
  part: string
  file: string
  look: string[]
  /** The installed package's part, this repo's own part, or a shared look (`…_CLASSES`) this repo writes once. */
  from: 'package' | 'own' | 'shared'
}

const packageDirCache = new Map<string, string | null>()
function packageDirOf(file: string): string | null {
  const start = dirname(resolve(file))
  if (packageDirCache.has(start)) return packageDirCache.get(start) ?? null
  let dir = start
  for (;;) {
    if (existsSync(join(dir, 'package.json'))) break
    const up = dirname(dir)
    if (up === dir) {
      dir = ''
      break
    }
    dir = up
  }
  packageDirCache.set(start, dir || null)
  return dir || null
}

const PACKAGE = '@estiva-app/ui'
const nameOf = (dir: string) => {
  try {
    return (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string }).name
  } catch {
    return undefined
  }
}

/** The installed package's parts and their looks, from the catalogue it ships. */
const shippedCache = new Map<string, { mtime: number; looks: Look[] }>()
function shippedLooks(appDir: string): Look[] {
  for (let dir = appDir; ; dir = dirname(dir)) {
    const file = join(dir, 'node_modules', PACKAGE, 'registry.json')
    if (existsSync(file)) {
      const mtime = statSync(file).mtimeMs
      const cached = shippedCache.get(file)
      if (cached && cached.mtime === mtime) return cached.looks
      let looks: Look[] = []
      try {
        const registry = JSON.parse(readFileSync(file, 'utf8')) as { entries: { name: string; sourceFile: string; looks?: string[] }[] }
        looks = registry.entries.flatMap((e) => (e.looks ?? []).map((l) => ({ part: e.name, file: e.sourceFile, look: l.split(' '), from: 'package' as const })))
      } catch {
        // A catalogue that does not parse is its own check's business.
      }
      shippedCache.set(file, { mtime, looks })
      return looks
    }
    if (dirname(dir) === dir) return []
  }
}

/** The names a file exports. */
function exportedNames(source: ts.SourceFile): Set<string> {
  const names = new Set<string>()
  const text = source.text
  for (const m of text.matchAll(/export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w*)/g)) names.add(m[1])
  for (const m of text.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) {
    const name = part.trim().split(/\s+as\s+/).pop()
    if (name && /^[A-Z]/.test(name)) names.add(name)
  }
  return names
}

/** A repo's own exported components and their looks, from its `src`. */
const ownCache = new Map<string, { mtime: number; looks: Look[] }>()
function ownLooks(repoDir: string): Look[] {
  const out: Look[] = []
  const walk = (dir: string) => {
    let names: string[] = []
    try {
      names = readdirSync(dir)
    } catch {
      return
    }
    for (const name of names) {
      if (name === 'node_modules' || name === 'dist') continue
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.tsx?$/.test(name) && !/\.(?:stories|test)\.tsx?$/.test(name) && !name.endsWith('.d.ts')) {
        const mtime = statSync(path).mtimeMs
        let cached = ownCache.get(path)
        if (!cached || cached.mtime !== mtime) {
          const text = readFileSync(path, 'utf8')
          const source = parseForLooks(path, text)
          const exported = name.endsWith('.tsx') ? [...componentsOf(source).keys()].filter((n) => exportedNames(source).has(n)) : []
          const file = relative(repoDir, path).replace(/\\/g, '/')
          const looks: Look[] = [...looksOf(source, exported)].flatMap(([part, lists]) => lists.map((l) => ({ part, file, look: l.split(' '), from: 'own' as const })))
          // A shared look written once (`…_CLASSES`): a copy of it is told to use it.
          if (text.includes('_CLASSES')) for (const [part, lists] of sharedLooksOf(source)) for (const l of lists) looks.push({ part, file, look: l.split(' '), from: 'shared' })
          cached = { mtime, looks }
          ownCache.set(path, cached)
        }
        out.push(...cached.looks)
      }
    }
  }
  walk(join(repoDir, 'src'))
  return out
}

export const noCopiedLook: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: "A part's look typed again by hand, where the part (or a shared look) should be used" },
    schema: [],
    messages: {
      usePart:
        "This class list is `{{part}}`'s look, typed again ({{count}} words: {{words}}). Use `{{part}}` from {{from}}: a copy looks right today and stays behind the day `{{part}}` changes.",
      shareIt:
        'This look is also written in `{{part}}` ({{file}}): {{words}}. Write it once in src/looks.ts and use it in both, so the two cannot drift apart.',
      useShared:
        'This class list is `{{part}}` ({{file}}), typed again: {{words}}. Use `{{part}}`: a look written once cannot drift apart.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    const file = context.filename
    const repoDir = packageDirOf(file)
    if (!repoDir) return {}
    const inPackage = nameOf(repoDir) === PACKAGE
    return {
      Program() {
        const here = relative(repoDir, file).replace(/\\/g, '/')
        const source = parseForLooks(file, context.sourceCode.text)
        const declared = new Set(componentsOf(source).keys())
        const looks = [...(inPackage ? [] : shippedLooks(repoDir)), ...ownLooks(repoDir)].filter((l) => l.file !== here && !declared.has(l.part))
        if (!looks.length) return
        const units = classUnits(source)
        // A string inside a className is read with it; report the className once.
        const within = (u: ClassUnit) => units.some((o) => o !== u && o.via === 'attribute' && u.via === 'literal' && u.start >= o.start && u.end <= o.end)
        const reported = new Set<number>()
        for (const unit of units) {
          if (within(unit) || reported.has(unit.start)) continue
          let best: { look: Look; shared: string[] } | null = null
          for (const look of looks) {
            // A shared look is compared with the package's parts only: the parts here that use it are not its copies.
            if (unit.shared && look.from !== 'package') continue
            const shared = copies(unit.look, look.look)
            // On a tie, the shared look: using it is the whole fix.
            if (shared && (!best || shared.length > best.shared.length || (shared.length === best.shared.length && look.from === 'shared'))) best = { look, shared }
          }
          if (!best) continue
          const loc = { start: context.sourceCode.getLocFromIndex(unit.start), end: context.sourceCode.getLocFromIndex(unit.end) }
          const at = { start: context.sourceCode.getLocFromIndex(unit.anchor), end: loc.end }
          if (isEscaped(context, { loc: at, range: [unit.anchor, unit.end] })) continue
          reported.add(unit.start)
          const words = best.shared.map((w) => `\`${w}\``).join(' ')
          if (best.look.from === 'shared') context.report({ loc, messageId: 'useShared', data: { part: best.look.part, file: best.look.file, words } })
          else if (inPackage) context.report({ loc, messageId: 'shareIt', data: { part: best.look.part, file: best.look.file, words } })
          else
            context.report({
              loc,
              messageId: 'usePart',
              data: { part: best.look.part, count: String(best.shared.length), words, from: best.look.from === 'package' ? PACKAGE : `\`${best.look.file}\`` },
            })
        }
      },
    }
  },
}
