import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconHash,
  IconHome,
  IconLayoutDashboard,
  IconListCheck,
  IconLayoutSidebarRight,
  IconLock,
  IconStack2,
  IconUsers,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { Avatar } from '../../src/Avatar'
import { IconButton } from '../../src/IconButton'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { EmptyState } from '../../src/EmptyState'
import { KindIcon } from '../../src/KindIcon'
import { Menu, MenuItem } from '../../src/Menu'
import { NavItem } from '../../src/NavItem'
import { PersonTrigger } from '../../src/PersonTrigger'
import { SectionLabel } from '../../src/SectionLabel'
import { Sidebar } from '../../src/Sidebar'
import { TooltipTrigger } from '../../src/Tooltip'
import { LinkCard } from '../../src/LinkCard'
import type { LinkState } from '../../src/linked'
import { ScrollArea } from '../../src/ScrollArea'
import { PeekBox, PeekCard, SentCard, ThreadPanel, TopicActivity, cardOf } from './PeekConversation'
import {
  FILES,
  MESSAGES,
  PEOPLE,
  TEAMS,
  TOPICS,
  canReadFile,
  canReadTopic,
  fileOf,
  spacesOf,
  teamOf,
  topicOf,
  type App,
  type FileRow,
  type Message,
  type PersonId,
  type SentUp,
  type TeamId,
  type Topic,
} from './fixtures'

/**
 * Lens: one frame for Peek, Ship and Leaf. The same sidebar in every app,
 * Topics (what we are focused on) and Teams (who we are), each listing the
 * app's own kind of file. The switcher in the top bar keeps what is open.
 */

export const APPS: { id: App; name: string; theme: string; what: string }[] = [
  { id: 'peek', name: 'Peek', theme: 'signal', what: 'Conversations' },
  { id: 'ship', name: 'Ship', theme: 'ship', what: 'Projects and issues' },
  { id: 'leaf', name: 'Leaf', theme: 'leaf', what: 'Documents' },
]

const appOfTheme = (theme?: string): App => APPS.find((a) => a.theme === theme)?.id ?? 'peek'

/** The app follows the theme on <html>: the toolbar's, or the switcher's. */
export function useApp(): [App, (app: App) => void] {
  const [app, setApp] = useState<App>(() => appOfTheme(document.documentElement.dataset.theme))
  useEffect(() => {
    const html = document.documentElement
    const follow = () => setApp(appOfTheme(html.dataset.theme))
    const observer = new MutationObserver(follow)
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    follow()
    return () => observer.disconnect()
  }, [])
  const switchTo = (next: App) => {
    // The preview's own way of choosing a theme (.storybook/preview.tsx).
    const theme = APPS.find((a) => a.id === next)!.theme
    const html = document.documentElement
    html.dataset.theme = theme
    html.classList.toggle('dark', theme === 'signal')
    html.classList.toggle('signal', theme === 'signal')
  }
  return [app, switchTo]
}

export type Selection = { type: 'home' } | { type: 'topic'; id: string } | { type: 'team'; id: TeamId } | { type: 'file'; id: string }
type PeekView = 'all' | 'main' | { file: string }

export const icon16 = { size: 16, stroke: 1.5 } as const
export const kindOf = (file: FileRow) => (file.app === 'ship' ? 'project' : 'file')
export const noun = (app: App, n: number) => (app === 'ship' ? (n === 1 ? 'project' : 'projects') : n === 1 ? 'document' : 'documents')
export const go = (fn: () => void) => (event: MouseEvent) => {
  event.preventDefault()
  fn()
}
/** The conversations with something new, as each person would see it. */
export const unreadFor = (viewer: PersonId) => new Set(viewer === 'miky' ? ['fast', 'eng-door', 'mkt-door'] : ['navigation', 'bugs'])

export function readersLabel(topic: Topic) {
  if (topic.readers === 'everyone') return { icon: <IconWorld {...icon16} />, words: 'Everyone' }
  if (topic.readers === 'teams') return { icon: <IconUsersGroup {...icon16} />, words: (topic.shared ?? []).map((t) => teamOf(t).name).join(' and ') }
  return { icon: <IconLock {...icon16} />, words: `${teamOf(topic.lead).name} only` }
}

