/// <reference types="node" />
/**
 * UIG-13: an app's catalogue. Every case below is one a real app has, or one
 * that broke the first draft of the reader against Peek and Ship:
 *
 * - a file's description sits at the very top, above its imports (Ship's style);
 * - a part draws nothing and is only ever used as a tag (a listener, a provider);
 * - `export { A, B } from '@estiva-app/ui'` is one statement handing on two parts;
 * - a card is only drawn by the list in its own file;
 * - a page is loaded with `lazy(() => import('./Page'))`, and the app itself with
 *   `const { default: App } = await import('./App.tsx')`;
 * - a part is reached through a barrel file;
 * - a part's type comes from a file that imports an app's data package.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { buildAppRegistry } from './app'
import { findInRegistries, formatFindings } from './find'
import { validateRegistry, type Registry, type RegistryEntry } from './schema'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const packageRegistry = JSON.parse(readFileSync(join(repoRoot, 'registry.json'), 'utf8')) as Registry
const made: string[] = []
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true })
})

/** Write an app into a fresh folder and return the folder. */
function app(files: Record<string, string>, manifest: object = { name: 'fixture-app', version: '1.2.3', scripts: { storybook: 'storybook dev -p 6123' } }): string {
  const dir = mkdtempSync(join(tmpdir(), 'uig13-'))
  made.push(dir)
  writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest))
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
  return dir
}

const FIXTURE: Record<string, string> = {
  // Comments in a tsconfig, as Peek writes them.
  'tsconfig.app.json': '{\n  // the alias\n  "compilerOptions": { "paths": { "@/*": ["./src/*"] } }\n}\n',
  'src/main.tsx': "void (async () => {\n  const { default: App } = await import('./App.tsx')\n  void App\n})()\n",
  'src/App.tsx': [
    "import { Frame } from '@/components/Frame'",
    "import { TopicSync } from '@/components/Sync'",
    "import { CtxProvider } from '@/components/Ctx'",
    "import { HomePage } from './pages/HomePage'",
    '',
    '/** The whole app: its frame and its one page. */',
    'export default function App() {',
    '  return <CtxProvider value={1}><TopicSync /><Frame><HomePage /></Frame></CtxProvider>',
    '}',
    '',
  ].join('\n'),
  'src/components/ui/Button.tsx': "/** Hands on the package's Button. */\nexport { Button, type ButtonProps } from '@estiva-app/ui'\n",
  'src/components/ui/Menu.tsx': "export { Menu, MenuItem } from '@estiva-app/ui'\n",
  'src/components/Frame.tsx': [
    '/**',
    ' * The frame every page sits in, with room for a side panel.',
    ' *',
    ' * It is written once, at the top, above the imports.',
    ' */',
    "import { EmptyState } from '@estiva-app/ui'",
    "import type { ReactNode } from 'react'",
    '',
    'export interface FrameProps {',
    '  /** What sits inside. */',
    '  children?: ReactNode',
    "  side?: 'left' | 'right'",
    '}',
    '',
    'export function Frame({ children }: FrameProps) {',
    '  return <div>{children ?? <EmptyState message="x" />}</div>',
    '}',
    '',
  ].join('\n'),
  'src/components/Frame.stories.tsx': [
    "import type { Meta, StoryObj } from '@storybook/react-vite'",
    "import { Frame } from './Frame'",
    'const meta = {',
    "  title: 'Layout/Frame',",
    '  component: Frame,',
    '} satisfies Meta<typeof Frame>',
    'export default meta',
    'export const Default: StoryObj<typeof meta> = {}',
    'export const WithSidebar: StoryObj<typeof meta> = {}',
    '',
  ].join('\n'),
  'src/components/Card.tsx': [
    "import { Button } from '@/components/ui/Button'",
    '',
    'interface CardProps {',
    '  title: string',
    '}',
    '',
    '/** One row inside a card. */',
    'export function CardRow({ title }: CardProps) {',
    '  return <li>{title}</li>',
    '}',
    '',
    '/** A card that lists its rows and a button. */',
    'export function Card({ title }: CardProps) {',
    '  return <ul><CardRow title={title} /><Button>Go</Button></ul>',
    '}',
    '',
  ].join('\n'),
  'src/components/Card.test.tsx': "import { Card } from './Card'\nvoid Card\n",
  'src/api/types.ts': "import type { Doc } from 'convex/react'\nexport type Item = Doc & { at: number }\n",
  'src/components/timelineTypes.ts': "import type { Item } from '@/api/types'\nexport interface TimelineProps {\n  /** The things that happened, oldest first. */\n  items: Item[]\n}\n",
  'src/components/Timeline.tsx': [
    "import type { TimelineProps } from '@/components/timelineTypes'",
    '',
    '/** What happened to a thing, as a timeline. */',
    'export function Timeline({ items }: TimelineProps) {',
    '  return <ol>{items.map((i) => <li key={i.at} />)}</ol>',
    '}',
    '',
  ].join('\n'),
  'src/components/index.ts': "export { Timeline } from './Timeline'\n",
  'src/components/Sync.tsx': "import { useEffect } from 'react'\n\n/** Keeps the topic list in step with the relay, and draws nothing. */\nexport function TopicSync() {\n  useEffect(() => {}, [])\n  return null\n}\n",
  'src/components/Ctx.tsx': "import { createContext } from 'react'\n\nconst Ctx = createContext(0)\n/** Gives every part below it the number. */\nexport const CtxProvider = Ctx.Provider\nexport const ThemeContext = createContext('light')\n",
  'src/components/Lonely.tsx': '/** A part nothing uses. */\nexport function Lonely() {\n  return <span />\n}\n',
  'src/components/Shown.tsx': '/** A part only its story uses. */\nexport function Shown() {\n  return <span />\n}\n',
  'src/components/Shown.stories.tsx': "import { Shown } from './Shown'\nconst meta = { title: 'Shown', component: Shown }\nexport default meta\nexport const Plain = {}\n",
  'src/components/Wide.tsx': '/**\n * A general strip of things.\n * @registry reusable: general; one screen uses it so far\n */\nexport function Wide() {\n  return <div />\n}\n',
  'src/components/EmptyState.tsx': "import { EmptyState as Shared } from '@estiva-app/ui'\n\n/** The package's empty state, with this app's own default words. */\nexport function EmptyState() {\n  return <Shared message=\"Nothing here\" />\n}\n",
  'src/pages/Lazy.tsx': '/** A page loaded only when it is opened. */\nexport default function Lazy() {\n  return <main />\n}\n',
  'src/pages/HomePage.tsx': [
    "import { lazy } from 'react'",
    "import { Card } from '@/components/Card'",
    "import { Timeline } from '../components/Timeline'",
    "import { Wide } from '@/components/Wide'",
    "import { EmptyState } from '@/components/EmptyState'",
    "const Lazy = lazy(() => import('./Lazy'))",
    '',
    '/** The first page. */',
    'export function HomePage() {',
    '  return <><Card title="a" /><Timeline items={[]} /><Wide /><EmptyState /><Lazy /></>',
    '}',
    '',
  ].join('\n'),
  'src/pages/Other.tsx': [
    "import { Frame } from '@/components/Frame'",
    "import { Timeline } from '@/components'",
    "import { EmptyState } from '@/components/EmptyState'",
    '',
    '/** A second page. */',
    'export function Other() {',
    '  return <Frame><Timeline items={[]} /><EmptyState /></Frame>',
    '}',
    '',
  ].join('\n'),
  'src/hooks.tsx': "/** A hook, in a .tsx file. */\nexport function useThing() {\n  return 1\n}\n",
}

