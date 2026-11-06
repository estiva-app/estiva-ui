import { useState, type MouseEvent, type ReactNode } from 'react'
import { IconCompass, IconDots } from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { Button } from '../../src/Button'
import { EmptyState } from '../../src/EmptyState'
import { KindIcon } from '../../src/KindIcon'
import { Menu, MenuItem } from '../../src/Menu'
import { NavItem } from '../../src/NavItem'
import { NavTree } from '../../src/NavTree'
import { PageHeader } from '../../src/PageHeader'
import { PersonTrigger } from '../../src/PersonTrigger'
import { SearchInput } from '../../src/SearchInput'
import { Sidebar } from '../../src/Sidebar'
import { SkeletonList } from '../../src/Skeleton'
import { Tabs } from '../../src/Tabs'
import { ToastProvider } from '../../src/Toast'
import { TooltipProvider } from '../../src/Tooltip'
import { PEOPLE, TOPICS, byTitle, fileOf, yourTopics, type Person, type Read, type Topic } from './fixtures'

export const icon16 = { size: 16, stroke: 1.5 } as const

/** A link that the prototype handles itself. */
export const go = (fn: () => void) => (event: MouseEvent) => {
  event.preventDefault()
  fn()
}

/** Where the story is: a topic, a file, Explore, or the app's home. */
export type Place = { type: 'home' } | { type: 'explore' } | { type: 'topic'; id: string } | { type: 'file'; id: string }
export const same = (a: Place, b: Place) => a.type === b.type && ('id' in a ? a.id : '') === ('id' in b ? b.id : '')

/** Tooltips and toasts, around a whole story. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>{children}</ToastProvider>
    </TooltipProvider>
  )
}

/** The app's frame: its name, View as, the sidebar and the page. Inside `Providers`. */
export function Frame({ app, viewer, onViewer, nav, children }: { app: string; viewer: Person; onViewer: (p: Person) => void; nav: ReactNode; children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden">
      <AppShell
        variant="inset"
        logo={<span className="px-2 text-body-1 font-semibold text-text-primary">{app}</span>}
        identity={
          <Menu align="right" trigger={<PersonTrigger name={PEOPLE[viewer]} />}>
            <MenuItem label="View as Miky" selected={viewer === 'miky'} onClick={() => onViewer('miky')} />
            <MenuItem label="View as Katerina" selected={viewer === 'katerina'} onClick={() => onViewer('katerina')} />
          </Menu>
        }
        nav={<Sidebar>{nav}</Sidebar>}
      >
        {children}
      </AppShell>
    </div>
  )
}

/** A page body under a PageHeader, as the apps draw a page. */
export function Page({ title, icon, actions, meta, children }: { title: string; icon?: ReactNode; actions?: ReactNode; meta?: string[]; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={title} leading={icon} actions={actions} meta={meta} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
    </div>
  )
}

/** The "Explore topics" row under a sidebar's topics: the same row in every app. */
export function ExploreRow({ place, onOpen }: { place: Place; onOpen: (p: Place) => void }) {
  return <NavItem href="#" label="Explore topics" icon={<IconCompass {...icon16} />} active={place.type === 'explore'} onClick={go(() => onOpen({ type: 'explore' }))} />
}

/**
 * Your topics in a sidebar, newest activity first. Peek: every one, flat, each
 * with its "…" (`menu`). Ship and Leaf: five, each folding to the files it lists,
 * in the topic's order. Then one Explore topics row.
 */
