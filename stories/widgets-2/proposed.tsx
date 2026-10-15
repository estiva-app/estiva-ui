/**
 * Widgets 2 prototype: the proposed shared kit, one drawing of each widget for
 * Peek, Ship and Leaf alike. Written as the package would export it, so the
 * build project can move it into `src/` once Miky and Katerina approve it: no
 * app name and no product noun in a name or a prop. The kind's noun, the app's
 * name and every field arrive as data from the app's manifest.
 *
 * What it settles, against today's three copies (today.tsx):
 * - compact is one line, always: icon, title, status, a face, the noun. No
 *   actions, so it can never grow into the detailed card (Katerina's Later
 *   line: an issue's compact and detailed look alike);
 * - detailed adds what compact cannot hold: the line under the title, the
 *   opening of the body, the meta line, and the actions;
 * - loading is the card it becomes, at its height, so nothing jumps;
 * - "not available." is one line in one place, in every app.
 */
import { IconCircle, IconCircleCheck, IconCircleDashed, IconCircleHalf2, IconCircleX, IconExternalLink, IconFileText, IconMessage2, IconPaperclip } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Avatar } from '../../src/Avatar'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { cn } from '../../src/cn'
import { InlineChip } from '../../src/InlineChip'
import { KindIcon } from '../../src/KindIcon'
import { Link } from '../../src/Link'
import { Person } from '../../src/Person'
import { Select } from '../../src/Select'
import { SkeletonBar } from '../../src/Skeleton'
import type { Status, StatusColour, Thing } from './fixtures'

const HREF = '#'
const noop = () => {}

/* ------------------------------------------------------------ the parts */

const STATUS_ICON: Record<StatusColour, { Icon: typeof IconCircle; tone: string }> = {
  neutral: { Icon: IconCircleDashed, tone: 'text-text-secondary' },
  blue: { Icon: IconCircleHalf2, tone: 'text-info-default' },
  green: { Icon: IconCircleCheck, tone: 'text-success-default' },
  muted: { Icon: IconCircleX, tone: 'text-text-muted' },
}

/** A status as its shape: Ship's icons, which read without colour. Words only where there is room. */
export function StatusMark({ status, words = false }: { status: Status; words?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-caption text-text-secondary" title={words ? undefined : status.label}>
      <StatusIcon status={status} />
      {words ? status.label : <span className="sr-only">{status.label}</span>}
    </span>
  )
}

/** The status's shape alone, beside words that already name it. */
function StatusIcon({ status }: { status: Status }) {
  const { Icon, tone } = STATUS_ICON[status.colour]
  return <Icon size={14} stroke={1.5} className={cn('shrink-0', tone)} aria-hidden />
}

/** The icon for a kind. A page gets its own (proposed): today every app draws it as "another app's file". */
export function ThingIcon({ kind, size = 16, tone = 'secondary' }: { kind: Thing['kind']; size?: 14 | 16; tone?: 'secondary' | 'inherit' }) {
  if (kind === 'page') return <IconFileText size={size} stroke={1.5} className={cn('shrink-0', tone === 'secondary' && 'text-text-secondary')} aria-hidden />
  return <KindIcon kind={kind} size={size} tone={tone} />
}

/** The noun in a card's corner: the quietest words on it. */
function Noun({ children }: { children: ReactNode }) {
  return <span className="shrink-0 text-caption text-text-muted">{children}</span>
}

/* ----------------------------------------------------------------- chip */

export interface ReferenceChipProps {
  kind: Thing['kind']
  title: string
  status?: Status
  state?: 'ready' | 'loading' | 'unavailable'
  /** The noun, for the unavailable chip: "Issue, not available". */
  noun?: string
}

/**
 * A link in running text. One chip for every app: the kind's icon, the title
 * cut at 24ch, the status as its shape only, so a chip stays a word long.
 * Loading keeps the icon (the kind is known from the address) and pulses
 * where the title will be; not available says so in the chip itself.
 */
