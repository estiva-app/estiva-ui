/**
 * Project changes prototype: what you see when someone changed a project's
 * text before you, and where a deleted project is, in each place it draws.
 * Nothing here is wired; the build issues in milestone 3 match these.
 *
 * The rules every drawing follows (Miky, 2 Nov, on ALO-1; records
 * every-file-is-an-artifact-the-relay-keeps-in-order D3 and D4, and
 * a-file-is-its-fields-each-kept-in-order-by-the-relay):
 * - a change to different blocks shows nothing: their words just appear;
 * - a block you both changed keeps their words in the text, and yours sit
 *   beside that block with Use mine, Copy and Dismiss until you choose; nobody
 *   else sees a half-state;
 * - a tab opened before the switch is refused, in the same shape, under
 *   "This page changed since you opened it";
 * - a deleted project is gone from lists and search; a link, a card or an
 *   Activity entry says who deleted it and when, with Restore for anyone who
 *   may edit it; the Archived view has a Deleted filter;
 * - no access: "You can't open this project", with no title.
 */
import { IconArchive, IconCheck, IconCopy, IconLock, IconTrash } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { cn } from '../../src/cn'
import { EmptyState } from '../../src/EmptyState'
import { Person } from '../../src/Person'
import { SectionLabel } from '../../src/SectionLabel'
import { Tabs } from '../../src/Tabs'

/* ------------------------------------------------------------ the words */

export const YOU = 'Person One'
export const THEM = 'Person Two'
export const TITLE = 'Item one'
export const WHEN = 'Mon, Nov 2'

/** A project's text as blocks: the one at `clash` is the block both people changed. */
export const BLOCKS = [
  'The first block. Nobody changed it, so it reads as it did.',
  'The second block, as the other person saved it a moment before you: their words stand in the text.',
  'The third block. They changed it too, but you did not, so their words simply appear.',
]
/** What you had typed into the second block when the save came back. */
export const YOURS = 'The second block, as you had it: your words, kept beside theirs until you choose.'

/** Who is looking: someone who may edit the project, or someone who may only read it. */
export type Viewer = 'editor' | 'reader'

/* ------------------------------------------------------------ the block both changed */

/**
 * Your version, beside the block you both changed. Use mine saves yours over
 * theirs; Copy puts yours on the clipboard and keeps it here; Dismiss drops it.
 * At phone width it sits under the block instead of beside it.
 */
