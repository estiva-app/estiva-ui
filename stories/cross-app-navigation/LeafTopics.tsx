import { useState, type ReactNode } from 'react'
import { IconArchive, IconDots, IconExternalLink, IconHome } from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { Chip } from '../../src/Chip'
import { EmptyState } from '../../src/EmptyState'
import { KindIcon } from '../../src/KindIcon'
import { Link } from '../../src/Link'
import { Menu, MenuItem } from '../../src/Menu'
import { NavItem } from '../../src/NavItem'
import { NavTree, type NavTreeGroup, type NavTreeNode } from '../../src/NavTree'
import { PersonTrigger } from '../../src/PersonTrigger'
import { SectionLabel } from '../../src/SectionLabel'
import { Sidebar } from '../../src/Sidebar'
import { SkeletonList } from '../../src/Skeleton'
import { Header, go, icon16 } from './Lens'

/**
 * Leaf's Topics navigation, stage 2 (project "Leaf's Topics navigation",
 * decided 4 Nov): Home, then up to five of your topics, then the Folders tree
 * as Leaf draws it today, and a topic's own page in Leaf. Unlike Per app's
 * Leaf (29 Oct), there is no Starred: it comes with the one Desk. It still
 * says Folders; Teams arrive with "Teams and following".
 * A topic folds to everything Leaf opens, its pages, projects and issues (D1);
 * the five are the ones whose files you changed last (D2); a sixth and on sit
 * behind a quiet More that opens them in place (D3).
 */

type Person = 'miky' | 'katerina' | 'agent'
type FolderId = 'hq' | 'peek' | 'ship' | 'leaf' | 'agent'

interface Page { id: string; kind: 'file'; title: string; folder: FolderId; archived?: boolean }
interface Project { id: string; kind: 'project'; title: string; folder: FolderId; archived?: boolean }
interface Issue { id: string; kind: 'issue'; title: string; project: string; archived?: boolean }
type Item = Page | Project | Issue
/** `last`: how recently each person changed one of the files it lists, 1 the most recent. */
interface Topic { id: string; title: string; summary: string; folder: FolderId; members: Person[]; space?: boolean; lists: string[]; last: Partial<Record<Person, number>> }

const PEOPLE: Record<Person, string> = { miky: 'Miky', katerina: 'Katerina Kelepouri', agent: 'Estiva agent' }

const FOLDERS: { id: FolderId; name: string }[] = [
  { id: 'hq', name: 'Estiva HQ' },
  { id: 'peek', name: 'Peek' },
  { id: 'ship', name: 'Ship' },
  { id: 'leaf', name: 'Leaf' },
  { id: 'agent', name: 'Agent' },
]
const folderName = (id: FolderId) => FOLDERS.find((f) => f.id === id)!.name

const page = (id: string, title: string, folder: FolderId, archived?: boolean): Page => ({ id, kind: 'file', title, folder, archived })
const project = (id: string, title: string, folder: FolderId, archived?: boolean): Project => ({ id, kind: 'project', title, folder, archived })
const issue = (id: string, title: string, projectId: string, archived?: boolean): Issue => ({ id, kind: 'issue', title, project: projectId, archived })

