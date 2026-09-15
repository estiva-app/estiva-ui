import { readFileSync } from 'node:fs'
import { ESLint, type Linter } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import estiva, { countGates, PLUGIN_KEY } from './index'

/**
 * The plugin as an app uses it: a flat config with `configs.recommended`,
 * linting text the way Peek's editor hook does (`lintText`). The rule's own
 * cases are in no-raw-button.test.ts.
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

  it('has no-raw-button, and both configs switch it on as an error under estiva/', () => {
    expect(Object.keys(estiva.rules)).toEqual(['no-raw-button'])
    for (const config of [estiva.configs.recommended, estiva.configs.strict]) {
      expect(config.plugins?.[PLUGIN_KEY]).toBe(estiva)
      expect(config.rules).toEqual({ 'estiva/no-raw-button': 'error' })
    }
  })
})

describe('an app lint with configs.recommended', () => {
  it('reports a raw <button>, naming Button', async () => {
    const [result] = await lint(component('    <button type="button">x</button>'))
    expect(result.messages.map((m) => [m.ruleId, m.severity, m.message])).toEqual([
      ['estiva/no-raw-button', 2, 'Use `Button` from @estiva-app/ui instead of a raw <button>.'],
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
    expect(countGates(await lint(code)).rules).toEqual({ 'estiva/no-raw-button': { errors: 1, warnings: 0, escapes: 0 } })
    expect(countGates(await lint(code, [countMode])).rules).toEqual({ 'estiva/no-raw-button': { errors: 1, warnings: 0, escapes: 1 } })
  })

  it('lists a report an eslint-disable silenced, and counts it as neither an error nor an escape', async () => {
    const results = await lint(component('    // eslint-disable-next-line estiva/no-raw-button\n    <button>x</button>'), [countMode])
    const count = countGates(results)
    expect(count.rules['estiva/no-raw-button']).toEqual({ errors: 0, warnings: 0, escapes: 0 })
    expect(count.disabled).toEqual([{ filePath: results[0].filePath, line: 4, ruleId: 'estiva/no-raw-button' }])
  })

  it('counts a marker inside that directive as an error of the rule', async () => {
    const results = await lint(component('    // eslint-disable-next-line estiva/no-raw-button -- @estiva-escape: a preview drawn from its own palette\n    <button>x</button>'), [countMode])
    const count = countGates(results)
    expect(count.rules['estiva/no-raw-button']).toEqual({ errors: 1, warnings: 0, escapes: 0 })
    expect(count.disabled).toHaveLength(1)
  })

  it('lists every rule of the plugin, even with nothing found', () => {
    expect(countGates([])).toEqual({ rules: { 'estiva/no-raw-button': { errors: 0, warnings: 0, escapes: 0 } }, disabled: [] })
  })
})
