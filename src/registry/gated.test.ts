/// <reference types="node" />
/**
 * UIG-19: what a part draws only behind a prop, and no story passes. Each case
 * is one the scan met in Peek or the package:
 *
 * - a gate on the part itself (SectionHeader's chevron);
 * - a prop handed to a smaller part that gates on it (ConversationCard's
 *   `onReply`, which the strip draws — strict, by Katerina's ruling);
 * - a prop handed to a dialog, shut in every story (skipped, her ruling);
 * - a story that spreads another story's args (`...Topic.args`);
 * - a spread it cannot open (a helper's `{...props}`), which keeps it quiet.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildAppRegistry } from './app'
import { gatedFindings } from './gated'

const made: string[] = []
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true })
})

function app(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'uig19-gated-'))
  made.push(dir)
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture-app', version: '1.0.0' }))
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
  return dir
}

const find = (dir: string) => gatedFindings(buildAppRegistry({ root: dir, repo: 'fixture' }), dir).map((f) => `${f.part}.${f.prop}`)

const card = `/**
 * A card.
 * @registry reusable: the fixture says so
 */
export function Card({ title, onReply, onShare }: { title: string; onReply?: () => void; onShare?: () => void }) {
  return (
    <div>
      {title}
      {onReply && <button type="button">Reply</button>}
      <Strip onShare={onShare} />
      <ShareDialog onShare={onShare} />
    </div>
  )
}

/** The strip under a card. */
export function Strip({ onShare }: { onShare?: () => void }) {
  return <div>{onShare ? <button type="button">Share</button> : null}</div>
}

/** A dialog, shut until opened. */
export function ShareDialog({ onShare }: { onShare?: () => void }) {
  return <div>{onShare && <button type="button">Share now</button>}</div>
}
`

const story = (body: string) => `import { Card } from './Card'\nconst meta = { title: 'Parts/Card', component: Card, args: { title: 'Hello' } }\nexport default meta\n${body}\n`

describe('what a part draws behind a prop', () => {
  it('names a gate on the part, and one it hands to a smaller part, when no story passes either', () => {
    const dir = app({ 'src/Card.tsx': card, 'src/Card.stories.tsx': story('export const Default = {}') })
    expect(find(dir).sort()).toEqual(['Card.onReply', 'Card.onShare'])
  })

  it('is satisfied by a story that passes them, in args or through another story’s args', () => {
    const dir = app({
      'src/Card.tsx': card,
      'src/Card.stories.tsx': story("export const Default = { args: { onReply: () => {} } }\nexport const Shared = { args: { ...Default.args, onShare: () => {} } }"),
    })
    expect(find(dir)).toEqual([])
  })

  it('skips a prop that reaches only a dialog', () => {
    const only = card.replace('      <Strip onShare={onShare} />\n', '')
    const dir = app({ 'src/Card.tsx': only, 'src/Card.stories.tsx': story("export const Default = { args: { onReply: () => {} } }") })
    expect(find(dir)).toEqual([])
  })

  it('stays quiet when a story passes props it cannot read', () => {
    const dir = app({
      'src/Card.tsx': card,
      'src/Card.stories.tsx': `import { Card } from './Card'\nimport { props } from './fixtures'\nconst meta = { title: 'Parts/Card', component: Card }\nexport default meta\nexport const Default = { render: () => <Card title="x" {...props} /> }\n`,
    })
    expect(find(dir)).toEqual([])
  })

  it('asks nothing of a part no story draws: the contract says so instead', () => {
    const dir = app({ 'src/Card.tsx': card })
    expect(find(dir)).toEqual([])
  })
})