/** Three kinds of discussion space in Peek, three icons (Miky, 28 Oct): a team's chat, a space two teams share, and a topic, lasting ones like Bugs included. */
export function spaceIcon(topic: Topic) {
  if (topic.role === 'chat') return <IconHash {...icon16} />
  if (isCrossTeam(topic)) return <IconUsersGroup {...icon16} />
  return <KindIcon kind="topic" />
}

/** A team's chat or a space two teams share: just the conversation, with no All, Main or listed files. */
export const isCrossTeam = (topic: Topic) => topic.readers === 'teams'
export const isChatOnly = (topic: Topic) => topic.role === 'chat' || isCrossTeam(topic)

export function AppSwitcher({ app, onApp }: { app: App; onApp: (app: App) => void }) {
  const current = APPS.find((a) => a.id === app)!
  return (
    <Menu
      trigger={
        <button type="button" aria-label={`${current.name}: switch app`} className="flex items-center gap-2 rounded-md px-2 py-1 text-body-2-strong text-text-primary hover:bg-bg-hover">
          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded bg-accent-primary text-caption font-semibold text-text-inverse">
            {current.name[0]}
          </span>
          {current.name}
          <IconChevronDown size={14} stroke={1.5} className="text-text-muted" />
        </button>
      }
    >
      {APPS.map((a) => (
        <MenuItem key={a.id} label={a.name} description={a.what} selected={a.id === app} trailing={a.id === app ? <IconCheck {...icon16} /> : undefined} onClick={() => onApp(a.id)} />
      ))}
    </Menu>
  )
}

export function ViewAs({ viewer, onViewer }: { viewer: PersonId; onViewer: (who: PersonId) => void }) {
  return (
    <Menu align="right" trigger={<PersonTrigger name={PEOPLE[viewer].name} />}>
      <MenuItem label="View as Miky" description="In every team" selected={viewer === 'miky'} onClick={() => onViewer('miky')} />
      <MenuItem label="View as Katerina" description="Not in Engineering, a private team" selected={viewer === 'katerina'} onClick={() => onViewer('katerina')} />
    </Menu>
  )
}

/** The sidebar every app draws: its home, Topics, Teams. */
function Nav({ app, viewer, selection, onSelect }: { app: App; viewer: PersonId; selection: Selection; onSelect: (s: Selection) => void }) {
  const isSelected = (s: Selection) => JSON.stringify(s) === JSON.stringify(selection)
  const fileRows = (files: FileRow[], lockedWhere?: string) => {
    const mine = files.filter((f) => f.app === app)
    const readable = mine.filter((f) => canReadFile(viewer, f))
    const locked = mine.length - readable.length
    return [
      ...readable.map((f) => (
        <NavItem key={f.id} href="#" label={f.title} icon={<KindIcon kind={kindOf(f)} />} active={isSelected({ type: 'file', id: f.id })} onClick={go(() => onSelect({ type: 'file', id: f.id }))} />
      )),
      locked > 0 && (
        <NavItem key="locked" href="#" label={`${locked} ${noun(app, locked)} you can't open`} tooltip={lockedWhere ?? 'They live in a private team you are not in.'} icon={<IconLock {...icon16} />} onClick={go(() => {})} />
      ),
    ]
  }
  const home = app === 'peek' ? { label: 'Desk', icon: <IconLayoutDashboard {...icon16} /> } : app === 'ship' ? { label: 'My issues', icon: <IconListCheck {...icon16} /> } : { label: 'Home', icon: <IconHome {...icon16} /> }
  const unread = unreadFor(viewer)
  return (
    <Sidebar aria-label={`${app} navigation`}>
      <NavItem href="#" label={home.label} icon={home.icon} active={selection.type === 'home'} onClick={go(() => onSelect({ type: 'home' }))} />

      <div className="px-2 pb-1 pt-4">
        <SectionLabel tone="muted">Topics</SectionLabel>
      </div>
      {TOPICS.filter((t) => t.ends && canReadTopic(viewer, t)).map((t) => {
        const rows = app === 'peek' ? [] : fileRows(t.lists.map(fileOf)).filter(Boolean)
        return (
          <NavItem
            key={t.id}
            href="#"
            label={t.title}
            icon={<KindIcon kind="topic" />}
            unread={app === 'peek' && unread.has(t.id)}
            active={isSelected({ type: 'topic', id: t.id })}
            onClick={go(() => onSelect({ type: 'topic', id: t.id }))}
            defaultOpen={false}
          >
            {rows.length > 0 ? rows : undefined}
          </NavItem>
        )
      })}

      <div className="px-2 pb-1 pt-4">
        <SectionLabel tone="muted">Teams</SectionLabel>
      </div>
      {TEAMS.map((team) => {
        const member = team.members.includes(viewer)
        const rows =
          app === 'peek'
            ? spacesOf(team.id)
                .filter((s) => canReadTopic(viewer, s))
                .map((s) => (
                  <NavItem
                    key={s.id}
                    href="#"
                    label={s.role === 'chat' ? (team.id === 'company' ? 'General' : 'Team chat') : s.title}
                    tooltip={s.role === 'chat' ? `${team.private ? 'Members only' : 'The team’s own conversation'}` : s.role === 'front-door' ? `Open to everyone: how others talk to ${team.name}` : readersLabel(s).words}
                    icon={spaceIcon(s)}
                    unread={unread.has(s.id)}
                    active={isSelected({ type: 'topic', id: s.id })}
                    onClick={go(() => onSelect({ type: 'topic', id: s.id }))}
                  />
                ))
            : fileRows(FILES.filter((f) => f.team === team.id), `${team.name} is private and you are not in it.`).filter(Boolean)
        return (
          <NavItem
            key={team.id}
            href="#"
            label={team.name}
            tooltip={team.private ? (member ? 'Private: only members read its chat and files' : 'Private: you see its front door, not its chat or files') : undefined}
            icon={team.private ? <IconLock {...icon16} /> : <IconUsers {...icon16} />}
            active={isSelected({ type: 'team', id: team.id })}
            onClick={go(() => onSelect({ type: 'team', id: team.id }))}
            defaultOpen={team.id === 'eng' || team.id === 'company'}
          >
            {rows.length > 0 ? rows : undefined}
          </NavItem>
        )
      })}
    </Sidebar>
  )
}

