/// <reference types="node" />
/**
 * The hand-written map of a Storybook (audit A3, widened by R16). Every case is a
 * real one: Peek's Huddles heading, kept in its Introduction and `HEADINGS` after
 * FOL-23 deleted the stories, and its "49 parts worth reusing" when the catalogue
 * built 41; Ship's `storySort.order` naming a Feedback heading it does not have and
 * leaving out Pages, and its Introduction's bullets; the package's order leaving
 * out Layout; and a Storybook with no map at all, which has nothing to rot.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { Registry } from './schema'
import { indexHeadings, introductionCount, introductionHeadings, orderedHeadings, sidebarHeadings, storyMapProblems } from './storymap'

const made: string[] = []
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true })
})

function app(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'storymap-'))
  made.push(dir)
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
  return dir
}

/** Only the classes matter here: the Introduction counts reusable and promote-candidate parts. */
const catalogue = (...classes: string[]) => ({ entries: classes.map((cls) => ({ app: { class: cls } })) }) as unknown as Registry

const STORY = (title: string) => `import type { Meta } from '@storybook/react-vite'\nconst meta = {\n  title: '${title}',\n} satisfies Meta\nexport default meta\n`
const HEADINGS_PREVIEW = (headings: string[]) =>
  `export default {\n  parameters: {\n    options: {\n      storySort: (a, b) => {\n        const HEADINGS = [\n${headings.map((h) => `          '${h}', // someone's heading\n`).join('')}        ]\n        return 0\n      },\n    },\n  },\n}\n`
const ORDER_PREVIEW = (headings: string[]) =>
  `export default {\n  parameters: {\n    options: {\n      // Docs first; the rest follows\n      storySort: {\n        order: [${headings.map((h) => (h === 'Docs' ? "'Docs', ['Introduction']" : `'${h}'`)).join(', ')}],\n      },\n    },\n  },\n}\n`
const TABLE_INTRO = (count: number, headings: string[]) =>
  `import { Meta } from '@storybook/addon-docs/blocks'\n\n<Meta title="Docs/Introduction" />\n\nOf everything the app owns, **${count} parts worth reusing** carry a written rule.\n\n| Heading | What |\n|---|---|\n${headings.map((h) => `| **${h}** | About ${h}. |`).join('\n')}\n`
const BULLET_INTRO = (groups: string[][]) =>
  `<Meta title="Docs/Introduction" />\n\n## How the sidebar is organised\n\n${groups.map((g) => `- **${g.join(' · ')}** — about them.`).join('\n')}\n\n## Conventions\n\n- **Stories first.** A component exists in Storybook first.\n`

const PEEK_TODAY = {
  'src/stories/Introduction.mdx': TABLE_INTRO(2, ['Docs', 'Primitives', 'Huddles']),
  'src/components/ui/Badge.stories.tsx': STORY('Primitives/Badge'),
  'src/components/ui/Chip.mdx': `import { Meta } from '@storybook/addon-docs/blocks'\n\n<Meta title='Primitives/Chip' />\n\n# Chip\n`,
  '.storybook/preview.tsx': HEADINGS_PREVIEW(['Docs', 'Primitives', 'Huddles']),
}

describe('reading the map', () => {
  it('reads the sidebar from story titles and page titles in either quote, in src and stories', () => {
    expect([...sidebarHeadings(app({ ...PEEK_TODAY, 'stories/Tokens.mdx': "<Meta title='Tokens/All' />\n" }))].sort()).toEqual(['Docs', 'Primitives', 'Tokens'])
  })

  it("reads Storybook's own index, whatever way a title was written", () => {
    expect([...indexHeadings({ a: { title: 'Pages/Desk' }, b: { title: 'Docs/Introduction' }, c: {} })].sort()).toEqual(['Docs', 'Pages'])
  })

  it('reads a HEADINGS list and a storySort order, skipping comments and nested lists', () => {
    expect(orderedHeadings(HEADINGS_PREVIEW(['Docs', 'Pages']))).toEqual(['Docs', 'Pages'])
    expect(orderedHeadings(ORDER_PREVIEW(['Docs', 'Primitives', 'Feedback']))).toEqual(['Docs', 'Primitives', 'Feedback'])
    expect(orderedHeadings('export default {}')).toBeNull()
  })

  it("reads the Introduction's table rows and its bullets, and its stated count", () => {
    expect([...introductionHeadings(TABLE_INTRO(49, ['Docs', 'Huddles']))]).toEqual(['Docs', 'Huddles'])
    // A bullet with no dash after its bold words is prose, not a heading.
    expect([...introductionHeadings(BULLET_INTRO([['Docs'], ['Primitives', 'Feedback', 'Inputs']]))]).toEqual(['Docs', 'Primitives', 'Feedback', 'Inputs'])
    expect(introductionCount(TABLE_INTRO(49, ['Docs']))).toBe(49)
    expect(introductionCount('# No number here')).toBeNull()
  })
})

describe('storyMapProblems', () => {
  it("finds Peek's three stale lines: a heading in both maps with no story, and the wrong count", () => {
    expect(storyMapProblems(app(PEEK_TODAY), { registry: catalogue('reusable', 'reusable', 'reusable', 'local') })).toEqual([
      '.storybook/preview.tsx: in the heading order but no story uses them: Huddles',
      'src/stories/Introduction.mdx: the page names, the sidebar does not have: Huddles',
      'src/stories/Introduction.mdx: says 2 parts worth reusing; the catalogue builds 3',
    ])
  })

  it("finds Ship's: an order and bullets naming Feedback, which it has not got, and leaving out Pages", () => {
    const dir = app({
      '.storybook/preview.tsx': ORDER_PREVIEW(['Docs', 'Primitives', 'Feedback']),
      'src/stories/Introduction.mdx': BULLET_INTRO([['Docs'], ['Primitives', 'Feedback']]),
    })
    expect(storyMapProblems(dir, { real: new Set(['Docs', 'Primitives', 'Pages']) })).toEqual([
      '.storybook/preview.tsx: not in the heading order, so they fall to the bottom of the sidebar: Pages',
      '.storybook/preview.tsx: in the heading order but no story uses them: Feedback',
      'src/stories/Introduction.mdx: the sidebar has, the page does not name: Pages',
      'src/stories/Introduction.mdx: the page names, the sidebar does not have: Feedback',
    ])
  })

  it("finds the package's order leaving out Layout, from a Storybook index", () => {
    const dir = app({ '.storybook/preview.tsx': ORDER_PREVIEW(['Docs', 'Primitives']) })
    expect(storyMapProblems(dir, { real: indexHeadings({ a: { title: 'Layout/ListColumn' }, b: { title: 'Primitives/Button' }, c: { title: 'Docs/Introduction' } }) })).toEqual([
      '.storybook/preview.tsx: not in the heading order, so they fall to the bottom of the sidebar: Layout',
    ])
  })

  it('passes when both maps match the Storybook and the count matches the catalogue', () => {
    const dir = app({
      ...PEEK_TODAY,
      'src/stories/Introduction.mdx': TABLE_INTRO(2, ['Docs', 'Primitives']),
      '.storybook/preview.tsx': HEADINGS_PREVIEW(['Docs', 'Primitives']),
    })
    expect(storyMapProblems(dir, { registry: catalogue('reusable', 'promote-candidate', 'local') })).toEqual([])
  })

  it('has nothing to check in a repository that keeps no map', () => {
    expect(storyMapProblems(app({ 'src/Badge.stories.tsx': STORY('Parts/Badge') }), { registry: catalogue('reusable') })).toEqual([])
  })
})
