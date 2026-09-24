import { readFileSync } from 'node:fs'
import { ESLint, type Linter } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import estiva, { APP_RULE_IDS, countGates, PACKAGE_RULE_IDS, PLUGIN_KEY } from './index'

/**
 * The plugin as an app uses it: a flat config with `configs.recommended`,
 * linting text the way Peek's editor hook does (`lintText`). The rules' own
 * cases are in no-raw-element.test.ts and no-rebuilt-behaviour.test.ts.
 */
const tsx: Linter.Config = {
  files: ['**/*.tsx'],
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
}

async function lint(code: string, extra: Linter.Config[] = []) {
  const eslint = new ESLint({
    cwd: process.cwd(),
    overrideConfigFile: true,
    overrideConfig: [tsx, estiva.configs.recommended, ...extra],
  })
  return eslint.lintText(code, { filePath: 'src/Probe.tsx' })
}

const component = (body: string) => `export function Probe() {\n  return (\n${body}\n  )\n}\n`
const countMode: Linter.Config = { settings: { estiva: { reportEscapes: true } } }

describe('the plugin object', () => {
  it('names itself and carries the package version', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
    expect(estiva.meta).toEqual({ name: '@estiva-app/ui/eslint', version: pkg.version })
  })

  it('carries every rule, the app ones and the inward ones', () => {
    expect(Object.keys(estiva.rules)).toEqual([
      'no-raw-element',
      'no-rebuilt-behaviour',
      'no-restyled-part',
      'no-handmade-header',
      'no-handmade-empty-state',
      'raw-element-outside-a-wrapper',
      'no-hand-rolled-behaviour',
      'component-has-a-page',
      'component-has-a-story',
    ])
  })

  /**
   * The apps spread `recommended`. A rule added for the package (UIG-5) must not
   * arrive in Peek or Ship with the next version bump: an app's components are
   * not primitives, so "buried inside a component" means nothing there
   * (`no-raw-element` is the app's version, UIG-7), and an app has no `.mdx`
   * pages at all. This is
   * the test that holds that line — if you add an app-facing rule on purpose,
   * change it deliberately, here.
   */
  it('gives an app only the app rules, as errors, under estiva/', () => {
    for (const config of [estiva.configs.recommended, estiva.configs.strict]) {
      expect(config.plugins?.[PLUGIN_KEY]).toBe(estiva)
      expect(config.rules).toEqual({ 'estiva/no-raw-element': 'error', 'estiva/no-rebuilt-behaviour': 'error', 'estiva/no-restyled-part': 'error', 'estiva/no-handmade-header': 'error', 'estiva/no-handmade-empty-state': 'error' })
    }
    expect(APP_RULE_IDS).toEqual(['estiva/no-raw-element', 'estiva/no-rebuilt-behaviour', 'estiva/no-restyled-part', 'estiva/no-handmade-header', 'estiva/no-handmade-empty-state'])
  })

  /**
   * `no-restyled-part` (UIG-9), `no-handmade-header` (UIG-22) and
   * `no-handmade-empty-state` (UIG-23) are in both sets: the package restyles
   * none of its own parts either (Katerina, 17 September), and draws no header
   * bar or empty state by hand ("my review isn't enough", 23 September). Every
   * other inward rule still reaches no app.
   */
  it('gives this package its own set, as errors, and only the shared rules reach an app config', () => {
    expect(estiva.configs.package.plugins?.[PLUGIN_KEY]).toBe(estiva)
    expect(estiva.configs.package.rules).toEqual({
      'estiva/raw-element-outside-a-wrapper': 'error',
      'estiva/no-hand-rolled-behaviour': 'error',
      'estiva/component-has-a-page': 'error',
      'estiva/component-has-a-story': 'error',
      'estiva/no-restyled-part': 'error',
      'estiva/no-handmade-header': 'error',
      'estiva/no-handmade-empty-state': 'error',
    })
    expect(PACKAGE_RULE_IDS).toEqual(Object.keys(estiva.configs.package.rules ?? {}))
    for (const id of PACKAGE_RULE_IDS.filter((id) => !['estiva/no-restyled-part', 'estiva/no-handmade-header', 'estiva/no-handmade-empty-state'].includes(id))) {
      expect(estiva.configs.recommended.rules?.[id]).toBeUndefined()
      expect(estiva.configs.strict.rules?.[id]).toBeUndefined()
    }
  })
})

