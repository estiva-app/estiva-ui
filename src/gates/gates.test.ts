import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ESLint, type Linter } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import { writeGateCount } from './count'
import { gateConfig, gateLint } from './gate-config'
import { runHook } from './hook'
import { behindMain, helpers, runStatus } from './status'
import { tokenConfig, tokenLint, tokenValues } from './token-lint'

/**
 * The gate pieces, as an app and this package use them (UIG-10, docs/GATES.md
 * §23). Their equality with what Peek, Ship and this package ran before the
 * move was proved by comparing the configs and every lint message; these tests
 * hold the behaviour from here on.
 *
 * A config *file* is needed where ESLint loads one (the count, the hook): it
 * imports the built `dist/gates`, which `npm test` builds first (`pretest`):
 * the release job runs the tests with no lint before them. The app folder sits inside this repository, so it resolves ESLint and
 * the plugins from this repository's `node_modules`, as an app resolves its own.
 */
const root = process.cwd()
const built = pathToFileURL(join(root, 'dist', 'gates', 'index.js')).href
const scratch = mkdtempSync(join(root, 'node_modules', '.gates-test-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

function app(name: string, files: Record<string, string>) {
  const dir = join(scratch, name)
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, private: true, type: 'module' }))
  writeFileSync(join(dir, 'eslint.gates.config.js'), `import { gateConfig } from '${built}'\nexport default gateConfig()\n`)
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true })
    writeFileSync(join(dir, rel), text)
  }
  return dir
}

async function lintWith(config: Linter.Config[], code: string, filePath: string) {
  const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: config })
  const [result] = await eslint.lintText(code, { filePath: join(root, filePath) })
  return result.messages
}

const component = (body: string) => `export function Probe() {\n  return ${body}\n}\n`
/** A line TypeScript's own lint writes: Peek PR #324 failed the token lint on it (UIG-37). */
const typescriptDirective = '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport const probe: any = 1\n'

describe('tokenLint and tokenValues', () => {
  it('refuse a hand-written text size and name the token, in the words for an app', async () => {
    const messages = await lintWith([tokenLint(), tokenValues()], component('<div className="text-[14px]">x</div>'), 'src/Probe.tsx')
    const error = messages.find((m) => m.ruleId === 'token-values/no-restricted-classes')
    expect(error?.severity).toBe(2)
    expect(error?.message).toContain('text-body-2')
  })

  it('speak to the package when the package runs them', async () => {
    const app = await lintWith([tokenLint(), tokenValues()], component('<div className="bg-gray-100 rounded-[3px]">x</div>'), 'src/Probe.tsx')
    const pkg = await lintWith([tokenLint({ audience: 'package' }), tokenValues({ audience: 'package' })], component('<div className="bg-gray-100 rounded-[3px]">x</div>'), 'src/Probe.tsx')
    expect(app.map((m) => m.message).join('\n')).toContain('from the package')
    expect(pkg.map((m) => m.message).join('\n')).toContain('tailwind-preset.js')
    expect(pkg.map((m) => m.ruleId)).toEqual(app.map((m) => m.ruleId))
  })

  it('report a hand-written height as a warning, never an error', async () => {
    const messages = await lintWith([tokenLint(), tokenValues()], component('<div className="h-[240px]">x</div>'), 'src/Probe.tsx')
    expect(messages.filter((m) => m.ruleId?.startsWith('token-'))).toEqual([expect.objectContaining({ ruleId: 'token-spacing/no-restricted-classes', severity: 1 })])
  })

  it('refuse a plain tailwind-merge and name cn(), for an app and for the package (UIG-21)', async () => {
    const code = "import { twMerge } from 'tailwind-merge'\nexport const merged = twMerge('p-2', 'p-3')\n"
    const app = await lintWith([tokenLint(), tokenValues()], code, 'src/lib/probe.ts')
    expect(app).toEqual([expect.objectContaining({ ruleId: 'no-restricted-imports', severity: 2, message: expect.stringContaining("package's cn()") })])
    const pkg = await lintWith([tokenLint({ audience: 'package' })], code, 'src/probe.ts')
    expect(pkg).toEqual([expect.objectContaining({ ruleId: 'no-restricted-imports', message: expect.stringContaining('src/cn.ts') })])
    expect(await lintWith([tokenLint()], "import { cn } from '@estiva-app/ui'\nexport const merged = cn('p-2', 'p-3')\n", 'src/lib/probe.ts')).toEqual([])
  })

  it('leave a test file to its test', async () => {
    const messages = await lintWith([tokenLint(), tokenValues()], component('<div style={{ color: "red" }}>x</div>'), 'src/Probe.test.tsx')
    expect(messages.filter((m) => m.severity === 2)).toEqual([])
  })
})

