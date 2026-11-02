import { useState, type ReactNode } from 'react'
import { IconArchive, IconCircle, IconCircleCheck, IconExternalLink, IconFolder, IconHome, IconListCheck, IconProgress, IconTarget } from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { EmptyState } from '../../src/EmptyState'
import { KindIcon } from '../../src/KindIcon'
import { Link } from '../../src/Link'
import { Menu, MenuItem } from '../../src/Menu'
import { NavItem } from '../../src/NavItem'
import { PersonTrigger } from '../../src/PersonTrigger'
import { SectionLabel } from '../../src/SectionLabel'
import { Sidebar } from '../../src/Sidebar'
import { SkeletonList } from '../../src/Skeleton'
import { Header, go, icon16 } from './Lens'

/**
 * Ship's Topics navigation, stage 1 (project "Ship's Topics navigation",
 * decided 2 Nov): the sidebar Ship can draw today, Home, Topics and a topic's
 * page. Unlike Per app's Ship (29 Oct), there is no Views and no Starred, and
 * the sidebar still says Folders: Teams arrive with "Teams and following".
 * Its own data, shaped like Miky's workspace, because a topic here lists
 * issues as well as projects, and things get archived.
 */

type Person = 'miky' | 'katerina' | 'agent'
type FolderId = 'hq' | 'peek' | 'ship' | 'leaf' | 'agent'
type Status = 'todo' | 'in-progress' | 'done'

interface Project { id: string; kind: 'project'; title: string; folder: FolderId; lead: Person; members: Person[]; progress: string; archived?: boolean }
interface Issue { id: string; kind: 'issue'; title: string; project: string; status: Status; assignee: Person; archived?: boolean }
interface Doc { id: string; kind: 'document'; title: string }
type Item = Project | Issue | Doc
type Work = Project | Issue
interface Topic { id: string; title: string; folder: FolderId; members: Person[]; space?: boolean; lists: string[] }

const PEOPLE: Record<Person, string> = { miky: 'Miky', katerina: 'Katerina Kelepouri', agent: 'Estiva agent' }

const FOLDERS: { id: FolderId; name: string }[] = [
  { id: 'hq', name: 'Estiva HQ' },
  { id: 'peek', name: 'Peek' },
  { id: 'ship', name: 'Ship' },
  { id: 'leaf', name: 'Leaf' },
  { id: 'agent', name: 'Agent' },
]
const folderName = (id: FolderId) => FOLDERS.find((f) => f.id === id)!.name

const project = (id: string, title: string, folder: FolderId, progress: string, more: Partial<Project> = {}): Project =>
  ({ id, kind: 'project', title, folder, lead: 'miky', members: ['miky', 'agent'], progress, ...more })
const issue = (id: string, title: string, projectId: string, status: Status, assignee: Person, archived?: boolean): Issue =>
  ({ id, kind: 'issue', title, project: projectId, status, assignee, archived })
const doc = (id: string, title: string): Doc => ({ id, kind: 'document', title })

