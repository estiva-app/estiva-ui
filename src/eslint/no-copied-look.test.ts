import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ESLint, RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { copies, looksOf, parseForLooks } from './looks-of'
import { noCopiedLook } from './no-copied-look'
import estiva from './index'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

/**
 * Two small repos on disk: an app, with the package's catalogue installed beside
 * it (`node_modules/@estiva-app/ui/registry.json`, its `looks`), and a copy of
 * the package's own layout. The looks are the ones the parts have today.
 */
const root = mkdtempSync(join(tmpdir(), 'no-copied-look-'))
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
const SECTION_LABEL = 'text-h5 leading-3 signal:font-mono signal:text-small signal:uppercase signal:tracking-widest text-text-secondary'
const registry = (entries: { name: string; sourceFile: string; looks: string[] }[]) => JSON.stringify({ schemaVersion: 2, entries })
write('app/package.json', '{ "name": "app" }')
write(
  'app/node_modules/@estiva-app/ui/registry.json',
  registry([
    { name: 'SectionLabel', sourceFile: 'src/SectionLabel.tsx', looks: [SECTION_LABEL] },
    { name: 'Card', sourceFile: 'src/Card.tsx', looks: ['rounded-lg border bg-bg-surface border-border-default'] },
    { name: 'Avatar', sourceFile: 'src/Avatar.tsx', looks: ['rounded-full bg-bg-inset text-text-secondary font-medium'] },
  ]),
)
// The app's own reusable part, and its wrapper of the package's Avatar.
write('app/src/components/ui/MetaText.tsx', "export function MetaText({ children }: { children: string }) {\n  return <span className=\"text-caption text-text-muted whitespace-nowrap signal:font-mono signal:text-small signal:tracking-wide signal:tabular-nums\">{children}</span>\n}\n")
write('app/src/components/ui/Avatar.tsx', "import { Avatar as UiAvatar } from '@estiva-app/ui'\nexport function Avatar(props: { name: string }) {\n  return <UiAvatar {...props} />\n}\n")
write('pkg/package.json', '{ "name": "@estiva-app/ui" }')
write('pkg/src/TextInput.tsx', "export function TextInput() {\n  return <input className=\"bg-bg-inset border border-border-default hover:border-border-strong focus:border-border-focus rounded-lg px-3 py-2 text-input-value text-text-primary\" />\n}\n")
write('app/src/components/ui/looks.ts', "export const WRITING_BOX_CLASSES = 'relative bg-bg-inset border border-border-default rounded-lg p-3 signal:focus-within:border-border-focus signal:focus-within:shadow-focus-ring'\n")
write('pkg/src/looks.ts', "export const FIELD_BOX_CLASSES = 'bg-bg-inset border border-border-default hover:border-border-strong focus:border-border-focus rounded-lg'\n")

const app = join(root, 'app/src/components/Probe.tsx')
const appWrapper = join(root, 'app/src/components/ui/Avatar.tsx')
const pkg = join(root, 'pkg/src/Textarea.tsx')
const probe = (jsx: string) => `export function Probe() {\n  return (\n    ${jsx}\n  )\n}\n`

