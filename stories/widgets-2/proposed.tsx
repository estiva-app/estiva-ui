/**
 * Widgets 2 prototype: the proposed shared kit, one drawing of each widget for
 * Peek, Ship and Leaf alike. Written as the package would export it, so the
 * build project can move it into `src/` once Miky and Katerina approve it: no
 * app name and no product noun in a name or a prop. The kind's icon, the key
 * and every field arrive as data from the app's manifest.
 *
 * Second iteration, from Miky's notes on WID-2 (15 Oct):
 * - no noun in a card's corner and no "Open in …": the icon says what it is,
 *   and the title is the link;
 * - an issue shows its key; the only status and assignee are the actionable ones;
 * - detailed shows the file's short summary, not the opening of its description;
 * - hovering a chip or a compact card shows the detailed card;
 * - a project shows its progress as a ring, its status and lead as actions,
 *   its comments, and each issue's assignee;
 * - a topic shows its conversations, its last update and its members, and
 *   detailed adds the latest conversation;
 * - a message is drawn with its author's face; a page with its authors and
 *   its last edit.
 */
import { IconCircle, IconCircleCheck, IconCircleDashed, IconCircleHalf2, IconCircleX, IconFileText, IconMessage2, IconPaperclip } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Avatar } from '../../src/Avatar'
import { AvatarGroup } from '../../src/AvatarGroup'
import { Card } from '../../src/Card'
import { cn } from '../../src/cn'
import { InlineChip } from '../../src/InlineChip'
import { KindIcon } from '../../src/KindIcon'
import { Link } from '../../src/Link'
import { MenuPanel } from '../../src/Menu'
import { PreviewCard } from '../../src/PreviewCard'
import { Select } from '../../src/Select'
import { SkeletonBar } from '../../src/Skeleton'
import { UnreadDot } from '../../src/UnreadDot'
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