const root = app(FIXTURE)
const registry = buildAppRegistry({ root, repo: 'fixture', packageRegistry })
const entry = (name: string): RegistryEntry => {
  const found = registry.entries.find((candidate) => candidate.name === name)
  if (!found) throw new Error(`no entry called ${name}`)
  return found
}

describe("an app's catalogue", () => {
  it('validates against the schema it was built for', () => {
    expect(validateRegistry(registry)).toEqual([])
    expect(registry.builtFrom).toMatchObject({ kind: 'app', repo: 'fixture', package: 'fixture-app', packageVersion: '1.2.3', typeExports: 0 })
    expect(registry.storybook.devUrl).toBe('http://localhost:6123')
  })

  it('counts every .tsx outside stories and tests, and says why a file holds no part', () => {
    // main.tsx, App.tsx, 2 pass-ons, Frame, Card, Timeline, Sync, Ctx, Lonely, Shown, Wide, EmptyState, Lazy, HomePage, Other, hooks.tsx
    expect(registry.builtFrom.files).toBe(17)
    expect(registry.filesWithoutParts).toEqual([
      { file: 'src/hooks.tsx', reason: 'It exports no part, only useThing.' },
      { file: 'src/main.tsx', reason: 'It exports nothing.' },
    ])
    expect(registry.entries.length).toBe(registry.builtFrom.exports)
  })

  it('finds parts that draw nothing, by their use as a tag, and leaves a context alone', () => {
    expect(entry('TopicSync').app?.usedIn).toEqual(['src/App.tsx'])
    expect(entry('CtxProvider').purpose).toBe('Gives every part below it the number.')
    expect(registry.entries.some((candidate) => candidate.name === 'ThemeContext')).toBe(false)
    expect(registry.entries.some((candidate) => candidate.name === 'useThing')).toBe(false)
  })

  it('lists a pass-on once per name, even two in one statement, and says whose it is', () => {
    const menu = entry('Menu')
    expect(menu.app).toMatchObject({ class: 're-export', handsOn: 'Menu', written: false })
    expect(entry('MenuItem').app?.class).toBe('re-export')
    expect(menu.purposeFrom).toBe('package')
    expect(entry('Button').importPath).toBe('@/components/ui/Button')
  })

  it('reads a description written at the very top of a one-part file, above the imports', () => {
    expect(entry('Frame').purpose).toBe('The frame every page sits in, with room for a side panel.')
    expect(entry('Frame').purposeFrom).toBe('file')
  })

  it("counts a part's own file when another part there draws it, and ignores tests", () => {
    expect(entry('CardRow').app).toMatchObject({ class: 'one-off', usedIn: ['src/components/Card.tsx'] })
    expect(entry('Card').app?.usedIn).toEqual(['src/pages/HomePage.tsx'])
  })

  it('follows a barrel, a lazy page and a dynamic import of the default', () => {
    expect(entry('Timeline').app?.usedIn).toEqual(['src/pages/HomePage.tsx', 'src/pages/Other.tsx'])
    expect(entry('Lazy').app).toMatchObject({ class: 'one-off', usedIn: ['src/pages/HomePage.tsx'], defaultExport: true })
    expect(entry('App').app).toMatchObject({ class: 'one-off', usedIn: ['src/main.tsx'], defaultExport: true })
  })

  it("ties a part to its app through a type that comes from the app's data", () => {
    const timeline = entry('Timeline')
    expect(timeline.app).toMatchObject({ class: 'reusable', tiedTo: ['src/components/timelineTypes.ts'] })
    expect(timeline.props).toEqual([{ name: 'items', takes: 'Item[]', required: true, note: 'The things that happened, oldest first.' }])
  })

  it('offers a reusable part that uses only what the package has as a candidate to move there', () => {
    expect(entry('Frame').app).toMatchObject({ class: 'promote-candidate', tiedTo: [], usedIn: ['src/App.tsx', 'src/pages/Other.tsx'] })
    expect(entry('Frame').variants).toEqual([{ prop: 'side', values: ['left', 'right'] }])
  })

  it('says a part is unused, and whether only its stories reach it', () => {
    expect(entry('Lonely').app).toMatchObject({ class: 'unused', reason: 'Nothing uses it.' })
    expect(entry('Shown').app).toMatchObject({ class: 'unused', reason: 'No file of the app uses it; only its stories do.' })
  })

  it('takes a kind written beside the part, with its reason', () => {
    expect(entry('Wide').app).toMatchObject({ class: 'reusable', written: true, reason: 'general; one screen uses it so far', usedIn: ['src/pages/HomePage.tsx'] })
    expect(entry('Wide').purpose).toBe('A general strip of things.')
  })

  it("names the package's part of the same name", () => {
    expect(entry('EmptyState').app?.packageNamesake).toBe('EmptyState')
    expect(entry('Button').app?.packageNamesake).toBe(null)
  })

  it("links the story that shows a part, with Storybook's own ids", () => {
    expect(entry('Frame')).toMatchObject({ storyId: 'layout-frame--default', docsId: 'layout-frame--docs' })
    // Card appears in no story of its own.
    expect(entry('Card')).toMatchObject({ storyId: null, docsId: null })
  })
})

