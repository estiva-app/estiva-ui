import { useEffect, useState, type DragEvent, type ReactNode } from 'react'
import { IconArchive, IconCheck, IconDotsVertical, IconEdit, IconLayoutDashboard, IconLayoutSidebarRight, IconNote, IconPlus, IconTarget, IconUser, IconUsers } from '@tabler/icons-react'
import { MembersPill } from '../../src/MembersPill'
import { ArchivedNotice } from '../../src/ArchivedNotice'
import { Button } from '../../src/Button'
import { cn } from '../../src/cn'
import { EmptyState } from '../../src/EmptyState'
import { IconButton } from '../../src/IconButton'
import { KindIcon } from '../../src/KindIcon'
import { LinkCard } from '../../src/LinkCard'
import { LinkRow } from '../../src/LinkRow'
import { Link } from '../../src/Link'
import { Menu, MenuItem, MenuSeparator } from '../../src/Menu'
import { ListColumn } from '../../src/ListColumn'
import { Panel } from '../../src/Panel'
import { Rail as RailNav } from '../../src/Rail'
import { RailItem } from '../../src/RailItem'
import { SectionHeader } from '../../src/SectionHeader'
import { SkeletonList } from '../../src/Skeleton'
import { isApplePlatform } from '../../src/shortcuts'
import { useToast } from '../../src/Toast'
import { Toolbar, ToolbarButton } from '../../src/Toolbar'
import { WithTooltip } from '../../src/Tooltip'
import { PEOPLE, TOPICS, fileOf, linkOf, type Look, type Person, type Read, type Topic } from './fixtures'
import { ExplorePage, FilePlaceholder, Frame, MoreIcon, Page, Providers,TopicsSection, go, icon16, type Place } from './parts'

/** Ctrl+O, Cmd+O on a Mac: Add to Open work, again to remove (Miky, 6 Nov). */
const OPEN_WORK_KEY = () => (isApplePlatform() ? 'Cmd+O' : 'Ctrl+O')

/**
 * A topic's files in its Overview, in the topic's order, each a row or a card.
 * NEW HERE: the whole file is dragged, with the document block's drop line
 * (BlockHandle); a click on the file still opens it. Peek's floating ✕ is now a
 * floating "…" with Remove, Show as row, Show as card (Miky, 6 Nov).
 */