function YourVersion({ text, onUseMine, onDismiss }: { text: string; onUseMine: () => void; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      <SectionLabel>Your version</SectionLabel>
      <p className="text-body-2 text-text-primary">{text}</p>
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="outlined" size="small" onClick={onUseMine}>
          Use mine
        </Button>
        <Button
          variant="muted"
          size="small"
          leadingIcon={copied ? <IconCheck size={14} stroke={1.5} /> : <IconCopy size={14} stroke={1.5} />}
          onClick={() => {
            void navigator.clipboard?.writeText(text).catch(() => undefined)
            setCopied(true)
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="muted" size="small" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  )
}

/**
 * The text with one block both people changed. Their words are in the text,
 * marked by a bar at its edge; yours sit beside it until you choose. Choosing
 * is yours alone: nobody else sees a half-state.
 */
export function ProjectText({ narrow = false, refused = false, className }: { narrow?: boolean; refused?: boolean; className?: string }) {
  const [choice, setChoice] = useState<'open' | 'mine' | 'theirs'>('open')
  const clash = 1
  return (
    <div className={cn('flex flex-col gap-3 text-body-2 text-text-primary', className)}>
      {refused && choice === 'open' && <p className="text-caption text-text-secondary">This page changed since you opened it.</p>}
      {BLOCKS.map((block, i) => {
        const text = i === clash && choice === 'mine' ? YOURS : block
        if (i !== clash || choice !== 'open') return <p key={i}>{text}</p>
        return (
          <div key={i} className={cn('grid gap-3', narrow ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_16rem] items-start')}>
            <p className="-ml-3 border-l-2 border-accent-primary pl-2.5">{text}</p>
            <YourVersion text={YOURS} onUseMine={() => setChoice('mine')} onDismiss={() => setChoice('theirs')} />
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------ the pages */

/** Ship's project page: LiveHeader's column, the text under the title. */
export function ShipProjectPage({ children, title = TITLE }: { children: ReactNode; title?: string | null }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <p className="text-caption text-text-muted">Projects</p>
      {title && <h1 className="-mx-2 px-2 py-1 text-h2 text-text-primary">{title}</h1>}
      {children}
    </div>
  )
}

/** Leaf's page: DocumentView's column, the document under the h1. */
export function LeafPage({ children, title = TITLE }: { children: ReactNode; title?: string | null }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-12 pt-10 pb-10">
      {title && <h1 className="text-h1 text-text-primary">{title}</h1>}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ deleted */

/** Restore, for anyone who may edit the project; it shows as done once pressed. */
function Restore({ viewer, restored, onRestore }: { viewer: Viewer; restored: boolean; onRestore: () => void }) {
  if (viewer === 'reader') return null
  return (
    <Button variant="outlined" size="small" className="shrink-0" disabled={restored} onClick={onRestore}>
      {restored ? 'Restored' : 'Restore'}
    </Button>
  )
}

/**
 * The deleted project's line, in ArchivedNotice's shape: who deleted it and
 * when, and Restore. Where a link to it opens: Ship's page and Leaf's page.
 */
export function DeletedNotice({ viewer }: { viewer: Viewer }) {
  const [restored, setRestored] = useState(false)
  return (
    <Card fill="inset" className="flex items-start gap-3 px-4 py-3">
      <IconTrash size={16} stroke={1.5} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="min-w-0 flex-1 text-body-2-strong text-text-primary">{`Deleted by ${THEM} · ${WHEN}`}</span>
      <Restore viewer={viewer} restored={restored} onRestore={() => setRestored(true)} />
    </Card>
  )
}

/** Peek's file card for a deleted project: the title, then who deleted it, with Restore. */
export function PeekDeletedCard({ viewer }: { viewer: Viewer }) {
  const [restored, setRestored] = useState(false)
  return (
    <Card fill="inset" className="mt-1 p-3">
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate text-body-2 font-semibold text-text-secondary">{TITLE}</span>
        <SectionLabel className="shrink-0">Project</SectionLabel>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="min-w-0 flex-1 text-caption text-text-secondary">{`Deleted by ${THEM} · ${WHEN}`}</span>
        <Restore viewer={viewer} restored={restored} onRestore={() => setRestored(true)} />
      </div>
    </Card>
  )
}

/** An Activity entry naming the deleted project. */
export function ActivityDeleted({ viewer }: { viewer: Viewer }) {
  const [restored, setRestored] = useState(false)
  return (
    <div className="flex items-center gap-2 py-1.5 text-body-2">
      <Person name={THEM} size={20} />
      <span className="min-w-0 flex-1 text-text-secondary">
        deleted <span className="text-text-primary">{TITLE}</span> · {WHEN}
      </span>
      <Restore viewer={viewer} restored={restored} onRestore={() => setRestored(true)} />
    </div>
  )
}

/* ------------------------------------------------------------ the Archived view's Deleted filter */

type ArchiveFilter = 'archived' | 'deleted'

function ArchivedRow({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <IconArchive size={16} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{title}</span>
      <span className="shrink-0 text-caption text-text-muted">{`Archived by ${YOU} · Fri, Oct 30`}</span>
    </div>
  )
}

function DeletedRow({ title, viewer }: { title: string; viewer: Viewer }) {
  const [restored, setRestored] = useState(false)
  return (
    <div className="flex items-center gap-2 py-2">
      <IconTrash size={16} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{title}</span>
      <span className="shrink-0 text-caption text-text-muted">{`Deleted by ${THEM} · ${WHEN}`}</span>
      <Restore viewer={viewer} restored={restored} onRestore={() => setRestored(true)} />
    </div>
  )
}

/**
 * The Archived view with its filter: Archived as today, and Deleted listing
 * every deleted project with who deleted it. Ship's Archived tab and Peek's
 * Archive draw the same list; Leaf has no Archived view of its own.
 */
export function ArchivedView({ app, viewer, start = 'deleted' }: { app: 'ship' | 'peek'; viewer: Viewer; start?: ArchiveFilter }) {
  const [filter, setFilter] = useState<ArchiveFilter>(start)
  return (
    <div className="flex flex-col gap-3 px-6 py-5">
      <p className="text-caption text-text-muted">{app === 'ship' ? 'Projects / Archived' : 'Archive'}</p>
      <Tabs
        size="small"
        aria-label="Show"
        tabs={[
          { id: 'archived', label: 'Archived', count: 2 },
          { id: 'deleted', label: 'Deleted', count: 2 },
        ]}
        active={filter}
        onChange={setFilter}
      />
      <div className="flex flex-col divide-y divide-border-subtle">
        {filter === 'archived' ? (
          <>
            <ArchivedRow title="Item three" />
            <ArchivedRow title="Item four" />
          </>
        ) : (
          <>
            <DeletedRow title={TITLE} viewer={viewer} />
            <DeletedRow title="Item two" viewer={viewer} />
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ no access */

/** Where a link to a project you can't read opens: the line, and no title. */
export function NoAccessPage() {
  return <EmptyState scope="page" icon={<IconLock size={16} stroke={1.5} />} message="You can't open this project" />
}

/** Peek's card for a project you can't read: the line, and no title. */
export function PeekNoAccessCard() {
  return (
    <Card fill="inset" className="mt-1 flex items-center gap-2 p-3">
      <IconLock size={16} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
      <span className="text-body-2 text-text-secondary">You can't open this project</span>
    </Card>
  )
}