// Found by writing Peek's and Ship's first descriptions, 18 September: each of these
// left a part with a description the builder could not see, or a pass-on counted as a part.
describe('what the first descriptions found', () => {
  const faults = buildAppRegistry({
    root: app({
      // Peek's Skeleton.tsx: imported from the package, then exported on a line of its own.
      'src/Skeleton.tsx': "import { SkeletonBar, SkeletonRow, SkeletonList as Shared } from '@estiva-app/ui'\n\n/** Grey rows in the shape of a list, while it loads. */\nexport function SkeletonList() {\n  return <div><SkeletonBar /><SkeletonRow /></div>\n}\n\n/** Peek's name for the package's list placeholder. */\nexport const SkeletonSidebarList = Shared\n\nexport { SkeletonBar, SkeletonRow }\n",
      // A file with its own description at the very top, and one on its part.
      'src/Row.tsx': "/**\n * Everything about rows.\n */\nimport { useState } from 'react'\n\n/** One row of a list, with a hover state of its own. */\nexport function Row() {\n  const [on] = useState(false)\n  return <li>{String(on)}</li>\n}\n",
      // A class, described above itself, with its props from what it extends.
      'src/Boundary.tsx': "import { Component, type ReactNode } from 'react'\n\ninterface Props {\n  children?: ReactNode\n  /** What to say when a part crashes. */\n  label: string\n}\n\n/** Catches a part that crashes and says so, so the rest keeps working. */\nexport class Boundary extends Component<Props> {\n  render() {\n    return <div>{this.props.children}</div>\n  }\n}\n",
      // A barrel in two lines: it hands Row on, and does not use it.
      'src/parts.ts': "import { Row } from './Row'\nexport { Row }\n",
      'src/Page.tsx': "import { Row } from './parts'\nimport { Boundary } from './Boundary'\nimport { SkeletonList, SkeletonBar } from './Skeleton'\n\n/** The one page. */\nexport function Page() {\n  return <Boundary label=\"x\"><Row /><SkeletonList /><SkeletonBar /></Boundary>\n}\n",
      // Peek's SearchInput and EmptyState: typed by the package's own props, under another local name.
      'src/Search.tsx': "import { SearchInput as UiSearchInput, type SearchInputProps as UiSearchInputProps } from '@estiva-app/ui'\n\n/** The package's search field, with this app's own placeholder. */\nexport function Search({ placeholder = 'Find', ...rest }: UiSearchInputProps) {\n  return <UiSearchInput placeholder={placeholder} {...rest} />\n}\n",
      'src/Empty.tsx': "import { EmptyState as Shared, type EmptyStateProps } from '@estiva-app/ui'\n\ntype Props = Omit<EmptyStateProps, 'message'> & { message?: string }\n\n/** The package's empty state, with this app's own default words. */\nexport function Empty({ message = 'Nothing', ...rest }: Props) {\n  return <Shared message={message} {...rest} />\n}\n",
      // Found by the code review: a default by name, a default written as an expression,
      // and a property that happens to share a part's name.
      'src/AsDefault.tsx': "/** A page handed out as its file's default, by name. */\nfunction Quiet() {\n  return <p />\n}\nexport { Quiet as default }\n",
      'src/memo-page.tsx': "import { memo } from 'react'\n\n/** A page written as memo of an arrow, straight into the default. */\nexport default memo(({ title }: { title: string }) => <main>{title}</main>)\n",
      'src/Loader.tsx': "import { lazy } from 'react'\nimport Row from './TopicRow'\nimport Hidden from './rows'\n\nconst Quiet = lazy(() => import('./AsDefault'))\nconst Memo = lazy(() => import('./memo-page'))\n\n/** Loads two pages when they are opened. */\nexport function Loader() {\n  return <><Quiet /><Memo title=\"x\" /><Row /><Hidden /></>\n}\n",
      // Found by the second review: a part named and also its file's memo'd default; a default
      // that only wraps a local part; and the first of two parts, described right above itself.
      'src/TopicRow.tsx': "import { memo } from 'react'\n\n/** One topic as a row of a list. */\nexport function TopicRow() {\n  return <li />\n}\n\nexport default memo(TopicRow)\n",
      'src/rows.tsx': "import { memo } from 'react'\n\nfunction HiddenRow() {\n  return <li />\n}\n\n/** A row handed out only as its file's default, wrapped in memo. */\nexport default memo(HiddenRow)\n",
      'src/Pair.tsx': "import { useState } from 'react'\n\n/** The first of two parts, described right above itself. */\nexport function First() {\n  const [a] = useState(0)\n  return <i>{a}</i>\n}\n\n/** The second of two parts, described right above itself. */\nexport function Second() {\n  return <b />\n}\n",
      'src/Slots.tsx': "/** A header nothing draws. */\nexport function Header() {\n  return <header />\n}\n\nexport interface Slots {\n  Header: string\n}\n\nexport class Frame {\n  Header = 1\n}\n",
      // Peek's SlashMenu: naming itself for React's tools is not a use of itself.
      'src/Menu.tsx': "import { forwardRef } from 'react'\n\n/** The menu a slash opens while typing. */\nexport const SlashMenu = forwardRef<HTMLDivElement>((_, ref) => <div ref={ref} />)\nSlashMenu.displayName = 'SlashMenu'\n",
    }),
    repo: 'faults',
    packageRegistry,
  })
  const one = (name: string) => faults.entries.find((e) => e.name === name)

  it('an import exported on its own line is a pass-on, not a part', () => {
    expect(one('SkeletonBar')?.app).toMatchObject({ class: 're-export', handsOn: 'SkeletonBar' })
    expect(one('SkeletonRow')?.app?.class).toBe('re-export')
    expect(one('SkeletonList')?.purpose).toBe('Grey rows in the shape of a list, while it loads.')
  })

  // Found making the promote page: Peek's SkeletonSidebarList is the package's SkeletonList.
  it("`export const X = ImportedPart` is the package's part under a second name, handed on", () => {
    expect(one('SkeletonSidebarList')?.app).toMatchObject({ class: 're-export', handsOn: 'SkeletonList' })
    expect(one('SkeletonSidebarList')?.purpose).toBe("The package's SkeletonList, handed on as SkeletonSidebarList so the app can import it from src/Skeleton.")
  })

  it("a part's own comment counts when the file has its own at the top", () => {
    expect(one('Row')).toMatchObject({ purpose: 'One row of a list, with a hover state of its own.', purposeFrom: 'comment' })
  })

  it('a class is read, comment and props', () => {
    expect(one('Boundary')?.purpose).toBe('Catches a part that crashes and says so, so the rest keeps working.')
    expect(one('Boundary')?.props.map((prop) => prop.name)).toEqual(['children', 'label'])
  })

  it('a file that only hands a part on is not a place that uses it', () => {
    expect(one('Row')?.app?.usedIn).toEqual(['src/Page.tsx'])
    expect(validateRegistry(faults)).toEqual([])
  })

  // Found by react-docgen, the second props reader.
  it("a wrapper typed by the package's props takes what the package's part takes", () => {
    const shared = (name: string) => packageRegistry.entries.find((entry) => entry.name === name)!
    expect(one('Search')?.props).toEqual(shared('SearchInput').props)
    const empty = one('Empty')!.props
    expect(empty.find((prop) => prop.name === 'message')).toEqual({ name: 'message', takes: 'text', required: false, note: null })
    expect(empty.map((prop) => prop.name).sort()).toEqual(shared('EmptyState').props.map((prop) => prop.name).sort())
  })

  // Found by the code review.
  it('`export { Quiet as default }` is a part, and a lazy page loading it uses it', () => {
    expect(one('Quiet')).toMatchObject({ purpose: "A page handed out as its file's default, by name." })
    expect(one('Quiet')?.app).toMatchObject({ usedIn: ['src/Loader.tsx'], defaultExport: true })
  })

  it('a default written as an expression is a part, named after its file, with its props', () => {
    expect(one('MemoPage')).toMatchObject({ purpose: 'A page written as memo of an arrow, straight into the default.', importPath: 'src/memo-page' })
    expect(one('MemoPage')?.app?.usedIn).toEqual(['src/Loader.tsx'])
    expect(one('MemoPage')?.props.map((prop) => prop.name)).toEqual(['title'])
  })

  it("a property of a type or a class that shares a part's name is not a use of it", () => {
    expect(one('Header')?.app).toMatchObject({ class: 'unused', usedIn: [] })
    expect(faults.entries.some((entry) => entry.name === 'Frame')).toBe(false)
  })

  // Found by the second review.
  it('`export default memo(TopicRow)` beside `export function TopicRow` is one part, and a default import uses it', () => {
    expect(faults.entries.filter((entry) => entry.name === 'TopicRow')).toHaveLength(1)
    expect(one('TopicRow')?.app?.usedIn).toEqual(['src/Loader.tsx'])
  })

  it('a default that only wraps a local part is that part, with the comment on the export', () => {
    expect(one('HiddenRow')).toMatchObject({ purpose: "A row handed out only as its file's default, wrapped in memo.", sourceFile: 'src/rows.tsx' })
    expect(one('HiddenRow')?.app?.usedIn).toEqual(['src/Loader.tsx'])
  })

  it("the first of several parts keeps the comment written right above it", () => {
    expect(one('First')).toMatchObject({ purpose: 'The first of two parts, described right above itself.', purposeFrom: 'comment' })
  })

  // Found by the second counter.
  it('setting displayName on a part is not a use of it', () => {
    expect(one('SlashMenu')?.app).toMatchObject({ class: 'unused', usedIn: [] })
  })
})

