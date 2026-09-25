/// <reference types="node" />
/**
 * `estiva-ui` — the catalogue as a command (UIG-12, UIG-13; docs/GATES.md §23
 * for why it ships in the package rather than as a script pasted into each repo).
 *
 *   estiva-ui find <words…> [--here | --also [name=]<folder>…] [--json] [--limit n]
 *   estiva-ui build [--out <path>]
 *   estiva-ui check
 *   estiva-ui skill [--out <folder>]
 *
 * Every command takes `--root <folder>` (the library it reads; default: here)
 * and `--repo <name>` (what an app's entries are called; default: its package name).
 *
 * **In the package** (`@estiva-app/ui` itself): `build` writes the committed
 * `registry.json`, and `check` rebuilds it and fails on a single byte of drift.
 *
 * **In an app**: nothing is committed (Katerina, 18 September 2026 — the
 * package is public, the apps are private). `check` builds the app's catalogue
 * and fails when a part has no one-line description or cannot be sorted, or
 * when a reusable part breaks the usage-page contract (UIG-19, `./contract`),
 * or when the app's hand-written map of its Storybook no longer matches it
 * (`./storymap`); CI's `gate` job runs it. `build` writes the catalogue to a file only when asked.
 *
 * `find` searches the package's catalogue — the one shipped inside the installed
 * package, or this repo's own in the package — plus, in an app, the app's own,
 * built fresh, plus every app beside it (UIG-20, `./siblings`): found, not
 * named, so one command answers the same from any repository, or from the
 * folder that holds them. `--here` searches no neighbour; `--also` names them.
 *
 * `skill` writes the repository's Claude skill loader (UIG-20, `./skill`), or
 * the one for `--out <folder>`; `check` fails when the repository's is missing
 * or differs.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONTRACT_KINDS, contractProblems, linkProblems, nameProblems } from './contract'
import { findInRegistries, formatFindings } from './find'
import { behindBy, findSiblings, workspaceOf } from './siblings'
import { loaderPath, loaderProblem, loaderText, repositoryOf, settingsPath, settingsWithSearch } from './skill'
import { indexHeadings, storyMapProblems } from './storymap'
import { CLASSES, validateRegistry, type Registry } from './schema'

/**
 * The builders, loaded only when they are used.
 *
 * They read TypeScript with TypeScript, and `typescript` is a dev dependency of
 * the app that installs this package — a real one in Peek, Ship and this repo,
 * and possibly absent elsewhere. A static import made the bundler put the whole
 * builder in the same chunk as `find`, so `npx estiva-ui find …` died with
 * ERR_MODULE_NOT_FOUND before opening the file it needed.
 */
const packageBuilder = () => import('./build')
const appBuilder = () => import('./app')
const gatedScan = () => import('./gated')

const [command, ...rest] = process.argv.slice(2)
const VALUED = ['--limit', '--out', '--file', '--root', '--repo', '--also']
const flag = (name: string) => rest.includes(`--${name}`)
const value = (name: string) => {
  const at = rest.indexOf(`--${name}`)
  return at === -1 ? undefined : rest[at + 1]
}
const values = (name: string) => rest.flatMap((word, i) => (word === `--${name}` && rest[i + 1] !== undefined ? [rest[i + 1]] : []))
/** Everything that is not a flag or a flag's value: the words of the question. */
const plain = () => {
  const out: string[] = []
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      if (VALUED.includes(rest[i])) i += 1
      continue
    }
    out.push(rest[i])
  }
  return out
}

const root = resolve(value('root') ?? '.')
const manifestAt = (folder: string) => JSON.parse(readFileSync(resolve(folder, 'package.json'), 'utf8')) as { name?: string }
/** The package itself, or an app that installs it. */
const isPackage = existsSync(resolve(root, 'package.json')) && manifestAt(root).name === '@estiva-app/ui'

/** The package's committed catalogue: `--file`, this repo's own in the package, else the copy inside the installed package. */
function packageRegistryPath(): string {
  const named = value('file')
  if (named) return resolve(named)
  if (isPackage) return resolve(root, 'registry.json')
  // dist/registry/cli.js → the package's own root. Never an app's own folder:
  // a registry.json there is the app's, written by `estiva-ui build`.
  return fileURLToPath(new URL('../../registry.json', import.meta.url))
}

function readPackageRegistry(): Registry {
  const path = packageRegistryPath()
  if (!existsSync(path)) throw new Error(`no registry.json at ${path} — run "estiva-ui build" in the package first`)
  const registry = JSON.parse(readFileSync(path, 'utf8')) as Registry
  const problems = validateRegistry(registry)
  // A malformed catalogue is worse than none: it would answer, wrongly.
  if (problems.length) throw new Error(`${path} does not match the schema:\n  ${problems.join('\n  ')}`)
  return registry
}