export function Header({ title, locked = false, children, right }: { title: string; locked?: boolean; children?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2">
      <span className="flex items-center gap-1 text-body-1 font-medium text-text-primary">
        {locked && <IconLock {...icon16} className="text-text-secondary" aria-label="Private" />}
        {title}
      </span>
      {children}
      <span className="ml-auto flex items-center gap-2">{right}</span>
    </div>
  )
}

/**
 * The team it belongs to, as the team's avatar and name (both teams for a
 * shared space). Who reads it is not said when everyone does; a private one is
 * locked at its title (Miky, 29 Oct).
 */
function TopicFacts({ topic }: { topic: Topic }) {
  const teams = topic.readers === 'teams' ? (topic.shared ?? []) : [topic.lead]
  return (
    <>
      {teams.map((t) => (
        <span key={t} className="flex items-center gap-1.5 text-body-2 text-text-secondary">
          <Avatar name={teamOf(t).name} size={20} />
          {teamOf(t).name}
        </span>
      ))}
      {!topic.ends && <span className="text-caption text-text-muted">No end</span>}
    </>
  )
}

export const isPrivate = (topic: Topic) => topic.readers === 'team'

function OtherApps({ topic, app, viewer, onApp }: { topic: Topic; app: App; viewer: PersonId; onApp: (a: App) => void }) {
  const files = topic.lists.map(fileOf).filter((f) => canReadFile(viewer, f))
  const elsewhere = APPS.filter((a) => a.id !== app).map((a) => {
    const n = a.id === 'peek' ? 0 : files.filter((f) => f.app === a.id).length
    const words = a.id === 'peek' ? 'The conversation, in Peek' : `${n} ${noun(a.id, n)} in ${a.name}`
    return { a, n, words }
  })
  return (
    <div className="flex flex-wrap gap-2 text-body-2">
      {elsewhere
        .filter((e) => e.a.id === 'peek' || e.n > 0)
        .map((e) => (
          <button key={e.a.id} type="button" onClick={() => onApp(e.a.id)} className="flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-text-secondary hover:bg-bg-hover">
            {e.words}
            <IconArrowUpRight size={14} stroke={1.5} />
          </button>
        ))}
    </div>
  )
}

/**
 * All | Main beside the topic's title, each saying what it holds and how much
 * (Miky, 29 Oct): All is every conversation, the topic's and its files'; Main
 * is the topic's own and the threads someone sent up to it. A file opened from the
 * listed files is a third segment while it is open.
 */
