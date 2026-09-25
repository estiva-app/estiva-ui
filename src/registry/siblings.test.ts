/// <reference types="node" />
/**
 * UIG-20: the apps beside this one, found rather than named. The folder below
 * is the shape of the real one: two apps (one inside a `web/` folder), a
 * service that does not install the package, a worktree and somebody's copy of
 * an app, and the package itself.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { appName, behindBy, findSiblings, workspaceOf } from './siblings'

const workspace = mkdtempSync(join(tmpdir(), 'uig20-'))
afterAll(() => rmSync(workspace, { recursive: true, force: true }))

const UI = { '@estiva-app/ui': '^0.28.0' }
function put(path: string, text: string) {
  mkdirSync(dirname(join(workspace, path)), { recursive: true })
  writeFileSync(join(workspace, path), text)
}
function appAt(folder: string, name: string, deps: Record<string, string> = UI, part = 'Part') {
  put(`${folder}/package.json`, JSON.stringify({ name, dependencies: deps }))
  put(`${folder}/src/${part}.tsx`, `/** The ${part.toLowerCase()} of ${name}. */\nexport function ${part}() {\n  return <i />\n}\n`)
}
// A repository is a folder with `.git`: a directory, or a worktree's file.
appAt('alpha', 'alpha-app', UI, 'Tabletop')
put('alpha/.git/HEAD', 'ref: refs/heads/main\n')
put('beta/package.json', JSON.stringify({ name: 'beta' }))
put('beta/.git/HEAD', 'ref: refs/heads/main\n')
appAt('beta/web', 'beta-web', { ...UI }, 'Workbench')
appAt('alpha-copy', 'alpha-app')
put('alpha-copy/.git', 'gitdir: ../alpha/.git/worktrees/alpha-copy\n')
appAt('beta-notes/web', 'beta-web')
appAt('service', 'service', { react: '^19.0.0' })
put('ui/package.json', JSON.stringify({ name: '@estiva-app/ui' }))
mkdirSync(join(workspace, 'ui', 'src'), { recursive: true })

describe('the apps beside this one', () => {
  it('is an app only when it installs the package and has a src', () => {
    expect(appName(join(workspace, 'alpha'))).toBe('alpha-app')
    expect(appName(join(workspace, 'service'))).toBeNull()
    expect(appName(join(workspace, 'ui'))).toBeNull()
    expect(appName(join(workspace, 'beta'))).toBeNull()
  })

  it('finds the folder that holds the repositories, from inside one or from that folder itself', () => {
    expect(workspaceOf(join(workspace, 'beta', 'web', 'src'))).toBe(workspace)
    expect(workspaceOf(join(workspace, 'alpha-copy'))).toBe(workspace)
  })

  it('finds each app once, inside a web folder too, and never a second checkout of the same app', () => {
    expect(findSiblings(workspace).map((s) => [s.name, s.packageName])).toEqual([
      ['alpha', 'alpha-app'],
      ['beta', 'beta-web'],
    ])
  })

  it('leaves out the app the search runs in, so a worktree of it is not searched twice', () => {
    expect(findSiblings(workspace, { skip: ['alpha-app'] }).map((s) => s.name)).toEqual(['beta'])
  })
})

// The command, as a session runs it: `dist/` is what `npm test` builds first.
const cli = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist', 'registry', 'cli.js')
describe.skipIf(!existsSync(cli))('estiva-ui find, with nothing else typed', () => {
  const find = (cwd: string, ...words: string[]) =>
    execFileSync(process.execPath, [cli, 'find', ...words], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

  it('searches every app beside the one it runs in', () => {
    const out = find(join(workspace, 'alpha-copy'), 'workbench')
    expect(out).toMatch(/^Workbench {2}· .* · {2}beta/m)
  })

  it('answers the same from the folder that holds them', () => {
    expect(find(workspace, 'tabletop')).toMatch(/^Tabletop {2}· .* · {2}alpha/m)
    expect(find(workspace, 'zzqqx')).toContain('Nothing in estiva-ui, alpha, beta matches')
  })

  it('searches no neighbour when told --here', () => {
    expect(find(join(workspace, 'alpha'), 'workbench', '--here')).not.toContain('Workbench')
  })
})

// The re-review after the audit before UIG-26: a search from one repository read a
// neighbour's checkout eleven commits behind, and answered with a part it had deleted.
describe('behindBy', () => {
  it('says how far a checkout is behind its main as last fetched, and null for a folder that is none', () => {
    const base = mkdtempSync(join(tmpdir(), 'behind-'))
    const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, stdio: 'pipe' })
    git(base, 'init', '-q', '--bare', '-b', 'main', 'origin.git')
    git(base, 'clone', '-q', 'origin.git', 'writer')
    git(join(base, 'writer'), 'commit', '-q', '--allow-empty', '-m', 'one')
    git(join(base, 'writer'), 'push', '-q', 'origin', 'HEAD:main')
    git(base, 'clone', '-q', 'origin.git', 'reader')
    const reader = join(base, 'reader')
    expect(behindBy(reader)).toBe(0)
    git(join(base, 'writer'), 'commit', '-q', '--allow-empty', '-m', 'two')
    git(join(base, 'writer'), 'push', '-q', 'origin', 'HEAD:main')
    expect(behindBy(reader)).toBe(0)
    git(reader, 'fetch', '-q')
    expect(behindBy(reader)).toBe(1)
    expect(behindBy(tmpdir())).toBeNull()
    rmSync(base, { recursive: true, force: true })
  })
})