function TopicFiles({ topic, read, readOnly, onRetry }: { topic: Topic; read: Read; readOnly: boolean; onRetry: () => void }) {
  const [files, setFiles] = useState(topic.files)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const { showToast } = useToast()
  const live = files.filter((f) => !fileOf(f.id).archived)
  const gone = files.filter((f) => fileOf(f.id).archived)

  const setLook = (id: string, look: Look) => setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, look } : f)))
  const remove = (id: string) => {
    setFiles((fs) => fs.filter((f) => f.id !== id))
    showToast({ label: `Removed ${fileOf(id).title} from ${topic.title}`, actionLabel: 'Undo', onAction: () => setFiles(files) })
  }
  const over = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    if (!dragging) return
    e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    setDropAt(e.clientY < box.top + box.height / 2 ? index : index + 1)
  }
  const drop = () => {
    if (dragging && dropAt !== null) {
      const from = live.findIndex((f) => f.id === dragging)
      const next = [...live]
      const [moved] = next.splice(from, 1)
      next.splice(dropAt > from ? dropAt - 1 : dropAt, 0, moved)
      setFiles([...next, ...gone])
    }
    setDragging(null)
    setDropAt(null)
  }

  const body =
    read === 'loading' ? (
      <SkeletonList rows={4} />
    ) : read === 'failed' ? (
      <EmptyState scope="section" message="Couldn’t load the files." action={{ label: 'Try again', onClick: onRetry }} />
    ) : files.length === 0 ? (
      <EmptyState scope="section" message="None yet. A topic can be only a conversation." />
    ) : (
      <>
        <ul className="flex flex-col" onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropAt(null)}>
          {live.map((f, index) => (
            <li key={f.id} data-topic-file={fileOf(f.id).title} className={cn('group/file relative py-1', dragging === f.id && 'opacity-40')} onDragOver={over(index)} onDrop={drop}>
              {dropAt === index && <DropLine at="top" />}
              <div
                className="relative"
                draggable={!readOnly}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  setDragging(f.id)
                }}
                onDragEnd={() => {
                  setDragging(null)
                  setDropAt(null)
                }}
              >
                {f.look === 'card' ? <LinkCard link={linkOf(fileOf(f.id), readOnly)} readOnly={readOnly} /> : <LinkRow link={linkOf(fileOf(f.id), readOnly)} />}
                {!readOnly && (
                  // Floats where Peek's ✕ floats today: over the file's top-right corner, on hover.
                  <div className={cn('absolute right-1 z-10 rounded-md bg-bg-elevated opacity-0 shadow-sm focus-within:opacity-100 group-hover/file:opacity-100 has-[[aria-expanded=true]]:opacity-100 [@media(hover:none)]:opacity-100', f.look === 'card' ? 'top-1' : 'top-1/2 -translate-y-1/2')}>
                    <Menu align="right" trigger={<IconButton aria-label={`More options for ${fileOf(f.id).title}`} tooltip="More options"><MoreIcon /></IconButton>}>
                      <MenuItem label="Show as row" selected={f.look === 'row'} onClick={() => setLook(f.id, 'row')} />
                      <MenuItem label="Show as card" selected={f.look === 'card'} onClick={() => setLook(f.id, 'card')} />
                      <MenuSeparator />
                      <MenuItem label="Remove" onClick={() => remove(f.id)} />
                    </Menu>
                  </div>
                )}
              </div>
              {dropAt === index + 1 && index === live.length - 1 && <DropLine at="bottom" />}
            </li>
          ))}
        </ul>
        {gone.length > 0 &&
          (showArchived ? (
            <div className="flex flex-col gap-1 pt-2">
              <Link href="#" variant="quiet" className="flex items-center gap-1 self-start text-body-2 text-text-secondary" onClick={go(() => setShowArchived(false))}>
                <IconArchive {...icon16} />
                Archived
              </Link>
              {gone.map((f) => (
                <div key={f.id} className="py-1">
                  <LinkRow link={linkOf(fileOf(f.id), true)} />
                </div>
              ))}
            </div>
          ) : (
            <Link href="#" variant="quiet" className="flex items-center gap-1 self-start pt-2 text-body-2 text-text-secondary" onClick={go(() => setShowArchived(true))}>
              <IconArchive {...icon16} />
              Archived · {gone.length}
            </Link>
          ))}
      </>
    )

  return (
    <section className="flex flex-col">
      {/* "Files", no count any more (Miky, 3 Nov: "Not sure if the number of files bring value"). */}
      <SectionHeader title="Files" actions={readOnly ? undefined : [{ icon: <IconPlus {...icon16} />, tooltip: 'Add file', onClick: () => {} }]} />
      <div className="flex flex-col px-2">{body}</div>
    </section>
  )
}

function DropLine({ at }: { at: 'top' | 'bottom' }) {
  return <span aria-hidden className={cn('pointer-events-none absolute -left-1 right-0 h-0.5 rounded-full bg-accent-primary', at === 'top' ? '-top-px' : '-bottom-px')} />
}

