import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildAppRegistry } from '../registry/app'
import { validateRegistry } from '../registry/schema'
import { appChecks } from './app-checks'
import { appFiles, ASKED_OF_NPM, createApp, themes } from './create-app'
import { helpers, type GateHelpers } from './status'

/**
 * `create-estiva-app` (UIG-10). What the app does when it runs is proved on a
 * throwaway app (docs/GATES.md, UIG-10: building it); these hold what it is made
 * of, and that it is made from this package alone.
 */
const versions = {
  '@estiva-app/identity': '^0.2.2',
  '@estiva-app/interop': '^0.23.0',
  '@estiva-app/platform': '^0.1.0',
  '@estiva-app/protocol': '^0.21.0',
  'eslint-plugin-react-hooks': '^7.0.1',
}
const files = appFiles({ name: 'probe-app', title: 'Probe', theme: 'dark', versions })
const scratch = mkdtempSync(join(process.cwd(), 'node_modules', '.create-app-test-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

describe('create-estiva-app', () => {
  it('reads nothing but this package: no Peek, no Ship, no sibling checkout', () => {
    const source = readFileSync(new URL('./create-app.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\.\.\/(peek|ship)\b|GATES_PEEK|GATES_SHIP|K:[\\/]Estiva/)
  })

  it('makes the frame, the checks and the gates, each as a file that imports the package', () => {
    expect(Object.keys(files).sort()).toEqual(
      [
        '.claude/settings.json', '.claude/skills/estiva-ui/SKILL.md', '.env.example', '.gates-count.json', '.github/workflows/deploy.yml', '.gitignore', '.storybook/main.ts', '.storybook/preview.tsx',
        'CLAUDE.md', 'README.md', 'docs/GATES-DEBT.md', 'eslint.config.js', 'eslint.gates.config.js', 'eslint.tokens.config.js', 'index.html', 'package.json',
        'postcss.config.js', 'scripts/gates-checks.mjs', 'src/App.test.tsx', 'src/App.tsx', 'src/auth/AuthShell.tsx', 'src/auth/boot.ts', 'src/auth/estivaId.ts',
        'src/config.ts', 'src/index.css', 'src/main.tsx', 'src/pages/HomePage.stories.tsx', 'src/pages/HomePage.tsx',
        'src/relay/client.test.ts', 'src/relay/client.ts', 'src/relay/useRelayState.ts', 'src/vite-env.d.ts', 'tailwind.config.js',
        'tsconfig.app.json', 'tsconfig.json', 'tsconfig.node.json', 'vite.config.ts',
      ].sort(),
    )
    expect(files['eslint.gates.config.js']).toContain("from '@estiva-app/ui/gates'")
    expect(files['scripts/gates-checks.mjs']).toContain("appChecks(h, { page: 'src/pages/HomePage.tsx' })")
    expect(JSON.parse(files['.claude/settings.json']).hooks.PreToolUse[0].hooks[0].command).toBe('node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook')
    // The skill loads from the package's one copy: the app holds its trigger and the line that reads it (UIG-20).
    expect(JSON.parse(files['.claude/settings.json']).permissions.allow).toContain('Bash(npm run ui:find *)')
    expect(files['.claude/skills/estiva-ui/SKILL.md']).toContain('!`cat "${CLAUDE_PROJECT_DIR}/node_modules/@estiva-app/ui/skill/estiva-ui.md"`')
    expect(files['.claude/skills/estiva-ui/SKILL.md']).not.toContain('## Steps')
    // What loads into every session starts small and imports nothing (UIG-21).
    expect(files['CLAUDE.md'].replace(/\n$/, '').split('\n').length).toBeLessThan(200)
    expect(files['CLAUDE.md']).not.toMatch(/^@\S/m)
  })

  it('uses the sidebar frame and one theme, set on <html>', () => {
    expect(files['src/App.tsx']).toMatch(/<AppShell[\s\S]*<Sidebar>[\s\S]*<NavItem/)
    expect(files['src/App.tsx']).not.toContain('Rail')
    expect(files['index.html']).toContain('<html lang="en" data-theme="dark">')
    expect(files['.storybook/preview.tsx']).toContain('document.documentElement.dataset.theme = "dark"')
  })

  it('starts the count at zero and keeps the CI job named gate', () => {
    const count = JSON.parse(files['.gates-count.json'])
    expect(Object.values(count.rules)).toEqual([{ errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }])
    expect(files['.github/workflows/deploy.yml']).toMatch(/\n {2}gate:\n[\s\S]*npm run lint:rules/)
    expect(files['docs/GATES-DEBT.md']).toContain('Nothing.')
  })

  it('never points at the real Estiva ID by itself', () => {
    expect(files['.env.example']).toContain('VITE_ESTIVA_ID_ORIGIN=\n')
    expect(Object.values(files).join('\n')).not.toContain('id.estiva.app')
  })

  it('takes its tool versions from this package, and the ones it does not use from what it is given', () => {
    const own = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
    const made = JSON.parse(files['package.json'])
    expect(made.dependencies['@estiva-app/ui']).toBe(`^${own.version}`)
    expect(made.devDependencies.vite).toBe(own.devDependencies.vite)
    expect(made.devDependencies.eslint).toBe(own.devDependencies.eslint)
    expect(made.dependencies['@estiva-app/identity']).toBe('^0.2.2')
  })

  it('asks npm for exactly what this package does not use itself', () => {
    const own = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
    const made = JSON.parse(files['package.json'])
    const notOurs = [...Object.keys(made.dependencies), ...Object.keys(made.devDependencies)].filter((n) => n !== '@estiva-app/ui' && !own.devDependencies[n])
    expect(notOurs.sort()).toEqual(ASKED_OF_NPM.filter((n) => !own.devDependencies[n]).sort())
  })

  it('bakes in protocol, platform and interop', () => {
    const made = JSON.parse(files['package.json'])
    expect(made.dependencies['@estiva-app/protocol']).toBe('^0.21.0')
    expect(made.dependencies['@estiva-app/platform']).toBe('^0.1.0')
    expect(made.dependencies['@estiva-app/interop']).toBe('^0.23.0')
  })

  it('never points at the real relay by itself', () => {
    expect(files['.env.example']).toContain('VITE_RELAY_URL=\n')
    expect(files['src/config.ts']).toMatch(/export const RELAY_URL: string \| null = [^\n]*\|\| null/)
    expect(Object.values(files).join('\n')).not.toContain('estiva.estiva.app')
  })

  it('holds one relay client per tab, signs with the wrong-person check, and leaves KINDS blank', () => {
    const client = files['src/relay/client.ts']
    expect(client.match(/^const holder = createLiveClientHolder\(\)$/gm)).toHaveLength(1)
    expect(client).not.toMatch(/\bcreateLiveClient\(|\bcreateLiveRelay\(|new WebSocket\(/)
    expect(client).toContain('signViaEstivaId(unsigned, { base, token, expectedPubkey })')
    expect(client).toContain('export const KINDS: number[] = []')
    expect(client).toContain("subscriptionPrefix: 'probe-app-'")
    expect(files['src/relay/client.test.ts']).toContain('holds one connection per tab')
  })

  it('describes every part it writes, and refuses one without in the job gate (UIG-13)', () => {
    const made = mkdtempSync(join(scratch, 'described-'))
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(made, path)), { recursive: true })
      writeFileSync(join(made, path), text)
    }
    const registry = buildAppRegistry({ root: made })
    expect(validateRegistry(registry)).toEqual([])
    expect(registry.entries.map((entry) => `${entry.name}: ${entry.app?.class}`).sort()).toEqual(['App: one-off', 'AuthShell: one-off', 'HomePage: one-off'])
    expect(registry.filesWithoutParts.map((file) => file.file)).toEqual(['src/main.tsx'])
    const scripts = JSON.parse(files['package.json']).scripts
    expect(scripts).toMatchObject({ 'ui:find': 'estiva-ui find', registry: 'estiva-ui build', 'registry:check': 'estiva-ui check' })
    expect(files['.github/workflows/deploy.yml']).toMatch(/\n {2}gate:\n[\s\S]*npm run registry:check/)
    expect(files['.gitignore'].split('\n')).toContain('registry.json')
  })

  it("puts the page's empty state straight into the frame, with no box around it", () => {
    // EmptyState's own page: in a flex column (the frame's main) it takes the room left and
    // centres both ways "with nothing to add". A box around it placed it instead: 64px from
    // the top, from UIG-10 until 18 September, and no gate reads a box.
    const page = files['src/pages/HomePage.tsx']
    expect(page).toMatch(/return \(\n {4}<>\n {6}<EmptyState message="Nothing here yet\." \/>/)
    expect(page).not.toMatch(/py-16|justify-center|items-center/)
    expect(files['src/pages/HomePage.stories.tsx']).toContain('<div className="flex h-screen flex-col">')
  })

  it('shows the connection on the home page, with a story for each state', () => {
    expect(files['src/App.tsx']).toContain('<HomePage relay={RELAY_URL} state={relayState} name={me.name} />')
    expect(files['src/pages/HomePage.tsx']).toContain('Running alone')
    for (const story of ['RunningAlone', 'Connecting', 'Connected']) expect(files['src/pages/HomePage.stories.tsx']).toContain(`export const ${story}: Story`)
  })

  it('refuses a name an app cannot have, a theme the package has not got, and a folder that exists', () => {
    expect(themes()).toEqual(expect.arrayContaining(['light', 'dark', 'signal', 'ship']))
    expect(() => appFiles({ name: 'Leaf', versions })).toThrow(/not a name/)
    expect(() => appFiles({ name: 'leaf', theme: 'purple', versions })).toThrow(/not one of the package's themes/)
    createApp({ name: 'once', parent: scratch, versions })
    expect(() => createApp({ name: 'once', parent: scratch, versions })).toThrow(/already exists/)
  })
})

/**
 * The made app, checked the way gates:status checks Peek and Ship (audit B5).
 * The tests above pin the starter's files one by one; they could not see that
 * its required job `gate` skipped the token lint, which every app check since
 * 0.30.0 asks for. This runs every check an app runs on a freshly made app, for
 * real: the package is linked in as the app's install, and ESLint, TypeScript
 * and the plugins resolve from this repository's own, as they do for the gate
 * tests. Only what needs GitHub or a commit is left out.
 */
describe('a made app, under the checks every app runs', () => {
  it('passes every one on its first commit, but the tickets not built yet', async () => {
    const dir = join(scratch, 'checked')
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true })
      writeFileSync(join(dir, path), text)
    }
    mkdirSync(join(dir, 'node_modules', '@estiva-app'), { recursive: true })
    symlinkSync(process.cwd(), join(dir, 'node_modules', '@estiva-app', 'ui'), 'junction')
    // The one plugin the app asks npm for that this repository does not use: the
    // gate only needs its name known, so a stand-in with no rules does.
    const hooks = join(dir, 'node_modules', 'eslint-plugin-react-hooks')
    mkdirSync(hooks, { recursive: true })
    writeFileSync(join(hooks, 'package.json'), JSON.stringify({ name: 'eslint-plugin-react-hooks', type: 'module', main: 'index.js' }))
    writeFileSync(join(hooks, 'index.js'), 'export default { rules: {}, configs: { flat: { recommended: { rules: {} } } } }\n')
    // Its first commit, as the ticket asks: the count file must be committed.
    const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.autocrlf=false', ...a], { cwd: dir, stdio: 'pipe' })
    git('init', '-q', '-b', 'main')
    git('add', '-A')
    git('commit', '-q', '-m', 'made by create-estiva-app')
    const real = helpers(dir)
    const h: GateHelpers = { ...real, protectedBranch: () => real.UNKNOWN('a rule on GitHub'), gh: () => real.UNKNOWN('a question for GitHub') }
    const failed: string[] = []
    for (const ticket of appChecks(h, { page: 'src/pages/HomePage.tsx' })) {
      for (const check of ticket.checks) {
        const result = await check.run()
        if (result.result === 'fail' || result.result === 'part') failed.push(`${ticket.ref} ${check.what}: ${result.detail}`)
      }
    }
    // RichText is UIG-30's, not built yet: no app passes that one.
    expect(failed.filter((f) => !f.startsWith('UIG-30 '))).toEqual([])
  }, 300_000)
})