const ITEMS: Item[] = [
  page('d-navigation', 'Navigation', 'hq'),
  page('d-meeting', 'Meeting notes', 'hq'),
  page('d-testing-widgets', 'Testing Widgets', 'hq'),
  page('d-picker-notes', 'Widget picker notes', 'hq', true),
  page('d-speed', 'Speed on Miky’s workspace', 'hq'),
  page('d-grant-research', 'Grant organisation research', 'hq'),
  page('d-grant-application', 'Application: first grant', 'hq'),
  page('d-protocol-names', 'Protocol names', 'hq'),
  page('d-brand', 'Brand guidelines', 'hq'),
  page('d-leaf-ideas', 'Leaf ideas', 'leaf'),
  project('p-leaf-nav', 'Leaf’s Topics navigation', 'leaf'),
  project('p-leaf-everyday', 'Leaf works for everyday documents', 'leaf'),
  project('p-teams', 'Teams and following', 'hq'),
  project('p-widgets-2', 'Widgets 2: build 2', 'hq'),
  project('p-widgets-1', 'Widgets 2: build 1', 'hq', true),
  project('p-read-only', 'Apps read only what they show', 'hq'),
  project('p-live', 'Live across apps', 'peek'),
  project('p-docs-2', 'docs.estiva.app 2: a grant reviewer sees what it can do', 'hq'),
  project('p-records-2', 'Decision records 2', 'agent'),
  project('p-agent-feedback', 'Agent: Feedback & Improvements', 'agent'),
  project('p-brand', 'Website refresh', 'hq'),
  project('p-peek-bugs', 'Peek: Feedback & Bugs', 'peek'),
  project('p-ship-bugs', 'Ship: Feedback & Bugs', 'ship'),
  project('p-launch', 'Public launch, first wave', 'hq', true),
  issue('i-proto', 'Leaf’s sidebar and a topic’s page, prototyped', 'p-leaf-nav'),
  issue('i-build', 'Leaf’s sidebar shows your topics', 'p-leaf-nav'),
  issue('i-rename', 'Folders are called Teams in every app', 'p-teams'),
  issue('i-widget-title', 'A widget card shows its title', 'p-widgets-2'),
  issue('i-widget-height', 'Widget embeds keep their height on a phone', 'p-widgets-2'),
  issue('i-widget-picker', 'Pick a widget from the composer', 'p-widgets-1', true),
  issue('i-ship-copy', 'Ship opens from a copy on the device', 'p-read-only'),
  issue('i-grant-form', 'Fill in the first grant’s form', 'p-docs-2'),
  issue('i-brand-colours', 'New colours on the website', 'p-brand'),
  issue('i-unread-dot', 'The unread dot stays after reading', 'p-peek-bugs'),
  issue('i-launch-post', 'Launch post', 'p-launch', true),
]
const itemOf = (id: string) => ITEMS.find((i) => i.id === id)!
const folderOf = (item: Item): FolderId => (item.kind === 'issue' ? (itemOf(item.project) as Project).folder : item.folder)
const TYPE: Record<Item['kind'], string> = { file: 'Page', project: 'Project', issue: 'Issue' }

const TOPICS: Topic[] = [
  { id: 'navigation', title: 'Navigation', summary: 'How you find your way across Peek, Ship and Leaf: teams and topics.', folder: 'hq', members: ['miky', 'katerina'], last: { miky: 1, katerina: 2 }, lists: ['p-leaf-nav', 'i-proto', 'p-teams', 'd-navigation', 'd-meeting'] },
  { id: 'fast', title: 'Peek, Ship and Leaf are fast', summary: 'Every app opens in under a second on a workspace Miky’s size.', folder: 'hq', members: ['miky'], last: { miky: 2 }, lists: ['p-read-only', 'p-live', 'i-ship-copy', 'd-speed'] },
  { id: 'widgets', title: 'Widgets', summary: 'Small live cards you put in a conversation or a document.', folder: 'hq', members: ['miky', 'katerina'], last: { miky: 3, katerina: 1 }, lists: ['p-widgets-2', 'i-widget-title', 'i-widget-height', 'd-testing-widgets', 'p-widgets-1', 'i-widget-picker', 'd-picker-notes'] },
  { id: 'grants', title: 'Grants', summary: 'Grants that fund the protocol work, and what each one asks for.', folder: 'hq', members: ['miky'], last: { miky: 4 }, lists: ['p-docs-2', 'i-grant-form', 'd-grant-research', 'd-grant-application'] },
  { id: 'records', title: 'Decision records', summary: 'Why Estiva is the way it is, written down.', folder: 'agent', members: ['miky', 'agent'], last: { miky: 5 }, lists: ['p-records-2', 'p-agent-feedback'] },
  // The sixth and seventh of Miky's: behind More.
  { id: 'naming', title: 'Naming the protocol', summary: '', folder: 'hq', members: ['miky'], last: { miky: 6 }, lists: ['d-protocol-names'] },
  { id: 'triage', title: 'Feedback triage', summary: 'Bugs and feedback from the apps, sorted every week.', folder: 'peek', members: ['miky', 'katerina'], last: { miky: 7, katerina: 4 }, lists: ['p-peek-bugs', 'p-ship-bugs', 'i-unread-dot'] },
  { id: 'brand', title: 'Brand', summary: 'How Estiva looks, from the website to the apps.', folder: 'hq', members: ['katerina'], last: { katerina: 3 }, lists: ['p-brand', 'i-brand-colours', 'd-brand'] },
  // Every file it lists is archived: not in the sidebar.
  { id: 'launch', title: 'Public launch', summary: 'The first public wave.', folder: 'hq', members: ['miky', 'katerina'], last: { miky: 8, katerina: 5 }, lists: ['p-launch', 'i-launch-post'] },
  // A space is a team's place to talk, never a page's topic (Miky, 2 Nov).
  { id: 'bugs', title: 'bugs', summary: '', folder: 'peek', members: ['miky', 'katerina'], space: true, last: { miky: 0, katerina: 0 }, lists: ['i-unread-dot'] },
]
const topicOf = (id: string) => TOPICS.find((t) => t.id === id)!