describe('gateConfig', () => {
  it('refuses a raw button in an app, in a .tsx and in a story, naming Button', async () => {
    for (const file of ['src/Probe.tsx', 'src/stories/Probe.stories.tsx']) {
      const messages = await lintWith(gateConfig(), component('<button type="button">x</button>'), file)
      expect(messages).toEqual([expect.objectContaining({ ruleId: 'estiva/no-raw-element', severity: 2, message: expect.stringContaining('Button') })])
    }
  })

  it('reads .ts for an app (UIG-8), and .tsx only for the package', async () => {
    const listener = "export function listen() {\n  window.addEventListener('keydown', () => {})\n}\n"
    expect(await lintWith(gateConfig(), listener, 'src/lib/probe.ts')).toEqual([expect.objectContaining({ ruleId: 'estiva/no-rebuilt-behaviour' })])
    expect(gateLint({ audience: 'package' }).files).toEqual(['src/**/*.tsx'])
  })

  it('leaves tests alone', async () => {
    const messages = await lintWith(gateConfig(), component('<button type="button">x</button>'), 'src/Probe.test.tsx')
    expect(messages.filter((m) => m.ruleId)).toEqual([])
  })

  it('knows the token lint and quiet plugins, so their directives do not break the gate', async () => {
    const code = `// eslint-disable-next-line token-values/no-restricted-classes -- @estiva-escape: a size the probe keeps on purpose\n${component('<div className="text-[14px]">x</div>')}`
    expect(await lintWith(gateConfig(), code, 'src/Probe.tsx')).toEqual([])
    const quiet = { rules: { 'some-rule': { create: () => ({}) } } }
    const directive = `// eslint-disable-next-line house/some-rule\n${component('<div>x</div>')}`
    expect(await lintWith(gateConfig({ quiet: { house: quiet } }), directive, 'src/Probe.tsx')).toEqual([])
  })

  it("knows TypeScript's rule names, so a TypeScript directive does not break the gate (UIG-37)", async () => {
    expect(await lintWith(gateConfig(), typescriptDirective, 'src/lib/probe.ts')).toEqual([])
    // An app that names the plugin itself, from its own copy, still loads: its copy wins.
    const own = { rules: { 'no-explicit-any': { create: () => ({}) } } }
    expect(await lintWith(gateConfig({ quiet: { '@typescript-eslint': own } }), typescriptDirective, 'src/lib/probe.ts')).toEqual([])
  })
})

describe('tokenConfig', () => {
  it('runs the token contract on its own: the same messages as the two pieces, for an app and for the package', async () => {
    const code = component('<div className="bg-gray-100 rounded-[3px]">x</div>')
    const app = await lintWith(tokenConfig(), code, 'src/Probe.tsx')
    expect(app.length).toBeGreaterThan(0)
    expect(app).toEqual(await lintWith([tokenLint(), tokenValues()], code, 'src/Probe.tsx'))
    const pkg = await lintWith(tokenConfig({ audience: 'package' }), code, 'src/Probe.tsx')
    expect(pkg).toEqual(await lintWith([tokenLint({ audience: 'package' }), tokenValues({ audience: 'package' })], code, 'src/Probe.tsx'))
  })

  it("knows TypeScript's rule names and the quiet plugins, so their directives do not break it (UIG-37)", async () => {
    expect(await lintWith(tokenConfig(), typescriptDirective, 'src/lib/probe.ts')).toEqual([])
    const quiet = { rules: { 'some-rule': { create: () => ({}) } } }
    const directive = `// eslint-disable-next-line house/some-rule\n${component('<div>x</div>')}`
    expect(await lintWith(tokenConfig({ quiet: { house: quiet } }), directive, 'src/Probe.tsx')).toEqual([])
  })

  it('never reads build output, nor a folder the app names', async () => {
    const hand = component('<div className="text-[14px]">x</div>')
    const ignored = (messages: Linter.LintMessage[]) => messages.every((m) => !m.ruleId)
    expect(ignored(await lintWith(tokenConfig(), hand, 'dist/Probe.tsx'))).toBe(true)
    expect(ignored(await lintWith(tokenConfig({ ignores: ['demo'] }), hand, 'demo/Probe.tsx'))).toBe(true)
  })
})

