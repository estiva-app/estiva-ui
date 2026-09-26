import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { noHandmadeHeader } from './no-handmade-header'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

const component = (body: string) => `export function Probe({ title, open }: { title: string; open: boolean }) {\n  return (\n${body}\n  )\n}\n`
const handmade = [{ messageId: 'handmade' }]

tester.run('no-handmade-header', noHandmadeHeader, {
  valid: [
    // 26 September: the package's own parts import the header from their sibling file.
    { name: 'the header inside the package, from its own file', code: `import { ContainerHeader } from './ContainerHeader'\n${component('<ContainerHeader title="Files" />')}` },
    { name: 'Panel in an app', code: `import { Panel } from '@estiva-app/ui'\n${component('<Panel title="Files">x</Panel>')}` },
    { name: 'the bare header in an app, escaped with its reason', code: `import { ContainerHeader } from '@estiva-app/ui'\n${component('// @estiva-escape(no-handmade-header): a header over a loading skeleton that cannot scroll\n<ContainerHeader title="Files" />')}` },
    { name: 'the part itself', code: component('<div className="flex h-full flex-col">\n<ContainerHeader title="Files" />\n<div />\n</div>') },
    {
      name: "a group heading inside a list: SectionHeader's row, not a column's bar (Ship's issue groups)",
      code: component('<section className="flex flex-col gap-px">\n<h3 className="flex h-8 items-center gap-2 px-3"><StatusLabel value="todo" /><span>{3}</span></h3>\n<div />\n</section>'),
    },
    {
      name: "a label strip on a card (Peek's huddle card)",
      code: component('<Card className="flex flex-col h-[130px]">\n<div className="h-6 bg-bg-inset px-2 flex items-center shrink-0"><span className="text-caption">Huddle</span></div>\n<div />\n</Card>'),
    },
    { name: 'a row a person presses is a row, not a header', code: component('<div className="flex h-full flex-col">\n<div className="flex items-center px-3 py-2" onClick={() => {}}><span>{title}</span></div>\n<div />\n</div>') },
    { name: 'a row with no title: a toolbar, a field', code: component('<div className="flex h-full flex-col">\n<div className="flex items-center gap-1 px-3"><Button>One</Button><Button>Two</Button></div>\n<div />\n</div>') },
    { name: 'a row with nothing after it heads nothing', code: component('<div className="flex h-full flex-col">\n<div className="flex items-center px-3 py-2"><span>{title}</span></div>\n</div>') },
    { name: 'a row with no side padding of its own', code: component('<div className="flex h-full flex-col">\n<div className="flex items-center py-2"><span>{title}</span></div>\n<div />\n</div>') },
    { name: 'a column of rows', code: component('<div className="flex h-full flex-col">\n<div className="flex flex-col px-3"><span>{title}</span></div>\n<div />\n</div>') },
    {
      name: 'an escape with its reason',
      code: component('<div className="flex h-full flex-col">\n{/* @estiva-escape(no-handmade-header): a print header that must not follow the theme */}\n<div className="flex items-center px-3 py-2"><span>{title}</span></div>\n<div />\n</div>'),
    },
  ],
  invalid: [
    {
      name: "the package's header on its own in an app: a panel made by hand, naming Panel (26 September)",
      code: `import { ContainerHeader as Header } from '@estiva-app/ui'\n${component('<div className="flex flex-col">\n<Header title="Estiva Ship" />\n<div className="px-4">{title}</div>\n</div>')}`,
      errors: [{ messageId: 'bare' }],
    },
    {
      // The Folders page's right pane, at the commit before 3dc663b.
      name: 'a pane that heads itself around an editable name',
      code: component('<div className="flex h-full flex-col">\n{/* ContainerHeader draws a static title, so this pane heads itself. */}\n<div className="flex items-center gap-2 px-3 py-2">\n<div className="min-w-0 flex-1"><EditableText value={title} label="Folder name" /></div>\n<IconButton icon={<IconX />} label="Close" />\n</div>\n<div className="min-h-0 flex-1" />\n</div>'),
      errors: handmade,
    },
    {
      // The Folders page's thread pane, at the commit before 3dc663b.
      name: 'a pane that heads itself with a title and a caption',
      code: component('<div className="flex h-full flex-col">\n<div className="flex items-center gap-2 px-3 py-2">\n<div className="min-w-0 flex-1">\n<p className="truncate text-body-2-strong text-text-primary">{title ?? "Conversation"}</p>\n{open && <p className="truncate text-caption text-text-muted">In Ship</p>}\n</div>\n</div>\n<div />\n</div>'),
      errors: handmade,
    },
    {
      name: "ContainerHeader's exact class list, typed by hand (Peek's FilesPanel and ThreadPanel)",
      code: component('<div className="flex flex-col h-full">\n<div className="h-12 shrink-0 flex items-center justify-between pl-5 pr-4 py-2 border-b border-border-subtle">\n<span className="text-body-2-strong text-text-primary">Files</span>\n</div>\n<div />\n</div>'),
      errors: handmade,
    },
    {
      name: 'the shape, not the class names: other padding, other gap, a heading, a column that grows',
      code: component('<aside className="flex grow flex-col">\n<header className="flex items-baseline gap-4 pl-6 pr-2 py-3"><h2>{title}</h2></header>\n<ul />\n</aside>'),
      errors: handmade,
    },
    {
      name: "a header bar's height and hairline, whatever the column is",
      code: component('<section className="flex flex-col">\n<div className="flex h-11 items-center border-b px-4"><span>{title}</span></div>\n<div />\n</section>'),
      errors: handmade,
    },
    {
      name: 'a bar shown only while something is open',
      code: component('<div className="flex h-full flex-col">\n{open && (\n<div className="flex items-center px-3 py-2"><span>{title}</span></div>\n)}\n<div />\n</div>'),
      errors: handmade,
    },
    {
      name: 'classes put together with cn() and a variant',
      code: component('<div className={cn("flex flex-col", "h-full")}>\n<div className={cn("flex items-center", "md:px-4 py-2")}><span>{title}</span></div>\n<div />\n</div>'),
      errors: handmade,
    },
    {
      // DialogShell's bar, before it drew ContainerHeader: a part's title, named as one.
      name: "a bar whose title is a part's Title",
      code: component('<div className="flex flex-col">\n<div className="h-12 flex items-center justify-between pl-5 pr-4 border-b shrink-0">\n{open ?? <Parts.Title render={<span />}>{title}</Parts.Title>}\n</div>\n<div />\n</div>'),
      errors: handmade,
    },
    {
      name: 'an escape with no reason escapes nothing',
      code: component('<div className="flex h-full flex-col">\n{/* @estiva-escape(no-handmade-header): */}\n<div className="flex items-center px-3 py-2"><span>{title}</span></div>\n<div />\n</div>'),
      errors: [{ messageId: 'escapeWithoutReason' }, { messageId: 'handmade' }],
    },
  ],
})