const ITEMS: Item[] = [
  project('p-nav', 'Ship’s Topics navigation', 'ship', '0 of 6', { members: ['miky', 'katerina', 'agent'] }),
  project('p-teams', 'Teams and following', 'hq', '2 of 8', { members: ['miky', 'katerina', 'agent'] }),
  project('p-topics-files', 'Topics group files', 'hq', '8 of 8'),
  project('p-read-only', 'Apps read only what they show', 'hq', '6 of 10'),
  project('p-live', 'Live across apps', 'peek', '1 of 3'),
  project('p-peek-bugs', 'Peek: Feedback & Bugs', 'peek', '4 of 9'),
  project('p-ship-bugs', 'Ship: Feedback & Bugs', 'ship', '5 of 8'),
  project('p-leaf-everyday', 'Leaf works for everyday documents', 'leaf', '7 of 11', { members: ['miky', 'katerina'] }),
  project('p-widgets-1', 'Widgets 2: build 1', 'hq', '6 of 6', { archived: true }),
  project('p-widgets-2', 'Widgets 2: build 2', 'hq', '4 of 5', { members: ['miky', 'katerina'] }),
  project('p-docs-2', 'docs.estiva.app 2: a grant reviewer sees what it can do', 'hq', '0 of 3'),
  project('p-records-2', 'Decision records 2', 'agent', '4 of 7'),
  project('p-agent-feedback', 'Agent: Feedback & Improvements', 'agent', '9 of 14'),
  project('p-brand', 'Website refresh', 'hq', '2 of 5', { lead: 'katerina', members: ['katerina'] }),
  project('p-launch', 'Public launch, first wave', 'hq', '9 of 9', { archived: true }),
  issue('i-proto', 'Ship’s new sidebar, Home, Topics and a topic’s page in the prototype', 'p-nav', 'in-progress', 'miky'),
  issue('i-read', 'Ship reads every topic once, and Add to topic uses it', 'p-nav', 'todo', 'agent'),
  issue('i-rename', 'Folders are called Teams in every app', 'p-teams', 'todo', 'agent'),
  issue('i-widget-title', 'A widget card shows its title', 'p-widgets-2', 'in-progress', 'katerina'),
  issue('i-widget-height', 'Widget embeds keep their height on a phone', 'p-widgets-2', 'todo', 'miky'),
  issue('i-widget-picker', 'Pick a widget from the composer', 'p-widgets-1', 'done', 'agent', true),
  issue('i-ship-copy', 'Ship opens from a copy on the device', 'p-read-only', 'in-progress', 'agent'),
  issue('i-peek-load', 'Peek drops the full topic load', 'p-read-only', 'todo', 'miky'),
  issue('i-grant-form', 'Fill in the first grant’s form', 'p-docs-2', 'todo', 'miky'),
  issue('i-brand-colours', 'New colours on the website', 'p-brand', 'in-progress', 'katerina'),
  issue('i-unread-dot', 'The unread dot stays after reading', 'p-peek-bugs', 'todo', 'miky'),
  issue('i-launch-post', 'Launch post', 'p-launch', 'done', 'miky', true),
  doc('d-navigation', 'Navigation'),
  doc('d-meeting', 'Meeting notes'),
  doc('d-testing-widgets', 'Testing Widgets'),
  doc('d-speed', 'Speed on Miky’s workspace'),
  doc('d-grant-research', 'Grant organisation research'),
  doc('d-grant-application', 'Application: first grant'),
  doc('d-protocol-names', 'Protocol names'),
]
const itemOf = (id: string) => ITEMS.find((i) => i.id === id)!
const projects = ITEMS.filter((i): i is Project => i.kind === 'project')
const issues = ITEMS.filter((i): i is Issue => i.kind === 'issue')
const folderOf = (work: Work) => (work.kind === 'project' ? work.folder : (itemOf(work.project) as Project).folder)
const isArchived = (work: Work) => !!work.archived

const TOPICS: Topic[] = [
  { id: 'widgets', title: 'Widgets', folder: 'hq', members: ['miky', 'katerina'], lists: ['p-widgets-2', 'i-widget-title', 'i-widget-height', 'p-widgets-1', 'i-widget-picker', 'd-testing-widgets'] },
  { id: 'fast', title: 'Peek, Ship and Leaf are fast', folder: 'hq', members: ['miky'], lists: ['p-read-only', 'p-live', 'i-ship-copy', 'd-speed'] },
  { id: 'navigation', title: 'Navigation', folder: 'hq', members: ['miky', 'katerina'], lists: ['p-nav', 'p-teams', 'p-topics-files', 'i-proto', 'd-navigation', 'd-meeting'] },
  { id: 'grants', title: 'Grants', folder: 'hq', members: ['miky'], lists: ['p-docs-2', 'i-grant-form', 'd-grant-research', 'd-grant-application'] },
  { id: 'brand', title: 'Brand', folder: 'hq', members: ['katerina'], lists: ['p-brand', 'i-brand-colours'] },
  { id: 'triage', title: 'Feedback triage', folder: 'peek', members: ['katerina'], lists: ['p-peek-bugs', 'p-ship-bugs', 'i-unread-dot'] },
  { id: 'records', title: 'Decision records', folder: 'agent', members: ['miky', 'agent'], lists: ['p-records-2', 'p-agent-feedback'] },
  // All of its work is archived: under Archived.
  { id: 'launch', title: 'Public launch', folder: 'hq', members: ['miky', 'katerina'], lists: ['p-launch', 'i-launch-post'] },
  // Lists only a document: nothing to show in Ship.
  { id: 'naming', title: 'Naming the protocol', folder: 'hq', members: ['miky'], lists: ['d-protocol-names'] },
  // A space is never on Ship's Topics, whatever it lists (Miky, 2 Nov).
  { id: 'bugs', title: 'bugs', folder: 'peek', members: ['miky', 'katerina'], space: true, lists: ['i-unread-dot'] },
]
const topicOf = (id: string) => TOPICS.find((t) => t.id === id)!