/** A status as its shape: Ship's icons, which read without colour. */
export function StatusMark({ status }: { status: Status }) {
  return (
    <span className="inline-flex shrink-0 items-center" title={status.label}>
      <StatusIcon status={status} />
      <span className="sr-only">{status.label}</span>
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

/** A key, the way people say it ("ABC-2"): before the title, quieter than it. */
function Key({ children }: { children: ReactNode }) {
  return <span className="shrink-0 text-caption tabular-nums text-text-muted">{children}</span>
}

/**
 * Progress as a small ring with the count beside it as a label (Miky, 15 Oct,
 * second round: the ring with the count inside was too big).
 */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const size = 16
  const stroke = 2
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-caption tabular-nums text-text-secondary" title={`${done} of ${total} done`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border-default" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * done) / total} ${c}`} className="stroke-success-default" />
      </svg>
      {done}/{total}
    </span>
  )
}

/**
 * The package's unread dot, after a count: the reader has something unread in
 * this conversation. Only a member has unread (SPEC §11.8), so a reader who
 * is not one sees the count alone.
 */
function Unread() {
  return (
    <span className="inline-flex" title="Unread">
      <UnreadDot className="h-auto w-auto" />
      <span className="sr-only">unread</span>
    </span>
  )
}

/** The comment count, the words brighter and a dot after it when the reader has unread there. */
function Comments({ count, unread = false }: { count: number; unread?: boolean }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 text-caption tabular-nums', unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>
      <IconMessage2 size={14} stroke={1.5} aria-hidden />
      {count}
      <span className="sr-only">comments</span>
      {unread && <Unread />}
    </span>
  )
}

/** A topic's count of conversations, with the same dot. */
function Conversations({ thing, last = false }: { thing: Thing; last?: boolean }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 text-caption tabular-nums', thing.unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>
      {thing.conversations} conversations
      {thing.unread && <Unread />}
      <span className="font-normal text-text-secondary">
        · {last && 'last '}
        {thing.updated}
      </span>
    </span>
  )
}

const people = (names: string[] = []) => names.map((name) => ({ name }))

/** The kind's own pickers, the only place its status and owner show in detailed. */
function Pickers({ thing }: { thing: Thing }) {
  if (!thing.status) return null
  return (
    <>
      <Select size="small" className="w-auto" value="s" onChange={noop} ariaLabel="Status" options={[{ value: 's', label: thing.status.label, leading: <StatusIcon status={thing.status} /> }]} />
      <Select
        size="small"
        className="w-auto"
        value="a"
        onChange={noop}
        ariaLabel={thing.kind === 'project' ? 'Lead' : 'Assignee'}
        options={[{ value: 'a', label: thing.assignee ?? 'Unassigned', leading: <Avatar name={thing.assignee} size={16} /> }]}
      />
    </>
  )
}

/* ----------------------------------------------------------------- chip */

export interface ReferenceChipProps {
  thing: Thing
  state?: 'ready' | 'loading' | 'unavailable'
  /** Hovering the chip shows the detailed card. */
  preview?: boolean
}

/** What leads a chip and a compact card: the author's face for a message, the kind's icon otherwise. */
function Lead({ thing, chip = false }: { thing: Thing; chip?: boolean }) {
  if (thing.kind === 'message') return <Avatar name={thing.author} size={16} />
  return <ThingIcon kind={thing.kind} size={chip ? 14 : 16} tone={chip ? 'inherit' : 'secondary'} />
}

/**
 * A link in running text: the icon (or the author's face), the key, the
 * title cut at 24ch, the status as its shape. Loading keeps the icon (the
 * kind is known from the address); not available says so in words.
 */
export function ReferenceChip({ thing, state = 'ready', preview = false }: ReferenceChipProps) {
  if (state === 'loading') {
    return (
      <InlineChip icon={<ThingIcon kind={thing.kind} size={14} tone="inherit" />}>
        <SkeletonBar className="h-2.5 w-16" />
      </InlineChip>
    )
  }
  if (state === 'unavailable') {
    return (
      <InlineChip icon={<ThingIcon kind={thing.kind} size={14} tone="inherit" />} className="text-text-muted">
        {thing.noun}, not available
      </InlineChip>
    )
  }
  const chip = (
    <InlineChip icon={<Lead thing={thing} chip />} href={HREF} className="max-w-[28ch]">
      {thing.key && <Key>{thing.key}</Key>}
      <span className="truncate">{thing.kind === 'message' ? `${thing.author}: ${thing.body}` : thing.title}</span>
      {thing.status && <StatusMark status={thing.status} />}
    </InlineChip>
  )
  return preview ? <HoverPreview thing={thing}>{chip}</HoverPreview> : chip
}

/* ---------------------------------------------------------------- cards */

export type CardLayout = 'compact' | 'detailed'

/** Compact: one 36px line. Every kind, every app. Hovering it shows the detailed card. */
export function CompactCard({ thing, preview = false }: { thing: Thing; preview?: boolean }) {
  const card = (
    <Card fill="inset" hover="hairline" className="relative flex h-9 items-center gap-2 px-3">
      <Lead thing={thing} />
      {thing.kind === 'message' ? (
        <span className="flex min-w-0 flex-1 items-baseline gap-2 text-body-2">
          <span className="shrink-0 text-body-2-strong text-text-primary">{thing.author}</span>
          <Link href={HREF} variant="quiet" cover truncate className="text-text-secondary">
            {thing.body}
          </Link>
        </span>
      ) : (
        <>
          {thing.key && <Key>{thing.key}</Key>}
          <span className="contents text-body-2-strong text-text-primary">
            <Link href={HREF} variant="quiet" cover truncate className="min-w-0 flex-1">
              {thing.title}
            </Link>
          </span>
        </>
      )}
      {thing.kind === 'topic' && <Conversations thing={thing} />}
      {thing.kind === 'page' && <span className="shrink-0 text-caption text-text-secondary">{thing.updated}</span>}
      {thing.kind === 'message' && <span className="shrink-0 text-caption text-text-muted">{thing.updated}</span>}
      {/* Compact keeps to one line: the comment count shows only when there is something unread in it. */}
      {thing.unread && thing.comments !== undefined && <Comments count={thing.comments} unread />}
      {thing.status && thing.kind === 'issue' && <StatusMark status={thing.status} />}
      {thing.done && <ProgressRing done={thing.done.done} total={thing.done.total} />}
      {thing.assignee && <Avatar name={thing.assignee} size={16} />}
      {thing.members && <AvatarGroup members={people(thing.members)} size={16} />}
      {thing.authors && <AvatarGroup members={people(thing.authors)} size={16} />}
    </Card>
  )
  return preview ? (
    <HoverPreview thing={thing} block>
      {card}
    </HoverPreview>
  ) : (
    card
  )
}

/**
 * Detailed: what compact cannot hold. The header is compact's line (icon, key,
 * title as the link; a project's ring or a topic's members in the corner),
 * then the summary, the kind's own extras (a project's issues, a topic's
 * latest conversation), and a footer: the pickers and the comments for an
 * issue or a project, who and when for a page and a topic.
 *
 * `bare` drops the card's frame, for the hover preview, which draws the
 * package's one elevated box around it.
 */
export function DetailedCard({ thing, bare = false }: { thing: Thing; bare?: boolean }) {
  const body = (
    <>
      <div className="flex min-h-[19.6px] items-center gap-2">
        <ThingIcon kind={thing.kind} />
        <span className="contents text-body-2-strong text-text-primary">
          <Link href={HREF} variant="quiet" truncate className="min-w-0 flex-1">
            {thing.title}
          </Link>
        </span>
        {thing.done && <ProgressRing done={thing.done.done} total={thing.done.total} />}
        {thing.members && <AvatarGroup members={people(thing.members)} size={16} />}
      </div>
      {/* The key sits with the project under the title: "ABC-2 · Group one" (Miky, second round). */}
      {(thing.key || thing.subtitle) && <p className="-mt-1 pl-6 text-caption text-text-secondary">{[thing.key, thing.subtitle].filter(Boolean).join(' · ')}</p>}
      {thing.summary && <p className="line-clamp-2 text-body-2 text-text-secondary">{thing.summary}</p>}
      {thing.children && (
        <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">
          {thing.children.map((child) => (
            <div key={child.key} className="flex h-8 items-center gap-2 px-2">
              {/* The status is the row's icon: a list of issues needs no issue icon on every row (Miky, second round). */}
              <StatusMark status={child.status} />
              <Key>{child.key}</Key>
              <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{child.title}</span>
              {child.assignee ? <Avatar name={child.assignee} size={16} /> : <span className="size-4 shrink-0" aria-hidden />}
            </div>
          ))}
        </div>
      )}
      {thing.latest && (
        <div className="flex gap-2 rounded-md border border-border-subtle p-2">
          <Avatar name={thing.latest.author} size={16} />
          <div className="min-w-0 flex-1">
            {/* "Latest" in words: the card follows the topic, so it is not the conversation the link was sent about. */}
            <div className="flex items-baseline gap-2 text-caption">
              <span className="text-text-muted">Latest conversation</span>
              <span className="text-text-primary">{thing.latest.author}</span>
              <span className="text-text-muted">{thing.latest.at}</span>
            </div>
            <p className="line-clamp-2 text-body-2 text-text-secondary">{thing.latest.body}</p>
          </div>
        </div>
      )}
      <div className="flex min-h-6 items-center gap-2 border-t border-border-subtle pt-2">
        {(thing.kind === 'issue' || thing.kind === 'project') && <Pickers thing={thing} />}
        {thing.kind === 'topic' && <Conversations thing={thing} last />}
        {thing.authors && (
          <span className="flex min-w-0 items-center gap-2 text-caption text-text-secondary">
            <AvatarGroup members={people(thing.authors)} size={16} />
            <span className="truncate">{thing.authors.join(', ')}</span>
            <span className="shrink-0 text-text-muted">· {thing.updated}</span>
          </span>
        )}
        {thing.comments !== undefined && (
          <span className="ml-auto flex">
            <Comments count={thing.comments} unread={thing.unread} />
          </span>
        )}
      </div>
    </>
  )
  if (bare) return <div className="flex flex-col gap-2 p-3">{body}</div>
  return (
    <Card fill="inset" data-card="detailed" className="flex flex-col gap-2 p-3">
      {body}
    </Card>
  )
}

/** The detailed card, on hover over a chip or a compact card: the package's preview card. */
export function HoverPreview({ thing, block = false, children }: { thing: Thing; block?: boolean; children: ReactNode }) {
  // A compact card fills its column; PreviewCard's own trigger is inline and would shrink it to its words.
  return (
    <PreviewCard side="bottom" content={<DetailedCard thing={thing} bare />} wrapperClassName={block ? 'grid w-full min-w-0 grid-cols-[minmax(0,1fr)]' : 'max-w-full'}>
      {children}
    </PreviewCard>
  )
}

/** The hover preview drawn open, for a still picture of it: the same box PreviewCard draws. */
export function HoverPreviewOpen({ thing }: { thing: Thing }) {
  return (
    <MenuPanel className="w-[360px] p-0">
      <DetailedCard thing={thing} bare />
    </MenuPanel>
  )
}

/**
 * A linked message, detailed: a card, the frame every other detailed card has
 * (Miky, 15 Oct: "card it is", over a quote). The time is the link.
 */
export function MessageCard({ thing }: { thing: Thing }) {
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Avatar name={thing.author} size={24} />
        <span className="text-body-2-strong text-text-primary">{thing.author}</span>
        <Link href={HREF} variant="quiet" className="text-caption text-text-muted">
          {thing.updated}
        </Link>
      </div>
      <p className="line-clamp-4 text-body-2 text-text-primary">{thing.body}</p>
    </Card>
  )
}

/* ------------------------------------------------- loading, not available */

/** What a kind's detailed card will hold, known before it loads (the kind is in the address). */
export interface LoadingShape {
  subtitle?: boolean
  summary?: boolean
  rows?: number
  preview?: boolean
  ring?: boolean
  footer?: 'pickers' | 'people' | 'line' | 'none'
}

/** The shape a thing's detailed card takes, for its placeholder. */
export function loadingShapeOf(thing: Thing): LoadingShape {
  return {
    subtitle: !!(thing.subtitle || thing.key),
    summary: !!thing.summary,
    rows: thing.children?.length ?? 0,
    preview: !!thing.latest,
    ring: !!thing.done,
    footer: thing.kind === 'issue' || thing.kind === 'project' ? 'pickers' : thing.authors ? 'people' : 'line',
  }
}

/** A bar that shows on an inset card: the package's bar is the inset colour, and vanishes on one. */
function Bar({ className }: { className?: string }) {
  return <SkeletonBar className={cn('bg-bg-active', className)} />
}

/**
 * Loading: the card it will become, drawn in bars, at the card's own height,
 * so the conversation does not jump when it arrives.
 */
export function CardLoading({ kind, layout, shape = {} }: { kind: Thing['kind']; layout: CardLayout; shape?: LoadingShape }) {
  if (layout === 'compact') {
    return (
      <Card fill="inset" aria-hidden data-card="loading" className="flex h-9 items-center gap-2 px-3 animate-skeleton-in">
        <ThingIcon kind={kind} />
        <Bar className="h-3 w-2/5" />
        <Bar className="ml-auto size-4 rounded-full" />
      </Card>
    )
  }
  const { subtitle = false, summary = true, rows = 0, preview = false, ring = false, footer = 'line' } = shape
  return (
    <Card fill="inset" aria-hidden data-card="loading" className="flex flex-col gap-2 p-3 animate-skeleton-in">
      <div className="flex h-[19.6px] items-center gap-2">
        <ThingIcon kind={kind} />
        <Bar className="h-3.5 w-1/2" />
        {ring && <Bar className="ml-auto size-4 rounded-full" />}
      </div>
      {subtitle && (
        <div className="-mt-1 flex h-[14.4px] items-center pl-6">
          <Bar className="h-2.5 w-20" />
        </div>
      )}
      {summary && (
        <div className="flex h-[19.6px] items-center">
          <Bar className="h-3 w-4/5" />
        </div>
      )}
      {rows > 0 && (
        <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-8 items-center px-2">
              <Bar className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}
      {preview && (
        <div className="flex h-[71.6px] flex-col justify-center gap-2 rounded-md border border-border-subtle p-2">
          <Bar className="h-2.5 w-24" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-3/5" />
        </div>
      )}
      {footer !== 'none' && (
        <div className="flex min-h-6 items-center gap-2 border-t border-border-subtle pt-2">
          {footer === 'pickers' ? (
            <>
              <Bar className="h-6 w-24 rounded-md" />
              <Bar className="h-6 w-28 rounded-md" />
            </>
          ) : footer === 'people' ? (
            <>
              <Bar className="size-4 rounded-full" />
              <Bar className="h-3 w-40" />
            </>
          ) : (
            <Bar className="h-3 w-40" />
          )}
        </div>
      )}
    </Card>
  )
}

/**
 * Not available: one line, at compact's height, whichever layout was chosen.
 * Deleted and unreadable read the same (Widgets 2, Not in scope). Here the
 * way out stays: there is no title to click, and the app it lives in may
 * still open it for you.
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
 * Accepted). The same header as a detailed card: the key and the title of
 * the file it is part of, as the link.
 */
export function PartCard({ kind, heading, partKey, children, state = 'ready', noun, app }: { kind: Thing['kind']; heading: string; partKey?: string; children?: ReactNode; state?: 'ready' | 'loading' | 'unavailable'; noun: string; app: string }) {
  if (state === 'loading') return <CardLoading kind={kind} layout="detailed" shape={{ summary: true, rows: 0, footer: 'none' }} />
  if (state === 'unavailable') return <CardUnavailable kind={kind} noun={`A part of this ${noun.toLowerCase()}`} app={app} />
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <ThingIcon kind={kind} />
        {partKey && <Key>{partKey}</Key>}
        <span className="contents text-body-2-strong text-text-primary">
          <Link href={HREF} variant="quiet" truncate className="min-w-0 flex-1">
            {heading}
          </Link>
        </span>
      </div>
      <div className="border-l-2 border-border-default pl-3">{children}</div>
    </Card>
  )
}

/**
 * A comment's anchor: the part it is about, quoted above the comment.
 * Unchanged from today (the two apps already agree), with the deleted line in
 * the same muted voice as "not available.".
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