export function ReferenceChip({ kind, title, status, state = 'ready', noun }: ReferenceChipProps) {
  if (state === 'loading') {
    return (
      <InlineChip icon={<ThingIcon kind={kind} size={14} tone="inherit" />}>
        <SkeletonBar className="h-2.5 w-16" />
      </InlineChip>
    )
  }
  if (state === 'unavailable') {
    return (
      <InlineChip icon={<ThingIcon kind={kind} size={14} tone="inherit" />} className="text-text-muted">
        {noun}, not available
      </InlineChip>
    )
  }
  return (
    <InlineChip icon={<ThingIcon kind={kind} size={14} tone="inherit" />} href={HREF} className="max-w-[24ch]">
      <span className="truncate">{title}</span>
      {status && <StatusMark status={status} />}
    </InlineChip>
  )
}

/* ---------------------------------------------------------------- cards */

export type CardLayout = 'compact' | 'detailed'

/** Compact: one 36px line. Every kind, every app. */
export function CompactCard({ thing }: { thing: Thing }) {
  return (
    <Card fill="inset" hover="hairline" className="relative flex h-9 items-center gap-2 px-3">
      <ThingIcon kind={thing.kind} />
      {thing.kind === 'message' ? (
        <span className="flex min-w-0 flex-1 items-baseline gap-2 text-body-2">
          <span className="shrink-0 text-body-2-strong text-text-primary">{thing.author}</span>
          <Link href={HREF} variant="quiet" cover truncate className="text-text-secondary">
            {thing.body}
          </Link>
        </span>
      ) : (
        <span className="contents text-body-2-strong text-text-primary">
          <Link href={HREF} variant="quiet" cover truncate className="min-w-0 flex-1">
            {thing.title}
          </Link>
        </span>
      )}
      {thing.status && <StatusMark status={thing.status} />}
      {thing.progress && <span className="shrink-0 text-caption tabular-nums text-text-secondary">{thing.progress}</span>}
      {thing.assignee && <Avatar name={thing.assignee} size={16} />}
      <Noun>{thing.noun}</Noun>
    </Card>
  )
}

/**
 * Detailed: what compact cannot hold. A header that matches compact's line,
 * the line under the title, the opening of the body (three lines), a meta
 * line, then the kind's own extras (a project's issues, an issue's actions)
 * and the way out to the app it lives in.
 */
