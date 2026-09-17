/// <reference types="node" />
/**
 * `create-estiva-app <name>` (UIG-10): the command. What it makes is
 * `create-app.ts`; this file only reads the arguments and says what happened.
 *
 *   npx -p @estiva-app/ui create-estiva-app leaf [--title Leaf] [--theme light] [--ui <version or tarball>]
 */
import { createApp } from './create-app'

const [name, ...rest] = process.argv.slice(2)
const value = (flag: string) => {
  const i = rest.indexOf(`--${flag}`)
  return i === -1 ? undefined : rest[i + 1]
}

try {
  if (!name || name.startsWith('--')) throw new Error('create-estiva-app <name> [--title <on-screen name>] [--theme <theme>] [--ui <@estiva-app/ui version or tarball>]')
  const dir = createApp({ name, title: value('title'), theme: value('theme'), ui: value('ui') })
  process.stdout.write(
    `Made ${dir}\n\nNext:\n  cd ${name}\n  npm install     (on Linux, or in a Linux container, so the lockfile carries every platform)\n  git init -b main && git add -A && git commit -m "The app, as create-estiva-app made it"\n  npm run dev\n`,
  )
} catch (error) {
  process.stderr.write(`${(error as Error).message}\n`)
  process.exitCode = 1
}
