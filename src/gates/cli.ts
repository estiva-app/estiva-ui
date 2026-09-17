/// <reference types="node" />
/**
 * `estiva-gates` — the gate pieces as one command (docs/GATES.md §23).
 *
 *   estiva-gates count --repo <name> [--package]   write .gates-count.json (postlint:rules)
 *   estiva-gates hook [--app <dir>] [--package]    the editor gate, run by a PreToolUse hook
 *   estiva-gates status [--json] [--detail]        gates:status
 *
 * An app's `package.json` runs the first and the last through npm, which finds
 * the command in `node_modules/.bin`. The hook is run by path, from the
 * committed `.claude/settings.json`:
 *
 *   node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook
 */
import { writeGateCount } from './count'
import { runHook } from './hook'
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
    case 'hook': {
      const result = await runHook({ app: value('app'), audience })
      if (result.code === 2) process.stderr.write(result.message)
      return result.code
    }
    case 'status': {
      process.stdout.write(`${await runStatus({ json: flag('json'), detail: flag('detail') })}${flag('json') ? '' : '\n'}`)
      return 0
    }
    default:
      process.stderr.write('estiva-gates <count | hook | status>\n')
      return 1
  }
}

process.exitCode = await main()
