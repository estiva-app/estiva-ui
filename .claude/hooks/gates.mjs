/**
 * The editor gate for this package (UIG-5): before Claude writes a `.tsx` under
 * `src/`, the inward gate lints the text it is about to write and refuses the
 * write on an error.
 *
 * The gate itself is the package's own piece, `runHook` in `src/gates/hook.ts`
 * (UIG-10, docs/GATES.md §23) — the one copy an app runs too. This file only
 * makes sure it is built: the rules and the hook are the built files in
 * `dist/`, the very files published, and a fresh checkout has none.
 *
 * It reaches a Claude session whose project directory is this repository.
 * A session started elsewhere is told by `CLAUDE.md` to run `npm run lint:rules`.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const built = join(root, 'dist', 'gates', 'index.js')
if (!existsSync(built)) {
  try {
    execFileSync(process.execPath, [join(root, 'build.mjs')], { cwd: root, stdio: 'ignore' })
  } catch {
    process.exit(0)
  }
}

const { runHook } = await import(pathToFileURL(built).href)
const { code, message } = await runHook({ root, audience: 'package' })
if (code === 2) process.stderr.write(message)
process.exit(code)