function ViewToggle({ view, onView, counts, file }: { view: 'all' | 'main' | 'file'; onView: (v: 'all' | 'main') => void; counts: { all: number; main: number }; file?: FileRow }) {
  const segment = (on: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-body-2-strong transition-colors',
      on ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
    )
  const count = (n: number, on: boolean) => <span className={cn('rounded px-1 font-mono text-caption', on ? 'bg-accent-wash text-accent-text' : 'text-text-muted')}>{n}</span>
  return (
    <div role="radiogroup" aria-label="What to show" className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-bg-inset p-0.5">
      <TooltipTrigger label="Everything: the topic’s conversation and every file it lists" placement="bottom">
        <button type="button" role="radio" aria-checked={view === 'all'} onClick={() => onView('all')} className={segment(view === 'all')}>
          <IconStack2 size={16} stroke={1.5} />
          All
          {count(counts.all, view === 'all')}
        </button>
      </TooltipTrigger>
      <TooltipTrigger label="The topic’s own conversation and the threads someone sent up to it" placement="bottom">
        <button type="button" role="radio" aria-checked={view === 'main'} onClick={() => onView('main')} className={segment(view === 'main')}>
          <KindIcon kind="topic" />
          Main
          {count(counts.main, view === 'main')}
        </button>
      </TooltipTrigger>
      {file && (
        <span role="radio" aria-checked className={cn(segment(true), 'max-w-48')}>
          <KindIcon kind={kindOf(file)} />
          <span className="truncate">{file.title}</span>
        </span>
      )}
    </div>
  )
}

