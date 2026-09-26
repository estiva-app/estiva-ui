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
 * It fails closed, as the apps' hook does since 0.35.0: Claude Code blocks a
 * write only on exit 2, so a gate that cannot build or cannot run refuses the
 * write and says why, rather than exiting 0 or crashing with 1 and letting it
 * through (the re-review after the audit before UIG-26).
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
const refuse = (why) => {
  process.stderr.write(`The UI Guardrails could not check this write, so it was not made: ${why}\nRun \`npm ci\` and \`npm run build\` in estiva-ui, then try again.\n`)
  process.exit(2)
}

if (!existsSync(built)) {
  try {
    execFileSync(process.execPath, [join(root, 'build.mjs')], { cwd: root, stdio: 'ignore' })
  } catch {
    refuse('the package could not be built, so there is no gate to run')
  }
}

try {
  const { runHook } = await import(pathToFileURL(built).href)
  const { code, message, note } = await runHook({ root, audience: 'package' })
  if (code === 2) process.stderr.write(message)
  // A copied look only warns: it reaches Claude as context on a write let through (R10).
  else if (note) process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: `A copied look, let through (it only warns):\n${note}` } })}\n`)
  process.exit(code)
} catch (error) {
  refuse(error instanceof Error ? error.message.split('\n')[0] : String(error))
}
