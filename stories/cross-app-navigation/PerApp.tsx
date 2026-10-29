import { useContext, useState, type ReactNode } from 'react'
import { IconClock, IconHome, IconLayoutDashboard, IconListCheck, IconLock, IconSortDescending, IconStar, IconTarget, IconUser, IconUsers, IconX } from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { Avatar } from '../../src/Avatar'
import { Button } from '../../src/Button'
import { Chip } from '../../src/Chip'
import { CollapsibleSection } from '../../src/CollapsibleSection'
import { Divider } from '../../src/Divider'
import { EmptyState } from '../../src/EmptyState'
import { IconButton } from '../../src/IconButton'
import { SectionHeader } from '../../src/SectionHeader'
import { KindIcon } from '../../src/KindIcon'
import { ListColumn } from '../../src/ListColumn'
import { NavItem } from '../../src/NavItem'
import { Rail } from '../../src/Rail'
import { RailItem } from '../../src/RailItem'
import { SectionLabel } from '../../src/SectionLabel'
import { Sidebar } from '../../src/Sidebar'
import { Tabs } from '../../src/Tabs'
import { AvatarGroup } from '../../src/AvatarGroup'
import { ActivityVariant, Following, NewDot, hasNewActivity } from './PeekConversation'
import { DESK, DMS, FILES, PEOPLE, TEAMS, TOPICS, canReadFile, dmTitle, canReadTopic, fileOf, spacesOf, teamOf, topicOf, type App, type DeskRow, type FileRow, type PersonId, type Topic } from './fixtures'
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
  useApp,
  useUnread,
  useSpaceIcon,
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

/**
 * The dot variant's sidebar row: blue for new messages (the row's own dot),
 * orange for new activity alone, in the same place (Miky, 29 Oct).
 */
function Row({ viewer, id, unread, children }: { viewer: PersonId; id: string; unread: boolean; children: ReactNode }) {
  const variant = useContext(ActivityVariant)
  if (variant === 'column' || unread || !hasNewActivity(viewer, id)) return children
  return (
    // The row keeps the dot's 24px slot clear, as NavItem does for its own dot.
    <div className="relative [&>:first-child]:pr-8">
      {children}
      <span className="pointer-events-none absolute right-1 top-0 flex h-full w-6 items-center justify-center">
        <NewDot tone="activity" />
      </span>
    </div>
  )
}

