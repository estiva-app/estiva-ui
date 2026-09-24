/// <reference types="node" />
/**
 * The app's hand-written map of its Storybook (audit A3). Every case is Peek's:
 * the Huddles heading its Introduction and `HEADINGS` kept after FOL-23 deleted
 * the stories, the "49 parts worth reusing" it kept when the catalogue built 41,
 * and a Storybook with no map at all, which has nothing to rot.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { Registry } from './schema'
import { introductionCount, introductionHeadings, orderedHeadings, sidebarHeadings, storyMapProblems } from './storymap'

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
const PREVIEW = (headings: string[]) =>
  `export default {\n  parameters: {\n    options: {\n      storySort: (a, b) => {\n        const HEADINGS = [\n${headings.map((h) => `          '${h}', // someone's heading\n`).join('')}        ]\n        return 0\n      },\n    },\n  },\n}\n`
const INTRO = (count: number, headings: string[]) =>
  `import { Meta } from '@storybook/addon-docs/blocks'\n\n<Meta title="Docs/Introduction" />\n\nOf everything the app owns, **${count} parts worth reusing** carry a written rule.\n\n| Heading | What |\n|---|---|\n${headings.map((h) => `| **${h}** | About ${h}. |`).join('\n')}\n`

const PEEK_TODAY = {
  'src/stories/Introduction.mdx': INTRO(2, ['Docs', 'Primitives', 'Huddles']),
  'src/components/ui/Badge.stories.tsx': STORY('Primitives/Badge'),
  'src/components/ui/Chip.mdx': `import { Meta } from '@storybook/addon-docs/blocks'\n\n<Meta title='Primitives/Chip' />\n\n# Chip\n`,
  '.storybook/preview.tsx': PREVIEW(['Docs', 'Primitives', 'Huddles']),
}

describe('reading the map', () => {
  it('reads the sidebar from story titles and from page titles in either quote', () => {
    expect([...sidebarHeadings(app(PEEK_TODAY))].sort()).toEqual(['Docs', 'Primitives'])
  })

  it('reads the order with its comments removed, and says when there is none', () => {
    expect(orderedHeadings(PREVIEW(['Docs', 'Pages']))).toEqual(['Docs', 'Pages'])
    expect(orderedHeadings('export default {}')).toBeNull()
  })

  it('reads the Introduction: its bold table rows and its stated count', () => {
    const intro = INTRO(49, ['Docs', 'Huddles'])
    expect([...introductionHeadings(intro)]).toEqual(['Docs', 'Huddles'])
    expect(introductionCount(intro)).toBe(49)
    expect(introductionCount('# No number here')).toBeNull()
  })
})

describe('storyMapProblems', () => {
  it("finds Peek's three stale lines: a heading in both maps with no story, and the wrong count", () => {
    const problems = storyMapProblems(catalogue('reusable', 'reusable', 'reusable', 'local'), app(PEEK_TODAY))
    expect(problems).toEqual([
      '.storybook/preview.tsx: named in HEADINGS but no story uses them: Huddles',
      'src/stories/Introduction.mdx: the page names, the sidebar does not have: Huddles',
      'src/stories/Introduction.mdx: says 2 parts worth reusing; the catalogue builds 3',
    ])
  })

  it('finds a heading the maps forget, which falls to the bottom of the sidebar', () => {
    const dir = app({ ...PEEK_TODAY, 'src/pages/Desk.stories.tsx': STORY('Pages/Desk') })
    expect(storyMapProblems(catalogue('reusable', 'promote-candidate'), dir)).toEqual([
      '.storybook/preview.tsx: not named in HEADINGS, so they fall to the bottom of the sidebar: Pages',
      '.storybook/preview.tsx: named in HEADINGS but no story uses them: Huddles',
      'src/stories/Introduction.mdx: the sidebar has, the page does not name: Pages',
      'src/stories/Introduction.mdx: the page names, the sidebar does not have: Huddles',
    ])
  })

  it('passes when both maps match the Storybook and the count matches the catalogue', () => {
    const dir = app({
      ...PEEK_TODAY,
      'src/stories/Introduction.mdx': INTRO(2, ['Docs', 'Primitives']),
      '.storybook/preview.tsx': PREVIEW(['Docs', 'Primitives']),
    })
    expect(storyMapProblems(catalogue('reusable', 'promote-candidate', 'local'), dir)).toEqual([])
  })

  it('has nothing to check in an app that keeps no map', () => {
    expect(storyMapProblems(catalogue('reusable'), app({ 'src/Badge.stories.tsx': STORY('Parts/Badge') }))).toEqual([])
  })
})