export function TopicsSection({
  viewer,
  topics = TOPICS,
  read,
  place,
  onOpen,
  limit,
  fold,
  menu,
  unread = [],
}: {
  viewer: Person
  topics?: Topic[]
  read: Read
  place: Place
  onOpen: (p: Place) => void
  limit?: number
  fold?: (t: Topic) => string[]
  menu?: (t: Topic) => ReactNode
  unread?: string[]
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(place.type === 'topic' ? [place.id] : []))
  if (read === 'loading')
    return (
      <NavTree title="Topics">
        <SkeletonList rows={5} />
      </NavTree>
    )
  if (read === 'failed')
    return (
      <NavTree title="Topics">
        <div className="px-2 py-1">
          <EmptyState scope="section" message="Your topics could not be read. Reload to try again." />
        </div>
        <ExploreRow place={place} onOpen={onOpen} />
      </NavTree>
    )
  const mine = yourTopics(viewer, topics).slice(0, limit)
  return (
    <NavTree title="Topics">
      {mine.length === 0 && (
        <div className="px-2 py-1">
          <EmptyState scope="section" message="You’re in no topics yet." />
        </div>
      )}
      {mine.map((t) => {
        const files = fold?.(t) ?? []
        return (
          <NavItem
            key={t.id}
            href="#"
            label={t.title}
            icon={<KindIcon kind="topic" />}
            unread={unread.includes(t.id)}
            active={same(place, { type: 'topic', id: t.id })}
            onClick={go(() => onOpen({ type: 'topic', id: t.id }))}
            menu={menu?.(t)}
            {...(fold && files.length > 0
              ? {
                  open: open.has(t.id),
                  onOpenChange: (o: boolean) =>
                    setOpen((s) => {
                      const next = new Set(s)
                      if (o) next.add(t.id)
                      else next.delete(t.id)
                      return next
                    }),
                }
              : {})}
          >
            {fold && files.length > 0
              ? files.map((id) => (
                  <NavItem key={id} href="#" label={fileOf(id).title} icon={<KindIcon kind={fileOf(id).kind} />} active={same(place, { type: 'file', id })} onClick={go(() => onOpen({ type: 'file', id }))} />
                ))
              : undefined}
          </NavItem>
        )
      })}
      <ExploreRow place={place} onOpen={onOpen} />
    </NavTree>
  )
}

type ExploreTab = 'all' | 'yours' | 'other' | 'archived'

/**
 * Explore topics: Ship's Topics page, the same in Peek and Leaf. All, Other and
 * Archived are A to Z, as Slack's channel browser; Your topics keeps the
 * sidebar's order, newest first. Join on a topic you're not in; an archived one
 * opens read-only.
 */
export function ExplorePage({ viewer, read, onRetry, onOpen, start = 'all', title = 'Explore topics' }: { viewer: Person; read: Read; onRetry: () => void; onOpen: (p: Place) => void; start?: ExploreTab; title?: string }) {
  const [tab, setTab] = useState<ExploreTab>(start)
  const [q, setQ] = useState('')
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const isMine = (t: Topic) => t.members.includes(viewer) || joined.has(t.id)
  const live = TOPICS.filter((t) => !t.archived)
  const lists: Record<ExploreTab, Topic[]> = {
    all: [...live].sort(byTitle),
    yours: yourTopics(viewer).concat(live.filter((t) => joined.has(t.id))),
    other: live.filter((t) => !isMine(t)).sort(byTitle),
    archived: TOPICS.filter((t) => t.archived).sort(byTitle),
  }
  const rows = lists[tab].filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Page title={title} icon={<IconCompass {...icon16} />}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { id: 'all', label: 'All', count: lists.all.length },
            { id: 'yours', label: 'Your topics', count: lists.yours.length },
            { id: 'other', label: 'Other topics', count: lists.other.length },
            { id: 'archived', label: 'Archived', count: lists.archived.length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="w-64">
          <SearchInput placeholder="Find a topic" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {read === 'loading' ? (
        <SkeletonList rows={8} />
      ) : read === 'failed' ? (
        <EmptyState scope="page" message="Topics didn’t load." action={{ label: 'Try again', onClick: onRetry }} />
      ) : rows.length === 0 ? (
        <EmptyState scope="page" message={q ? `No topic matches “${q}”.` : tab === 'archived' ? 'No topic is archived.' : tab === 'yours' ? 'You’re in no topics yet.' : 'Nothing here yet.'} />
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover">
              <KindIcon kind="topic" />
              <a href="#" className="flex min-w-0 flex-1 flex-col" onClick={go(() => onOpen({ type: 'topic', id: t.id }))}>
                <span className="truncate text-body-2 font-medium text-text-primary">{t.title}</span>
                <span className="truncate text-caption text-text-muted">
                  {[t.team, `${t.members.length} ${t.members.length === 1 ? 'member' : 'members'}`, t.archived ? `Archived ${t.atLabel}` : `Active ${t.atLabel}`, t.summary].filter(Boolean).join(' · ')}
                </span>
              </a>
              {!t.archived && !isMine(t) && (
                <Button size="small" variant="outlined" onClick={() => setJoined((s) => new Set(s).add(t.id))}>
                  Join
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}

/** A file page, drawn only as far as needed to show where a click went. */
export function FilePlaceholder({ id }: { id: string }) {
  const f = fileOf(id)
  return (
    <Page title={f.title} icon={<KindIcon kind={f.kind} />}>
      <p className="text-caption text-text-muted">The file’s page, as today.</p>
    </Page>
  )
}

export const MoreIcon = () => <IconDots {...icon16} />
