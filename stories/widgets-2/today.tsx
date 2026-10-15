/**
 * Widgets 2 prototype: how Peek, Ship and Leaf draw a link's widget today,
 * redrawn as static markup, class for class, from each app's `origin/main`
 * (15 Oct: peek-app 92e0cb9, estiva-ship df0136c, leaf 70a5627). Nothing here
 * fetches; every field is a prop. These exist only so the proposed kit can be
 * judged beside them, and go away with the prototype.
 */
import { IconCircle, IconCircleCheck, IconCircleDashed, IconCircleHalf2, IconCircleX, IconExternalLink, IconMessage2 } from '@tabler/icons-react'
import { AttachmentCard } from '../../src/AttachmentCard'
import { Avatar } from '../../src/Avatar'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { Divider } from '../../src/Divider'
import { InlineChip } from '../../src/InlineChip'
import { KindIcon, type ThingKind } from '../../src/KindIcon'
import { Link } from '../../src/Link'
import { Person } from '../../src/Person'
import { SectionLabel } from '../../src/SectionLabel'
import { Select } from '../../src/Select'
import { SkeletonBar } from '../../src/Skeleton'
import { PART, PICTURE, type Status, type StatusColour, type Thing } from './fixtures'

const HREF = '#'
const noop = () => {}

/** KindIcon has no page; every app draws a Leaf page as another app's file today. */
export const iconKind = (kind: Thing['kind']): ThingKind => (kind === 'page' ? 'file' : kind)

/* ------------------------------------------------------------------ Peek */

const PEEK_STATUS: Record<StatusColour, string> = {
  neutral: 'text-text-secondary',
  blue: 'text-info-default',
  green: 'text-success-default',
  muted: 'text-text-muted',
}

/** Peek's `Reference`: a chip with the kind's icon, cut at 24ch, its status in coloured words. */
export function PeekChip({ thing }: { thing: Thing }) {
  if (thing.kind === 'message') {
    return (
      <InlineChip icon={<KindIcon kind="message" size={14} tone="inherit" />} href={HREF} style={{ maxWidth: '24ch' }}>
        <span className="truncate">
          {thing.author}: {thing.body}
        </span>
      </InlineChip>
    )
  }
  return (
    <InlineChip icon={<KindIcon kind={iconKind(thing.kind)} size={14} tone="inherit" />} href={HREF} style={{ maxWidth: '24ch' }}>
      <span className="truncate">{thing.title}</span>
      {thing.status && <span className={cn('shrink-0 text-caption font-medium', PEEK_STATUS[thing.status.colour])}>{thing.status.label}</span>}
    </InlineChip>
  )
}

/** Peek's chip before the lookup answers, and when it never does: the address's first 12 characters. */
export function PeekChipQuiet({ address }: { address: string }) {
  return <InlineChip tone="quiet">{address.slice(0, 12)}…</InlineChip>
}

/**
 * Peek's `ForeignObjectCard`. `row` (compact) drops the subtitle and the body
 * but keeps the meta line and the actions, which is why an issue's row and
 * card read alike.
 */