/** Peek's topic: All, Main, or one listed file's conversation; the listed files beside it. */
export function PeekTopic({ topic, viewer, app, onApp, onSelect }: { topic: Topic; viewer: PersonId; app: App; onApp: (a: App) => void; onSelect: (s: Selection) => void }) {
  const [view, setView] = useState<PeekView>('main')
  const [sent, setSent] = useState<Record<string, Message[]>>({})
  const [thread, setThread] = useState<string | null>(null)
  const [side, setSide] = useState(true)
  // Threads sent up with Send to topic in this prototype, by the topic they went to.
  const [ups, setUps] = useState<Record<string, { m: Message; up: SentUp }[]>>({})
  useEffect(() => {
    setView('main')
    setThread(null)
  }, [topic.id])
  const listed = topic.lists.map(fileOf)
  const every = [...(MESSAGES[topic.id] ?? []), ...(sent[topic.id] ?? [])]
  const readable = (m: Message) => !m.on || canReadFile(viewer, fileOf(m.on))
  /** Where a file's thread was sent up to, and by whom: the fixtures' own, then this prototype's. */
  const upIn = (t: string, m: Message) => (MESSAGES[t]?.some((x) => x.id === m.id) ? m.sentUp : undefined) ?? ups[t]?.find((s) => s.m.id === m.id)?.up
  const sends = (ups[topic.id] ?? []).filter((s) => !every.some((m) => m.id === s.m.id))
  // A sent thread is a message on the topic, so every reader of the topic gets it, locked to those who can't open its file.
  const entries = [...every, ...sends.map((s) => s.m)]
    .map((m) => ({ m, up: m.on ? upIn(topic.id, m) : undefined, readable: readable(m) }))
    .filter((e) => e.readable || e.up)
  const hidden = every.length + sends.length - entries.length
  const opened = entries.find((e) => e.m.id === thread && e.readable)?.m
  const chatOnly = isChatOnly(topic)
  // Main: what was said on the topic itself, and the threads someone sent up by hand (Miky, 29 Oct). Resolving or a mention alone does not bring one here.
  const main = entries.filter((e) => !e.m.on || e.up)
  const shown = chatOnly || view === 'all' ? entries : view === 'main' ? main : entries.filter((e) => e.m.on === view.file && e.readable)
  // The topics a thread can go to, the one you are on first.
  const placesOf = (m: Message) =>
    TOPICS.filter((t) => m.on && t.lists.includes(m.on) && canReadTopic(viewer, t)).sort((a, b) => Number(b.id === topic.id) - Number(a.id === topic.id))
  /** A listed file's card: its summary, a project's issues (Miky, 29 Oct: not the latest conversation), and how much was said here. */
  const fileCard = (f: FileRow): LinkState => {
    const said = every.filter((m) => m.on === f.id)
    const card = cardOf(f, said.at(-1)?.at ?? '')
    if (card.state !== 'ready') return card
    const count = said.reduce((n, m) => n + 1 + (m.thread?.length ?? 0), 0)
    const children = f.issues?.map((i, n) => ({
      id: `${f.id}-${n}`,
      title: i.title,
      href: '#',
      status: i.done ? { label: 'Done', colour: 'green' as const } : { label: 'In progress', colour: 'blue' as const },
    }))
    return { ...card, linked: { ...card.linked, summary: f.summary, children, conversation: count ? { count, href: '#' } : undefined } }
  }
  const tab = typeof view === 'string' ? view : 'file'
  const chosen = typeof view === 'string' ? undefined : fileOf(view.file)
  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={topic.title}
          locked={isPrivate(topic)}
          right={
            <>
              <TopicFacts topic={topic} />
              {!chatOnly && (
                <IconButton aria-label={side ? 'Hide the files' : 'Show the files'} tooltip={side ? 'Hide the sidebar' : 'Show the sidebar'} onClick={() => setSide(!side)}>
                  <IconLayoutSidebarRight {...icon16} />
                </IconButton>
              )}
            </>
          }
        >
          {!chatOnly && <ViewToggle view={tab} onView={setView} counts={{ all: entries.length, main: main.length }} file={chosen} />}
        </Header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {shown.length === 0 ? (
            <EmptyState scope="section" message="Nothing here yet." />
          ) : (
            <div className="flex flex-col gap-1">
              {shown.map(({ m, up, readable }) =>
                // On the topic a sent thread is its sender's message; in a file's own view it is a plain message.
                up && typeof view === 'string' ? (
                  <SentCard key={m.id} m={m} up={up} readable={readable} viewer={viewer} selected={thread === m.id} onOpen={() => setThread(m.id)} onFile={(id) => setView({ file: id })} />
                ) : (
                  <PeekCard key={m.id} m={m} viewer={viewer} selected={thread === m.id} onOpen={() => setThread(m.id)} heading={typeof view === 'string'} onFile={(id) => setView({ file: id })} />
                ),
              )}
            </div>
          )}
          {hidden > 0 && view === 'all' && <p className="mt-5 flex items-center gap-1 text-caption text-text-muted"><IconLock size={14} stroke={1.5} />{hidden} more on files you can’t open</p>}
        </div>
        <div className="border-t border-border-subtle p-3">
          <PeekBox
            to={chosen ? chosen.title : topic.title}
            onSent={(body) =>
              setSent((now) => ({ ...now, [topic.id]: [...(now[topic.id] ?? []), { id: `sent-${Date.now()}`, by: viewer, at: 'Now', body, on: chosen?.id }] }))
            }
          />
        </div>
      </div>
      {opened && (
        <ThreadPanel
          key={opened.id}
          m={opened}
          viewer={viewer}
          places={placesOf(opened)}
          sentTo={TOPICS.flatMap((t) => {
            const up = upIn(t.id, opened)
            return opened.on && up ? [{ topic: t.id, up }] : []
          })}
          onSend={(to, note) =>
            setUps((now) => ({ ...now, ...Object.fromEntries(to.map((t) => [t, [...(now[t] ?? []), { m: opened, up: { by: viewer, at: 'Now', note: note || undefined } }]])) }))
          }
          onClose={() => setThread(null)}
        />
      )}
      {!chatOnly && !opened && side && <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-border-subtle p-4 lg:flex">
        {/* Yours alone, above the files (Miky, 29 Oct): mentions, highlights and reactions to your messages. About three rows show; the rest scroll inside. */}
        <SectionLabel tone="muted">Activity</SectionLabel>
        <ScrollArea className="shrink-0" viewportClassName="max-h-[300px]">
          <TopicActivity viewer={viewer} messages={entries.filter((e) => e.readable).map((e) => e.m)} onOpen={setThread} />
        </ScrollArea>
        <SectionLabel tone="muted">Files</SectionLabel>
        {listed.length === 0 && <p className="text-body-2 text-text-muted">None yet. A topic can be only a conversation.</p>}
        {(() => {
          const open = listed.filter((f) => canReadFile(viewer, f))
          return (
            <div className="flex flex-col gap-3">
              {/* The package's card, for its details, with no app label: the card says what it is (Miky, 29 Oct). A click shows the file's conversation here instead of leaving. */}
              {open.map((f) => (
                <div
                  key={f.id}
                  className={cn('rounded-md', chosen?.id === f.id && 'bg-bg-selected')}
                  onClickCapture={(e) => {
                    e.preventDefault()
                    setView({ file: f.id })
                  }}
                >
                  <LinkCard link={fileCard(f)} />
                </div>
              ))}
              {listed.length > open.length && (
                <span className="flex items-center gap-2 px-2 py-1 text-caption text-text-muted">
                  <IconLock size={14} stroke={1.5} />
                  {listed.length - open.length} you can’t open
                </span>
              )}
            </div>
          )
        })()}
      </aside>}
    </div>
  )
}

