/// <reference types="node" />
/**
 * `estiva-ui` — the catalogue as a command (UIG-12, UIG-13; docs/GATES.md §23
 * for why it ships in the package rather than as a script pasted into each repo).
 *
 *   estiva-ui find <words…> [--also [name=]<folder>]… [--json] [--limit n]
 *   estiva-ui build [--out <path>]
 *   estiva-ui check
 *
 * Every command takes `--root <folder>` (the library it reads; default: here)
 * and `--repo <name>` (what an app's entries are called; default: its package name).
 *
 * **In the package** (`@estiva-app/ui` itself): `build` writes the committed
 * `registry.json`, and `check` rebuilds it and fails on a single byte of drift.
 *
 * **In an app**: nothing is committed (Katerina, 18 September 2026 — the
 * package is public, the apps are private). `check` builds the app's catalogue
 * and fails when a part has no one-line description or cannot be sorted; CI's
 * `gate` job runs it. `build` writes the catalogue to a file only when asked.
 *
 * `find` searches the package's catalogue — the one shipped inside the installed
 * package, or this repo's own in the package — plus, in an app, the app's own,
 * built fresh, plus each `--also` app that sits beside it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findInRegistries, formatFindings } from './find'
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

async function buildApp(folder: string, repo: string | undefined): Promise<Registry> {
  const { buildAppRegistry } = await appBuilder()
  const registry = buildAppRegistry({ root: folder, repo })
  const problems = validateRegistry(registry)
  if (problems.length) throw new Error(`the catalogue of ${registry.builtFrom.repo} does not match its own schema:\n  ${problems.join('\n  ')}`)
  return registry
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
        try {
          registries.push(await buildApp(folder, repo))
        } catch (error) {
          const [first, ...more] = String(error instanceof Error ? error.message : error).split('\n')
          process.stderr.write(`not searched: ${first}${more.length ? `\n${more.slice(0, 3).join('\n')}${more.length > 3 ? `\n  …and ${more.length - 3} more — run "estiva-ui check" there` : ''}` : ''}\n`)
        }
      }
      if (!isPackage) await add(root, value('repo'))
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
        process.stdout.write(`${summary(await buildApp(root, value('repo')))}\n`)
        return 0
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
      return 0
    }

    default:
      process.stderr.write('estiva-ui <find | build | check>\n')
      return 1
  }
}

try {
  process.exitCode = await main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