export function PeekCard({ thing, layout }: { thing: Thing; layout: 'card' | 'row' }) {
  const whole = layout === 'card'
  const actions = thing.kind === 'issue'
  return (
    <Card fill="inset" className={cn('mt-1', whole ? 'p-3' : 'px-3 py-2')}>
      <div className="flex items-baseline gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {thing.kind === 'message' ? (
            <Person name={thing.author} size={16} />
          ) : (
            <span className="contents text-body-2 font-semibold text-text-primary">
              <Link href={HREF} variant="quiet" external truncate>
                {thing.title}
              </Link>
            </span>
          )}
          {thing.status && !actions && <span className={cn('inline-flex items-center text-caption font-medium', PEEK_STATUS[thing.status.colour])}>{thing.status.label}</span>}
        </div>
        {thing.kind !== 'message' && <SectionLabel className="shrink-0">{thing.kind === 'page' ? thing.app : thing.noun}</SectionLabel>}
      </div>
      {whole && thing.subtitle && <p className="mt-1 text-caption text-text-secondary">{thing.subtitle}</p>}
      {whole && thing.body && <p className="mt-1 line-clamp-4 text-body-2 text-text-primary">{thing.body}</p>}
      {(thing.assignee || thing.progress) && !actions && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {thing.assignee && (
            <span className="contents text-caption text-text-secondary">
              <Person name={thing.assignee} size={16} />
            </span>
          )}
          {thing.progress && <span className="text-caption text-text-secondary">Progress: {thing.progress}</span>}
        </div>
      )}
      {actions && thing.status && (
        <div className="mt-2">
          <Divider className="mx-0" />
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Select size="small" className="w-auto" value="s" onChange={noop} ariaLabel="Status" options={[{ value: 's', label: thing.status.label }]} />
            <Select
              size="small"
              className="w-auto"
              value="a"
              onChange={noop}
              ariaLabel="Assignee"
              options={[{ value: 'a', label: thing.assignee ?? 'Unassigned', leading: <Avatar name={thing.assignee} size={16} /> }]}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

/** The height Peek holds a chosen card at while it loads (measured: row 97, topic card 46, others 229). */
const PEEK_HELD = { row: 97, card: { topic: 46, other: 229 } }

/** Peek's `ForeignObjectSkeleton`. */
export function PeekSkeleton({ thing, layout }: { thing: Thing; layout: 'card' | 'row' }) {
  const height = layout === 'row' ? PEEK_HELD.row : thing.kind === 'topic' ? PEEK_HELD.card.topic : PEEK_HELD.card.other
  return (
    <div aria-hidden style={{ height }} className={cn('mt-1 overflow-hidden rounded-lg border border-border-subtle bg-bg-inset animate-skeleton-in', layout === 'row' ? 'px-3 py-2' : 'p-3')}>
      <SkeletonBar className="h-3.5 w-1/2" />
      <div className="mt-2 flex items-center gap-2">
        <SkeletonBar className="h-3 w-16" />
        <SkeletonBar className="h-3 w-24" />
      </div>
    </div>
  )
}

/** Peek's `NotAvailableRow`, the same in row and card. */
export function PeekNotAvailable({ noun, app }: { noun: string; app: string }) {
  return (
    <Card fill="none" unreadable className="mt-1 px-3 py-2">
      <div className="text-caption text-text-secondary">
        {noun} — not available.{' '}
        <Link href={HREF} variant="underlined" external>
          Open in {app} ↗
        </Link>
      </div>
    </Card>
  )
}

/** Peek's and Ship's `PartCard`, resolved: the part drawn live, under "{Noun} · {title}". */
export function TodayPartCard({ app }: { app: 'Peek' | 'Ship' }) {
  return (
    <Card fill="inset" className={cn('flex flex-col gap-3 p-3', app === 'Peek' && 'mt-1')}>
      <span className="contents text-h5 text-text-primary">
        <Link href={HREF} variant="quiet" external truncate>
          {PART.noun} · {PART.heading}
        </Link>
      </span>
      <PartBlocks />
      <div>
        <Button size="small" leadingIcon={<IconExternalLink stroke={1.5} className="size-3.5" />}>
          {app === 'Ship' ? 'Open' : `Open in ${PART.app}`}
        </Button>
      </div>
    </Card>
  )
}

/** The part's blocks, as a small rich text draws them. */
export function PartBlocks() {
  const [heading, paragraph, ...points] = PART.blocks
  return (
    <div className="flex flex-col gap-1 text-body-2 text-text-primary">
      <p className="text-body-2-strong">{heading}</p>
      <p>{paragraph}</p>
      <ul className="list-disc pl-5">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  )
}

/** Peek's `PartCard` when the reader cannot read the part. */
export function PeekPartNotAvailable() {
  return (
    <Card fill="inset" unreadable className="mt-1 px-3 py-2">
      <span className="text-caption italic text-text-muted">Not available to you</span>
    </Card>
  )
}

/** Peek's `CommentAnchor` and Ship's `BlockAnchorNote`: the same classes. */
export function TodayCommentAnchor({ text }: { text?: string }) {
  if (text === undefined) {
    return <div className="border-l-2 border-border-default pl-2 text-caption text-text-muted">The part this refers to has since been deleted.</div>
  }
  return (
    <div className="border-l-2 border-border-strong pl-2 text-caption text-text-muted">
      <span className="line-clamp-2 italic">{text}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ Ship */

const SHIP_STATUS_ICON = {
  neutral: { Icon: IconCircleDashed, tone: 'text-text-secondary' },
  blue: { Icon: IconCircleHalf2, tone: 'text-info-default' },
  green: { Icon: IconCircleCheck, tone: 'text-success-default' },
  muted: { Icon: IconCircleX, tone: 'text-text-muted' },
} as const

/** Ship's `StatusLabel` at `small`: the status's shape icon and its words. */
export function ShipStatus({ status, words = true }: { status: Status; words?: boolean }) {
  const { Icon, tone } = SHIP_STATUS_ICON[status.colour] ?? { Icon: IconCircle, tone: 'text-text-muted' }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-caption text-text-secondary">
      <Icon size={14} stroke={1.5} className={tone} aria-hidden />
      {words && status.label}
    </span>
  )
}

/** Ship's `Reference`: Peek's chip shape, with the status as an icon and words. */
export function ShipChip({ thing }: { thing: Thing }) {
  return (
    <InlineChip icon={<KindIcon kind={iconKind(thing.kind)} size={14} tone="inherit" />} href={HREF} style={{ maxWidth: '24ch' }}>
      <span className="truncate">{thing.kind === 'message' ? `${thing.author}: ${thing.body}` : thing.title}</span>
      {thing.status && <ShipStatus status={thing.status} />}
    </InlineChip>
  )
}

/** Ship's `ForeignObject`. Row and card differ only by `py-2`; neither has a body or actions. */
export function ShipCard({ thing, layout }: { thing: Thing; layout: 'card' | 'row' }) {
  return (
    <Card href={HREF} fill="surface" className={cn('flex flex-col gap-2 p-3', layout === 'row' && 'py-2')}>
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 truncate text-body-2-strong text-text-primary">{thing.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {thing.comments !== undefined && (
            <span className="flex shrink-0 items-center gap-1 text-caption tabular-nums text-text-muted">
              <IconMessage2 size={14} stroke={1.5} aria-hidden />
              {thing.comments}
            </span>
          )}
          <Chip label={thing.kind === 'page' ? thing.app : thing.noun} />
        </span>
      </div>
      {thing.subtitle && <p className="line-clamp-2 text-body-2 text-text-secondary">{thing.subtitle}</p>}
      {(thing.status || thing.assignee) && (
        <div className="flex flex-wrap items-center gap-2.5 text-caption text-text-muted">
          {thing.status && <ShipStatus status={thing.status} />}
          {thing.assignee && (
            <span className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden className="text-text-muted">
                ·
              </span>
              Assignee
              <Person name={thing.assignee} size={16} />
            </span>
          )}
        </div>
      )}
      {thing.children && (
        <div className="mt-1 flex flex-col divide-y divide-border-default">
          {thing.children.map((child) => (
            <div key={child.title} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate text-body-2-strong text-text-primary">{child.title}</span>
              <ShipStatus status={child.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/** Ship's linked message: no frame, a face, the author, the words. It reads as a quote. */
export function ShipQuote({ thing }: { thing: Thing }) {
  return (
    <div className="flex gap-2 py-1.5">
      <Avatar name={thing.author} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-caption text-text-muted">
          <span className="truncate text-text-secondary">{thing.author}</span>
        </div>
        <p className="text-body-2 text-text-primary">{thing.body}</p>
      </div>
    </div>
  )
}

/** Ship's loading placeholder: one bar, whatever is coming. */
export function ShipSkeleton() {
  return <SkeletonBar className="h-16 w-full" />
}

/** Ship's unreachable card. */
export function ShipNotAvailable({ noun }: { noun: string }) {
  return (
    <Card fill="surface" unreadable className="p-3">
      <div className="text-body-2 text-text-muted">
        You may not have access to this {noun.toLowerCase()}.{' '}
        <span className="text-text-secondary">
          <Link href={HREF} variant="underlined">
            Open it there
          </Link>
        </span>
        .
      </div>
    </Card>
  )
}

/** Ship's attachment: the package's card, as Ship passes it. */
export function TodayAttachment({ name, size, contentType }: { name: string; size: number; contentType: string }) {
  return <AttachmentCard name={name} size={size} contentType={contentType} src={contentType.startsWith('image/') ? PICTURE : undefined} download />
}

/* ------------------------------------------------------------------ Leaf */

/** Leaf's `ReferenceChip`: no status. */
export function LeafChip({ thing }: { thing: Thing }) {
  return (
    <InlineChip icon={<KindIcon kind={iconKind(thing.kind)} size={14} tone="inherit" />} className="max-w-[24ch]">
      <span className="truncate">{thing.kind === 'message' ? thing.author : thing.title}</span>
    </InlineChip>
  )
}

/** Leaf's `ReferenceObject`: an icon and the title; detailed adds the noun under it. No status, body or app. */
export function LeafCard({ thing, layout }: { thing: Thing; layout: 'compact' | 'detailed' }) {
  return (
    <Card hover="fill" className="flex items-center gap-2 px-3 py-2">
      <KindIcon kind={iconKind(thing.kind)} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body-2-strong text-text-primary">{thing.kind === 'message' ? thing.author : thing.title}</span>
        {layout === 'detailed' && <span className="truncate text-body-2 text-text-secondary">{thing.noun}</span>}
      </span>
    </Card>
  )
}

/** Leaf's loading placeholder. */
export function LeafSkeleton() {
  return <SkeletonBar className="h-12 w-full" />
}
