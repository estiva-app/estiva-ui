import { useState } from 'react'
import { IconChevronDown, IconChevronRight, IconFileText, IconHome, IconLayoutList, IconSend } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { EmptyState } from '../../src/EmptyState'
import { IconButton } from '../../src/IconButton'
import { KindIcon } from '../../src/KindIcon'
import { Menu, MenuItem, MenuSeparator } from '../../src/Menu'
import { NavItem } from '../../src/NavItem'
import { NoAccessNotice } from '../../src/NoAccessNotice'
import { Panel } from '../../src/Panel'
import { ProgressBar } from '../../src/ProgressBar'
import { SectionHeader } from '../../src/SectionHeader'
import { SkeletonList } from '../../src/Skeleton'
import { Tabs } from '../../src/Tabs'
import { TextInput } from '../../src/TextInput'
import { PEOPLE, TOPICS, fileOf, topicOf, type File, type Person, type Read, type Topic } from './fixtures'
import { ExplorePage, FilePlaceholder, Frame, MoreIcon, Page, Providers, TopicsSection, go, icon16, type Place } from './parts'

type ProjectsTab = 'all' | 'planned' | 'active' | 'completed'
const TABS: Record<ProjectsTab, string> = { all: 'All', planned: 'Planned', active: 'Active', completed: 'Completed' }
const inTab = (tab: ProjectsTab, f: File) =>
  tab === 'all' || (tab === 'planned' && f.status?.label === 'Planned') || (tab === 'active' && f.status?.label === 'In progress') || (tab === 'completed' && f.status?.label === 'Completed')

/** The topic's files of one kind, in the topic's order (the order is kept inside each kind; Miky, 6 Nov). */
const ofKind = (topic: Topic, kind: File['kind'], archived = false) => topic.files.map((f) => fileOf(f.id)).filter((f) => f.kind === kind && !!f.archived === archived)

/** A project row exactly as Ship's Projects page draws it: name, status, lead, progress. */
function ProjectRow({ f }: { f: File }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 hover:bg-bg-hover">
      <KindIcon kind="project" />
      <a href="#" className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{f.title}</a>
      <span className="hidden w-20 shrink-0 truncate text-caption text-text-secondary sm:inline">{f.status?.label}</span>
      <span className="hidden w-10 shrink-0 sm:block">{f.lead && <Avatar name={PEOPLE[f.lead]} size={24} label={PEOPLE[f.lead]} bot={f.lead === 'agent'} />}</span>
      <span className="hidden w-36 shrink-0 items-center gap-2 sm:flex">
        {f.done && <ProgressBar value={f.done.done} max={f.done.total} label="Issues done" className="flex-1" />}
        <span className="w-12 text-right font-mono text-caption tabular-nums text-text-secondary">{f.done ? `${f.done.done}/${f.done.total}` : ''}</span>
      </span>
    </div>
  )
}

/**
 * A document row: its last edit, folding to its child pages.
 * Extends: Ship's row, with NavItem's fold chevron (no row in the kit folds in a page).
 */
function DocumentRow({ f, depth = 0 }: { f: File; depth?: number }) {
  const [open, setOpen] = useState(false)
  const kids = f.children?.map(fileOf) ?? []
  return (
    <>
      <div className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 hover:bg-bg-hover" style={{ paddingLeft: 12 + depth * 24 }}>
        {kids.length > 0 ? (
          <button type="button" aria-label={open ? `Fold ${f.title}` : `Show the pages in ${f.title}`} aria-expanded={open} className="flex size-4 items-center justify-center text-text-muted" onClick={() => setOpen(!open)}>
            {open ? <IconChevronDown size={14} stroke={1.5} /> : <IconChevronRight size={14} stroke={1.5} />}
          </button>
        ) : (
          <IconFileText {...icon16} className="text-text-secondary" />
        )}
        <a href="#" className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{f.title}</a>
        <span className="shrink-0 text-caption text-text-muted">
          {f.editedBy ? `${PEOPLE[f.editedBy].split(' ')[0]}, ` : ''}
          {f.edited}
        </span>
      </div>
      {open && kids.map((k) => <DocumentRow key={k.id} f={k} depth={depth + 1} />)}
    </>
  )
}

function IssueRow({ f }: { f: File }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 hover:bg-bg-hover">
      <KindIcon kind="issue" />
      <a href="#" className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{f.title}</a>
      <span className="hidden w-20 shrink-0 truncate text-caption text-text-secondary sm:inline">{f.status?.label}</span>
      <span className="hidden w-10 shrink-0 sm:block">{f.lead && <Avatar name={PEOPLE[f.lead]} size={24} label={PEOPLE[f.lead]} bot={f.lead === 'agent'} />}</span>
      <span aria-hidden className="hidden w-36 shrink-0 sm:block" />
    </div>
  )
}