/** Ship's and Leaf's topic: the app's own files the topic lists, from any team. */
export function FilesOfTopic({ topic, app, viewer, onApp, onSelect }: { topic: Topic; app: 'ship' | 'leaf'; viewer: PersonId; onApp: (a: App) => void; onSelect: (s: Selection) => void }) {
  const mine = topic.lists.map(fileOf).filter((f) => f.app === app)
  const open = mine.filter((f) => canReadFile(viewer, f))
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title={topic.title} locked={isPrivate(topic)} right={<TopicFacts topic={topic} />} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <OtherApps topic={topic} app={app} viewer={viewer} onApp={onApp} />
        <SectionLabel tone="muted">{app === 'ship' ? 'Projects this topic lists' : 'Documents this topic lists'}</SectionLabel>
        {mine.length === 0 ? (
          <EmptyState scope="section" message="Nothing here yet." />
        ) : (
          <FileList files={open} app={app} onSelect={onSelect} />
        )}
        {mine.length > open.length && (
          <p className="flex items-center gap-1 text-caption text-text-muted">
            <IconLock size={14} stroke={1.5} />
            {mine.length - open.length} {noun(app, mine.length - open.length)} you can’t open: they live in a private team you are not in.
          </p>
        )}
      </div>
    </div>
  )
}

export function FileList({ files, app, onSelect }: { files: FileRow[]; app: 'ship' | 'leaf'; onSelect: (s: Selection) => void }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">
      {files.map((f) => (
        <button key={f.id} type="button" onClick={() => onSelect({ type: 'file', id: f.id })} className="flex items-center gap-3 px-3 py-2 text-left hover:bg-bg-hover">
          <KindIcon kind={kindOf(f)} />
          <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{f.title}</span>
          <span className="text-caption text-text-muted">{teamOf(f.team).name}</span>
          {app === 'ship' && <span className="w-16 text-right text-caption text-text-secondary">{f.progress}</span>}
        </button>
      ))}
    </div>
  )
}