describe('writeGateCount', () => {
  it('writes the count once, leaves it alone when nothing changed, and fails on a rule switched off', async () => {
    const dir = app('count', {
      'src/Kept.tsx': component('(\n    // @estiva-escape: a probe that keeps its element on purpose\n    <form />\n  )'),
    })
    const first = await writeGateCount({ root: dir, repo: 'probe' })
    expect(first.changed).toBe(true)
    const written = JSON.parse(readFileSync(join(dir, '.gates-count.json'), 'utf8'))
    expect(written).toMatchObject({ schemaVersion: 1, repo: 'probe' })
    expect(written.rules['estiva/no-raw-element']).toEqual({ errors: 0, warnings: 0, escapes: 1 })
    expect(Object.keys(written.rules)).toEqual(['estiva/no-raw-element', 'estiva/no-rebuilt-behaviour', 'estiva/no-restyled-part', 'estiva/no-handmade-header', 'estiva/no-handmade-empty-state', 'estiva/no-native-title', 'estiva/no-copied-look'])

    expect((await writeGateCount({ root: dir, repo: 'probe' })).changed).toBe(false)

    writeFileSync(join(dir, 'src', 'Off.tsx'), 'export function Probe() {\n  // eslint-disable-next-line estiva/no-raw-element\n  return <form />\n}\n')
    const off = await writeGateCount({ root: dir, repo: 'probe' })
    expect(off.failures.join('\n')).toContain('src/Off.tsx:3  estiva/no-raw-element'.replace('/', process.platform === 'win32' ? '\\' : '/'))
  })
})

describe('runHook', () => {
  const dir = app('hook', { 'src/Page.tsx': 'export function Page() {\n  return <div>x</div>\n}\n' })
  const write = (file_path: string, content: string) => ({ tool_name: 'Write', tool_input: { file_path, content } })

  it('refuses a raw button with exit 2 and the message naming Button', async () => {
    const result = await runHook({ root: dir, input: write('src/Probe.tsx', component('<button type="button">x</button>')) })
    expect(result.code).toBe(2)
    expect(result.message).toContain('src/Probe.tsx was not written: the UI Guardrails refuse it (eslint.gates.config.js).')
    expect(result.message).toContain('Button')
  })

  it('applies an Edit to the file on disk before judging it', async () => {
    const edit = { tool_name: 'Edit', tool_input: { file_path: 'src/Page.tsx', old_string: '<div>x</div>', new_string: '<a href="/x">x</a>' } }
    expect((await runHook({ root: dir, input: edit })).code).toBe(2)
    const fine = { tool_name: 'Edit', tool_input: { file_path: 'src/Page.tsx', old_string: '<div>x</div>', new_string: '<div>y</div>' } }
    expect((await runHook({ root: dir, input: fine })).code).toBe(0)
  })

  it('lets through a test, a declaration file, and anything outside src', async () => {
    for (const path of ['src/Probe.test.tsx', 'src/types.d.ts', 'scripts/probe.tsx']) {
      expect((await runHook({ root: dir, input: write(path, component('<button type="button">x</button>')) })).code).toBe(0)
    }
  })

  it('stops a new part once with what already exists, then lets it through (UIG-20)', async () => {
    const seen = mkdtempSync(join(scratch, 'seen-'))
    const input = { ...write('src/PanelHeader.tsx', 'export function PanelHeader() {\n  return <div>x</div>\n}\n'), session_id: 'one' }
    const first = await runHook({ root: dir, input, seen })
    expect(first.code).toBe(2)
    expect(first.message).toContain('src/PanelHeader.tsx was not written yet: it adds a new part, PanelHeader.')
    expect(first.message).toContain('What already exists for "panel header"')
    expect(first.message).toContain('ContainerHeader')
    expect((await runHook({ root: dir, input, seen })).code).toBe(0)
    // Another session is asked again.
    expect((await runHook({ root: dir, input: { ...input, session_id: 'two' }, seen })).code).toBe(2)
    // The search reads every app beside this checkout: seconds on a machine that holds them all.
  }, 60_000)

  it('does not stop a file already there, a story, or a file that draws nothing', async () => {
    const seen = mkdtempSync(join(scratch, 'seen-'))
    for (const input of [
      write('src/Page.tsx', 'export function Page() {\n  return <div>y</div>\n}\n'),
      write('src/Panel.stories.tsx', 'export const Default = () => <div>x</div>\n'),
      write('src/format.tsx', 'export function formatDate(date: Date) {\n  return date.toISOString()\n}\n'),
    ]) {
      expect((await runHook({ root: dir, input, seen })).code).toBe(0)
    }
  })

  it('finds the app in a folder of its own, as Ship keeps it in web/', async () => {
    const top = join(scratch, 'top')
    mkdirSync(top, { recursive: true })
    const web = app('top/web', {})
    expect(web).toBe(join(top, 'web'))
    const result = await runHook({ root: top, app: 'web', input: write('web/src/Probe.tsx', component('<button type="button">x</button>')) })
    expect(result.code).toBe(2)
    expect(result.message).toContain('web/src/Probe.tsx was not written: the UI Guardrails refuse it (web/eslint.gates.config.js).')
  })
})