export function DetailedCard({ thing, actions = false }: { thing: Thing; actions?: boolean }) {
  return (
    <Card fill="inset" data-card="detailed" className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <ThingIcon kind={thing.kind} />
        <span className="contents text-body-2-strong text-text-primary">
          <Link href={HREF} variant="quiet" truncate className="min-w-0 flex-1">
            {thing.title}
          </Link>
        </span>
        <Noun>{thing.noun}</Noun>
      </div>
      {thing.subtitle && <p className="-mt-1 pl-6 text-caption text-text-secondary">{thing.subtitle}</p>}
      {thing.body && <p className="line-clamp-3 text-body-2 text-text-secondary">{thing.body}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
        {thing.status && <StatusMark status={thing.status} words />}
        {thing.assignee && <Person name={thing.assignee} size={16} />}
        {thing.author && thing.kind !== 'message' && <Person name={thing.author} size={16} />}
        {thing.progress && <span className="tabular-nums">{thing.progress}</span>}
        {thing.comments !== undefined && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <IconMessage2 size={14} stroke={1.5} aria-hidden />
            {thing.comments}
          </span>
        )}
        {thing.updated && <span>{thing.updated}</span>}
      </div>
      {thing.children && (
        <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">
          {thing.children.map((child) => (
            <div key={child.title} className="flex h-8 items-center gap-2 px-2">
              <ThingIcon kind="issue" />
              <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{child.title}</span>
              <StatusMark status={child.status} />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-border-subtle pt-2">
        {actions && thing.status && (
          <>
            <Select size="small" className="w-auto" value="s" onChange={noop} ariaLabel="Status" options={[{ value: 's', label: thing.status.label, leading: <StatusIcon status={thing.status} /> }]} />
            <Select
              size="small"
              className="w-auto"
              value="a"
              onChange={noop}
              ariaLabel="Assignee"
              options={[{ value: 'a', label: thing.assignee ?? 'Unassigned', leading: <Avatar name={thing.assignee} size={16} /> }]}
            />
          </>
        )}
        <span className="ml-auto shrink-0 text-caption">
          <Link href={HREF} variant="quiet" external className="text-text-secondary">
            Open in {thing.app} ↗
          </Link>
        </span>
      </div>
    </Card>
  )
}

/**
 * A linked message, detailed, option A: a quote. No frame; a rule on the
 * left, the face, the author and when, then the words.
 */
export function MessageQuote({ thing }: { thing: Thing }) {
  return (
    <div className="flex gap-2 border-l-2 border-border-strong py-1 pl-3">
      <Avatar name={thing.author} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-caption">
          <span className="text-body-2-strong text-text-primary">{thing.author}</span>
          <span className="text-text-muted">{thing.updated}</span>
          <span className="ml-auto">
            <Link href={HREF} variant="quiet" className="text-text-muted">
              Go to message
            </Link>
          </span>
        </div>
        <p className="line-clamp-4 text-body-2 text-text-primary">{thing.body}</p>
      </div>
    </div>
  )
}

/** A linked message, detailed, option B: a card, the same frame as every other detailed card. */
export function MessageCard({ thing }: { thing: Thing }) {
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Avatar name={thing.author} size={24} />
        <span className="text-body-2-strong text-text-primary">{thing.author}</span>
        <span className="text-caption text-text-muted">{thing.updated}</span>
        <span className="ml-auto">
          <Noun>{thing.noun}</Noun>
        </span>
      </div>
      <p className="line-clamp-4 text-body-2 text-text-primary">{thing.body}</p>
      <div className="flex border-t border-border-subtle pt-2">
        <span className="ml-auto text-caption">
          <Link href={HREF} variant="quiet" className="text-text-secondary">
            Go to message
          </Link>
        </span>
      </div>
    </Card>
  )
}

/* ------------------------------------------------- loading, not available */

/**
 * Loading: the card it will become, drawn in bars, at the card's own height,
 * so the conversation does not jump when it arrives. The icon is real: the
 * kind is known from the address before anything loads.
 */
export function CardLoading({ kind, layout, shape = {} }: { kind: Thing['kind']; layout: CardLayout; shape?: LoadingShape }) {
  if (layout === 'compact') {
    return (
      <Card fill="inset" aria-hidden data-card="loading" className="flex h-9 items-center gap-2 px-3 animate-skeleton-in">
        <ThingIcon kind={kind} />
        <Bar className="h-3 w-2/5" />
        <Bar className="ml-auto h-3 w-10" />
      </Card>
    )
  }
  const { subtitle = false, lines = 3, rows = 0, actions = false } = shape
  return (
    <Card fill="inset" aria-hidden data-card="loading" className="flex flex-col gap-2 p-3 animate-skeleton-in">
      <div className="flex h-[19.6px] items-center gap-2">
        <ThingIcon kind={kind} />
        <Bar className="h-3.5 w-1/2" />
        <Bar className="ml-auto h-3 w-10" />
      </div>
      {subtitle && (
        <div className="-mt-1 flex h-[14.4px] items-center pl-6">
          <Bar className="h-2.5 w-20" />
        </div>
      )}
      {lines > 0 && (
        <div className="flex flex-col">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="flex h-[19.6px] items-center">
              <Bar className={cn('h-3', i === lines - 1 ? 'w-3/5' : 'w-full')} />
            </div>
          ))}
        </div>
      )}
      <div className="flex h-4 items-center gap-3">
        <Bar className="h-3 w-16" />
        <Bar className="h-3 w-24" />
      </div>
      {rows > 0 && (
        <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-8 items-center px-2">
              <Bar className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}
      <div className="flex min-h-[calc(14.4px+0.5rem+1px)] items-center gap-2 border-t border-border-subtle pt-2">
        {actions && (
          <>
            <Bar className="h-6 w-24 rounded-md" />
            <Bar className="h-6 w-28 rounded-md" />
          </>
        )}
        <Bar className="ml-auto h-3 w-20" />
      </div>
    </Card>
  )
}

/** What a kind's detailed card will hold, known before it loads (the kind is in the address). */
export interface LoadingShape {
  subtitle?: boolean
  lines?: number
  rows?: number
  actions?: boolean
}

/** The shape a thing's detailed card takes, for its placeholder. */
export function loadingShapeOf(thing: Thing, actions = false): LoadingShape {
  return { subtitle: !!thing.subtitle, lines: thing.body ? 3 : 0, rows: thing.children?.length ?? 0, actions: actions && !!thing.status }
}

/** A bar that shows on an inset card: the package's bar is the inset colour, and vanishes on one. */
function Bar({ className }: { className?: string }) {
  return <SkeletonBar className={cn('bg-bg-active', className)} />
}

/**
 * Not available: one line, at compact's height, whichever layout was chosen.
 * Deleted and unreadable read the same (Widgets 2, Not in scope). The way out
 * stays, because the app it lives in may still open it for you.
 */
export function CardUnavailable({ kind, noun, app }: { kind: Thing['kind']; noun: string; app: string }) {
  return (
    <Card fill="none" unreadable className="flex h-9 items-center gap-2 px-3">
      <ThingIcon kind={kind} />
      <span className="min-w-0 flex-1 truncate text-body-2 text-text-muted">{noun} — not available.</span>
      <span className="shrink-0 text-caption">
        <Link href={HREF} variant="quiet" external className="text-text-secondary">
          Open in {app} ↗
        </Link>
      </span>
    </Card>
  )
}

/* ------------------------------------------------------------ the part */

/**
 * A block of a description, shared live (a part). No compact or detailed:
 * a pasted block link inserts the part itself (the-author-chooses-a-links-card,
 * Accepted). Proposed: the same header line as a detailed card, so a part and
 * a card read as one family, and the way out in the same corner.
 */
export function PartCard({ kind, heading, noun, app, children, state = 'ready' }: { kind: Thing['kind']; heading: string; noun: string; app: string; children?: ReactNode; state?: 'ready' | 'loading' | 'unavailable' }) {
  if (state === 'loading') return <CardLoading kind={kind} layout="detailed" shape={{ lines: 4 }} />
  if (state === 'unavailable') return <CardUnavailable kind={kind} noun={`A part of this ${noun.toLowerCase()}`} app={app} />
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <ThingIcon kind={kind} />
        <span className="contents text-body-2-strong text-text-primary">
          <Link href={HREF} variant="quiet" truncate className="min-w-0 flex-1">
            {heading}
          </Link>
        </span>
        <Noun>Part of the {noun.toLowerCase()}</Noun>
      </div>
      <div className="border-l-2 border-border-default pl-3">{children}</div>
      <div className="flex border-t border-border-subtle pt-2">
        <Button size="small" className="ml-auto" leadingIcon={<IconExternalLink stroke={1.5} className="size-3.5" />}>
          Open in {app}
        </Button>
      </div>
    </Card>
  )
}

/**
 * A comment's anchor: the part it is about, quoted above the comment.
 * Proposed: unchanged from today (the two apps already agree), with the
 * deleted line in the same muted voice as "not available.".
 */
export function CommentAnchor({ text }: { text?: string }) {
  if (text === undefined) return <div className="border-l-2 border-border-default pl-2 text-caption text-text-muted">The part this is about was deleted.</div>
  return (
    <div className="border-l-2 border-border-strong pl-2 text-caption text-text-muted">
      <span className="line-clamp-2 italic">{text}</span>
    </div>
  )
}

/* ----------------------------------------------------------- attachment */

/** An attachment's chip: a paperclip and the file's name. */
export function AttachmentChip({ name, state = 'ready' }: { name: string; state?: 'ready' | 'loading' | 'unavailable' }) {
  if (state === 'loading') {
    return (
      <InlineChip icon={<IconPaperclip size={14} stroke={1.5} aria-hidden />}>
        <SkeletonBar className="h-2.5 w-16" />
      </InlineChip>
    )
  }
  if (state === 'unavailable') {
    return (
      <InlineChip icon={<IconPaperclip size={14} stroke={1.5} aria-hidden />} className="text-text-muted">
        File, not available
      </InlineChip>
    )
  }
  return (
    <InlineChip icon={<IconPaperclip size={14} stroke={1.5} aria-hidden />} href={HREF} className="max-w-[24ch]">
      <span className="truncate">{name}</span>
    </InlineChip>
  )
}