/** The topic's page in Peek: the conversation in the middle, the Overview with its files on the right. */
function TopicPage({ topic, viewer, read, onRetry, inOpenWork, onToggleOpenWork }: { topic: Topic; viewer: Person; read: Read; onRetry: () => void; inOpenWork: boolean; onToggleOpenWork: () => void }) {
  const readOnly = !!topic.archived || !topic.members.includes(viewer)
  const [overview, setOverview] = useState(true)
  return (
    // The header as Peek's file page draws it today (useFilePane): the title alone, the members pill, then one toolbar.
    <Page
      title={topic.title}
      members={<MembersPill members={topic.members.map((p) => ({ name: PEOPLE[p] }))} count={topic.members.length} />}
      actions={
        <div className="flex items-center gap-1">
          {!topic.archived && (
            // NEW HERE. Add to Open work: now a button on the topic's page, with its key (Miky, 3 Nov: "more prominent and have keyboard shortcut").
            <WithTooltip label={inOpenWork ? 'Remove from Open work' : 'Add to Open work'} shortcut={OPEN_WORK_KEY()}>
              <Button size="small" variant="outlined" leadingIcon={inOpenWork ? <IconCheck {...icon16} /> : <IconLayoutDashboard {...icon16} />} onClick={onToggleOpenWork}>
                {inOpenWork ? 'In Open work' : 'Add to Open work'}
              </Button>
            </WithTooltip>
          )}
          <Toolbar aria-label="File actions" surface={false}>
            {/* The Overview, shown and hidden, before the ⋮, as today (SidePanelButton). */}
            <ToolbarButton tooltip={overview ? 'Hide side panel' : 'Show side panel'} aria-label={overview ? 'Hide side panel' : 'Show side panel'} pressed={overview} onClick={() => setOverview(!overview)}>
              <IconLayoutSidebarRight {...icon16} />
            </ToolbarButton>
          {/* Rename, Move, Archive and Delete live here only (Miky, 3 Nov). New topic inside is gone everywhere. */}
          <Menu align="right" trigger={<ToolbarButton tooltip="More actions" aria-label="More actions"><IconDotsVertical {...icon16} /></ToolbarButton>}>
            {topic.archived ? (
              <MenuItem label="Unarchive" />
            ) : (
              <>
                <MenuItem label="Rename" />
                <MenuItem label="Move…" />
                <MenuItem label="Copy link" />
                <MenuItem label="Archive" />
                <MenuSeparator />
                <MenuItem label="Delete" destructive />
              </>
            )}
          </Menu>
          </Toolbar>
        </div>
      }
    >
      {topic.archived && <ArchivedNotice by="Miky" when={topic.atLabel} resolution="Shipped." onUnarchive={() => {}} />}
      <div className="-m-6 flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 items-center justify-center p-6">
          <p className="text-caption text-text-muted">The topic’s conversation, as today.</p>
        </div>
        {overview && <div className="w-[384px] shrink-0 border-l border-border-subtle">
          <Panel title="Overview" bodyClassName="flex flex-col pb-4 pt-2">
            <TopicFiles key={topic.id} topic={topic} read={read} readOnly={readOnly} onRetry={onRetry} />
            <section className="flex flex-col">
              <SectionHeader title="Activity" />
              <p className="px-4 text-caption text-text-muted">Activity, as today.</p>
            </section>
          </Panel>
        </div>}
      </div>
    </Page>
  )
}

export interface PeekTopicsProps {
  viewer?: Person
  start?: Place
  /** The sidebar's and Explore's read when the story opens. */
  read?: Read
  /** The topic's files' read when the story opens. */
  files?: Read
  /** Two seconds in, Katerina writes in Onboarding and it moves to the top. */
  live?: boolean
  openWork?: string[]
}

/**
 * Peek's Topics, levelled up (Miky, 3 and 6 Nov): one flat list of every topic
 * you're in, newest activity first, then Explore topics. Its "…" keeps only
 * what you do from a list.
 */
export function PeekTopics(props: PeekTopicsProps) {
  return (
    <Providers>
      <PeekApp {...props} />
    </Providers>
  )
}