/** Where Peek's rail stands for a place: what the list column beside it lists. */
function railFor(place: Place, current: RailId): RailId {
  if (place.type === 'home') return 'desk'
  if (place.type === 'team') return 'teams'
  if (place.type === 'person') return 'people'
  if (place.type === 'topic') return topicOf(place.id).role === 'dm' ? 'people' : topicOf(place.id).ends ? 'topics' : 'teams'
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
  const activity = useContext(ActivityVariant)
  const topic = place.type === 'topic' ? topicOf(place.id) : undefined
  if ((topic && !canReadTopic(viewer, topic)) || (place.type === 'file' && !canReadFile(viewer, fileOf(place.id)))) return <EmptyState message="You can’t open this." />
  switch (place.type) {
    case 'home':
      if (app === 'peek') return <EmptyState message="Pick something from your Desk." />
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
      return <FilePage id={place.id} app={app} viewer={viewer} onSelect={onOpen} />
    case 'topic':
      return app === 'peek' ? <PeekTopic topic={topic!} viewer={viewer} app={app} onApp={onApp} onSelect={onOpen} activity={activity} /> : <FilesOfTopic topic={topic!} app={app} viewer={viewer} onApp={onApp} onSelect={onOpen} />
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
      {item('Home', <IconHome {...icon16} />, { type: 'home' })}
      {item('Open work', <IconClock {...icon16} />, { type: 'page', id: 'open-work' })}
      {item('Starred', <IconStar {...icon16} />, { type: 'page', id: 'starred' })}
      {/* The toggle heads the tree it switches (Miky, 28 October: at the top it read as apart from it). */}
      <div className="px-2 pb-2 pt-4">
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
  const unread = useUnread(viewer)
  const iconOf = useSpaceIcon()
  return TEAMS.map((team) => {
    const spaces = spacesOf(team.id).filter((s) => canReadTopic(viewer, s))
    return (
      <div key={team.id} className="flex flex-col gap-0.5 pb-3">
        <button type="button" onClick={() => onOpen({ type: 'team', id: team.id })} className="flex items-center gap-1 rounded px-2 pb-1 text-left text-text-muted hover:text-text-primary">
          <SectionLabel tone="muted">{team.name}</SectionLabel>
          {team.private && <IconLock size={12} stroke={1.5} />}
        </button>
        {spaces.map((s: Topic) => (
          <Row key={s.id} viewer={viewer} id={s.id} unread={unread.has(s.id)}>
          <NavItem
            href="#"
            label={s.role === 'chat' ? (team.id === 'company' ? 'general' : team.name.toLowerCase()) : s.title}
            tooltip={s.role === 'chat' ? (team.private ? 'The team’s own chat: members only' : 'The team’s own chat') : s.role === 'front-door' ? `Open to everyone: how others talk to ${team.name}` : readersLabel(s).words}
            icon={iconOf(s)}
            unread={unread.has(s.id)}
            active={same(place, { type: 'topic', id: s.id })}
            onClick={go(() => onOpen({ type: 'topic', id: s.id }))}
          />
          </Row>
        ))}
      </div>
    )
  })
}

const deskPlace = (row: DeskRow): Place => (row.topic ? { type: 'topic', id: row.topic } : { type: 'file', id: row.file! })
const deskOf = (viewer: PersonId) => DESK[viewer === 'katerina' ? 'katerina' : 'miky']

/** The first Peek row on the Desk, which Peek opens beside the list, as it does today. */
const firstDeskPlace = (viewer: PersonId): Place => {
  const desk = deskOf(viewer)
  const row = [...desk.needs, ...desk.managing, ...desk.activity].find((r) => r.app === 'peek' && r.topic)
  return row ? deskPlace(row) : { type: 'home' }
}

const deskIcon = (row: DeskRow) => (row.topic ? spaceIcon(topicOf(row.topic)) : <KindIcon kind={kindOf(fileOf(row.file!))} />)

/** One Screener item as Peek draws it (ScreenerItem): who or what, a two-line preview, then Open, Later and Dismiss. */
function ScreenerRow({ row, onOpen, onDismiss }: { row: DeskRow; onOpen: () => void; onDismiss: () => void }) {
  return (
    <div className="flex flex-col rounded-lg p-2 hover:bg-bg-hover has-[button:hover]:bg-transparent">
      <div className="flex items-center gap-2">
        {deskIcon(row)}
        <span className="truncate text-body-2-strong text-text-primary">{row.title}</span>
      </div>
      <p className="line-clamp-2 py-1 pl-6 pr-2 text-caption text-text-secondary">{row.detail}</p>
      <div className="flex items-center justify-between pl-6 pt-3">
        <div className="flex items-center gap-2">
          <Button variant="primary" size="small" onClick={onOpen}>
            Open
          </Button>
          <Button variant="outlined" size="small" onClick={onDismiss}>
            Later
          </Button>
        </div>
        <IconButton variant="outlined" tooltip="Dismiss" aria-label="Dismiss" onClick={onDismiss}>
          <IconX size={16} stroke={1.5} />
        </IconButton>
      </div>
    </div>
  )
}

/**
 * Peek's Desk as Peek draws it today (peek-app DeskPage; Miky, 28 Oct): the
 * Screener, Urgent, Open work and Starred in the list column, the conversation
 * open beside it. Every section but Open work hides when it is empty. A row
 * from Ship or Leaf goes to its app. Ship and Leaf keep the Desk as a page.
 */
function DeskList({ viewer, place, onShow, onApp }: { viewer: PersonId; place: Place; onShow: (p: Place) => void; onApp: (a: App) => void }) {
  const desk = deskOf(viewer)
  const unread = useUnread(viewer)
  const [opened, setOpened] = useState<DeskRow[]>([])
  const [gone, setGone] = useState<Set<string>>(new Set())
  const screener = desk.needs.filter((r) => !r.urgent && !gone.has(r.id))
  const urgent = desk.needs.filter((r) => r.urgent)
  const openWork = [...desk.managing, ...opened]
  const starred = (Object.keys(PEOPLE) as PersonId[]).filter((p) => p !== viewer && p !== 'agent')
  const show = (row: DeskRow) => {
    if (row.app !== 'peek') onApp(row.app)
    onShow(deskPlace(row))
  }
  const row = (r: DeskRow) => (
    <NavItem key={r.id} href="#" label={r.title} tooltip={`${appName(r.app)}: ${r.detail}`} icon={deskIcon(r)} unread={!!r.topic && unread.has(r.topic)} active={same(place, deskPlace(r))} onClick={go(() => show(r))} />
  )
  return (
    <>
      {screener.length > 0 && (
        <>
          <CollapsibleSection title="Screener" trailing={<Chip type="brand" label={String(screener.length)} />} contentClassName="gap-0.5 mt-1">
            {screener.map((r) => (
              <ScreenerRow
                key={r.id}
                row={r}
                onOpen={() => {
                  setGone((g) => new Set([...g, r.id]))
                  setOpened((o) => [...o, r])
                  show(r)
                }}
                onDismiss={() => setGone((g) => new Set([...g, r.id]))}
              />
            ))}
          </CollapsibleSection>
          <Divider className="my-2" />
        </>
      )}
      {urgent.length > 0 && (
        <>
          <div className="flex flex-col">
            <SectionHeader title="Urgent" hover="none" />
            {urgent.map(row)}
          </div>
          <Divider className="my-2" />
        </>
      )}
      <div className="flex flex-col">
        <SectionHeader title="Open work" showActions="always" hover="none" actions={[{ icon: <IconSortDescending size={16} stroke={1.5} />, tooltip: 'Sort by', onClick: () => {} }]} />
        {openWork.map(row)}
      </div>
      <Divider className="my-2" />
      <CollapsibleSection title="Starred" contentClassName="gap-0.5 mt-1">
        {starred.map((p) => (
          <NavItem key={p} href="#" label={PEOPLE[p].name} icon={<Avatar name={PEOPLE[p].name} size={16} />} active={same(place, { type: 'person', id: p })} onClick={go(() => onShow({ type: 'person', id: p }))} />
        ))}
      </CollapsibleSection>
    </>
  )
}

/** Peek: a rail of Desk, Topics, Teams and People, and the list column the rail chose. */
function PeekFrame({ viewer, place, rail, onRail, onOpen, onShow, onApp, identity, logo, children }: { viewer: PersonId; place: Place; rail: RailId; onRail: (r: RailId) => void; onOpen: (p: Place) => void; onShow: (p: Place) => void; onApp: (a: App) => void; identity: ReactNode; logo: ReactNode; children: ReactNode }) {
  const unread = useUnread(viewer)
  const iconOf = useSpaceIcon()
  const rails: { id: RailId; label: string; icon: ReactNode }[] = [
    { id: 'desk', label: 'Desk', icon: <IconLayoutDashboard size={20} stroke={1.5} /> },
    { id: 'topics', label: 'Topics', icon: <IconTarget size={20} stroke={1.5} /> },
    { id: 'teams', label: 'Teams', icon: <IconUsers size={20} stroke={1.5} /> },
    { id: 'people', label: 'People', icon: <IconUser size={20} stroke={1.5} /> },
  ]
  const list =
    rail === 'desk'
      ? <DeskList viewer={viewer} place={place} onShow={onShow} onApp={onApp} />
      : rail === 'topics'
      ? TOPICS.filter((t) => t.ends && canReadTopic(viewer, t)).map((t) => (
          <Row key={t.id} viewer={viewer} id={t.id} unread={unread.has(t.id)}>
            <NavItem href="#" label={t.title} tooltip={`Led by ${teamOf(t.lead).name}`} icon={iconOf(t)} unread={unread.has(t.id)} active={same(place, { type: 'topic', id: t.id })} onClick={go(() => onOpen({ type: 'topic', id: t.id }))} />
          </Row>
        ))
      : rail === 'teams'
        ? <TeamSpaces viewer={viewer} place={place} onOpen={onOpen} />
        : // Your direct conversations, a one-to-one and a group (Miky, 29 Oct).
          DMS.filter((d) => canReadTopic(viewer, d)).map((d) => {
            const others = (d.members ?? []).filter((p) => p !== viewer)
            return (
              <Row key={d.id} viewer={viewer} id={d.id} unread={unread.has(d.id)}>
                <NavItem
                  href="#"
                  label={dmTitle(viewer, d)}
                  icon={others.length > 1 ? <AvatarGroup size={16} members={others.map((p) => ({ name: PEOPLE[p].name }))} /> : <Avatar name={PEOPLE[others[0]].name} size={16} />}
                  unread={unread.has(d.id)}
                  active={same(place, { type: 'topic', id: d.id })}
                  onClick={go(() => onOpen({ type: 'topic', id: d.id }))}
                />
              </Row>
            )
          })
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
                if (r.id === 'desk') onShow(firstDeskPlace(viewer))
              })}
            />
          ))}
        </Rail>
      }
    >
      <div className="flex h-full min-h-0">
        <ListColumn title={rails.find((r) => r.id === rail)!.label}>
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
  /** Where Activity lives: its own column beside the files, or behind a dot by the title (Miky, 29 Oct, to compare). */
  activity?: 'column' | 'dot'
}

export function PerApp(props: PerAppProps) {
  return (
    <ActivityVariant.Provider value={props.activity ?? 'column'}>
      {/* The topic's icon is how you follow it, in both (Miky, 29 Oct). */}
      <Following.Provider value>
        <PerAppInner {...props} />
      </Following.Provider>
    </ActivityVariant.Provider>
  )
}

function PerAppInner({ viewer: firstViewer = 'miky', start = { type: 'topic', id: 'fast' } }: PerAppProps) {
  const [app, switchTo] = useApp()
  const [viewer, setViewer] = useState<PersonId>(firstViewer)
  const [place, setPlace] = useState<Place>(() => (start.type === 'home' && app === 'peek' ? firstDeskPlace(firstViewer) : start))
  const [rail, setRail] = useState<RailId>(() => (start.type === 'home' ? 'desk' : railFor(start, 'topics')))
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
        <PeekFrame viewer={viewer} place={place} rail={rail} onRail={setRail} onOpen={open} onShow={setPlace} onApp={switchTo} identity={identity} logo={logo}>
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
