import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { noHandmadeEmptyState } from './no-handmade-empty-state'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

/**
 * The wrong-scope half follows the app's components into their files, so its
 * cases live in a small app on disk, laid out the way Peek's Folders page was at
 * `7f22e5e~1`: the page scrolls a view drawn in another file.
 */
const root = mkdtempSync(join(tmpdir(), 'no-handmade-empty-state-'))
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
write('app/package.json', '{ "name": "app" }')
write(
  'app/src/components/ui/EmptyState.tsx',
  "import { EmptyState as UiEmptyState, type EmptyStateProps } from '@estiva-app/ui'\nexport function EmptyState({ message = 'Nothing', ...rest }: EmptyStateProps) {\n  return <UiEmptyState message={message} {...rest} />\n}\n",
)
// The file conversation, as it arrived in the merge: two page states in a view another file scrolls.
write(
  'app/src/components/views/ForeignConversationView.tsx',
  "import { EmptyState } from '@/components/ui/EmptyState'\nexport function ForeignConversationView({ state }: { state: string[] | 'failed' }) {\n  if (state === 'failed') return <EmptyState message=\"This conversation could not be read.\" />\n  if (state.length === 0) return <EmptyState message=\"Nothing said about this yet.\" />\n  return <div>{state.map((c) => <p key={c}>{c}</p>)}</div>\n}\n",
)
// The folder view: its own states are sections; the rows it draws hold a page state two components down.
write(
  'app/src/components/views/FolderContentsView.tsx',
  "import { EmptyState } from '@/components/ui/EmptyState'\nexport function FolderContentsView({ files }: { files: string[] }) {\n  if (files.length === 0) return <EmptyState scope=\"section\" message=\"Nothing in this folder yet.\" />\n  return <div>{files.map((f) => <FileRow key={f} file={f} />)}</div>\n}\nfunction FileRow({ file }: { file: string }) {\n  return <div><p>{file}</p><ChildRows file={file} /></div>\n}\nfunction ChildRows({ file }: { file: string }) {\n  const children: string[] = file ? [] : [file]\n  if (children.length === 0) return <EmptyState message=\"Nothing in this yet.\" />\n  return <>{children.map((c) => <FileRow key={c} file={c} />)}</>\n}\n",
)
// Ship's Activity: it hands its className on to a section EmptyState. It is the app's own, and is followed.
write(
  'app/src/components/Activity.tsx',
  "import { EmptyState } from '@estiva-app/ui'\nexport function Activity({ items, className }: { items: string[]; className?: string }) {\n  if (items.length === 0) return <EmptyState scope=\"section\" className={className} message=\"No related conversations yet.\" />\n  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>\n}\n",
)

const app = join(root, 'app/src/pages/Probe.tsx')
const component = (body: string) => `export function Probe({ rows, report, answer, choosing }: { rows: string[]; report?: string; answer: false | { text: string; sources: string[] }; choosing: boolean }) {\n${body}\n}\n`
const jsx = (body: string) => component(`  return (\n${body}\n  )`)
const scrolled = (imports: string, body: string) =>
  `import { ScrollArea, EmptyState } from '@estiva-app/ui'\n${imports}\nexport function Probe({ rows }: { rows: string[] }) {\n  return (\n${body}\n  )\n}\n`
const handmade = [{ messageId: 'handmade' }]