function PeekApp({ viewer: firstViewer = 'miky', start = { type: 'topic', id: 'widgets' }, read: firstRead = 'ok', files: firstFiles = 'ok', live = false, openWork: firstOpenWork = [] }: PeekTopicsProps) {
  const [viewer, setViewer] = useState<Person>(firstViewer)
  const [place, setPlace] = useState<Place>(start)
  const [read, setRead] = useState<Read>(firstRead)
  const [filesRead, setFilesRead] = useState<Read>(firstFiles)
  const [topics, setTopics] = useState<Topic[]>(TOPICS)
  const [unread, setUnread] = useState<string[]>(['fast'])
  const [openWork, setOpenWork] = useState<Set<string>>(() => new Set(firstOpenWork))
  // The rail's choice when it isn't Topics; null follows the place.
  const [rail, setRail] = useState<Exclude<Rail, 'topics'> | null>(null)
  const { showToast } = useToast()
  const toggle = (t: Topic) => {
    const had = openWork.has(t.id)
    setOpenWork((s) => {
      const next = new Set(s)
      if (had) next.delete(t.id)
      else next.add(t.id)
      return next
    })
    showToast({ label: had ? `Removed ${t.title} from Open work` : `Added ${t.title} to Open work` })
  }
  const current = place.type === 'topic' ? topics.find((t) => t.id === place.id) : undefined

  // Ctrl/Cmd+O on a topic's page: taken from the browser's "Open file" (Miky, 6 Nov).
  useEffect(() => {
    if (!current || current.archived) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        toggle(current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Live where the app is live: a new message moves its topic to the top as it happens (Miky, 6 Nov).
  useEffect(() => {
    if (!live) return
    const timer = setTimeout(() => {
      setTopics((ts) => ts.map((t) => (t.id === 'onb' ? { ...t, at: 0, atLabel: 'Just now' } : t)))
      setUnread((u) => [...u, 'onb'])
    }, 2000)
    return () => clearTimeout(timer)
  }, [live, setTopics, setUnread])

  const open = (next: Place) => {
    setPlace(next)
    if (next.type === 'topic') setUnread((u) => u.filter((id) => id !== next.id))
  }

  // The sidebar "…": only what you do from a list (Miky, 3 Nov).
  const menu = (t: Topic) => (
    <>
      <MenuItem label={openWork.has(t.id) ? 'Remove from Open work' : 'Add to Open work'} shortcut={OPEN_WORK_KEY()} onClick={() => toggle(t)} />
      <MenuItem label="Copy link" />
      {t.team !== 'Company' && <MenuItem label="Make it a space" />}
      <MenuSeparator />
      <MenuItem label="Leave" />
    </>
  )

  const page =
    place.type === 'explore' ? (
      <ExplorePage viewer={viewer} read={read} onRetry={() => setRead('ok')} onOpen={open} />
    ) : place.type === 'topic' && current ? (
      <TopicPage topic={current} viewer={viewer} read={filesRead} onRetry={() => setFilesRead('ok')} inOpenWork={openWork.has(current.id)} onToggleOpenWork={() => toggle(current)} />
    ) : place.type === 'file' ? (
      <FilePlaceholder id={place.id} />
    ) : (
      <Untouched what="Pick a topic, or Explore topics." />
    )

  // What the rail has lit: Desk is the story's home; Teams and People are drawn only as far as their own page.
  const at: Rail = rail ?? (place.type === 'home' ? 'desk' : 'topics')
  const content =
    at === 'topics' ? (
      <div className="flex min-h-0 min-w-0 flex-1">
        {/* Peek's Topics column, as TopicsColumn draws it: its header with New topic, then the list. Flat now, with Explore topics last. */}
        <ListColumn
          title="Topics"
          actions={
            <Toolbar aria-label="Topic list actions" surface={false}>
              <ToolbarButton tooltip="New topic" aria-label="New topic">
                <IconEdit {...icon16} />
              </ToolbarButton>
            </Toolbar>
          }
        >
          <TopicsSection inColumn viewer={viewer} topics={topics} read={read} place={place} onOpen={open} menu={menu} unread={unread} />
        </ListColumn>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{page}</div>
      </div>
    ) : (
      <Untouched what={at === 'desk' ? 'Desk, as today.' : at === 'teams' ? 'Teams, as today.' : 'People, as today.'} />
    )

  const item = (key: Rail, label: string, icon: ReactNode) => (
    <RailItem
      href="#"
      icon={icon}
      label={label}
      active={at === key}
      onClick={go(() => {
        setRail(key === 'topics' ? null : key)
        if (key === 'desk') setPlace({ type: 'home' })
        if (key === 'topics' && place.type === 'home') setPlace({ type: 'topic', id: topics[0].id })
      })}
    />
  )

  return (
    <Frame
      app="Peek"
      viewer={viewer}
      onViewer={setViewer}
      nav={
        // Peek's NavRail on origin/main: Desk, Topics, Teams, People.
        <RailNav>
          {item('desk', 'Desk', <IconNote {...icon16} />)}
          {item('topics', 'Topics', <IconTarget {...icon16} />)}
          {item('teams', 'Teams', <IconUsers {...icon16} />)}
          {item('people', 'People', <IconUser {...icon16} />)}
        </RailNav>
      }
    >
      {content}
    </Frame>
  )
}

type Rail = 'desk' | 'topics' | 'teams' | 'people'

/** A screen this project doesn't change. */
function Untouched({ what }: { what: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <p className="text-caption text-text-muted">{what}</p>
    </div>
  )
}