describe('an app lint with configs.recommended', () => {
  it('reports a raw <button>, naming Button', async () => {
    const [result] = await lint(component('    <button type="button">x</button>'))
    expect(result.messages.map((m) => [m.ruleId, m.severity, m.message])).toEqual([
      ['estiva/no-raw-element', 2, 'Use `Button` from @estiva-app/ui instead of a raw <button>.'],
    ])
  })

  it('reports a raw <a>, naming Link', async () => {
    const [result] = await lint(component('    <a href="/x">x</a>'))
    expect(result.messages.map((m) => [m.ruleId, m.severity, m.message])).toEqual([
      ['estiva/no-raw-element', 2, 'Use `Link` from @estiva-app/ui instead of a raw <a>. For a chip, `InlineChip`; for a whole card, `Card` with `href`.'],
    ])
  })

  it('reports behaviour rebuilt by hand, naming the part', async () => {
    const [result] = await lint(component('    <div className="h-64 overflow-y-auto" />'))
    expect(result.messages.map((m) => [m.ruleId, m.severity, m.message])).toEqual([
      ['estiva/no-rebuilt-behaviour', 2, "`overflow-y-auto` scrolls with the browser's scrollbar. Use `ScrollArea` from @estiva-app/ui, which draws ours."],
    ])
  })

  /**
   * UIG-8's acceptance: a separator inside Divider is not a hand-written role.
   * The package is exempt from the apps' rules; this runs them on Divider anyway,
   * to show the role branch has nothing to say there (its Base UI import is the
   * package's job, and reported only because the apps' config is not meant for it).
   */
  it("finds no hand-written role in Divider's own source", async () => {
    const source = readFileSync(new URL('../Divider.tsx', import.meta.url), 'utf8')
    const [result] = await lint(source)
    expect(result.messages.filter((m) => m.messageId === 'role' || m.messageId === 'roleNoPart')).toEqual([])
  })

  /**
   * The probe is linted inside this package's folder, so its part is a sibling
   * (`./Link`), the way the package's own files import one; in an app the same
   * rule reads an import from `@estiva-app/ui` (no-restyled-part.test.ts).
   */
  it('reports a part restyled, naming its look props', async () => {
    const [result] = await lint(`import { Link } from './Link'\n${component('    <Link href="/x" className="mt-2 text-h2">x</Link>')}`)
    expect(result.messages.map((m) => [m.ruleId, m.severity, m.message])).toEqual([
      [
        'estiva/no-restyled-part',
        2,
        '`text-h2` on `Link` changes how it looks. A part of @estiva-app/ui is placed from outside, never restyled: only space, size, flex and grid, and position pass in. Use its `variant` or `truncate`. A look for what is around it goes on your own element around it.',
      ],
    ])
  })

  it('passes the same element under an escape', async () => {
    const [result] = await lint(component('    // @estiva-escape: a preview drawn from its own palette\n    <button type="button">x</button>'))
    expect(result.messages).toEqual([])
  })
})

describe('countGates', () => {
  it('counts an error, and an escape only when the lint reports escapes', async () => {
    const code = component('    <div>\n      <button>x</button>\n      {/* @estiva-escape: a preview drawn from its own palette */}\n      <button>y</button>\n    </div>')
    const none = { errors: 0, warnings: 0, escapes: 0 }
    expect(countGates(await lint(code)).rules).toEqual({ 'estiva/no-raw-element': { errors: 1, warnings: 0, escapes: 0 }, 'estiva/no-rebuilt-behaviour': none, 'estiva/no-restyled-part': none, 'estiva/no-handmade-header': none, 'estiva/no-handmade-empty-state': none })
    expect(countGates(await lint(code, [countMode])).rules).toEqual({ 'estiva/no-raw-element': { errors: 1, warnings: 0, escapes: 1 }, 'estiva/no-rebuilt-behaviour': none, 'estiva/no-restyled-part': none, 'estiva/no-handmade-header': none, 'estiva/no-handmade-empty-state': none })
  })

  it('lists a report an eslint-disable silenced, and counts it as neither an error nor an escape', async () => {
    const results = await lint(component('    // eslint-disable-next-line estiva/no-raw-element\n    <button>x</button>'), [countMode])
    const count = countGates(results)
    expect(count.rules['estiva/no-raw-element']).toEqual({ errors: 0, warnings: 0, escapes: 0 })
    expect(count.disabled).toEqual([{ filePath: results[0].filePath, line: 4, ruleId: 'estiva/no-raw-element' }])
  })

  it('counts a marker inside that directive as an error of the rule', async () => {
    const results = await lint(component('    // eslint-disable-next-line estiva/no-raw-element -- @estiva-escape: a preview drawn from its own palette\n    <button>x</button>'), [countMode])
    const count = countGates(results)
    expect(count.rules['estiva/no-raw-element']).toEqual({ errors: 1, warnings: 0, escapes: 0 })
    expect(count.disabled).toHaveLength(1)
  })

  it('lists every rule of the plugin, even with nothing found', () => {
    expect(countGates([])).toEqual({
      rules: { 'estiva/no-raw-element': { errors: 0, warnings: 0, escapes: 0 }, 'estiva/no-rebuilt-behaviour': { errors: 0, warnings: 0, escapes: 0 },
        'estiva/no-restyled-part': { errors: 0, warnings: 0, escapes: 0 },
        'estiva/no-handmade-header': { errors: 0, warnings: 0, escapes: 0 },
        'estiva/no-handmade-empty-state': { errors: 0, warnings: 0, escapes: 0 },
      },
      disabled: [],
    })
  })
})