describe('gates:status', () => {
  it('reads a CI job by its id, a committed hook, and a script', () => {
    const dir = app('status-helpers', {
      '.github/workflows/deploy.yml': 'jobs:\n  check:\n    steps:\n      - run: npm test\n  gate:\n    steps:\n      # - run: npm run lint:rules\n      - run: npm run lint:rules\n',
      '.claude/settings.json': JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook' }] }] } }),
    })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'status-helpers', scripts: { 'gates:status': 'estiva-gates status' } }))
    const h = helpers(dir)
    expect(h.ciJob('gate', 'lint:rules').result).toBe('pass')
    expect(h.ciJob('check', 'lint:rules').result).toBe('fail')
    expect(h.script('package.json', 'gates:status').result).toBe('pass')
  })

  // Audit A2: a hook is judged by running it, the way Claude Code does, on a raw
  // <button>. Only exit 2 blocks a write; a hook that cannot run exits 1, and
  // the write goes through.
  it('runs the committed hook and passes only when it refuses the write', () => {
    const settings = (matcher: string, command: string) => ({ '.claude/settings.json': JSON.stringify({ hooks: { PreToolUse: [{ matcher, hooks: [{ type: 'command', command }] }] } }) })
    const refuses = 'node -e "console.error(String.fromCharCode(60) + \'button\' + String.fromCharCode(62)); process.exit(2)" -- gates'
    expect(helpers(app('hook-refuses', settings('Edit|Write', refuses))).hook('.claude/settings.json', 'gates')).toMatchObject({ result: 'pass' })
    const broken = helpers(app('hook-broken', settings('Edit|Write', 'node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook'))).hook('.claude/settings.json', 'gates')
    expect(broken).toMatchObject({ result: 'fail', detail: expect.stringContaining('let a raw <button> through (exit 1)') })
    expect(helpers(app('hook-waves', settings('Edit|Write', 'node -e "process.exit(0)" -- gates'))).hook('.claude/settings.json', 'gates')).toMatchObject({ result: 'fail' })
    expect(helpers(app('hook-never', settings('Read', refuses))).hook('.claude/settings.json', 'gates')).toMatchObject({ result: 'fail', detail: expect.stringContaining('never for a Write') })
    // The hook is handed the real project folder, as Claude Code hands it.
    const seen = 'node -e "console.error(String.fromCharCode(60) + \'button\' + String.fromCharCode(62)); process.exit(String(process.env.CLAUDE_PROJECT_DIR).endsWith(process.argv[1]) ? 2 : 1)" hook-dir gates'
    // Exit 2 for another reason is not a refusal of the button (in the package a new file with no page is refused too).
    const other = 'node -e "console.error(String.fromCharCode(110) + \'o page\'); process.exit(2)" -- gates'
    expect(helpers(app('hook-other', settings('Edit|Write', other))).hook('.claude/settings.json', 'gates')).toMatchObject({ result: 'fail' })
    expect(helpers(app('hook-dir', settings('Edit|Write', seen))).hook('.claude/settings.json', 'gates')).toMatchObject({ result: 'pass' })
  })

  // Audit A4: a checkout seven commits behind reported a finished ticket as not started.
  it('says how far a checkout is behind main, after fetching it', () => {
    const base = app('behind', {})
    const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, stdio: 'pipe' }).toString().trim()
    git(base, 'init', '-q', '--bare', '-b', 'main', 'origin.git')
    git(base, 'clone', '-q', 'origin.git', 'writer')
    const writer = join(base, 'writer')
    git(writer, 'commit', '-q', '--allow-empty', '-m', 'one')
    git(writer, 'push', '-q', 'origin', 'HEAD:main')
    git(base, 'clone', '-q', 'origin.git', 'reader')
    const reader = join(base, 'reader')
    expect(behindMain(reader)).toBe('')
    git(writer, 'commit', '-q', '--allow-empty', '-m', 'two')
    git(writer, 'push', '-q', 'origin', 'HEAD:main')
    expect(behindMain(reader)).toContain('1 commit behind origin/main')
  })

  it('counts what loads into every session, imports included, and refuses a rule file with no paths (UIG-21)', () => {
    const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`).join('\n') + '\n'
    const scoped = '---\npaths:\n  - "src/**"\n---\n\nA rule.\n'
    const small = helpers(app('instructions-small', { 'CLAUDE.md': lines(40), '.claude/rules/ui.md': scoped }))
    expect(small.instructions(200)).toMatchObject({ result: 'pass', detail: expect.stringContaining('40 lines') })
    // 150 + 60 = 210: CLAUDE.md alone is under the limit, and its import takes it over.
    const imported = helpers(app('instructions-import', { 'CLAUDE.md': `${lines(149)}@RULES.md\n`, 'RULES.md': lines(60) }))
    expect(imported.instructions(200)).toMatchObject({ result: 'fail', detail: expect.stringContaining('210 lines') })
    const unscoped = helpers(app('instructions-unscoped', { 'CLAUDE.md': lines(10), '.claude/rules/ui.md': scoped, '.claude/rules/all.md': 'Loads every time.\n' }))
    expect(unscoped.instructions(200)).toMatchObject({ result: 'fail', detail: expect.stringContaining('.claude/rules/all.md') })
  })

  it('prints a repo on its own: its own rows, then its parts', async () => {
    const dir = app('status-run', {
      'scripts/gates-checks.mjs': "export default (h) => ({ repo: 'probe', tickets: [\n  { ref: 'UIG-2', title: 'Rails', owner: false, checks: [{ what: 'wired', run: () => h.PASS('yes') }] },\n  { ref: 'UIG-9', title: 'Allow-list', owner: false, checks: [{ what: 'a look is refused', run: () => h.FAIL('no') }] },\n] })\n",
    })
    const out = await runStatus({ root: dir })
    expect(out).toContain('Tickets probe owns (0):')
    expect(out).toContain('✅  UIG-2')
    expect(out).toContain('⬜  UIG-9')
    const json = JSON.parse(await runStatus({ root: dir, json: true }))
    expect(json.engine).toMatch(/^@estiva-app\/ui@\d+\.\d+\.\d+$/)
  })

  it('finds the checks file beside the app, and still reads the repo from its top (Ship, UIG-32)', async () => {
    // The checks file sits in `web/`, where the install is; what it names is read from the top folder.
    const top = join(scratch, 'status-web')
    mkdirSync(join(top, 'web', 'scripts'), { recursive: true })
    writeFileSync(join(top, 'package.json'), JSON.stringify({ name: 'status-web', scripts: { 'gates:status': 'node web/node_modules/@estiva-app/ui/dist/gates/cli.js status --app web' } }))
    writeFileSync(join(top, 'web', 'scripts', 'gates-checks.mjs'), "export default (h) => ({ repo: 'shipish', tickets: [\n  { ref: 'UIG-4', title: 'The chain', owner: true, checks: [{ what: 'the top folder is read', run: () => h.script('package.json', 'gates:status') }] },\n] })\n")
    const out = await runStatus({ root: top, app: 'web' })
    expect(out).toContain('Tickets shipish owns (1):')
    expect(out).toContain('✅  UIG-4')
  })
})