tester.run('no-copied-look', noCopiedLook, {
  valid: [
    { name: 'placement only: where it sits is everyone’s', filename: app, code: probe('<div className="flex items-center gap-2 px-3 py-2 min-w-0 shrink-0" />') },
    { name: 'three look words: a text style, not a part', filename: app, code: probe('<span className="text-caption text-text-muted truncate">x</span>') },
    { name: 'the part used, not copied', filename: app, code: `import { SectionLabel } from '@estiva-app/ui'\n${probe('<SectionLabel tone="secondary">Files</SectionLabel>')}` },
    {
      name: 'a wrapper of the package’s part, named like it (Peek’s Avatar): its own look is the part’s, never a copy',
      filename: appWrapper,
      code: "import { Avatar as UiAvatar } from '@estiva-app/ui'\nexport function Avatar() {\n  return <span className=\"rounded-full bg-bg-inset text-text-secondary font-medium\"><UiAvatar /></span>\n}\n",
    },
    { name: 'a look written once in the package and imported is not a copy', filename: pkg, code: `import { FIELD_BOX_CLASSES } from './looks'\n${probe('<textarea className={FIELD_BOX_CLASSES} />')}` },
    {
      name: 'an escape with its reason',
      filename: app,
      code: probe(`<>\n      {/* @estiva-escape: recorded in GATES.md, a label strip Katerina left as it is */}\n      <span className="${SECTION_LABEL}">x</span>\n    </>`),
    },
  ],
  invalid: [
    {
      name: 'the package’s SectionLabel, typed again in an app (the ticket’s ForeignObjectWidget case, in today’s words)',
      filename: app,
      code: probe(`<span className="min-w-0 ${SECTION_LABEL}">Assignee</span>`),
      errors: [{ messageId: 'usePart' }],
    },
    {
      name: 'the same look, the words in another order and one class more',
      filename: app,
      code: probe('<span className="text-text-secondary signal:tracking-widest signal:uppercase text-h5 signal:text-small signal:font-mono leading-3 shrink-0">x</span>'),
      errors: [{ messageId: 'usePart' }],
    },
    {
      name: 'a card’s frame, through cn() and a const',
      filename: app,
      code: `import { cn } from '@/lib/utils'\nconst FRAME = 'rounded-lg border border-border-default bg-bg-surface'\n${probe('<div className={cn(FRAME, "p-3")} />')}`,
      errors: [{ messageId: 'usePart' }, { messageId: 'usePart' }],
    },
    {
      name: 'the app’s own part, typed again: covered because it is exported from src, with no list kept',
      filename: app,
      code: probe('<span className="text-caption text-text-muted whitespace-nowrap shrink-0 signal:font-mono signal:text-small signal:tracking-wide signal:tabular-nums">9:14</span>'),
      errors: [{ messageId: 'usePart' }],
    },
    {
      name: 'the package copying itself: Textarea typing TextInput’s field (the ticket’s TextInput ≈ Textarea)',
      filename: pkg,
      code: probe('<textarea className="bg-bg-inset border border-border-default hover:border-border-strong focus:border-border-focus rounded-lg px-3 py-2 text-input-value text-text-primary" />'),
      errors: [{ messageId: 'shareIt' }],
    },
    {
      name: 'a shared look typed again in the package: told to use it',
      filename: pkg,
      code: probe('<div className="bg-bg-inset border border-border-default hover:border-border-strong focus:border-border-focus rounded-lg" />'),
      errors: [{ messageId: 'useShared' }],
    },
    {
      name: 'an app’s own shared look typed again: told to use it (Peek’s writing box)',
      filename: app,
      code: probe('<div className="relative bg-bg-inset border border-border-default rounded-lg p-3 signal:focus-within:border-border-focus signal:focus-within:shadow-focus-ring" />'),
      errors: [{ messageId: 'useShared' }],
    },
  ],
})

describe('looks', () => {
  it('reads a part at rest with one option at a time, never every option at once', () => {
    const source = parseForLooks('Card.tsx', "const FILL = { surface: 'bg-bg-surface border-border-default', inset: 'bg-bg-inset border-border-subtle' }\nexport function Card({ fill, selected }: { fill: 'surface' | 'inset'; selected: boolean }) {\n  return <div className={cn('rounded-lg border', FILL[fill], selected && 'bg-bg-selected border-accent-primary')} />\n}\n")
    const looks = looksOf(source, ['Card']).get('Card') ?? []
    expect(looks).toContain('rounded-lg border bg-bg-surface border-border-default')
    expect(looks).toContain('rounded-lg border bg-bg-inset border-border-subtle')
    expect(looks.some((l) => l.includes('bg-bg-surface') && l.includes('bg-bg-inset'))).toBe(false)
  })

  it('states its line: four look words, covering 80% of the shorter list', () => {
    expect(copies(['a-1', 'b-1', 'c-1', 'd-1'], ['a-1', 'b-1', 'c-1', 'd-1', 'e-1'])).toHaveLength(4)
    expect(copies(['a-1', 'b-1', 'c-1'], ['a-1', 'b-1', 'c-1'])).toBeNull()
    expect(copies(['a-1', 'b-1', 'c-1', 'd-1', 'x-1', 'y-1'], ['a-1', 'b-1', 'c-1', 'd-1', 'e-1', 'f-1'])).toBeNull()
  })
})

describe('a new part is covered the day it is added', () => {
  it('reads the installed catalogue, so a part the package adds is compared without touching the rule', async () => {
    const lint = async () => {
      const eslint = new ESLint({
        cwd: join(root, 'app'),
        overrideConfigFile: true,
        overrideConfig: [{ files: ['**/*.tsx'], languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } }, ...estiva.configs.recommended }],
      })
      const [result] = await eslint.lintText(probe('<div className="rounded-full bg-accent-wash text-accent-primary font-semibold ring-1 ring-accent-outline">3</div>'), { filePath: app })
      return result.messages.filter((m) => m.ruleId === 'estiva/no-copied-look')
    }
    expect(await lint()).toHaveLength(0)
    write(
      'app/node_modules/@estiva-app/ui/registry.json',
      registry([{ name: 'CountBadge', sourceFile: 'src/CountBadge.tsx', looks: ['rounded-full bg-accent-wash text-accent-primary font-semibold ring-1 ring-accent-outline'] }]),
    )
    const found = await lint()
    expect(found).toHaveLength(1)
    // A warning, never an error (Katerina, 13 September).
    expect(found[0].severity).toBe(1)
    expect(found[0].message).toContain('CountBadge')
  })
})