/** The installed package whose skill text a loader reads: this repo in the package, else the app's install. */
const packageRoot = () => (isPackage ? root : resolve(root, 'node_modules', '@estiva-app', 'ui'))

/** The Claude skill loader (UIG-20): reports, and says whether it passed. */
function checkLoader(): boolean {
  const problem = loaderProblem(repositoryOf(root), packageRoot())
  if (problem) {
    process.stderr.write(`claude skill: ${problem}\n`)
    return false
  }
  process.stdout.write('claude skill: the loader reads the package’s text\n')
  return true
}

async function buildApp(folder: string, repo: string | undefined): Promise<Registry> {
  const { buildAppRegistry } = await appBuilder()
  const registry = buildAppRegistry({ root: folder, repo })
  const problems = validateRegistry(registry)
  if (problems.length) throw new Error(`the catalogue of ${registry.builtFrom.repo} does not match its own schema:\n  ${problems.join('\n  ')}`)
  return registry
}

/**
 * Every story and docs link in a catalogue, against the Storybook beside it
 * (UIG-19). `storybook index` writes the ids Storybook itself would serve — no
 * server, no browser, seconds — so a renamed story, or a page that no longer
 * compiles, fails here rather than as a dead link somebody finds later.
 * Reports, and says whether it passed. A folder with no Storybook has nothing
 * to check.
 */
function checkLinks(registry: Registry, folder: string): { ok: boolean; headings?: Set<string>; titles?: Set<string> } {
  const bin = resolve(folder, 'node_modules', '.bin', process.platform === 'win32' ? 'storybook.cmd' : 'storybook')
  if (!existsSync(resolve(folder, '.storybook')) || !existsSync(bin)) {
    process.stdout.write('story links: no Storybook here, nothing to check\n')
    return { ok: true }
  }
  const out = join(mkdtempSync(join(tmpdir(), 'estiva-ui-index-')), 'index.json')
  // A `.cmd` needs a shell on Windows, and Node wants that as one quoted line
  // rather than an argument list. Both paths are ours: the app's folder and a temp file.
  const run =
    process.platform === 'win32'
      ? spawnSync(`"${bin}" index -o "${out}" --quiet`, { cwd: folder, encoding: 'utf8', shell: true })
      : spawnSync(bin, ['index', '-o', out, '--quiet'], { cwd: folder, encoding: 'utf8' })
  if (run.status !== 0 || !existsSync(out)) {
    process.stderr.write(`story links: Storybook could not index its stories, so no link can be trusted:\n${(run.stderr || run.stdout || '').trim()}\n`)
    return { ok: false }
  }
  const entries = (JSON.parse(readFileSync(out, 'utf8')) as { entries: Record<string, { title?: string }> }).entries
  const ids = new Set(Object.keys(entries))
  const headings = indexHeadings(entries)
  const titles = new Set(Object.values(entries).flatMap((e) => (e.title ? [e.title] : [])))
  const dead = linkProblems(registry, ids)
  const count = registry.entries.reduce((n, entry) => n + (entry.storyId ? 1 : 0) + (entry.docsId ? 1 : 0), 0)
  if (dead.length) {
    process.stderr.write(`story links: ${dead.length} of ${count} lead nowhere:\n  ${dead.join('\n  ')}\n`)
    return { ok: false, headings, titles }
  }
  process.stdout.write(`story links: all ${count} open a story or docs page Storybook has\n`)
  return { ok: true, headings, titles }
}

/**
 * What a part draws only when a prop is passed, where no story passes it
 * (UIG-19, `./gated`). Strict, by Katerina's ruling: a part's own stories show
 * everything it can draw. In an app it reads the reusable parts; in the package,
 * every component (`kinds` is the package's one class, `component`).
 */
async function checkGated(registry: Registry, folder: string, kinds?: string[]): Promise<boolean> {
  const { gatedFindings } = await gatedScan()
  const found = gatedFindings(registry, folder, { ...(kinds ? { kinds } : {}), pictured: 'own' })
  if (found.length) {
    const lines = found.map((f) => `${f.part} (${f.file}) draws something only when given \`${f.prop}\`, and no story that draws it passes \`${f.prop}\`: pass it in a story`)
    process.stderr.write(`stories: ${found.length === 1 ? 'one thing a part draws is' : `${found.length} things parts draw are`} never shown:\n  ${lines.join('\n  ')}\n`)
    return false
  }
  process.stdout.write('stories: everything a part draws behind a prop is shown by a story\n')
  return true
}

