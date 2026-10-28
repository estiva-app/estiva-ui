import { useState, type ReactNode } from 'react'
import { IconClock, IconHome, IconLayoutDashboard, IconListCheck, IconLock, IconStar, IconTarget, IconUser, IconUsers } from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { Avatar } from '../../src/Avatar'
import { EmptyState } from '../../src/EmptyState'
import { KindIcon } from '../../src/KindIcon'
import { ListColumn } from '../../src/ListColumn'
import { NavItem } from '../../src/NavItem'
import { Rail } from '../../src/Rail'
import { RailItem } from '../../src/RailItem'
import { SectionLabel } from '../../src/SectionLabel'
import { Sidebar } from '../../src/Sidebar'
import { Tabs } from '../../src/Tabs'
import { DESK, FILES, PEOPLE, TEAMS, TOPICS, canReadFile, canReadTopic, fileOf, spacesOf, teamOf, topicOf, type App, type DeskRow, type FileRow, type PersonId, type Topic } from './fixtures'
import {
  APPS,
  AppSwitcher,
  FileList,
  FilePage,
  FilesOfTopic,
  Header,
  PeekTopic,
  TeamPage,
  ViewAs,
  go,
  icon16,
  kindOf,
  noun,
  readersLabel,
  spaceIcon,
  unreadFor,
  useApp,
  type Selection,
} from './Lens'

/**
 * Per app: Miky's sketch of 28 October. The model is Lens's (a file lives in
 * one team, a topic led by a team lists files from any team); what changes is
 * the navigation, which each app draws its own way. Peek has a rail of Desk,
 * Topics, Teams and People with a list column beside it; Ship has Desk, then
 * Topics, Projects and Issues, then Teams; Leaf has a Teams | Topics toggle.
 * The Desk is the same in all three.
 */

type Page = 'topics' | 'projects' | 'issues' | 'open-work' | 'starred'
type Place = Selection | { type: 'page'; id: Page } | { type: 'person'; id: PersonId }
type RailId = 'desk' | 'topics' | 'teams' | 'people'

const same = (a: Place, b: Place) => JSON.stringify(a) === JSON.stringify(b)
const appName = (app: App) => APPS.find((a) => a.id === app)!.name

/** Where Peek's rail stands for a place: what the list column beside it lists. */
function railFor(place: Place, current: RailId): RailId {
  if (place.type === 'home') return 'desk'
  if (place.type === 'team') return 'teams'
  if (place.type === 'person') return 'people'
  if (place.type === 'topic') return topicOf(place.id).ends ? 'topics' : 'teams'
  return current
}