tester.run('no-handmade-empty-state', noHandmadeEmptyState, {
  valid: [
    // the part itself
    { name: 'the part, in place of the list', code: jsx('<div>{rows.length === 0 ? <EmptyState scope="section" message="Nothing here" /> : rows.map((r) => <p key={r}>{r}</p>)}</div>') },

    // UIG-1's two false alarms, which the ticket makes regression tests
    {
      name: '"Nothing is created until you submit it." — a hint beside a button (CommandLauncher.tsx:1498)',
      code: jsx('<>\n<Button>Open the form</Button>\n<span className="text-[12px] text-text-secondary">Nothing is created until you submit it.</span>\n</>'),
    },
    {
      name: '"…this folder has no folder state yet." — a status note, under a condition that asks nothing about a list (FolderContentsView.tsx:101)',
      code: component('  const folder = { source: "channel" }\n  return (\n<div>\n{folder.source === "channel" && (\n<p className="text-caption text-text-muted">From channel contents; this folder has no folder state yet.</p>\n)}\n{rows.map((r) => <p key={r}>{r}</p>)}\n</div>\n  )'),
    },

    // the ticket's three ❓, ruled not empty states (GATES.md)
    {
      name: '"No comparison yet — it needs one relay fetch." — a debug line for a report not fetched yet (ReadStatePanel.tsx:65)',
      code: component('  if (!report) return <p className="text-caption text-text-muted">No comparison yet — it needs one relay fetch.</p>\n  return <p>{report}</p>'),
    },
    {
      name: '"No answer came back." — a failure after a request; the other side is an answer, with its sources listed inside it (CommandLauncher.tsx:1514)',
      code: jsx('<div>{answer === false ? (\n<p className="text-text-secondary">No answer came back. Edit the question and press Enter to try again.</p>\n) : (\n<>\n<p>{answer.text}</p>\n<ol>{answer.sources.map((s) => <li key={s}>{s}</li>)}</ol>\n</>\n)}</div>'),
    },

    // look-alikes
    { name: 'the full side of the test: a count', code: jsx('<div>{rows.length > 0 && <span className="font-mono text-caption">{rows.length}</span>}</div>') },
    { name: 'the full side of the test, with words', code: jsx('<div>{rows.length > 0 && <p className="text-caption">Recent</p>}{rows.map((r) => <p key={r}>{r}</p>)}</div>') },
    { name: 'the full side of a ternary', code: jsx('<div>{rows.length ? <p>Pick one below.</p> : <Button>Add</Button>}</div>') },
    {
      name: 'a status line whose words are a choice (ReactionPicker.stories.tsx:76)',
      code: component('  const chosen = rows[0]\n  return <span className="text-caption text-text-secondary">{chosen ? `Chose ${chosen}` : "Nothing chosen yet."}</span>'),
    },
    { name: 'a paragraph, not a line', code: jsx(`<div>{rows.length === 0 ? <p>${'Nothing here, and a long explanation of why that is and what to do next about it. '.repeat(2)}</p> : rows.map((r) => <p key={r}>{r}</p>)}</div>`) },
    { name: 'a line that is a value, not words: a message body', code: jsx('<div>{rows.length === 0 ? <p className="pl-8">{report}</p> : rows.map((r) => <p key={r}>{r}</p>)}</div>') },
    { name: 'a box holding more than the line', code: jsx('<div>{rows.length === 0 ? <div className="px-3"><p>Nothing yet.</p><Button>Add one</Button></div> : rows.map((r) => <p key={r}>{r}</p>)}</div>') },
    {
      name: 'an escape with its reason',
      code: jsx('<div>{rows.length === 0 ? (\n// @estiva-escape(no-handmade-empty-state): a printed report keeps its own empty line, set in the print style\n<p>Nothing to print.</p>\n) : rows.map((r) => <p key={r}>{r}</p>)}</div>'),
    },

    // the right scope
    { name: 'a page state for a whole column, outside any ScrollArea', filename: app, code: scrolled('', '<div className="flex h-full flex-col">{rows.length === 0 ? <EmptyState message="No topics yet." /> : <ScrollArea className="flex-1">{rows.map((r) => <p key={r}>{r}</p>)}</ScrollArea>}</div>') },
    { name: 'a section state inside a ScrollArea', filename: app, code: scrolled('', '<ScrollArea className="flex-1">{rows.length === 0 ? <EmptyState scope="section" message="No issues yet." /> : null}</ScrollArea>') },
    { name: 'a page state inside a ScrollArea whose content fills it', filename: app, code: scrolled('', '<ScrollArea className="flex-1" contentClassName="flex min-h-full flex-col">{rows.length === 0 && <EmptyState message="Nothing here yet." />}</ScrollArea>') },
    { name: 'a scope that is decided at run time is not judged', filename: app, code: scrolled('', '<ScrollArea className="flex-1"><EmptyState scope={rows.length ? "section" : "page"} message="Nothing here yet." /></ScrollArea>') },
    { name: "a component that hands its className to a section state (Ship's Activity), followed and fine", filename: app, code: scrolled("import { Activity } from '@/components/Activity'", '<ScrollArea className="flex-1" contentClassName="px-6"><section><Activity items={rows} /></section></ScrollArea>') },
  ],
  invalid: [
    // the hand-made line, each way it stands in for a list
    { name: 'the other side of a map (Ship Board.tsx:61 at 6693025)', code: jsx('<div className="flex flex-col gap-1.5">{rows.length === 0 ? <p className="px-1 py-2 text-caption text-text-muted">Nothing here</p> : rows.map((r) => <p key={r}>{r}</p>)}</div>'), errors: handmade },
    { name: 'same shape, other class names and another tag (FilePicker.stories.tsx:25)', code: jsx('<ul className="flex flex-col gap-1 text-body-2">{rows.length === 0 ? <li>Nothing chosen yet.</li> : rows.map((r) => <li key={r}>{r}</li>)}</ul>'), errors: handmade },
    { name: 'a map on the other side is enough, whatever the test', code: jsx('<div>{rows[0] === undefined ? <span className="text-caption">Nothing here yet.</span> : rows.map((r) => <p key={r}>{r}</p>)}</div>'), errors: handmade },
    { name: 'under a test that the list is empty, in a box around it (CommandLauncher.tsx:1716 at d094006)', code: jsx('<div>{rows.length === 0 && (\n<div className="flex items-center h-12 px-3">\n<span className="text-[14px] text-text-secondary">Nothing for that here.</span>\n</div>\n)}</div>'), errors: handmade },
    { name: 'returned when the list is empty', code: component('  if (rows.length === 0) return <p className="text-body-2">No tickets in this project yet.</p>\n  return <ul>{rows.map((r) => <li key={r}>{r}</li>)}</ul>'), errors: handmade },
    { name: "the empty side is the second: `rows.length ? … : …`", code: jsx('<div>{rows.length ? <Rows rows={rows} /> : <p>None yet.</p>}</div>'), errors: handmade },
    { name: '`!rows.length`', code: jsx('<div>{!rows.length && <p>Nothing to show.</p>}</div>'), errors: handmade },
    { name: 'optional chaining', code: jsx('<div>{rows?.length === 0 && <p>Nothing in it yet.</p>}</div>'), errors: handmade },
    {
      name: "words that do not say \"no\": Peek's dialogs (StartTopicDialog.tsx:106), and a name in the sentence",
      code: jsx('<Dialog>{choosing && rows.length === 0 ? (\n<p className="text-body-2 text-text-secondary">There is nowhere in {report} to start one yet — make a folder first.</p>\n) : (\n<Form />\n)}</Dialog>'),
      errors: handmade,
    },
    {
      name: 'an escape with no reason is not an escape',
      code: jsx('<div>{rows.length === 0 ? (\n// @estiva-escape(no-handmade-empty-state)\n<p>Nothing to print.</p>\n) : rows.map((r) => <p key={r}>{r}</p>)}</div>'),
      errors: [{ messageId: 'escapeWithoutReason' }, ...handmade],
    },

    // the wrong scope
    { name: 'a page state straight inside a ScrollArea', filename: app, code: scrolled('', '<ScrollArea className="min-h-0 flex-1">{rows.length === 0 && <EmptyState message="Nothing here yet." />}</ScrollArea>'), errors: [{ messageId: 'wrongScope' }] },
    { name: 'scope="page" said out loud', filename: app, code: scrolled('', '<ScrollArea className="flex-1" contentClassName="flex flex-col gap-3 p-4"><EmptyState scope="page" message="Nothing here yet." /></ScrollArea>'), errors: [{ messageId: 'wrongScope' }] },
    { name: "through the app's wrapper, one box down", filename: app, code: "import { ScrollArea } from '@estiva-app/ui'\nimport { EmptyState } from '@/components/ui/EmptyState'\nexport function Probe() {\n  return <ScrollArea className=\"flex-1\"><div className=\"p-4\"><EmptyState message=\"Nothing said about this yet.\" /></div></ScrollArea>\n}\n", errors: [{ messageId: 'wrongScope' }] },
    {
      name: 'the file conversation at 7f22e5e~1: a view drawn in another file, scrolled here — both its states',
      filename: app,
      code: scrolled("import { ForeignConversationView } from '@/components/views/ForeignConversationView'", '<ScrollArea className="min-h-0 flex-1">\n<ForeignConversationView state={rows} />\n</ScrollArea>'),
      errors: [
        { messageId: 'wrongScopeVia', data: { component: 'ForeignConversationView', where: 'ForeignConversationView.tsx:3' } },
        { messageId: 'wrongScopeVia', data: { component: 'ForeignConversationView', where: 'ForeignConversationView.tsx:4' } },
      ],
    },
    {
      name: 'the nested children at 7f22e5e~1: a page state under one row of a list, two components down in another file',
      filename: app,
      code: scrolled("import { FolderContentsView } from '@/components/views/FolderContentsView'", '<ScrollArea className="min-h-0 flex-1">\n<FolderContentsView files={rows} />\n</ScrollArea>'),
      errors: [{ messageId: 'wrongScopeVia', data: { component: 'FolderContentsView', where: 'FolderContentsView.tsx:11' } }],
    },
    {
      name: 'a component in the same file',
      filename: app,
      code: "import { ScrollArea, EmptyState } from '@estiva-app/ui'\nfunction Replies({ rows }: { rows: string[] }) {\n  if (rows.length === 0) return <EmptyState message=\"No replies yet.\" />\n  return <>{rows.map((r) => <p key={r}>{r}</p>)}</>\n}\nexport function Probe({ rows }: { rows: string[] }) {\n  return <ScrollArea className=\"flex-1\"><Replies rows={rows} /></ScrollArea>\n}\n",
      errors: [{ messageId: 'wrongScopeVia', data: { component: 'Replies', where: 'line 3' } }],
    },
  ],
})
