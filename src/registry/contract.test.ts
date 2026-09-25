/// <reference types="node" />
/**
 * UIG-19: the usage-page contract every app's `gate` job runs, and the story
 * links. Each case is one the three repos actually have, or one that got past
 * the copies this replaces:
 *
 * - a page that lost its `When not` (the ticket's own example);
 * - Peek's pages, which never checked the order or the code under `How`;
 * - a reusable part drawn only inside another story, whose page says so on a
 *   **Seen in** line (Katerina, 21 September);
 * - a story file named after a part whose stories draw its `…View` half, in the
 *   same file — FilesPanel and TopicDetailsDialog in Peek, which the catalogue
 *   used to call drawn nowhere;
 * - a Windows checkout, read with CRLF.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildAppRegistry } from './app'
import { contractProblems, hasSeenIn, linkProblems, nameProblems, pageProblem } from './contract'

const made: string[] = []
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true })
})

function app(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'uig19-'))
  made.push(dir)
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture-app', version: '1.0.0' }))
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
  return dir
}

const PAGE = [
  "import { Meta } from '@storybook/addon-docs/blocks'",
  '',
  "<Meta title='Parts/Badge' />",
  '',
  '# Badge',
  '',
  'A small count beside a name.',
  '',
  '## When',
  '',
  'A count.',
  '',
  '## When not',
  '',
  'A word.',
  '',
  '## How',
  '',
  '```tsx',
  '<Badge count={3} />',
  '```',
  '',
  '## What it owns',
  '',
  'Nothing. It only draws.',
  '',
].join('\n')

const part = (name: string, cls = 'reusable') =>
  `/**\n * ${name}, for the fixture.\n * @registry ${cls}: the fixture says so\n */\nexport function ${name}() {\n  return <span>${name}</span>\n}\n`

describe('a usage page', () => {
  it('keeps the contract with an opening line and the four sections in order', () => {
    expect(pageProblem(PAGE)).toBeNull()
  })

  it('fails without "When not"', () => {
    expect(pageProblem(PAGE.replace('## When not', '## Not when'))).toBe('no "When not" section')
  })

  it('fails with its sections out of order', () => {
    const swapped = PAGE.replace('## When not\n\nA word.\n', '').replace('## What it owns', '## When not\n\nA word.\n\n## What it owns')
    expect(pageProblem(swapped)).toMatch(/^sections out of order/)
  })

  it('fails with no opening line', () => {
    expect(pageProblem(PAGE.replace('A small count beside a name.\n', ''))).toMatch(/^no opening line/)
  })

  // R18: the code must be under How itself; one in a later section passed.
  it('fails with no code under How, even with code further down', () => {
    expect(pageProblem(PAGE.replace('```tsx\n<Badge count={3} />\n```', 'Pass a count.'))).toBe('no code under "How"')
    const later = PAGE.replace('```tsx\n<Badge count={3} />\n```', 'Pass a count.').replace('Nothing. It only draws.', '```tsx\n<Badge count={3} />\n```')
    expect(pageProblem(later)).toBe('no code under "How"')
  })

  it('reads a Windows checkout', () => {
    expect(pageProblem(PAGE.replace(/\n/g, '\r\n'))).toBeNull()
  })

  it('knows a Seen in line, and only at the start of a line', () => {
    expect(hasSeenIn('**Seen in** — *Messages/ConversationCard*.')).toBe(true)
    expect(hasSeenIn('It is **Seen in** two places.')).toBe(false)
  })
})

describe('an app against the contract', () => {
  it('passes a reusable part with a page and a story, and asks nothing of a one-off', () => {
    const dir = app({
      'src/Badge.tsx': part('Badge'),
      'src/Badge.mdx': PAGE,
      'src/Badge.stories.tsx': "import { Badge } from './Badge'\nconst meta = { title: 'Parts/Badge', component: Badge }\nexport default meta\nexport const Default = {}\n",
      'src/Once.tsx': part('Once', 'one-off'),
    })
    expect(contractProblems(buildAppRegistry({ root: dir, repo: 'fixture' }), dir)).toEqual([])
  })

  it('names a reusable part with no page, and the file to write', () => {
    const dir = app({ 'src/Badge.tsx': part('Badge') })
    expect(contractProblems(buildAppRegistry({ root: dir, repo: 'fixture' }), dir)).toEqual([
      'Badge (reusable, src/Badge.tsx) has no usage page: write src/Badge.mdx, with an opening line, then When, When not, How, What it owns',
    ])
  })

  it('names a page that lost a section', () => {
    const dir = app({ 'src/Badge.tsx': part('Badge'), 'src/Badge.mdx': PAGE.replace('## When not', '## Not when') })
    const problems = contractProblems(buildAppRegistry({ root: dir, repo: 'fixture' }), dir)
    expect(problems).toContain('Badge (reusable, src/Badge.tsx): src/Badge.mdx has no "When not" section')
  })

  it('names a reusable part drawn nowhere, and passes it once its page says where it is seen', () => {
    const dir = app({ 'src/Badge.tsx': part('Badge'), 'src/Badge.mdx': PAGE })
    expect(contractProblems(buildAppRegistry({ root: dir, repo: 'fixture' }), dir)).toEqual([
      'Badge (reusable, src/Badge.tsx) is drawn nowhere: give it a story, or write a "**Seen in**" line on src/Badge.mdx naming the stories that draw it, or why none can',
    ])
    writeFileSync(join(dir, 'src/Badge.mdx'), PAGE.replace('A small count beside a name.\n', 'A small count beside a name.\n\n**Seen in** — *Parts/Card*, beside the title.\n'))
    expect(contractProblems(buildAppRegistry({ root: dir, repo: 'fixture' }), dir)).toEqual([])
  })

  it("counts a story file named after the part that draws its view, from the part's own file", () => {
    const dir = app({
      'src/Panel.tsx': `${part('Panel')}\n/** The half that only draws. */\nexport function PanelView() {\n  return <div>view</div>\n}\n`,
      'src/Panel.stories.tsx': "import { PanelView } from './Panel'\nconst meta = { title: 'Parts/Panel', component: PanelView }\nexport default meta\nexport const Open = {}\n",
    })
    const entry = buildAppRegistry({ root: dir, repo: 'fixture' }).entries.find((e) => e.name === 'Panel')
    expect(entry?.storyId).toBe('parts-panel--open')
  })
})

describe('story links', () => {
  it('names a link its Storybook does not have, and passes the ones it has', () => {
    const dir = app({
      'src/Badge.tsx': part('Badge'),
      'src/Badge.stories.tsx': "import { Badge } from './Badge'\nconst meta = { title: 'Parts/Badge', component: Badge }\nexport default meta\nexport const Default = {}\n",
    })
    const registry = buildAppRegistry({ root: dir, repo: 'fixture' })
    expect(linkProblems(registry, new Set(['parts-badge--default', 'parts-badge--docs']))).toEqual([])
    expect(linkProblems(registry, new Set(['parts-badge--docs']))).toEqual([
      'Badge (src/Badge.tsx) links to a story its Storybook does not have: parts-badge--default',
    ])
  })
})

// R14, the re-review after the audit before UIG-26. Every case is Peek's or Ship's own:
// StartTopicDialog sent readers to CreateTopicDialog and RepliesRow to HuddleCard, both
// deleted by FOL-23; EmptyState's Seen in named a story on two lines; Ship's Attachment
// named the package's story by a title it had lost.
describe('nameProblems', () => {
  const page = (whenNot: string, seenIn = '') =>
    PAGE.replace('A word.', whenNot).replace('A small count beside a name.', `A small count beside a name.${seenIn ? `\n\n${seenIn}` : ''}`)
  const registry = (dir: string) => ({ entries: [{ name: 'Badge', docPage: 'src/Badge.mdx' }] }) as unknown as Parameters<typeof nameProblems>[0]
  const known = new Set(['Badge', 'Chip'])

  it('names a part under When not that no catalogue has, and passes one that exists', () => {
    const dir = app({ 'src/Badge.mdx': page('A topic someone is invited to: that is **CreateTopicDialog**; a label is `Chip`.') })
    expect(nameProblems(registry(dir), dir, { known })).toEqual(['src/Badge.mdx: "When not" names CreateTopicDialog, which is no part of the package or this app'])
  })

  it('reads a Seen in line against the Storybook, a title wrapped across lines too, and the package ids', () => {
    const seen = '**Seen in** — *Parts/Badge*, *To be removed/\nTopicActivity* and\n*Media/AttachmentCard*.'
    const dir = app({ 'src/Badge.mdx': page('A word.', seen) })
    const titles = new Set(['Parts/Badge'])
    expect(nameProblems(registry(dir), dir, { known, titles, packageIds: ['components-attachmentcard--document'] })).toEqual([
      'src/Badge.mdx: "Seen in" names To be removed/TopicActivity, which no Storybook has',
      'src/Badge.mdx: "Seen in" names Media/AttachmentCard, which no Storybook has',
    ])
    expect(nameProblems(registry(dir), dir, { known, titles: new Set(['Parts/Badge', 'To be removed/TopicActivity']), packageIds: ['media-attachmentcard--default'] })).toEqual([])
  })

  it('leaves the Seen in line alone when there is no Storybook index to read', () => {
    const dir = app({ 'src/Badge.mdx': page('A word.', '**Seen in** — *Gone/Story*.') })
    expect(nameProblems(registry(dir), dir, { known })).toEqual([])
  })
})