// The third /code-review pass, 18 September: ten more ways a real file can mislead the
// catalogue, each confirmed there on a throwaway app, each one case here.
describe('what the third review found', () => {
  const third = buildAppRegistry({
    root: app({
      'tsconfig.json': '{ "compilerOptions": { "baseUrl": "." } }\n',
      'src/Choice.tsx': "/** A choice, taken as text or as a number. */\nexport function Choice(props: { value: string }): JSX.Element\nexport function Choice(props: { value: number }): JSX.Element\nexport function Choice(props: { value: string | number }) {\n  return <span>{String(props.value)}</span>\n}\n",
      'src/Kbd.tsx': '/** One key, drawn as a keycap. */\nexport function Kbd() {\n  return <kbd />\n}\n\n/** Keys in a row. */\nexport function KbdRow() {\n  return <span><Kbd /></span>\n}\n',
      'src/Guard.tsx': "import { Component } from 'react'\n\ninterface Props {\n  /** What it guards. */\n  label: string\n}\n\n/** Something else in the file. */\nexport function Other() {\n  return <i />\n}\n\n/** Catches what crashes below it. */\nexport default class extends Component<Props> {\n  render() {\n    return <div>{this.props.label}</div>\n  }\n}\n",
      'src/List.tsx': "import { memo } from 'react'\n\n/** One row of the list. */\nexport function Row() {\n  return <li />\n}\n\n/** The list, drawing its rows. */\nexport default memo(function List() {\n  return <ul><Row /></ul>\n})\n",
      'src/parts/Card.tsx': '/** A card. */\nexport function Card() {\n  return <div />\n}\n',
      'src/parts/index.ts': "export * as Parts from './Card'\n",
      'src/UsesCard.tsx': "import { Parts } from './parts'\n\n/** Draws a card through a namespace. */\nexport function UsesCard() {\n  return <Parts.Card />\n}\n",
      'src/Badge.tsx': '/** A small badge. */\nexport function Badge() {\n  return <b />\n}\n',
      'src/UsesBadge.tsx': "import { Badge } from 'src/Badge'\n\n/** Draws a badge, imported through baseUrl. */\nexport function UsesBadge() {\n  return <Badge />\n}\n",
      'src/Settings.tsx': '/** The settings page. */\nexport function SettingsPage() {\n  return <main />\n}\n\n/** One settings row. */\nexport function SettingsRow() {\n  return <li />\n}\n',
      'src/routes.tsx': "import { lazy } from 'react'\n\nconst Page = lazy(() => import('./Settings').then((m) => ({ default: m.SettingsPage })))\n\n/** The routes. */\nexport function Routes() {\n  return <Page />\n}\n",
      'src/Icon.tsx': '/** An icon nothing uses. */\nexport function Icon() {\n  return <svg />\n}\n\n/** An item that draws the icon it is given. */\nexport function Item({ icon: Icon }: { icon: () => JSX.Element }) {\n  return <Icon />\n}\n',
      'src/profile/index.tsx': "/** The profile folder's page. */\nexport default function () {\n  return <section />\n}\n",
      'src/Wrapped.tsx': "import { memo } from 'react'\nimport { Avatar } from '@estiva-app/ui'\n\n/** The package's avatar, memoised for long lists. */\nexport default memo(Avatar)\n",
      'src/Tag.tsx': "import type { FC } from 'react'\n\ninterface TagProps {\n  /** The words on the tag. */\n  label: string\n}\n\n/** A tag, typed as a function component. */\nexport const Tag: FC<TagProps> = ({ label }) => <em>{label}</em>\n",
      // Found by the narrow pass on those fixes.
      'src/routesTable.ts': 'export const routes: unknown[] = []\n',
      'src/router.tsx': "import { createBrowserRouter } from 'react-router-dom'\nimport { routes } from './routesTable'\n\nexport default createBrowserRouter(routes)\n",
      'src/Chip.tsx': "import { forwardRef, memo, type ComponentType } from 'react'\n\n/** A chip nothing uses. */\nexport function Chip() {\n  return <i />\n}\n\nexport default memo(forwardRef(Chip)) as ComponentType\n",
    }),
    repo: 'third',
    packageRegistry,
  })
  const one = (name: string) => third.entries.find((entry) => entry.name === name)

  it('builds and validates', () => {
    expect(validateRegistry(third)).toEqual([])
  })

  it('an overloaded part is one entry, described by its first signature', () => {
    expect(third.entries.filter((entry) => entry.name === 'Choice')).toHaveLength(1)
    expect(one('Choice')).toMatchObject({ purpose: 'A choice, taken as text or as a number.' })
    expect(one('Choice')?.props.map((prop) => prop.name)).toEqual(['value'])
  })

  it('in a file with no imports, the first part keeps its own comment', () => {
    expect(one('Kbd')).toMatchObject({ purpose: 'One key, drawn as a keycap.', purposeFrom: 'comment' })
  })

  it('an unnamed default class is a part, named after its file, with its comment and props', () => {
    expect(one('Guard')).toMatchObject({ purpose: 'Catches what crashes below it.' })
    expect(one('Guard')?.props.map((prop) => prop.name)).toEqual(['label'])
  })

  it('a use inside a default written as an expression counts', () => {
    expect(one('Row')?.app?.usedIn).toEqual(['src/List.tsx'])
    expect(one('List')?.purpose).toBe('The list, drawing its rows.')
  })

  it('`export * as Parts` is followed to the parts', () => {
    expect(one('Card')?.app?.usedIn).toEqual(['src/UsesCard.tsx'])
  })

  it("an import through tsconfig's baseUrl is the app's own file, not a package", () => {
    expect(one('Badge')?.app?.usedIn).toEqual(['src/UsesBadge.tsx'])
    expect(one('UsesBadge')?.app?.tiedTo).toEqual([])
  })

  it('a lazy page that picks one name uses that part only', () => {
    expect(one('SettingsPage')?.app?.usedIn).toEqual(['src/routes.tsx'])
    expect(one('SettingsRow')?.app?.usedIn).toEqual([])
  })

  it("a local name that shadows a part's is not a use of it", () => {
    expect(one('Icon')?.app).toMatchObject({ class: 'unused', usedIn: [] })
  })

  it("an unnamed default in a folder's index.tsx is named after the folder", () => {
    expect(one('Profile')).toMatchObject({ purpose: "The profile folder's page.", sourceFile: 'src/profile/index.tsx' })
  })

  it("a part typed `FC<Props>` takes the annotation's props", () => {
    expect(one('Tag')?.props).toEqual([{ name: 'label', takes: 'text', required: true, note: 'The words on the tag.' }])
  })

  it('a default that wraps something that is not a part adds no part', () => {
    expect(third.entries.some((entry) => entry.sourceFile === 'src/router.tsx')).toBe(false)
    expect(third.filesWithoutParts.map((file) => file.file)).toContain('src/router.tsx')
  })

  it('a default that hands a part out, however wrapped, is not a use of it', () => {
    expect(third.entries.filter((entry) => entry.name === 'Chip')).toHaveLength(1)
    expect(one('Chip')?.app).toMatchObject({ class: 'unused', usedIn: [] })
  })

  it('memo of a package part is a new part of the app, not a pass-on', () => {
    expect(one('Wrapped')?.app).toMatchObject({ class: 'unused', handsOn: null, defaultExport: true })
    expect(one('Wrapped')?.purpose).toBe("The package's avatar, memoised for long lists.")
    expect(third.entries.some((entry) => entry.name === 'Avatar')).toBe(false)
  })
})