/** Pages first, then projects, then issues: Leaf's own files lead. */
const ORDER: Record<Item['kind'], number> = { file: 0, project: 1, issue: 2 }
const filesOf = (topic: Topic) => topic.lists.map(itemOf).sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
const liveFilesOf = (topic: Topic) => filesOf(topic).filter((i) => !i.archived)
/** Under Topics: yours, not a space, and it lists a file that is not archived. Ordered by your last change to one of its files. */
const topicsOf = (viewer: Person) =>
  TOPICS.filter((t) => !t.space && t.members.includes(viewer) && liveFilesOf(t).length > 0).sort((a, b) => (a.last[viewer] ?? 99) - (b.last[viewer] ?? 99))

const FIVE = 5

type Place = { type: 'home' } | { type: 'topic'; id: string } | { type: 'file'; id: string }
const same = (a: Place, b: Place) => JSON.stringify(a) === JSON.stringify(b)

/** How the shared read of every topic stands; the Folders are read as today. */
export type TopicsRead = 'ok' | 'loading' | 'failed'

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">{children}</div>
}

/** A file as a row: its icon says its type, and its title. */
function FileRow({ item, onOpen }: { item: Item; onOpen: (p: Place) => void }) {
  return (
    <button type="button" onClick={() => onOpen({ type: 'file', id: item.id })} className="flex items-center gap-3 px-3 py-2 text-left hover:bg-bg-hover">
      <KindIcon kind={item.kind} />
      <span className={`min-w-0 flex-1 truncate text-body-2 ${item.archived ? 'text-text-muted' : 'text-text-primary'}`}>{item.title}</span>
    </button>
  )
}

function Page({ title, icon, children, right, sub }: { title: string; icon?: ReactNode; children: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title={title} icon={icon} right={right}>
        {sub}
      </Header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">{children}</div>
    </div>
  )
}

/** A topic's page in Leaf: its summary, what it lists opening in Leaf, the archived behind a link, and its conversation in Peek. */
function TopicPage({ topic, read, onRetry, onOpen }: { topic: Topic; read: TopicsRead; onRetry: () => void; onOpen: (p: Place) => void }) {
  const [showArchived, setShowArchived] = useState(false)
  const live = liveFilesOf(topic)
  const gone = filesOf(topic).filter((i) => i.archived)
  const peek = (
    <Link href="#" external variant="quiet" className="flex items-center gap-1 text-body-2" onClick={go(() => {})}>
      Conversation in Peek
      <IconExternalLink size={14} stroke={1.5} />
    </Link>
  )
  if (read !== 'ok')
    return (
      <Page title={topic.title} icon={<KindIcon kind="topic" />} right={peek}>
        {read === 'loading' ? <SkeletonList rows={6} /> : <EmptyState scope="page" message="This topic didn’t load." action={{ label: 'Try again', onClick: onRetry }} />}
      </Page>
    )
  return (
    <Page title={topic.title} icon={<KindIcon kind="topic" />} right={peek} sub={<span className="text-caption text-text-muted">{folderName(topic.folder)}</span>}>
      {topic.summary && <p className="text-body-2 text-text-secondary">{topic.summary}</p>}
      {live.length > 0 ? (
        <Rows>{live.map((i) => <FileRow key={i.id} item={i} onOpen={onOpen} />)}</Rows>
      ) : (
        <p className="text-body-2 text-text-secondary">Everything it lists is archived.</p>
      )}
      {gone.length > 0 &&
        (showArchived || live.length === 0 ? (
          <div className="flex flex-col gap-2">
            <SectionLabel tone="muted">Archived</SectionLabel>
            <Rows>{gone.map((i) => <FileRow key={i.id} item={i} onOpen={onOpen} />)}</Rows>
          </div>
        ) : (
          <Link href="#" variant="quiet" className="flex items-center gap-1 self-start text-body-2 text-text-secondary" onClick={go(() => setShowArchived(true))}>
            <IconArchive {...icon16} />
            Archived · {gone.length}
          </Link>
        ))}
    </Page>
  )
}