/**
 * The repository's hand-written map of its Storybook — the heading order and the
 * Introduction — against the Storybook (its own index, when there is one) and,
 * in an app, the catalogue (`./storymap`). Reports, and says whether it passed.
 */
function checkStoryMap(folder: string, registry?: Registry, headings?: Set<string>): boolean {
  const problems = storyMapProblems(folder, { ...(registry ? { registry } : {}), ...(headings ? { real: headings } : {}) })
  if (problems.length) {
    process.stderr.write(`storybook map: ${problems.length === 1 ? 'one line no longer matches' : `${problems.length} lines no longer match`}:\n  ${problems.join('\n  ')}\n`)
    return false
  }
  process.stdout.write('storybook map: the heading order and the Introduction match the Storybook and the catalogue\n')
  return true
}

/** One line per kind, in a fixed order, so two runs read the same. */
function summary(registry: Registry): string {
  const count = (cls: string) => registry.entries.filter((entry) => entry.app?.class === cls).length
  const kinds = CLASSES.map((cls) => `${count(cls)} ${cls}`).join(', ')
  const files = registry.builtFrom.files ?? 0
  return `${registry.builtFrom.repo}: ${registry.entries.length} parts in ${files - registry.filesWithoutParts.length} files (${registry.filesWithoutParts.length} more hold none) — ${kinds}. Every part is described and sorted.`
}