export function TeamPage({ team, app, viewer, onSelect }: { team: TeamId; app: App; viewer: PersonId; onSelect: (s: Selection) => void }) {
  const t = teamOf(team)
  const member = t.members.includes(viewer)
  const files = FILES.filter((f) => f.team === team && f.app === app)
  const leads = TOPICS.filter((x) => x.ends && x.lead === team)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title={t.name}>
        <span className="flex items-center gap-1 text-caption text-text-secondary">
          {t.private ? <IconLock {...icon16} /> : <IconUsers {...icon16} />}
          {t.private ? 'Private' : team === 'company' ? 'Everyone in the company' : 'Open'}
        </span>
        <span className="flex items-center -space-x-1">
          {t.members.map((p) => (
            <Avatar key={p} name={PEOPLE[p].name} size={20} />
          ))}
        </span>
      </Header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {app === 'peek' ? (
          <>
            <SectionLabel tone="muted">Its spaces</SectionLabel>
            <div className="flex flex-col gap-1">
              {spacesOf(team).map((s) => {
                const can = canReadTopic(viewer, s)
                return (
                  <button key={s.id} type="button" disabled={!can} onClick={() => onSelect({ type: 'topic', id: s.id })} className="flex items-center gap-2 rounded-md px-2 py-1 text-left text-body-2 text-text-primary hover:bg-bg-hover disabled:text-text-muted">
                    {spaceIcon(s)}
                    {s.role === 'chat' ? (team === 'company' ? 'General' : 'Team chat') : s.title}
                    <span className="text-caption text-text-muted">{can ? readersLabel(s).words : 'Members only'}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : !member && t.private ? (
          <EmptyState scope="section" message={`${t.name} is private. Its ${noun(app, 2)} are for its members; talk to it through ${spacesOf(team).find((s) => s.role === 'front-door')?.title ?? 'its front door'} in Peek.`} />
        ) : (
          <>
            <SectionLabel tone="muted">{app === 'ship' ? 'Its projects' : 'Its documents'}</SectionLabel>
            {files.length === 0 ? <EmptyState scope="section" message="Nothing here yet." /> : <FileList files={files} app={app} onSelect={onSelect} />}
          </>
        )}
        {leads.length > 0 && (
          <>
            <SectionLabel tone="muted">Topics it leads</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {leads.map((x) => (
                <Chip key={x.id} label={x.title} leadingIcon={<KindIcon kind="topic" size={14} tone="inherit" />} href="#" onClick={go(() => onSelect({ type: 'topic', id: x.id }))} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** A project or a document: one team, any number of topics. */
export function FilePage({ id, app, onSelect }: { id: string; app: App; onSelect: (s: Selection) => void }) {
  const f = fileOf(id)
  const topics = TOPICS.filter((t) => t.lists.includes(id))
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header title={f.title}>
        <span className="text-caption text-text-muted">{f.app === 'ship' ? `Ship project · ${f.progress} done` : 'Leaf document'}</span>
      </Header>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-body-2">
          <span className="w-20 text-text-secondary">Team</span>
          <Chip label={teamOf(f.team).name} leadingIcon={<IconUsers size={14} stroke={1.5} />} href="#" onClick={go(() => onSelect({ type: 'team', id: f.team }))} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-body-2">
          <span className="w-20 text-text-secondary">Topics</span>
          {topics.length === 0 ? <span className="text-text-muted">None</span> : topics.map((t) => <Chip key={t.id} label={t.title} leadingIcon={<KindIcon kind="topic" size={14} tone="inherit" />} href="#" onClick={go(() => onSelect({ type: 'topic', id: t.id }))} />)}
        </div>
        <p className="text-caption text-text-muted">
          The team decides who reads it. Topics only list it: adding it to a topic grants nobody anything. {app === 'peek' ? 'In Peek, open it from a topic’s Files.' : ''}
        </p>
      </div>
    </div>
  )
}

export interface LensProps {
  viewer?: PersonId
  start?: Selection
}

export function Lens({ viewer: firstViewer = 'miky', start = { type: 'topic', id: 'fast' } }: LensProps) {
  const [app, switchTo] = useApp()
  const [viewer, setViewer] = useState<PersonId>(firstViewer)
  const [selection, setSelection] = useState<Selection>(start)
  // A space the viewer can no longer read (switched to Katerina) falls back to Desk.
  const topic = selection.type === 'topic' ? topicOf(selection.id) : undefined
  const unreadable = (topic && !canReadTopic(viewer, topic)) || (selection.type === 'file' && !canReadFile(viewer, fileOf(selection.id)))
  const content =
    selection.type === 'home' || unreadable ? (
      <EmptyState message={unreadable ? 'You can’t open this.' : 'Not drawn in this prototype.'} />
    ) : selection.type === 'team' ? (
      <TeamPage team={selection.id} app={app} viewer={viewer} onSelect={setSelection} />
    ) : selection.type === 'file' ? (
      <FilePage id={selection.id} app={app} onSelect={setSelection} />
    ) : app === 'peek' ? (
      <PeekTopic topic={topic!} viewer={viewer} app={app} onApp={switchTo} onSelect={setSelection} />
    ) : (
      <FilesOfTopic topic={topic!} app={app} viewer={viewer} onApp={switchTo} onSelect={setSelection} />
    )
  return (
    <div className="h-screen overflow-hidden">
      <AppShell
        logo={<AppSwitcher app={app} onApp={switchTo} />}
        onSearch={() => {}}
        searchPlaceholder="Search Peek, Ship and Leaf…"
        identity={<ViewAs viewer={viewer} onViewer={setViewer} />}
        nav={<Nav app={app} viewer={viewer} selection={selection} onSelect={setSelection} />}
      >
        {content}
      </AppShell>
    </div>
  )
}