/** A page, project or issue, drawn only as far as its "Topics: …" line, which now opens the topic's page in Leaf. */
function FilePage({ item, read, onOpen }: { item: Item; read: TopicsRead; onOpen: (p: Place) => void }) {
  const topics = read === 'ok' ? TOPICS.filter((t) => !t.space && t.lists.includes(item.id)) : []
  return (
    <Page title={item.title} icon={<KindIcon kind={item.kind} />} sub={<span className="text-caption text-text-muted">{folderName(folderOf(item))}</span>}>
      {topics.length > 0 && (
        <p className="flex flex-wrap items-center gap-1 text-body-2 text-text-secondary">
          Topics:
          {topics.map((t, n) => (
            <span key={t.id}>
              <Link href="#" variant="quiet" className="text-text-primary" onClick={go(() => onOpen({ type: 'topic', id: t.id }))}>{t.title}</Link>
              {n < topics.length - 1 && ','}
            </span>
          ))}
        </p>
      )}
      <p className="text-caption text-text-muted">The rest of the page is as today{item.kind === 'file' ? '' : ', with Open in Ship'}.</p>
    </Page>
  )
}

function HomePage() {
  return (
    <Page title="Home" icon={<IconHome {...icon16} />}>
      <p className="text-caption text-text-muted">Home as today: Recent, the pages you changed last.</p>
    </Page>
  )
}

/** A file under a topic, as a sidebar row: the same row Leaf's tree draws for it. */
function fileNavRow(item: Item, place: Place, onOpen: (p: Place) => void) {
  return (
    <NavItem
      key={item.id}
      href="#"
      label={item.title}
      icon={<KindIcon kind={item.kind} />}
      hint={item.kind === 'file' ? undefined : <Chip type="neutral" label={TYPE[item.kind]} />}
      active={same(place, { type: 'file', id: item.id })}
      onClick={go(() => onOpen({ type: 'file', id: item.id }))}
    />
  )
}

/** Up to five of your topics, then a quiet More that opens the rest in place; none, and the section is not drawn. */
function TopicsSection({ viewer, read, count, place, folded, onFold, onOpen }: { viewer: Person; read: TopicsRead; count?: number; place: Place; folded: Set<string>; onFold: (id: string, open: boolean) => void; onOpen: (p: Place) => void }) {
  const [more, setMore] = useState(false)
  if (read === 'loading')
    return (
      <NavTree title="Topics">
        <SkeletonList rows={3} />
      </NavTree>
    )
  // In the words Leaf's Folders use when they fail.
  if (read === 'failed')
    return (
      <NavTree title="Topics">
        <div className="px-2 py-1">
          <EmptyState scope="section" message="Your topics could not be read. Reload to try again." />
        </div>
      </NavTree>
    )
  const all = topicsOf(viewer).slice(0, count)
  if (all.length === 0) return null
  const shown = more ? all : all.slice(0, FIVE)
  return (
    <NavTree title="Topics">
      {shown.map((t) => (
        <NavItem
          key={t.id}
          href="#"
          label={t.title}
          icon={<KindIcon kind="topic" />}
          active={same(place, { type: 'topic', id: t.id })}
          onClick={go(() => onOpen({ type: 'topic', id: t.id }))}
          open={folded.has(t.id)}
          onOpenChange={(o) => onFold(t.id, o)}
        >
          {liveFilesOf(t).map((i) => fileNavRow(i, place, onOpen))}
        </NavItem>
      ))}
      {all.length > FIVE && <NavItem href="#" label={more ? 'Less' : 'More'} icon={<IconDots {...icon16} />} className="text-text-muted" onClick={go(() => setMore(!more))} />}
    </NavTree>
  )
}