async function main(): Promise<number> {
  switch (command) {
    case 'find': {
      const query = plain().join(' ')
      if (!query.trim()) {
        process.stderr.write('estiva-ui find <words…> — what the thing you need does, in words\n')
        return 1
      }
      const registries: Registry[] = [readPackageRegistry()]
      // An app that cannot be read is said out loud, and the rest still answer.
      const add = async (folder: string, repo: string | undefined) => {
        const behind = behindBy(folder)
        if (behind) process.stderr.write(`note: ${repo ?? basename(folder)} (${folder}) is ${behind} commit${behind === 1 ? '' : 's'} behind main as last fetched — its answers may name parts that are gone; pull it\n`)
        try {
          registries.push(await buildApp(folder, repo))
        } catch (error) {
          const [first, ...more] = String(error instanceof Error ? error.message : error).split('\n')
          process.stderr.write(`not searched: ${first}${more.length ? `\n${more.slice(0, 3).join('\n')}${more.length > 3 ? `\n  …and ${more.length - 3} more — run "estiva-ui check" there` : ''}` : ''}\n`)
        }
      }
      // The folder it runs in is searched when it is an app; the folder that
      // holds the repositories is not one, and only its neighbours answer.
      const here = !isPackage && existsSync(resolve(root, 'package.json')) ? (manifestAt(root).name ?? basename(root)) : null
      if (here) await add(root, value('repo'))
      if (!values('also').length && !flag('here')) {
        for (const sibling of findSiblings(workspaceOf(root), { skip: here ? [here] : [] })) await add(sibling.folder, sibling.name)
      }
      for (const also of values('also')) {
        const [name, folder] = also.includes('=') ? [also.slice(0, also.indexOf('=')), also.slice(also.indexOf('=') + 1)] : [undefined, also]
        const at = resolve(root, folder)
        if (!existsSync(resolve(at, 'package.json'))) {
          process.stderr.write(`not searched: ${name ?? basename(at)} — nothing at ${at}\n`)
          continue
        }
        await add(at, name)
      }
      const limit = Number(value('limit') ?? 5)
      const findings = findInRegistries(registries, query, { limit: Number.isFinite(limit) && limit > 0 ? limit : 5 })
      if (flag('json')) {
        process.stdout.write(`${JSON.stringify(findings.map((finding) => finding.entry), null, 2)}\n`)
        return 0
      }
      process.stdout.write(`${formatFindings(registries, findings, query)}\n`)
      // Nothing found is not a failure — it is the answer that sends a session
      // to ask rather than to invent.
      return 0
    }

    case 'build': {
      const out = resolve(root, value('out') ?? 'registry.json')
      if (isPackage) {
        const { buildRegistry, serializeRegistry } = await packageBuilder()
        const registry = buildRegistry({ root })
        const problems = validateRegistry(registry)
        if (problems.length) {
          process.stderr.write(`the registry this build produced does not match its own schema:\n  ${problems.join('\n  ')}\n`)
          return 1
        }
        writeFileSync(out, serializeRegistry(registry), 'utf8')
        process.stdout.write(`${out}: ${registry.entries.length} entries from ${registry.builtFrom.exports} exports\n`)
        return 0
      }
      const { serializeRegistry } = await packageBuilder()
      const registry = await buildApp(root, value('repo'))
      writeFileSync(out, serializeRegistry(registry), 'utf8')
      process.stdout.write(`${out}: ${summary(registry)}\n`)
      return 0
    }

    case 'check': {
      if (!isPackage) {
        const registry = await buildApp(root, value('repo'))
        process.stdout.write(`${summary(registry)}\n`)
        // The usage-page contract and the story links (UIG-19): the one copy, run by every app's `gate` job.
        const broken = contractProblems(registry, root)
        if (broken.length) {
          process.stderr.write(`${broken.length === 1 ? 'a part breaks' : `${broken.length} parts break`} the usage-page contract:\n  ${broken.join('\n  ')}\n`)
        } else {
          const owed = registry.entries.filter((entry) => (CONTRACT_KINDS as readonly string[]).includes(entry.app?.class ?? '')).length
          process.stdout.write(`usage pages: all ${owed} reusable parts keep the contract and are drawn somewhere\n`)
        }
        const linked = checkLinks(registry, root)
        const shown = await checkGated(registry, root)
        const loaded = checkLoader()
        const mapped = checkStoryMap(root, registry, linked.headings)
        // What the pages name must still be there (R14): parts under When and When not,
        // and the stories a Seen in line sends a reader to, here or in the package.
        const pkg = readPackageRegistry()
        const stale = nameProblems(registry, root, {
          known: new Set([...pkg.entries, ...registry.entries].map((e) => e.name)),
          ...(linked.titles ? { titles: linked.titles } : {}),
          packageIds: pkg.entries.flatMap((e) => [e.storyId, e.docsId].filter((id): id is string => Boolean(id))),
        })
        if (stale.length) process.stderr.write(`usage pages: ${stale.length === 1 ? 'one name leads' : `${stale.length} names lead`} nowhere:\n  ${stale.join('\n  ')}\n`)
        else process.stdout.write('usage pages: every part and story they name is there\n')
        return broken.length || stale.length || !linked.ok || !shown || !loaded || !mapped ? 1 : 0
      }
      const { buildRegistry, serializeRegistry } = await packageBuilder()
      const path = packageRegistryPath()
      const built = buildRegistry({ root })
      const problems = validateRegistry(built)
      if (problems.length) {
        process.stderr.write(`the registry does not match its own schema:\n  ${problems.join('\n  ')}\n`)
        return 1
      }
      if (!existsSync(path)) {
        process.stderr.write(`${path} is missing — run "npm run registry"\n`)
        return 1
      }
      // Byte for byte. The point of the check is that the committed file cannot
      // drift from the code; "near enough" is drift.
      if (readFileSync(path, 'utf8').replace(/\r\n/g, '\n') !== serializeRegistry(built)) {
        process.stderr.write(`${path} is not what the code produces — run "npm run registry" and commit the result\n`)
        return 1
      }
      process.stdout.write(`${path}: current, ${built.entries.length} entries from ${built.builtFrom.exports} exports\n`)
      const linked = checkLinks(built, root)
      const shown = await checkGated(built, root, ['component'])
      const loaded = checkLoader()
      // The package keeps a heading order too (R16): it left out Layout, and nothing saw.
      const mapped = checkStoryMap(root, undefined, linked.headings)
      return linked.ok && shown && loaded && mapped ? 0 : 1
    }

    case 'skill': {
      const out = value('out')
      const folder = out ? resolve(out) : repositoryOf(root)
      // The loader's path starts where the session does and cannot climb out:
      // Claude Code refuses a `..` in it.
      if (relative(folder, packageRoot()).startsWith('..')) {
        process.stderr.write(`${folder} does not hold ${packageRoot()}: a loader there could not reach the skill's text\n`)
        return 1
      }
      const path = loaderPath(folder)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, loaderText(folder, packageRoot()), 'utf8')
      process.stdout.write(`${path}: the Claude skill, read from ${packageRoot()}\n`)
      const settings = settingsWithSearch(folder)
      if (settings) {
        writeFileSync(settingsPath(folder), settings, 'utf8')
        process.stdout.write(`${settingsPath(folder)}: the search allowed without a prompt\n`)
      }
      return 0
    }

    default:
      process.stderr.write('estiva-ui <find | build | check | skill>\n')
      return 1
  }
}

try {
  process.exitCode = await main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