describe('an app the catalogue refuses', () => {
  const refused = (files: Record<string, string>) => {
    try {
      buildAppRegistry({ root: app(files), repo: 'x', packageRegistry })
      return ''
    } catch (error) {
      return (error as Error).message
    }
  }

  it('names every part with no description, and where to write it', () => {
    const message = refused({
      'src/One.tsx': 'export function One() {\n  return <i />\n}\n',
      'src/Two.tsx': 'export function Alpha() {\n  return <i />\n}\nexport function Beta() {\n  return <Alpha />\n}\n',
    })
    expect(message).toContain('One in src/One.tsx has no one-line description. Write one as a /** … */ comment directly above it, or at the top of the file.')
    // A file of two parts: the top of the file would describe neither.
    expect(message).toContain('Alpha in src/Two.tsx has no one-line description. Write one as a /** … */ comment directly above it.')
    expect(message).toContain('Beta in src/Two.tsx')
  })

  it('a kind nobody may write', () => {
    expect(refused({ 'src/One.tsx': '/**\n * One.\n * @registry unused: gone\n */\nexport function One() {\n  return <i />\n}\n' })).toMatch(/the kinds a person may write are reusable, one-off, promote-candidate/)
  })

  it('export * from a package, which hides what it hands on', () => {
    expect(refused({ 'src/All.tsx': "export * from '@estiva-app/ui'\n" })).toMatch(/hands on everything from '@estiva-app\/ui' with export \*/)
  })
})