const workOf = (topic: Topic) => topic.lists.map(itemOf).filter((i): i is Work => i.kind !== 'document')
const liveWorkOf = (topic: Topic) => workOf(topic).filter((w) => !isArchived(w))
const docsOf = (topic: Topic) => topic.lists.map(itemOf).filter((i): i is Doc => i.kind === 'document')
/** On Topics: not a space, and it lists a project or issue that is not archived (done ones count). */
const isShown = (topic: Topic) => !topic.space && liveWorkOf(topic).length > 0
/** Under Archived: every project and issue it lists is archived. */
const isArchivedTopic = (topic: Topic) => !topic.space && workOf(topic).length > 0 && liveWorkOf(topic).length === 0
const byTitle = <T extends { title: string }>(a: T, b: T) => a.title.localeCompare(b.title)
/** Projects first, then issues, as the topic lists them. */
const projectsFirst = (work: Work[]) => [...work.filter((w) => w.kind === 'project'), ...work.filter((w) => w.kind === 'issue')]
const isOpen = (i: Issue) => i.status !== 'done' && !i.archived
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`
/** "2 projects · 1 open issue", leaving out a part that is none. */
const workCount = (topic: Topic) => {
  const live = liveWorkOf(topic)
  const projectCount = live.filter((w) => w.kind === 'project').length
  const openCount = live.filter((w) => w.kind === 'issue' && isOpen(w)).length
  return [projectCount && plural(projectCount, 'project'), openCount && plural(openCount, 'open issue')].filter(Boolean).join(' · ')
}

type Place =
  | { type: 'home' }
  | { type: 'topics'; folder?: FolderId; archived?: boolean }
  | { type: 'projects'; folder?: FolderId }
  | { type: 'issues'; folder?: FolderId }
  | { type: 'folder'; folder: FolderId }
  | { type: 'topic'; id: string }
  | { type: 'work'; id: string }

const same = (a: Place, b: Place) => JSON.stringify(a) === JSON.stringify(b)

/** How the shared read of every topic stands; Ship's own projects and issues are read as today. */
export type TopicsRead = 'ok' | 'loading' | 'failed' | 'none'

const STATUS: Record<Status, { label: string; icon: ReactNode }> = {
  todo: { label: 'Todo', icon: <IconCircle {...icon16} /> },
  'in-progress': { label: 'In progress', icon: <IconProgress {...icon16} /> },
  done: { label: 'Done', icon: <IconCircleCheck {...icon16} /> },
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">{children}</div>
}

/** A project with its progress, or an issue with its status and project. */
function WorkRow({ work, onOpen, showFolder = false }: { work: Work; onOpen: (p: Place) => void; showFolder?: boolean }) {
  return (
    <button type="button" onClick={() => onOpen({ type: 'work', id: work.id })} className="flex items-center gap-3 px-3 py-2 text-left hover:bg-bg-hover">
      <KindIcon kind={work.kind} />
      <span className={`min-w-0 flex-1 truncate text-body-2 ${isArchived(work) ? 'text-text-muted' : 'text-text-primary'}`}>{work.title}</span>
      {work.kind === 'issue' && <span className="hidden max-w-48 truncate text-caption text-text-muted sm:inline">{itemOf(work.project).title}</span>}
      {showFolder && work.kind === 'project' && <span className="hidden text-caption text-text-muted sm:inline">{folderName(work.folder)}</span>}
      {work.kind === 'project' ? (
        <span className="w-14 shrink-0 text-right text-caption text-text-secondary">{work.progress}</span>
      ) : (
        <span className="flex w-24 shrink-0 items-center justify-end gap-1 text-caption text-text-secondary">
          {STATUS[work.status].icon}
          {STATUS[work.status].label}
        </span>
      )}
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

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel tone="muted">{label}</SectionLabel>
      {children}
    </div>
  )
}

/** Where the topic read stands, in place of a list that needs it. */
function ReadState({ read, scope, onRetry }: { read: TopicsRead; scope: 'page' | 'section'; onRetry: () => void }) {
  if (read === 'loading') return <SkeletonList rows={scope === 'page' ? 8 : 3} />
  return <EmptyState scope={scope} message="Topics didn’t load." action={{ label: 'Try again', onClick: onRetry }} />
}

/** One topic on Topics: its name, and one level of the projects and issues it lists. */
function TopicBlock({ topic, archived, onOpen }: { topic: Topic; archived: boolean; onOpen: (p: Place) => void }) {
  const work = projectsFirst(archived ? workOf(topic) : liveWorkOf(topic))
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => onOpen({ type: 'topic', id: topic.id })} className="flex items-center gap-2 text-left">
        <KindIcon kind="topic" />
        <span className="text-body-1 font-medium text-text-primary hover:underline">{topic.title}</span>
      </button>
      <Rows>
        {work.map((w) => (
          <WorkRow key={w.id} work={w} onOpen={onOpen} />
        ))}
      </Rows>
    </div>
  )
}

function TopicsPage({ viewer, folder, archived = false, read, onRetry, onOpen }: { viewer: Person; folder?: FolderId; archived?: boolean; read: TopicsRead; onRetry: () => void; onOpen: (p: Place) => void }) {
  const inScope = read === 'none' ? [] : TOPICS.filter((t) => !folder || t.folder === folder).sort(byTitle)
  const title = `${folder ? `${folderName(folder)} · ` : ''}${archived ? 'Archived topics' : 'Topics'}`
  if (read === 'loading' || read === 'failed') return <Page title={title} icon={<IconTarget {...icon16} />}><ReadState read={read} scope="page" onRetry={onRetry} /></Page>
  if (archived) {
    const gone = inScope.filter(isArchivedTopic)
    return (
      <Page title={title} icon={<IconArchive {...icon16} />} right={<Link href="#" variant="quiet" onClick={go(() => onOpen({ type: 'topics', folder }))}>Topics</Link>}>
        {gone.length === 0 ? <EmptyState scope="section" message="No archived topics." /> : <div className="flex flex-col gap-5">{gone.map((t) => <TopicBlock key={t.id} topic={t} archived onOpen={onOpen} />)}</div>}
      </Page>
    )
  }
  const shown = inScope.filter(isShown)
  const yours = shown.filter((t) => t.members.includes(viewer))
  const others = shown.filter((t) => !t.members.includes(viewer))
  const archivedCount = inScope.filter(isArchivedTopic).length
  return (
    <Page title={title} icon={<IconTarget {...icon16} />}>
      {shown.length === 0 && <EmptyState message="No topic lists a project or issue yet." />}
      {[['Your topics', yours] as const, ['Other topics', others] as const].map(
        ([label, list]) =>
          list.length > 0 && (
            <Section key={label} label={label}>
              <div className="flex flex-col gap-5">
                {list.map((t) => <TopicBlock key={t.id} topic={t} archived={false} onOpen={onOpen} />)}
              </div>
            </Section>
          ),
      )}
      {archivedCount > 0 && (
        <Link href="#" variant="quiet" className="flex items-center gap-1 self-start text-body-2 text-text-secondary" onClick={go(() => onOpen({ type: 'topics', folder, archived: true }))}>
          <IconArchive {...icon16} />
          Archived · {archivedCount}
        </Link>
      )}
    </Page>
  )
}

/** A topic's page in Ship: its work with status, its documents as links to Leaf, the archived behind a link. */
function TopicPage({ topic, read, onRetry, onOpen }: { topic: Topic; read: TopicsRead; onRetry: () => void; onOpen: (p: Place) => void }) {
  const [showArchived, setShowArchived] = useState(false)
  const live = projectsFirst(liveWorkOf(topic))
  const gone = projectsFirst(workOf(topic).filter(isArchived))
  const docs = docsOf(topic)
  const peek = (
    <Link href="#" external variant="quiet" className="flex items-center gap-1 text-body-2" onClick={go(() => {})}>
      Conversation in Peek
      <IconExternalLink size={14} stroke={1.5} />
    </Link>
  )
  if (read === 'loading' || read === 'failed') return <Page title={topic.title} icon={<KindIcon kind="topic" />} right={peek}><ReadState read={read} scope="page" onRetry={onRetry} /></Page>
  return (
    <Page title={topic.title} icon={<KindIcon kind="topic" />} right={peek} sub={<span className="text-caption text-text-muted">{folderName(topic.folder)}</span>}>
      {live.length > 0 ? (
        <Rows>
          {live.map((w) => <WorkRow key={w.id} work={w} onOpen={onOpen} />)}
        </Rows>
      ) : (
        <p className="text-body-2 text-text-secondary">All of its projects and issues are archived.</p>
      )}
      {docs.length > 0 && (
        <Section label="Documents">
          <Rows>
            {docs.map((d) => (
              <a key={d.id} href="#" onClick={go(() => {})} className="flex items-center gap-3 px-3 py-2 hover:bg-bg-hover">
                <KindIcon kind="file" />
                <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{d.title}</span>
                <span className="flex items-center gap-1 text-caption text-text-muted">
                  Leaf
                  <IconExternalLink size={14} stroke={1.5} />
                </span>
              </a>
            ))}
          </Rows>
        </Section>
      )}
      {gone.length > 0 &&
        (showArchived || live.length === 0 ? (
          <Section label="Archived">
            <Rows>
              {gone.map((w) => <WorkRow key={w.id} work={w} onOpen={onOpen} />)}
            </Rows>
          </Section>
        ) : (
          <Link href="#" variant="quiet" className="flex items-center gap-1 self-start text-body-2 text-text-secondary" onClick={go(() => setShowArchived(true))}>
            <IconArchive {...icon16} />
            Archived · {gone.length}
          </Link>
        ))}
    </Page>
  )
}

function Home({ viewer, read, onRetry, onOpen }: { viewer: Person; read: TopicsRead; onRetry: () => void; onOpen: (p: Place) => void }) {
  const topics = read === 'none' ? [] : TOPICS.filter((t) => isShown(t) && t.members.includes(viewer)).sort(byTitle)
  const mine = projects.filter((p) => !p.archived && (p.lead === viewer || p.members.includes(viewer))).sort(byTitle)
  const assigned = issues.filter((i) => isOpen(i) && i.assignee === viewer)
  return (
    <Page title="Home" icon={<IconHome {...icon16} />}>
      <Section label="Your topics">
        {read === 'loading' || read === 'failed' ? (
          <ReadState read={read} scope="section" onRetry={onRetry} />
        ) : topics.length === 0 ? (
          <EmptyState scope="section" message="You are in no topic yet." />
        ) : (
          <Rows>
            {topics.map((t) => (
              <button key={t.id} type="button" onClick={() => onOpen({ type: 'topic', id: t.id })} className="flex items-center gap-3 px-3 py-2 text-left hover:bg-bg-hover">
                <KindIcon kind="topic" />
                <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{t.title}</span>
                <span className="text-caption text-text-secondary">{workCount(t)}</span>
              </button>
            ))}
          </Rows>
        )}
      </Section>
      <Section label="Your projects">
        {mine.length === 0 ? <EmptyState scope="section" message="You lead no project and are in none." /> : <Rows>{mine.map((p) => <WorkRow key={p.id} work={p} onOpen={onOpen} showFolder />)}</Rows>}
      </Section>
      <Section label="Assigned to you">
        {assigned.length === 0 ? <EmptyState scope="section" message="No open issue is assigned to you." /> : <Rows>{assigned.map((i) => <WorkRow key={i.id} work={i} onOpen={onOpen} />)}</Rows>}
      </Section>
    </Page>
  )
}

function ProjectsPage({ folder, onOpen }: { folder?: FolderId; onOpen: (p: Place) => void }) {
  const list = projects.filter((p) => !p.archived && (!folder || p.folder === folder)).sort(byTitle)
  return (
    <Page title={folder ? `${folderName(folder)} · Projects` : 'Projects'} icon={<KindIcon kind="project" />}>
      {list.length === 0 ? <EmptyState message="No projects here." /> : <Rows>{list.map((p) => <WorkRow key={p.id} work={p} onOpen={onOpen} showFolder={!folder} />)}</Rows>}
    </Page>
  )
}

function IssuesPage({ folder, onOpen }: { folder?: FolderId; onOpen: (p: Place) => void }) {
  const list = issues.filter((i) => isOpen(i) && (!folder || folderOf(i) === folder))
  return (
    <Page title={folder ? `${folderName(folder)} · Issues` : 'Issues'} icon={<IconListCheck {...icon16} />}>
      {list.length === 0 ? <EmptyState message="No open issues here." /> : <Rows>{list.map((i) => <WorkRow key={i.id} work={i} onOpen={onOpen} />)}</Rows>}
    </Page>
  )
}

/** A project or issue, drawn only as far as its "Topics: …" line, which now opens the topic's page in Ship. */
function WorkPage({ work, read, onOpen }: { work: Work; read: TopicsRead; onOpen: (p: Place) => void }) {
  const topics = read === 'ok' ? TOPICS.filter((t) => !t.space && t.lists.includes(work.id)).sort(byTitle) : []
  return (
    <Page title={work.title} icon={<KindIcon kind={work.kind} />} sub={<span className="text-caption text-text-muted">{folderName(folderOf(work))}</span>}>
      {topics.length > 0 && (
        <p className="flex flex-wrap items-center gap-1 text-body-2 text-text-secondary">
          Topics:
          {topics.map((t, n) => (
            <span key={t.id}>
              <Link href="#" variant="quiet" className="text-text-primary" onClick={go(() => onOpen({ type: 'topic', id: t.id }))}>{t.title}</Link>
              {isArchivedTopic(t) && ' (archived)'}
              {n < topics.length - 1 && ','}
            </span>
          ))}
        </p>
      )}
      <p className="text-caption text-text-muted">The rest of the page is as today.</p>
    </Page>
  )
}

function Content({ place, viewer, read, onRetry, onOpen }: { place: Place; viewer: Person; read: TopicsRead; onRetry: () => void; onOpen: (p: Place) => void }) {
  switch (place.type) {
    case 'home':
      return <Home viewer={viewer} read={read} onRetry={onRetry} onOpen={onOpen} />
    case 'topics':
      return <TopicsPage viewer={viewer} folder={place.folder} archived={place.archived} read={read} onRetry={onRetry} onOpen={onOpen} />
    case 'projects':
      return <ProjectsPage folder={place.folder} onOpen={onOpen} />
    case 'issues':
      return <IssuesPage folder={place.folder} onOpen={onOpen} />
    case 'folder':
      return <Page title={folderName(place.folder)} icon={<IconFolder {...icon16} />}><p className="text-caption text-text-muted">The Folder’s page, as today: its topics beside its projects.</p></Page>
    case 'topic':
      return <TopicPage key={place.id} topic={topicOf(place.id)} read={read} onRetry={onRetry} onOpen={onOpen} />
    case 'work':
      return <WorkPage work={itemOf(place.id) as Work} read={read} onOpen={onOpen} />
  }
}

/** The Folder a place sits in, whose fold opens for it. */
const folderOfPlace = (place: Place): FolderId | undefined =>
  place.type === 'work' ? folderOf(itemOf(place.id) as Work) : 'folder' in place ? place.folder : undefined

/** Home, Topics, Projects, Issues, then each Folder folding to its own Topics, Projects and Issues (Miky, 2 Nov). */
function ShipSidebar({ place, onOpen, open, onFold }: { place: Place; onOpen: (p: Place) => void; open: Set<FolderId>; onFold: (f: FolderId, open: boolean) => void }) {
  // A project or issue marks its Folder's Projects or Issues entry.
  const at: Place =
    place.type === 'work' ? (itemOf(place.id).kind === 'project' ? { type: 'projects', folder: folderOfPlace(place) } : { type: 'issues', folder: folderOfPlace(place) }) : place.type === 'topics' && place.archived ? { type: 'topics', folder: place.folder } : place
  const item = (label: string, icon: ReactNode, to: Place, count?: { n: number; label: string }) => (
    <NavItem key={label} href="#" label={label} icon={icon} active={same(at, to)} count={count?.n} countLabel={count?.label} onClick={go(() => onOpen(to))} />
  )
  const active = projects.filter((p) => !p.archived).length
  const openIssues = issues.filter(isOpen).length
  return (
    <Sidebar aria-label="ship navigation">
      {item('Home', <IconHome {...icon16} />, { type: 'home' })}
      <div className="pt-3" />
      {item('Topics', <IconTarget {...icon16} />, { type: 'topics' })}
      {item('Projects', <KindIcon kind="project" />, { type: 'projects' }, { n: active, label: `${active} active` })}
      {item('Issues', <IconListCheck {...icon16} />, { type: 'issues' }, { n: openIssues, label: `${openIssues} open` })}
      <div className="px-2 pb-1 pt-4">
        <SectionLabel tone="muted">Folders</SectionLabel>
      </div>
      {FOLDERS.map((f) => (
        <NavItem key={f.id} href="#" label={f.name} icon={<IconFolder {...icon16} />} active={same(place, { type: 'folder', folder: f.id })} onClick={go(() => onOpen({ type: 'folder', folder: f.id }))} open={open.has(f.id)} onOpenChange={(o) => onFold(f.id, o)}>
          {item('Topics', <IconTarget {...icon16} />, { type: 'topics', folder: f.id })}
          {item('Projects', <KindIcon kind="project" />, { type: 'projects', folder: f.id })}
          {item('Issues', <IconListCheck {...icon16} />, { type: 'issues', folder: f.id })}
        </NavItem>
      ))}
    </Sidebar>
  )
}

function ViewAs({ viewer, onViewer }: { viewer: Person; onViewer: (p: Person) => void }) {
  return (
    <Menu align="right" trigger={<PersonTrigger name={PEOPLE[viewer]} />}>
      <MenuItem label="View as Miky" selected={viewer === 'miky'} onClick={() => onViewer('miky')} />
      <MenuItem label="View as Katerina" selected={viewer === 'katerina'} onClick={() => onViewer('katerina')} />
    </Menu>
  )
}

export interface ShipTopicsProps {
  viewer?: 'miky' | 'katerina'
  start?: Place
  /** The topic read's state when the story opens; Try again turns a failed read into a loaded one. */
  read?: TopicsRead
}

export type { Place as ShipPlace }

export function ShipTopics({ viewer: firstViewer = 'miky', start = { type: 'home' }, read: firstRead = 'ok' }: ShipTopicsProps) {
  const [viewer, setViewer] = useState<Person>(firstViewer)
  const [place, setPlace] = useState<Place>(start)
  const [read, setRead] = useState<TopicsRead>(firstRead)
  const [open, setOpen] = useState<Set<FolderId>>(() => new Set(folderOfPlace(start) ? [folderOfPlace(start)!] : []))
  const fold = (f: FolderId, isOpen: boolean) =>
    setOpen((now) => {
      const next = new Set(now)
      if (isOpen) next.add(f)
      else next.delete(f)
      return next
    })
  const onOpen = (next: Place) => {
    setPlace(next)
    const f = folderOfPlace(next)
    if (f) fold(f, true)
  }
  return (
    <div className="h-screen overflow-hidden">
      <AppShell
        logo={<span className="px-2 text-body-1 font-semibold text-text-primary">Ship</span>}
        onSearch={() => {}}
        searchPlaceholder="Search Ship…"
        identity={<ViewAs viewer={viewer} onViewer={setViewer} />}
        nav={<ShipSidebar place={place} onOpen={onOpen} open={open} onFold={fold} />}
      >
        <Content place={place} viewer={viewer} read={read} onRetry={() => setRead('ok')} onOpen={onOpen} />
      </AppShell>
    </div>
  )
}
