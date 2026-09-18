import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { appFiles, ASKED_OF_NPM, createApp, themes } from './create-app'

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
        '.claude/settings.json', '.env.example', '.gates-count.json', '.github/workflows/deploy.yml', '.gitignore', '.storybook/main.ts', '.storybook/preview.tsx',
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
  })

  it('uses the sidebar frame and one theme, set on <html>', () => {
    expect(files['src/App.tsx']).toMatch(/<AppShell[\s\S]*<Sidebar>[\s\S]*<NavItem/)
    expect(files['src/App.tsx']).not.toContain('Rail')
    expect(files['index.html']).toContain('<html lang="en" data-theme="dark">')
    expect(files['.storybook/preview.tsx']).toContain('document.documentElement.dataset.theme = "dark"')
  })

  it('starts the count at zero and keeps the CI job named gate', () => {
    const count = JSON.parse(files['.gates-count.json'])
    expect(Object.values(count.rules)).toEqual([{ errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }, { errors: 0, warnings: 0, escapes: 0 }])
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
