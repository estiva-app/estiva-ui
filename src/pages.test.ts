/**
 * The contract every component page keeps (UIG-14, with UIG-15 and UIG-16 folded in).
 *
 * A page opens with a line saying what the part is, then has `When`, `When not`,
 * `How` (with code) and `What it owns`, in that order, before `Keys` and `Props`.
 *
 * `What it owns` reads the checker's own list back. A row ticked ✓ in its third
 * column is a behaviour from `OWNED_BEHAVIOURS` that one of the page's parts owns,
 * worded as `ROW` below; every behaviour the page's parts own has one; and a row
 * worded as a behaviour the parts do not own fails. So the page and the checker
 * cannot say different things. A part that owns nothing says so in one line.
 *
 * A `When not` line names only parts that exist: a bold name is a value export of
 * `index.ts`, or a page.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { OWNED_BEHAVIOURS } from './eslint/no-rebuilt-behaviour'

/** How a page words each behaviour. `base-ui` is how a part is built, not what it does for a caller. */
const ROW: Record<string, RegExp> = {
  portal: /^Floats on top of the page\b/,
  'press-outside': /^Closes on a press outside\b/,
  'page-keys': /^Takes its keys by itself\b/,
  focus: /^Holds focus inside while open\b/,
  'scroll-lock': /^Stops the page behind it scrolling\b/,
  follow: /^Stays attached to its anchor\b/,
  walking: /^Moves through its items with the arrow keys\b/,
  role: /^Says what it is to assistive technology\b/,
  'tab-stop': /^Is reachable with Tab\b/,
  scroll: /^Scrolls with our scrollbar\b/,
}
const NOT_A_ROW = ['base-ui']

/** A page whose part another ticket is changing, while it is; empty when none is. */
const WAITING: string[] = []

const NOTHING = 'Nothing. It only draws. Clicks and keys are yours.'

const dir = new URL('.', import.meta.url)
const read = (file: string) => readFileSync(new URL(file, dir), 'utf8').replace(/\r\n/g, '\n')
const pages = readdirSync(dir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.slice(0, -4))

const index = read('index.ts')
/** Value exports of index.ts, by the module they come from. */
const byModule = new Map<string, string[]>()
for (const m of index.matchAll(/export\s*\{([^}]*)\}\s*from\s*'\.\/([\w/]+)'/g)) {
  const names = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('type '))
    .map((s) => s.split(/\s+as\s+/).pop()!)
  byModule.set(m[2], [...(byModule.get(m[2]) ?? []), ...names])
}
const exported = new Set([...byModule.values()].flat())

/** The parts a page documents: its own name, and its module's exports that have no page of their own. */
const partsOf = (page: string) => [page, ...(byModule.get(page) ?? []).filter((n) => n !== page && !pages.includes(n))]

const section = (t: string, name: string) => {
  const head = `\n## ${name}\n`
  const at = t.indexOf(head)
  if (at < 0) return null
  const rest = t.slice(at + head.length)
  const end = rest.search(/^## /m)
  return end < 0 ? rest : rest.slice(0, end)
}

const owns = (t: string) =>
  (section(t, 'What it owns') ?? '')
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.startsWith('| It does |'))
    .map((l) => l.split('|').map((c) => c.trim()))
    .map(([, does, never, ticked]) => ({ does, never, ticked: ticked === '✓' }))

describe('the page contract', () => {
  it('words every behaviour the checker knows', () => {
    const ids = OWNED_BEHAVIOURS.map((b) => b.id).filter((id) => !NOT_A_ROW.includes(id))
    expect(Object.keys(ROW).sort()).toEqual(ids.sort())
  })

  it('finds the pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(54)
  })

  for (const page of pages) {
    describe(page, () => {
      const t = read(`${page}.mdx`)
      const headings = [...t.matchAll(/^## (.+)$/gm)].map((m) => m[1])

      it('opens with a line saying what it is', () => {
        const opening = t.split(/^# .*$/m)[1]?.split(/\n\s*\n/).map((s) => s.trim()).find((s) => s && !s.startsWith('<'))
        expect(opening, 'no opening line under the title').toBeTruthy()
      })

      it('has each section once', () => {
        expect(headings.filter((h, i) => headings.indexOf(h) !== i)).toEqual([])
      })

      it('has its sections in order', () => {
        const want = WAITING.includes(page) ? ['When', 'When not', 'How'] : ['When', 'When not', 'How', 'What it owns']
        const at = want.map((h) => headings.indexOf(h))
        expect(at.filter((i) => i < 0).length, `missing: ${want.filter((_, i) => at[i] < 0).join(', ')}`).toBe(0)
        expect([...at].sort((a, b) => a - b)).toEqual(at)
        for (const after of ['Keys', 'Props']) {
          const i = headings.indexOf(after)
          if (i >= 0) expect(at[at.length - 1], `${want[want.length - 1]} comes before ${after}`).toBeLessThan(i)
        }
      })

      it('shows code under How', () => {
        expect(section(t, 'How')).toMatch(/```tsx?\n/)
      })

      it('names only parts that exist under When not', () => {
        const names = [...(section(t, 'When not') ?? '').matchAll(/\*\*`?([A-Z][A-Za-z0-9]*)`?\*\*/g)].map((m) => m[1])
        expect(names.filter((n) => !exported.has(n) && !pages.includes(n))).toEqual([])
      })

      if (WAITING.includes(page)) return

      it('says what it owns, as the checker does', () => {
        const parts = partsOf(page)
        const owned = OWNED_BEHAVIOURS.filter((b) => !NOT_A_ROW.includes(b.id) && b.owners.some((o) => parts.includes(o))).map((b) => b.id)
        const rows = owns(t)
        const body = (section(t, 'What it owns') ?? '').trim()
        if (!rows.length) {
          expect(owned, `${page} owns ${owned.join(', ')}; the page says nothing`).toEqual([])
          expect(body).toBe(NOTHING)
          return
        }
        const said = rows.flatMap((r) => Object.entries(ROW).filter(([, re]) => re.test(r.does)).map(([id]) => ({ id, ticked: r.ticked, does: r.does })))
        expect(said.filter((s) => !s.ticked).map((s) => s.does), 'a checker behaviour, not ticked').toEqual([])
        expect(rows.filter((r) => r.ticked && !Object.values(ROW).some((re) => re.test(r.does))).map((r) => r.does), 'ticked, but not worded as a checker behaviour').toEqual([])
        expect(said.map((s) => s.id).sort()).toEqual([...owned].sort())
        expect(rows.every((r) => r.does && r.never), 'every row says what it does and what you never write').toBe(true)
      })
    })
  }
})