describe('validateRegistry, on an app', () => {
  const broken = (change: (copy: Registry) => void) => {
    const copy = JSON.parse(JSON.stringify(registry)) as Registry
    change(copy)
    return validateRegistry(copy).join(' ')
  }

  it('refuses a kind its evidence does not support', () => {
    expect(broken((copy) => (copy.entries.find((e) => e.name === 'Card')!.app!.class = 'reusable'))).toMatch(/Card\)\.app\.class is reusable, but its evidence \(1 uses, 0 ties\) says one-off/)
  })

  it('refuses a file that is neither a part nor listed', () => {
    expect(broken((copy) => copy.filesWithoutParts.pop())).toMatch(/but the app has 17 files/)
  })

  it('refuses a pass-on that says nothing of whose it is', () => {
    expect(broken((copy) => (copy.entries.find((e) => e.name === 'Menu')!.app!.handsOn = null))).toMatch(/handsOn is missing on a pass-on/)
  })

  it('allows two parts of one name in two files of an app', () => {
    const copy = JSON.parse(JSON.stringify(registry)) as Registry
    const twin = { ...copy.entries.find((e) => e.name === 'Lonely')!, sourceFile: 'src/components/Lonely2.tsx' }
    copy.entries.push(twin)
    copy.builtFrom.exports += 1
    copy.builtFrom.files! += 1
    expect(validateRegistry(copy)).toEqual([])
  })
})