/** The topic's own conversation, in the side panel where a project's or an issue's sits (Miky, 4 Nov). */
function ConversationPanel({ topic, readOnly }: { topic: Topic; readOnly: boolean }) {
  const [sent, setSent] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const messages: { who: Person; at: string; body: string }[] = [
    { who: 'katerina', at: '1h ago', body: 'Card widget sketches are in. Status and lead on the card, the rest in the row.' },
    { who: 'agent', at: '40m ago', body: 'Build 2 picks them up: the card draws status and lead from this week.' },
    ...sent.map((body) => ({ who: 'miky' as const, at: 'Just now', body })),
  ]
  return (
    <Panel
      title="Conversation"
      footer={
        readOnly ? (
          <p className="px-4 py-3 text-caption text-text-muted">This topic is archived. Nothing more can be said in it.</p>
        ) : (
          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (draft.trim()) setSent((s) => [...s, draft.trim()])
              setDraft('')
            }}
          >
            <div className="flex-1">
              <TextInput placeholder={`Reply in ${topic.title}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
            </div>
            <IconButton aria-label="Send" tooltip="Send" type="submit">
              <IconSend {...icon16} />
            </IconButton>
          </form>
        )
      }
    >
      <ul className="flex flex-col gap-4 p-4">
        {messages.map((m, i) => (
          <li key={i} className="flex gap-2">
            <Avatar name={PEOPLE[m.who]} size={24} bot={m.who === 'agent'} />
            <div className="flex min-w-0 flex-col">
              <span className="text-caption text-text-muted">
                <span className="font-medium text-text-primary">{PEOPLE[m.who]}</span> · {m.at}
              </span>
              <span className="text-body-2 text-text-primary">{m.body}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="px-4 pb-4 text-caption text-text-muted">The same conversation as the topic in Peek: a reply here shows there.</p>
    </Panel>
  )
}

/** A topic's page in Ship (Miky, 4 Nov): projects as the Projects page draws them, issues, documents with last edit and child pages, and the conversation beside them. */
function TopicPage({ topic, viewer, read, onRetry }: { topic: Topic; viewer: Person; read: Read; onRetry: () => void }) {
  const [tab, setTab] = useState<ProjectsTab>('all')
  const [conversation, setConversation] = useState(true)
  const readable = topic.members.includes(viewer) || topic.team === 'Company'
  if (!readable)
    return (
      <Page title="Topic" icon={<KindIcon kind="topic" />}>
        <NoAccessNotice what="topic" />
      </Page>
    )
  const projects = ofKind(topic, 'project')
  const shown = projects.filter((f) => inTab(tab, f))
  const issues = ofKind(topic, 'issue')
  const docs = ofKind(topic, 'file')
  const archived = topic.files.map((f) => fileOf(f.id)).filter((f) => f.archived)
  return (
    <Page
      title={topic.title}
      icon={<KindIcon kind="topic" />}
      meta={[topic.team]}
      actions={
        <div className="flex items-center gap-1">
          <IconButton aria-label={conversation ? 'Hide the conversation' : 'Show the conversation'} tooltip={conversation ? 'Hide the conversation' : 'Show the conversation'} pressed={conversation} onClick={() => setConversation(!conversation)}>
            <IconLayoutList {...icon16} />
          </IconButton>
          <Menu align="right" trigger={<IconButton aria-label={`More options for ${topic.title}`} tooltip="More options"><MoreIcon /></IconButton>}>
            <MenuItem label="Copy link" />
            <MenuItem label="Open in Peek" />
            <MenuSeparator />
            <MenuItem label="Archive" />
          </Menu>
        </div>
      }
    >
      <div className="-m-6 flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          {topic.summary && <p className="text-body-2 text-text-secondary">{topic.summary}</p>}
          {read === 'loading' ? (
            <SkeletonList rows={8} />
          ) : read === 'failed' ? (
            <EmptyState scope="page" message="This topic didn’t load." action={{ label: 'Try again', onClick: onRetry }} />
          ) : topic.files.length === 0 ? (
            <EmptyState scope="page" message="This topic lists no projects, issues or documents yet." />
          ) : (
            <>
              {projects.length > 0 && (
                <section className="flex flex-col gap-2">
                  <SectionHeader title="Projects" />
                  <Tabs<ProjectsTab> aria-label="Projects by status" tabs={(Object.keys(TABS) as ProjectsTab[]).map((id) => ({ id, label: TABS[id], count: projects.filter((f) => inTab(id, f)).length }))} active={tab} onChange={setTab} />
                  <div className="hidden items-center gap-3 px-3 text-caption text-text-muted sm:flex">
                    <span className="flex-1 pl-7">Name</span>
                    <span className="w-20">Status</span>
                    <span className="w-10">Lead</span>
                    <span className="w-36">Progress</span>
                  </div>
                  {shown.length === 0 ? <EmptyState scope="section" message={`No ${TABS[tab].toLowerCase()} projects.`} /> : shown.map((f) => <ProjectRow key={f.id} f={f} />)}
                </section>
              )}
              {issues.length > 0 && (
                <section className="flex flex-col gap-1">
                  <SectionHeader title="Issues" />
                  {issues.map((f) => <IssueRow key={f.id} f={f} />)}
                </section>
              )}
              {docs.length > 0 && (
                <section className="flex flex-col gap-1">
                  <SectionHeader title="Documents" />
                  {docs.map((f) => <DocumentRow key={f.id} f={f} />)}
                </section>
              )}
              {archived.length > 0 && <ArchivedLine files={archived} />}
            </>
          )}
        </div>
        {conversation && read === 'ok' && (
          <div className="w-[384px] shrink-0 border-l border-border-subtle">
            <ConversationPanel topic={topic} readOnly={!!topic.archived} />
          </div>
        )}
      </div>
    </Page>
  )
}

/** One "Archived" line at the end, as Ship's topic page has it today. */
function ArchivedLine({ files }: { files: File[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-col gap-1">
      <SectionHeader title={`Archived · ${files.length}`} chevron isExpanded={open} onToggle={() => setOpen(!open)} />
      {open &&
        files.map((f) => (
          <div key={f.id} className="flex items-center gap-3 px-3 py-2 text-body-2 text-text-muted">
            <KindIcon kind={f.kind} />
            {f.title}
          </div>
        ))}
    </section>
  )
}

export interface ShipTopicsProps {
  viewer?: Person
  start?: Place
  read?: Read
  /** The open topic's read. */
  topic?: Read
}

export function ShipTopics(props: ShipTopicsProps) {
  return (
    <Providers>
      <ShipApp {...props} />
    </Providers>
  )
}

/** Ship's sidebar: Home, Projects, Issues, then your five newest topics, each folding to its projects and issues, then Explore topics. */
function ShipApp({ viewer: firstViewer = 'miky', start = { type: 'topic', id: 'widgets' }, read: firstRead = 'ok', topic: firstTopic = 'ok' }: ShipTopicsProps) {
  const [viewer, setViewer] = useState<Person>(firstViewer)
  const [place, setPlace] = useState<Place>(start)
  const [read, setRead] = useState<Read>(firstRead)
  const [topicRead, setTopicRead] = useState<Read>(firstTopic)
  // Ship folds a topic to what Ship opens: its projects and issues, in the topic's order.
  const fold = (t: Topic) => t.files.map((f) => fileOf(f.id)).filter((f) => !f.archived && f.kind !== 'file').map((f) => f.id)
  const content =
    place.type === 'explore' ? (
      <ExplorePage title="Topics" viewer={viewer} read={read} onRetry={() => setRead('ok')} onOpen={setPlace} />
    ) : place.type === 'topic' ? (
      <TopicPage key={place.id} topic={topicOf(place.id)} viewer={viewer} read={topicRead} onRetry={() => setTopicRead('ok')} />
    ) : place.type === 'file' ? (
      <FilePlaceholder id={place.id} />
    ) : (
      <Page title="Home">
        <p className="text-caption text-text-muted">Home, as today.</p>
      </Page>
    )
  return (
    <Frame
      app="Ship"
      viewer={viewer}
      onViewer={setViewer}
      nav={
        <>
          <NavItem href="#" label="Home" icon={<IconHome {...icon16} />} active={place.type === 'home'} onClick={go(() => setPlace({ type: 'home' }))} />
          <NavItem href="#" label="Projects" icon={<KindIcon kind="project" />} />
          <NavItem href="#" label="Issues" icon={<KindIcon kind="issue" />} />
          <TopicsSection viewer={viewer} topics={TOPICS} read={read} place={place} onOpen={setPlace} limit={5} fold={fold} />
        </>
      }
    >
      {content}
    </Frame>
  )
}