/** Leaf's Folders tree as today: each Folder's pages and projects, a project folding to its issues; archived files left out. */
function folderGroups(open: Set<string>, onFold: (id: string, open: boolean) => void): NavTreeGroup[] {
  const node = (item: Item): NavTreeNode => {
    const issues = item.kind === 'project' ? ITEMS.filter((i): i is Issue => i.kind === 'issue' && i.project === item.id && !i.archived) : []
    return {
      id: item.id,
      label: item.title,
      href: '#',
      icon: <KindIcon kind={item.kind} />,
      hint: item.kind === 'file' ? undefined : <Chip type="neutral" label={TYPE[item.kind]} />,
      ...(issues.length > 0 ? { children: issues.map(node), open: open.has(item.id), onOpenChange: (o: boolean) => onFold(item.id, o) } : {}),
    }
  }
  return FOLDERS.map((f) => {
    const roots = ITEMS.filter((i) => i.kind !== 'issue' && i.folder === f.id && !i.archived)
    return { id: f.id, title: f.name, nodes: roots.map(node), message: roots.length === 0 ? 'Nothing in this yet.' : undefined, open: open.has(f.id), onOpenChange: (o) => onFold(f.id, o) }
  })
}

/** The Folder, and the project, a file sits under: what opens in the tree when it is opened. */
const treePathOf = (id: string): string[] => {
  const item = itemOf(id)
  return item.kind === 'issue' ? [folderOf(item), item.project] : [item.folder]
}

function ViewAs({ viewer, onViewer }: { viewer: Person; onViewer: (p: Person) => void }) {
  return (
    <Menu align="right" trigger={<PersonTrigger name={PEOPLE[viewer]} />}>
      <MenuItem label="View as Miky" selected={viewer === 'miky'} onClick={() => onViewer('miky')} />
      <MenuItem label="View as Katerina" selected={viewer === 'katerina'} onClick={() => onViewer('katerina')} />
    </Menu>
  )
}

export interface LeafTopicsProps {
  viewer?: 'miky' | 'katerina'
  start?: Place
  /** The topic read's state when the story opens; Try again turns a failed read into a loaded one. */
  read?: TopicsRead
  /** How many of the viewer's topics exist, first by your last change. Absent, all of them. */
  topics?: number
  /** Topics folded open when the story opens. */
  folded?: string[]
}

export type { Place as LeafPlace }

export function LeafTopics({ viewer: firstViewer = 'miky', start = { type: 'home' }, read: firstRead = 'ok', topics, folded: firstFolded = [] }: LeafTopicsProps) {
  const [viewer, setViewer] = useState<Person>(firstViewer)
  const [place, setPlace] = useState<Place>(start)
  const [read, setRead] = useState<TopicsRead>(firstRead)
  const [folded, setFolded] = useState<Set<string>>(() => new Set(firstFolded))
  const [tree, setTree] = useState<Set<string>>(() => new Set(start.type === 'file' ? treePathOf(start.id) : []))
  const toggle = (set: (f: (s: Set<string>) => Set<string>) => void) => (id: string, isOpen: boolean) =>
    set((now) => {
      const next = new Set(now)
      if (isOpen) next.add(id)
      else next.delete(id)
      return next
    })
  const foldTopic = toggle(setFolded)
  const foldTree = toggle(setTree)
  // Opening a file opens the Folders tree onto it, as Leaf does now, wherever it was clicked.
  const onOpen = (next: Place) => {
    setPlace(next)
    if (next.type === 'file') treePathOf(next.id).forEach((id) => foldTree(id, true))
  }
  const content =
    place.type === 'home' ? <HomePage /> : place.type === 'topic' ? <TopicPage key={place.id} topic={topicOf(place.id)} read={read} onRetry={() => setRead('ok')} onOpen={onOpen} /> : <FilePage item={itemOf(place.id)} read={read} onOpen={onOpen} />
  return (
    <div className="h-screen overflow-hidden">
      <AppShell
        variant="inset"
        logo={<span className="px-2 text-body-1 font-semibold text-text-primary">Leaf</span>}
        identity={<ViewAs viewer={viewer} onViewer={setViewer} />}
        nav={
          <Sidebar>
            <NavItem href="#" label="Home" icon={<IconHome {...icon16} />} active={place.type === 'home'} onClick={go(() => onOpen({ type: 'home' }))} />
            <TopicsSection key={viewer} viewer={viewer} read={read} count={topics} place={place} folded={folded} onFold={foldTopic} onOpen={onOpen} />
            <NavTree title="Folders" groups={folderGroups(tree, foldTree)} selected={place.type === 'file' ? place.id : undefined} onSelect={(node, e) => { e.preventDefault(); onOpen({ type: 'file', id: node.id }) }} />
          </Sidebar>
        }
      >
        {content}
      </AppShell>
    </div>
  )
}
