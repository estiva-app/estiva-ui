/// <reference types="node" />
/**
 * `estiva-gates` — the gate pieces as one command (docs/GATES.md §23).
 *
 *   estiva-gates ci [--package]                    CI's job `gate`: every step of the gate (R13)
 *   estiva-gates count --repo <name> [--package]   write .gates-count.json (postlint:rules)
 *   estiva-gates hook [--app <dir>] [--package]    the editor gate, run by a PreToolUse hook
 *   estiva-gates name-escapes [--config <file>]    once: name the rule in every escape marker (B3)
 *   estiva-gates status [--app <dir>] [--json] [--detail] [--escapes]   gates:status
 *
 * An app's `package.json` runs the first and the last through npm, which finds
 * the command in `node_modules/.bin`. The hook is run by path, from the
 * committed `.claude/settings.json`:
 *
 *   node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook
 *
 * A repo whose app sits in a folder of its own runs both by path, from the
 * repo's top folder, and says where the app is (Ship did, from UIG-32 until
 * PER-19 moved its app to the top folder):
 *
 *   node "$CLAUDE_PROJECT_DIR/web/node_modules/@estiva-app/ui/dist/gates/cli.js" hook --app web
 *   node web/node_modules/@estiva-app/ui/dist/gates/cli.js status --app web
 */
import { runCi } from './ci'
import { writeGateCount } from './count'
import { runHook } from './hook'
import { nameEscapes } from './name-escapes'
import { runStatus } from './status'

const [command, ...rest] = process.argv.slice(2)
const flag = (name: string) => rest.includes(`--${name}`)
const value = (name: string) => {
  const i = rest.indexOf(`--${name}`)
  return i === -1 ? undefined : rest[i + 1]
}
const audience = flag('package') ? 'package' : 'app'

async function main(): Promise<number> {
  switch (command) {
    case 'ci':
      return runCi({ audience })
    case 'count': {
      const repo = value('repo')
      if (!repo) {
        process.stderr.write('estiva-gates count needs --repo <name>, the name written into .gates-count.json\n')
        return 1
      }
      const result = await writeGateCount({ repo, audience, config: value('config') })
      process.stdout.write(`${result.lines.join('\n')}\n`)
      if (result.failures.length) process.stderr.write(`${result.failures.join('\n')}\n`)
      return result.failures.length ? 1 : 0
    }
    case 'name-escapes': {
      // Once, after taking 0.36.0: every unnamed marker gets the rules it keeps off (B3).
      const result = await nameEscapes({ config: value('config') })
      process.stdout.write(`${result.named.length} markers named:\n  ${result.named.join('\n  ')}\n`)
      if (result.unreached.length) process.stdout.write(`${result.unreached.length} unnamed markers no rule reaches, left as they are:\n  ${result.unreached.join('\n  ')}\n`)
      return 0
    }
    case 'hook': {
      // A hook that fails open guards nothing: Claude Code lets a write through
      // on any exit but 2, and a crash exits 1 (audit A2). So a gate that cannot
      // run — no ESLint in the app's install, a config that does not load —
      // refuses the write and says why, and the session fixes the install.
      try {
        const result = await runHook({ app: value('app'), audience })
        if (result.code === 2) process.stderr.write(result.message)
        // A note on a write let through reaches Claude as additional context: plain
        // stdout on exit 0 does not, for a PreToolUse hook (code.claude.com/docs/en/hooks-guide).
        else if (result.note) process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: `A copied look, let through (it only warns):\n${result.note}` } })}\n`)
        return result.code
      } catch (error) {
        const why = error instanceof Error ? error.message.split('\n')[0] : String(error)
        process.stderr.write(`The UI Guardrails could not check this write, so it was not made: ${why}\nRun \`npm ci\` in the app's folder, then try again.\n`)
        return 2
      }
    }
    case 'status': {
      process.stdout.write(`${await runStatus({ app: value('app'), json: flag('json'), detail: flag('detail'), escapes: flag('escapes') })}${flag('json') ? '' : '\n'}`)
      return 0
    }
    default:
      process.stderr.write('estiva-gates <ci | count | hook | status | name-escapes>\n')
      return 1
  }
}

process.exitCode = await main()