describe('one search over the package and the apps', () => {
  it("answers with the app's part, and never lists a pass-on as a part of its own", () => {
    const found = findInRegistries([packageRegistry, registry], 'timeline')
    expect(found[0].entry).toMatchObject({ name: 'Timeline', repo: 'fixture' })
    expect(findInRegistries([packageRegistry, registry], 'menu', { limit: 50 }).every((f) => f.entry.app?.class !== 're-export')).toBe(true)
  })

  it("puts the package's part first when an app's matches as well", () => {
    const found = findInRegistries([packageRegistry, registry], 'EmptyState', { limit: 10 }).map((f) => `${f.entry.repo}:${f.entry.name}`)
    expect(found).toContain('fixture:EmptyState')
    expect(found.indexOf('estiva-ui:EmptyState')).toBeLessThan(found.indexOf('fixture:EmptyState'))
  })

  it("puts a package part whose name carries a word before an app's part answering as many (UIG-20)", () => {
    // "panel header" put an app's own `Header` above the package's `ContainerHeader`: its whole name is one of the words.
    const header = buildAppRegistry({
      root: app({ 'src/Header.tsx': '/** The top row of a panel: its title and its buttons. */\nexport function Header() {\n  return <header />\n}\n' }),
      repo: 'fixture',
    })
    const found = findInRegistries([packageRegistry, header], 'panel header', { limit: 5 }).map((f) => `${f.entry.repo}:${f.entry.name}`)
    expect(found[0]).toBe('estiva-ui:ContainerHeader')
    expect(found).toContain('fixture:Header')
  })

  it("does not let a package part the words reach only through its notes bury the app's answer", () => {
    const composer = buildAppRegistry({
      root: app({ 'src/Composer.tsx': '/** Where a comment is written and sent. */\nexport function Composer() {\n  return <form />\n}\n' }),
      repo: 'fixture',
    })
    expect(findInRegistries([packageRegistry, composer], 'comment composer')[0].entry).toMatchObject({ repo: 'fixture', name: 'Composer' })
  })

  it('says which apps hand a package part on, and how a default is imported', () => {
    const text = formatFindings([packageRegistry, registry], findInRegistries([packageRegistry, registry], 'Button', { limit: 1 }), 'Button')
    expect(text).toContain('fixture hands it on from @/components/ui/Button')
    const lazy = formatFindings([packageRegistry, registry], findInRegistries([packageRegistry, registry], 'Lazy', { limit: 1 }), 'Lazy')
    expect(lazy).toContain("import Lazy from '@/pages/Lazy'")
  })
})

