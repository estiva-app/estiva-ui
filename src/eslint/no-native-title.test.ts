import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { noNativeTitle, PARTS_WITH_A_TITLE } from './no-native-title'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

/** An app on disk, so a wrapper of the app's own is followed to its part, as Peek's are. */
const root = mkdtempSync(join(tmpdir(), 'no-native-title-'))
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
write('app/package.json', '{ "name": "app" }')
write('app/src/components/ui/IconButton.tsx', "export { IconButton } from '@estiva-app/ui'\n")
write('app/src/components/ui/Button.tsx', "import { Button as UiButton, type ButtonProps } from '@estiva-app/ui'\nexport function Button(props: ButtonProps) {\n  return <UiButton {...props} />\n}\n")
write('app/src/components/Banner.tsx', 'export function NewTopicBanner({ title }: { title: string }) {\n  return <p>{title}</p>\n}\n')
const app = join(root, 'app/src/Probe.tsx')

const component = (body: string, imports = '') => `${imports}export function Probe({ at, name }: { at: string; name: string }) {\n  return (\n${body}\n  )\n}\n`
const native = [{ messageId: 'native' }]

tester.run('no-native-title', noNativeTitle, {
  valid: [
    { name: 'the part: WithTooltip', code: component('<WithTooltip label={at}><time>{at}</time></WithTooltip>', "import { WithTooltip } from '@estiva-app/ui'\n") },
    { name: "IconButton's own tooltip", code: component('<IconButton tooltip="Close" aria-label="Close">x</IconButton>', "import { IconButton } from '@estiva-app/ui'\n") },
    { name: 'a <title> inside an <svg> is a label for a screen reader, not a tooltip', code: component('<svg viewBox="0 0 16 16"><title>Unread</title><circle r="4" /></svg>') },
    { name: "a <title> in a document's head", code: component('<html><head><title>Estiva</title></head><body /></html>') },
    ...PARTS_WITH_A_TITLE.map((part) => ({ name: `${part}'s title is its own heading`, code: component(`<${part} title="Files" />`, `import { ${part} } from '@estiva-app/ui'\n`) })),
    { name: "the app's own component with a title of its own (Peek's NewTopicBanner)", filename: app, code: component('<NewTopicBanner title={name} />', "import { NewTopicBanner } from '@/components/Banner'\n") },
    { name: "a story's title is the Storybook's, an object key", code: "const meta = { title: 'Primitives/Tooltip', component: Tooltip }\nexport default meta\n" },
    { name: 'a prop of another name', code: component('<span aria-label={name} data-title={name}>{name}</span>') },
    { name: 'an escape with its reason', code: component('<>\n{/* @estiva-escape: the print view has no pointer, and the address must survive a copy */}\n<span title={at}>{at}</span>\n</>') },
  ],
  invalid: [
    {
      name: 'the file conversation timestamp at peek 3dc663b~1 (ForeignConversationView.tsx:106)',
      code: component('<time\n  dateTime={at}\n  title={new Date(at).toLocaleString()}\n  className="text-caption text-text-muted"\n>\n  {at}\n</time>'),
      errors: native,
    },
    { name: "a reference chip's cut-short title (Reference.tsx at UIG-1's commits)", code: component('<span className="truncate" title={name}>{name}</span>'), errors: native },
    { name: 'a title that is only there sometimes (MentionChip.tsx)', code: component('<span title={name ? undefined : at}>{name}</span>'), errors: native },
    { name: 'a string', code: component('<div title="online presence" />'), errors: native },
    { name: "a part that hands it on to its element: the apps' status probe", code: component('<Button title="Delete">x</Button>', "import { Button } from '@estiva-app/ui'\n"), errors: native },
    { name: "through the app's re-export", filename: app, code: component('<IconButton title="Close" aria-label="Close">x</IconButton>', "import { IconButton } from '@/components/ui/IconButton'\n"), errors: native },
    { name: "through the app's wrapper that hands its props on", filename: app, code: component('<Button title="Delete">x</Button>', "import { Button } from '@/components/ui/Button'\n"), errors: native },
    { name: 'an escape with no reason is not an escape', code: component('<>\n{/* @estiva-escape */}\n<span title={at}>{at}</span>\n</>'), errors: [{ messageId: 'escapeWithoutReason' }, ...native] },
  ],
})

describe('PARTS_WITH_A_TITLE', () => {
  it('is every part the catalogue says takes a title of its own, and no other', () => {
    const registry = JSON.parse(readFileSync(new URL('../../registry.json', import.meta.url), 'utf8')) as { entries: { name: string; props?: { name: string }[] | null }[] }
    const declared = registry.entries.filter((entry) => entry.props?.some((prop) => prop.name === 'title')).map((entry) => entry.name).sort()
    expect([...PARTS_WITH_A_TITLE].sort()).toEqual(declared)
  })
})