/** The Desk: what waits on you, what you are running, and what just happened, from every app. */
function Desk({ viewer, app, title, onOpen, onApp }: { viewer: PersonId; app: App; title: string; onOpen: (p: Place) => void; onApp: (a: App) => void }) {
  const desk = DESK[viewer === 'katerina' ? 'katerina' : 'miky']
  const open = (row: DeskRow) => {
    if (row.app !== app) onApp(row.app)
    onOpen(row.topic ? { type: 'topic', id: row.topic } : { type: 'file', id: row.file! })
  }
  const section = (label: string, rows: DeskRow[]) => (
    <div key={label} className="flex flex-col gap-1">
      <SectionLabel tone="muted">{label}</SectionLabel>
      <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">
        {rows.map((row) => (
          <button key={row.id} type="button" onClick={() => open(row)} className="flex items-start gap-3 px-3 py-2 text-left hover:bg-bg-hover">
            <span className="mt-0.5 w-10 shrink-0 text-caption text-text-muted">{appName(row.app)}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body-2 text-text-primary">{row.title}</span>
              <span className="text-caption text-text-secondary">{row.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title={title}>
        <span className="text-caption text-text-muted">The same in Peek, Ship and Leaf: rows from every app, and opening one goes to its app.</span>
      </Header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {section('Needs your attention', desk.needs)}
        {section('In progress, you are running it', desk.managing)}
        {section('Activity', desk.activity)}
      </div>
    </div>
  )
}

/** Ship's Topics: what the company is focused on, each with the projects it lists (Linear's Initiatives). */
function TopicsPage({ viewer, onOpen }: { viewer: PersonId; onOpen: (p: Place) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title="Topics">
        <span className="text-caption text-text-muted">What the company is focused on now. Each one ends.</span>
      </Header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {TOPICS.filter((t) => t.ends && canReadTopic(viewer, t)).map((t) => {
          const projects = t.lists.map(fileOf).filter((f) => f.app === 'ship')
          const open = projects.filter((f) => canReadFile(viewer, f))
          return (
            <div key={t.id} className="flex flex-col gap-2">
              <button type="button" onClick={() => onOpen({ type: 'topic', id: t.id })} className="flex flex-wrap items-center gap-2 text-left">
                <KindIcon kind="topic" />
                <span className="text-body-1 font-medium text-text-primary hover:underline">{t.title}</span>
                <span className="text-caption text-text-secondary">Led by {teamOf(t.lead).name}</span>
              </button>
              {projects.length === 0 ? (
                <p className="text-caption text-text-muted">No projects. A topic can be only a conversation.</p>
              ) : (
                <FileList files={open} app="ship" onSelect={onOpen} />
              )}
              {projects.length > open.length && (
                <p className="flex items-center gap-1 text-caption text-text-muted">
                  <IconLock size={14} stroke={1.5} />
                  {projects.length - open.length} {noun('ship', projects.length - open.length)} you can’t open
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Ship's Projects: every project, with the team it lives in. */
function ProjectsPage({ viewer, onOpen }: { viewer: PersonId; onOpen: (p: Place) => void }) {
  const projects = FILES.filter((f) => f.app === 'ship')
  const open = projects.filter((f) => canReadFile(viewer, f))
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title="Projects" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <FileList files={open} app="ship" onSelect={onOpen} />
        {projects.length > open.length && (
          <p className="flex items-center gap-1 text-caption text-text-muted">
            <IconLock size={14} stroke={1.5} />
            {projects.length - open.length} {noun('ship', projects.length - open.length)} you can’t open: they live in a private team you are not in.
          </p>
        )}
      </div>
    </div>
  )
}

function Content({ place, app, viewer, onOpen, onApp }: { place: Place; app: App; viewer: PersonId; onOpen: (p: Place) => void; onApp: (a: App) => void }) {
  const topic = place.type === 'topic' ? topicOf(place.id) : undefined
  if ((topic && !canReadTopic(viewer, topic)) || (place.type === 'file' && !canReadFile(viewer, fileOf(place.id)))) return <EmptyState message="You can’t open this." />
  switch (place.type) {
    case 'home':
      return <Desk viewer={viewer} app={app} title={app === 'leaf' ? 'Home' : 'Desk'} onOpen={onOpen} onApp={onApp} />
    case 'page':
      if (place.id === 'topics') return <TopicsPage viewer={viewer} onOpen={onOpen} />
      if (place.id === 'projects') return <ProjectsPage viewer={viewer} onOpen={onOpen} />
      return <EmptyState message="Not drawn in this prototype." />
    case 'person':
      return <EmptyState message={`Your conversation with ${PEOPLE[place.id].name}. Not drawn in this prototype.`} />
    case 'team':
      return <TeamPage team={place.id} app={app} viewer={viewer} onSelect={onOpen} />
    case 'file':
      return <FilePage id={place.id} app={app} onSelect={onOpen} />
    case 'topic':
      return app === 'peek' ? <PeekTopic topic={topic!} viewer={viewer} app={app} onApp={onApp} onSelect={onOpen} /> : <FilesOfTopic topic={topic!} app={app} viewer={viewer} onApp={onApp} onSelect={onOpen} />
  }
}

/** A team's files as nav rows, and a line for the ones the viewer can't open. */
function fileRows(files: FileRow[], app: 'ship' | 'leaf', viewer: PersonId, place: Place, onOpen: (p: Place) => void) {
  const mine = files.filter((f) => f.app === app)
  const readable = mine.filter((f) => canReadFile(viewer, f))
  const locked = mine.length - readable.length
  return [
    ...readable.map((f) => <NavItem key={f.id} href="#" label={f.title} icon={<KindIcon kind={kindOf(f)} />} active={same(place, { type: 'file', id: f.id })} onClick={go(() => onOpen({ type: 'file', id: f.id }))} />),
    ...(locked > 0 ? [<NavItem key="locked" href="#" label={`${locked} ${noun(app, locked)} you can’t open`} icon={<IconLock {...icon16} />} onClick={go(() => {})} />] : []),
  ]
}

const teamIcon = (team: (typeof TEAMS)[number]) => (team.private ? <IconLock {...icon16} /> : <IconUsers {...icon16} />)

/** Ship: Desk, then Topics, Projects and Issues, then Teams. */
function ShipNav({ viewer, place, onOpen }: { viewer: PersonId; place: Place; onOpen: (p: Place) => void }) {
  const item = (label: string, icon: ReactNode, to: Place) => <NavItem href="#" label={label} icon={icon} active={same(place, to)} onClick={go(() => onOpen(to))} />
  return (
    <Sidebar aria-label="ship navigation">
      {item('Desk', <IconLayoutDashboard {...icon16} />, { type: 'home' })}
      <div className="pt-3" />
      {item('Topics', <IconTarget {...icon16} />, { type: 'page', id: 'topics' })}
      {item('Projects', <KindIcon kind="project" />, { type: 'page', id: 'projects' })}
      {item('Issues', <IconListCheck {...icon16} />, { type: 'page', id: 'issues' })}
      <div className="px-2 pb-1 pt-4">
        <SectionLabel tone="muted">Teams</SectionLabel>
      </div>
      {TEAMS.map((team) => {
        const rows = fileRows(FILES.filter((f) => f.team === team.id), 'ship', viewer, place, onOpen)
        return (
          <NavItem key={team.id} href="#" label={team.name} icon={teamIcon(team)} active={same(place, { type: 'team', id: team.id })} onClick={go(() => onOpen({ type: 'team', id: team.id }))} defaultOpen={false}>
            {rows.length > 0 ? rows : undefined}
          </NavItem>
        )
      })}
    </Sidebar>
  )
}

/** Leaf: a Teams | Topics toggle, Home, Open work and Starred, then the tree the toggle chose. */
function LeafNav({ viewer, place, onOpen }: { viewer: PersonId; place: Place; onOpen: (p: Place) => void }) {
  const [by, setBy] = useState<'teams' | 'topics'>('teams')
  const item = (label: string, icon: ReactNode, to: Place) => <NavItem href="#" label={label} icon={icon} active={same(place, to)} onClick={go(() => onOpen(to))} />
  return (
    <Sidebar aria-label="leaf navigation">
      <div className="px-2 pb-3">
        <Tabs<'teams' | 'topics'>
          aria-label="Show documents by"
          size="small"
          active={by}
          onChange={setBy}
          tabs={[
            { id: 'teams', label: 'Teams' },
            { id: 'topics', label: 'Topics' },
          ]}
        />
      </div>
      {item('Home', <IconHome {...icon16} />, { type: 'home' })}
      {item('Open work', <IconClock {...icon16} />, { type: 'page', id: 'open-work' })}
      {item('Starred', <IconStar {...icon16} />, { type: 'page', id: 'starred' })}
      <div className="px-2 pb-1 pt-4">
        <SectionLabel tone="muted">{by === 'teams' ? 'Teams' : 'Topics'}</SectionLabel>
      </div>
      {by === 'teams'
        ? TEAMS.map((team) => {
            const rows = fileRows(FILES.filter((f) => f.team === team.id), 'leaf', viewer, place, onOpen)
            return (
              <NavItem key={team.id} href="#" label={team.name} icon={teamIcon(team)} active={same(place, { type: 'team', id: team.id })} onClick={go(() => onOpen({ type: 'team', id: team.id }))} defaultOpen={team.id === 'company'}>
                {rows.length > 0 ? rows : undefined}
              </NavItem>
            )
          })
        : TOPICS.filter((t) => t.ends && canReadTopic(viewer, t)).map((t) => {
            const rows = fileRows(t.lists.map(fileOf), 'leaf', viewer, place, onOpen)
            return (
              <NavItem
                key={t.id}
                href="#"
                label={t.title}
                tooltip={`Led by ${teamOf(t.lead).name}`}
                icon={<KindIcon kind="topic" />}
                active={same(place, { type: 'topic', id: t.id })}
                onClick={go(() => onOpen({ type: 'topic', id: t.id }))}
                defaultOpen={t.id === 'navigation'}
              >
                {rows.length > 0 ? rows : undefined}
              </NavItem>
            )
          })}
    </Sidebar>
  )
}

/** Peek's list column under Teams: each team's spaces, flat under its name (#general, marketing, Talk to Marketing). */
function TeamSpaces({ viewer, place, onOpen }: { viewer: PersonId; place: Place; onOpen: (p: Place) => void }) {
  const unread = unreadFor(viewer)
  return TEAMS.map((team) => {
    const spaces = spacesOf(team.id).filter((s) => canReadTopic(viewer, s))
    return (
      <div key={team.id} className="flex flex-col gap-0.5 pb-3">
        <button type="button" onClick={() => onOpen({ type: 'team', id: team.id })} className="flex items-center gap-1 rounded px-2 pb-1 text-left text-text-muted hover:text-text-primary">
          <SectionLabel tone="muted">{team.name}</SectionLabel>
          {team.private && <IconLock size={12} stroke={1.5} />}
        </button>
        {spaces.map((s: Topic) => (
          <NavItem
            key={s.id}
            href="#"
            label={s.role === 'chat' ? (team.id === 'company' ? 'general' : team.name.toLowerCase()) : s.title}
            tooltip={s.role === 'chat' ? (team.private ? 'The team’s own chat: members only' : 'The team’s own chat') : s.role === 'front-door' ? `Open to everyone: how others talk to ${team.name}` : readersLabel(s).words}
            icon={spaceIcon(s)}
            unread={unread.has(s.id)}
            active={same(place, { type: 'topic', id: s.id })}
            onClick={go(() => onOpen({ type: 'topic', id: s.id }))}
          />
        ))}
      </div>
    )
  })
}

/** Peek: a rail of Desk, Topics, Teams and People, and the list column the rail chose. */
function PeekFrame({ viewer, place, rail, onRail, onOpen, identity, logo, children }: { viewer: PersonId; place: Place; rail: RailId; onRail: (r: RailId) => void; onOpen: (p: Place) => void; identity: ReactNode; logo: ReactNode; children: ReactNode }) {
  const unread = unreadFor(viewer)
  const rails: { id: RailId; label: string; icon: ReactNode }[] = [
    { id: 'desk', label: 'Desk', icon: <IconLayoutDashboard size={20} stroke={1.5} /> },
    { id: 'topics', label: 'Topics', icon: <IconTarget size={20} stroke={1.5} /> },
    { id: 'teams', label: 'Teams', icon: <IconUsers size={20} stroke={1.5} /> },
    { id: 'people', label: 'People', icon: <IconUser size={20} stroke={1.5} /> },
  ]
  const list =
    rail === 'topics'
      ? TOPICS.filter((t) => t.ends && canReadTopic(viewer, t)).map((t) => (
          <NavItem key={t.id} href="#" label={t.title} tooltip={`Led by ${teamOf(t.lead).name}`} icon={<KindIcon kind="topic" />} unread={unread.has(t.id)} active={same(place, { type: 'topic', id: t.id })} onClick={go(() => onOpen({ type: 'topic', id: t.id }))} />
        ))
      : rail === 'teams'
        ? <TeamSpaces viewer={viewer} place={place} onOpen={onOpen} />
        : (Object.keys(PEOPLE) as PersonId[])
            .filter((p) => p !== viewer)
            .map((p) => <NavItem key={p} href="#" label={PEOPLE[p].name} icon={<Avatar name={PEOPLE[p].name} size={16} />} active={same(place, { type: 'person', id: p })} onClick={go(() => onOpen({ type: 'person', id: p }))} />)
  return (
    <AppShell
      variant="floating"
      logo={logo}
      onSearch={() => {}}
      searchPlaceholder="Search Peek, Ship and Leaf…"
      identity={identity}
      nav={
        <Rail aria-label="peek navigation">
          {rails.map((r) => (
            <RailItem
              key={r.id}
              href="#"
              label={r.label}
              icon={r.icon}
              active={rail === r.id}
              onClick={go(() => {
                onRail(r.id)
                if (r.id === 'desk') onOpen({ type: 'home' })
              })}
            />
          ))}
        </Rail>
      }
    >
      <div className="flex h-full min-h-0">
        <ListColumn title={rails.find((r) => r.id === rail)!.label} collapsed={rail === 'desk'}>
          {list}
        </ListColumn>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AppShell>
  )
}

export interface PerAppProps {
  viewer?: PersonId
  start?: Place
}

export function PerApp({ viewer: firstViewer = 'miky', start = { type: 'topic', id: 'fast' } }: PerAppProps) {
  const [app, switchTo] = useApp()
  const [viewer, setViewer] = useState<PersonId>(firstViewer)
  const [place, setPlace] = useState<Place>(start)
  const [rail, setRail] = useState<RailId>(() => railFor(start, 'topics'))
  const open = (next: Place) => {
    setPlace(next)
    setRail((current) => railFor(next, current))
  }
  const content = <Content place={place} app={app} viewer={viewer} onOpen={open} onApp={switchTo} />
  const logo = <AppSwitcher app={app} onApp={switchTo} />
  const identity = <ViewAs viewer={viewer} onViewer={setViewer} />
  return (
    <div className="h-screen overflow-hidden">
      {app === 'peek' ? (
        <PeekFrame viewer={viewer} place={place} rail={rail} onRail={setRail} onOpen={open} identity={identity} logo={logo}>
          {content}
        </PeekFrame>
      ) : (
        <AppShell
          logo={logo}
          onSearch={() => {}}
          searchPlaceholder="Search Peek, Ship and Leaf…"
          identity={identity}
          nav={app === 'ship' ? <ShipNav viewer={viewer} place={place} onOpen={open} /> : <LeafNav viewer={viewer} place={place} onOpen={open} />}
        >
          {content}
        </AppShell>
      )}
    </div>
  )
}
