/// <reference types="node" />
/**
 * UIG-20: the skill's text, held to what it points at.
 *
 * The skill names the package's parts and props. Renaming one would leave the
 * skill sending sessions to something that is not there, so every part it names
 * is checked against the catalogue. Its Gotchas stand for recorded defects,
 * reconciled in `docs/GATES-SKILL.md`; that table has to keep adding up.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Registry } from './schema'
import { loaderText, SKILL_DESCRIPTION } from './skill'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const text = readFileSync(join(repoRoot, 'skill', 'estiva-ui.md'), 'utf8').replace(/\r\n/g, '\n')
const registry = JSON.parse(readFileSync(join(repoRoot, 'registry.json'), 'utf8')) as Registry
const byName = new Map(registry.entries.map((entry) => [entry.name, entry]))
const record = readFileSync(join(repoRoot, 'docs', 'GATES-SKILL.md'), 'utf8').replace(/\r\n/g, '\n')

describe('the skill', () => {
  it('has the four parts, stays short, and fits Claude Code’s description limit', () => {
    expect(text).toMatch(/^# /)
    for (const heading of ['## When this applies', '## Steps, in order', '## Gotchas']) expect(text).toContain(heading)
    expect(text.split('\n').length).toBeLessThan(200)
    expect(SKILL_DESCRIPTION.length).toBeLessThanOrEqual(1536)
    expect(text).toMatch(/1\. \*\*Search before creating anything\.\*\* Run\n {3}`npm run ui:find/)
  })

  it('names only parts the package has', () => {
    const named = [...new Set([...text.matchAll(/`([A-Z][A-Za-z]+)`/g)].map((m) => m[1]))]
    expect(named.length).toBeGreaterThan(20)
    expect(named.filter((name) => !byName.has(name))).toEqual([])
  })

  it('names only props those parts have', () => {
    const props: [string, string][] = [
      ['EmptyState', 'scope'],
      ['ListColumn', 'above'],
      ['IconButton', 'tooltip'],
      ['SectionHeader', 'hover'],
      ['WithTooltip', 'inline'],
      ['Toolbar', 'surface'],
      ['Form', 'busy'],
      ['Popover', 'maxHeight'],
      ['Popover', 'open'],
    ]
    for (const [part, prop] of props) expect(byName.get(part)?.props.map((p) => p.name), `${part}.${prop}`).toContain(prop)
  })

  it('carries the four regressions the ticket names', () => {
    expect(text).toMatch(/header row drawn by hand[\s\S]*?`ContainerHeader`/)
    expect(text).toMatch(/no scroll container[\s\S]*?`ListColumn`/)
    expect(text).toMatch(/`EditableText` rendering too large/)
    expect(text).toMatch(/`EmptyState` at the wrong level[\s\S]*?scope="page"/)
  })

  it('assumes no app: no app is named, so it holds in every one', () => {
    expect(`${text}\n${SKILL_DESCRIPTION}`).not.toMatch(/\b(Peek|Ship|Leaf)\b/)
  })

  it('is read in by the loader, never copied into it', () => {
    const loader = loaderText(repoRoot, repoRoot)
    expect(loader).not.toContain('## Gotchas')
    expect(loader).toContain('!`cat "${CLAUDE_PROJECT_DIR}/skill/estiva-ui.md"`')
  })
})

describe('the Gotchas, against the record', () => {
  const rows = [...record.matchAll(/^\| (\d+) \|.*\| (G\d+|EXCL)\b[^|]*\|$/gm)].map((m) => ({ n: Number(m[1]), verdict: m[2] }))
  const gotchas = [...text.matchAll(/^(\d+)\. \*\*/gm)].map((m) => Number(m[1]))

  it('gives every recorded defect a row, numbered without a gap', () => {
    expect(rows.length).toBeGreaterThan(500)
    expect(rows.map((row) => row.n)).toEqual(rows.map((_, i) => i + 1))
  })

  it('backs every Gotcha with at least two recorded defects, and points at none the skill lacks', () => {
    const numbered = gotchas.filter((n, i) => i >= 5 || n > 5) // the five steps are numbered too
    const count = (g: number) => rows.filter((row) => row.verdict === `G${g}`).length
    for (let g = 1; g <= 24; g++) expect(count(g), `G${g}`).toBeGreaterThanOrEqual(2)
    expect(rows.filter((row) => row.verdict.startsWith('G') && Number(row.verdict.slice(1)) > 24)).toEqual([])
    expect(numbered.filter((n) => n >= 1 && n <= 24).length).toBeGreaterThanOrEqual(19)
    expect(text).toMatch(/^24\. \*\*/m)
  })

  it('states counts that add up', () => {
    const into = rows.filter((row) => row.verdict !== 'EXCL').length
    const out = rows.filter((row) => row.verdict === 'EXCL').length
    expect(record).toContain(`**${rows.length}** | **${into}** | **${out}**`)
    expect(text).toContain(`counted ${rows.length}`)
    expect(text).toContain(`cover the ${into}`)
  })
})
