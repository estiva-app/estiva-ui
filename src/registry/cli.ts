/// <reference types="node" />
/**
 * `estiva-ui` — the catalogue as a command (UIG-12; docs/GATES.md §23 for why
 * it ships in the package rather than as a script pasted into each repo).
 *
 *   estiva-ui find <words…> [--json] [--limit n]   what do we have for this?
 *   estiva-ui build [--out <path>]                 write registry.json
 *   estiva-ui check                                rebuild and compare; CI runs this
 *
 * `find` reads the committed `registry.json`: the one in the folder it is run
 * from, else the one shipped inside the installed package. So an app can ask
 * the question without a checkout of this repo. `build` and `check` read the
 * source, so they only mean anything inside the library they describe.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findInRegistry, formatFindings } from './find'
import { validateRegistry, type Registry } from './schema'

/**
 * The builder, loaded only when it is used.
 *
 * It reads TypeScript with TypeScript, and `typescript` is a dev dependency of
 * the app that installs this package — a real one in Peek, Ship and this repo,
 * and possibly absent elsewhere. `find` needs none of it: it reads a JSON file.
 * A static import made the bundler put the whole builder in the same chunk as
 * `find`, so `npx estiva-ui find …` died with ERR_MODULE_NOT_FOUND before
 * opening the file it needed.
 */
const builder = () => import('./build')

const [command, ...rest] = process.argv.slice(2)
const flag = (name: string) => rest.includes(`--${name}`)
const value = (name: string) => {
  const at = rest.indexOf(`--${name}`)
  return at === -1 ? undefined : rest[at + 1]
}
/** Everything that is not a flag or a flag's value: the words of the question. */
const plain = () => {
  const out: string[] = []
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      if (rest[i] === '--limit' || rest[i] === '--out' || rest[i] === '--file') i += 1
      continue
    }
    out.push(rest[i])
  }
  return out
}

/** The committed file: where it is run, else the copy inside the installed package. */
function registryPath(): string {
  const named = value('file')
  if (named) return resolve(named)
  const here = resolve(process.cwd(), 'registry.json')
  if (existsSync(here)) return here
  // dist/registry/cli.js → the package's own root.
  return fileURLToPath(new URL('../../registry.json', import.meta.url))
}

function readRegistry(): Registry {
  const path = registryPath()
  if (!existsSync(path)) throw new Error(`no registry.json at ${path} — run "estiva-ui build" in the library first`)
  const registry = JSON.parse(readFileSync(path, 'utf8')) as Registry
  const problems = validateRegistry(registry)
  // A malformed catalogue is worse than none: it would answer, wrongly.
  if (problems.length) throw new Error(`${path} does not match the schema:\n  ${problems.join('\n  ')}`)
  return registry
}

async function main(): Promise<number> {
  switch (command) {
    case 'find': {
      const query = plain().join(' ')
      if (!query.trim()) {
        process.stderr.write('estiva-ui find <words…> — what the thing you need does, in words\n')
        return 1
      }
      const registry = readRegistry()
      const limit = Number(value('limit') ?? 5)
      const findings = findInRegistry(registry, query, { limit: Number.isFinite(limit) && limit > 0 ? limit : 5 })
      if (flag('json')) {
        process.stdout.write(`${JSON.stringify(findings.map((finding) => finding.entry), null, 2)}\n`)
        return 0
      }
      process.stdout.write(`${formatFindings(registry, findings, query)}\n`)
      // Nothing found is not a failure — it is the answer that sends a session
      // to ask rather than to invent.
      return 0
    }

    case 'build': {
      const { buildRegistry, serializeRegistry } = await builder()
      const out = resolve(value('out') ?? 'registry.json')
      const registry = buildRegistry()
      const problems = validateRegistry(registry)
      if (problems.length) {
        process.stderr.write(`the registry this build produced does not match its own schema:\n  ${problems.join('\n  ')}\n`)
        return 1
      }
      writeFileSync(out, serializeRegistry(registry), 'utf8')
      process.stdout.write(`${out}: ${registry.entries.length} entries from ${registry.builtFrom.exports} exports\n`)
      return 0
    }

    case 'check': {
      const { buildRegistry, serializeRegistry } = await builder()
      const path = registryPath()
      const built = buildRegistry()
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
