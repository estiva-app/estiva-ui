import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { appFiles, createApp, themes } from './create-app'

/**
 * `create-estiva-app` (UIG-10). What the app does when it runs is proved on a
 * throwaway app (docs/GATES.md, UIG-10: building it); these hold what it is made
 * of, and that it is made from this package alone.
 */
const versions = { '@estiva-app/identity': '^0.2.2', 'eslint-plugin-react-hooks': '^7.0.1' }
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
        'src/config.ts', 'src/index.css', 'src/main.tsx', 'src/pages/HomePage.stories.tsx', 'src/pages/HomePage.tsx', 'src/vite-env.d.ts', 'tailwind.config.js',
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

  it('takes its tool versions from this package, and the two it does not use from what it is given', () => {
    const own = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
    const made = JSON.parse(files['package.json'])
    expect(made.dependencies['@estiva-app/ui']).toBe(`^${own.version}`)
    expect(made.devDependencies.vite).toBe(own.devDependencies.vite)
    expect(made.devDependencies.eslint).toBe(own.devDependencies.eslint)
    expect(made.dependencies['@estiva-app/identity']).toBe('^0.2.2')
  })

  it('refuses a name an app cannot have, a theme the package has not got, and a folder that exists', () => {
    expect(themes()).toEqual(expect.arrayContaining(['light', 'dark', 'signal', 'ship']))
    expect(() => appFiles({ name: 'Leaf', versions })).toThrow(/not a name/)
    expect(() => appFiles({ name: 'leaf', theme: 'purple', versions })).toThrow(/not one of the package's themes/)
    createApp({ name: 'once', parent: scratch, versions })
    expect(() => createApp({ name: 'once', parent: scratch, versions })).toThrow(/already exists/)
  })
})