// The command, as an app runs it: `dist/` is what `npm test` builds first.
const cli = join(repoRoot, 'dist', 'registry', 'cli.js')
describe.skipIf(!existsSync(cli))('estiva-ui in an app', () => {
  const run = (args: string[], cwd: string) => execFileSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

  it('check prints what it found, and fails on a part with no description', () => {
    const bare = app({ 'src/One.tsx': 'export function One() {\n  return <i />\n}\n' })
    expect(() => run(['check'], bare)).toThrow(/One in src\/One\.tsx has no one-line description/)
  })

  it('check fails a reusable part with no usage page, naming the page to write (UIG-19)', () => {
    // The fixture's reusable parts have no pages: it was written before the contract ran in `check`.
    let failed: { stdout?: string; stderr?: string } = {}
    try {
      run(['check', '--repo', 'fixture'], root)
    } catch (error) {
      failed = error as { stdout?: string; stderr?: string }
    }
    expect(failed.stdout).toMatch(/^fixture: 17 parts in 15 files \(2 more hold none\)/)
    expect(failed.stderr).toContain('Timeline (reusable, src/components/Timeline.tsx) has no usage page: write src/components/Timeline.mdx')
    const one = app({ 'src/One.tsx': '/** One, drawn once. */\nexport function One() {\n  return <i />\n}\n' })
    expect(run(['check'], one)).toContain('usage pages: all 0 reusable parts keep the contract')
  })

  it("find searches the app and the package, and never takes an app's own registry.json for the package's", () => {
    // What `estiva-ui build` leaves behind in an app, and git ignores.
    run(['build'], root)
    expect(existsSync(join(root, 'registry.json'))).toBe(true)
    const out = run(['find', 'timeline'], root)
    expect(out).toContain('Timeline  ·  used in several places  ·  fixture-app')
    expect(run(['find', 'popover'], root)).toContain('Popover  ·  component  ·  estiva-ui')
  })

  it('find brings in an app beside it with --also, and says when one is not there', () => {
    const other = app({ 'src/Orbit.tsx': '/** A ring of avatars around a centre. */\nexport function Orbit() {\n  return <i />\n}\n' }, { name: 'other-app' })
    const out = execFileSync(process.execPath, [cli, 'find', 'orbit', '--also', `other=${other}`, '--also', 'gone=./nowhere'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    expect(out).toContain('Orbit  ·  used nowhere in the app  ·  other')
  })
})
