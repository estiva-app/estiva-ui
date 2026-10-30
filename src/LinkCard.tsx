/**
 * A link's card: what a row cannot hold. Look C (Katerina, 29 Oct): it starts
 * as its row does, its kind in a file's 36px tile with the title and one line
 * under it (its key and its kind's word), and on the title's line, at the right,
 * its ring, its conversation count and its faces, in that order, as a row's;
 * then its summary, the items inside it in a box of their own, the newest thing said
 * in it as a quote, and a footer: the pickers, or who and when. Words a person wrote draw as themselves: their face, their name
 * and the time beside it, then the words.
 *
 * At most 480px wide, in a message, a document and a box being written in alike
 * (Katerina, 30 Oct: a card across a wide box did not look good); in a box it
 * sits on the files' fill, its values and its links as words until it is sent,
 * so a click on it never leaves the draft. While it loads it holds the card's
 * own shape, so what is around it does not jump; not available is one row.
 */
import { useContext, type ReactNode } from 'react'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { Card } from './Card'
import { cn } from './cn'
import { Link } from './Link'
import { inTheBox, type Linked, type LinkedKind, type LinkState, type LoadingShape } from './linked'
import { CommentCount, LinkedIcon, LinkKey, LinkPickers, LinkTile, ProgressRing, StatusMark } from './LinkParts'
import { linkMetaOf, LinkUnavailable, WrittenUrl } from './LinkRow'
import { QUOTE_BAR_CLASSES, TIME_CLASSES, TYPE_TILE_CLASSES } from './looks'
import { SkeletonBar } from './Skeleton'

export interface LinkCardProps {
  link: LinkState
  /** The values read as words, never pickers: the hover preview. In a box being written in (`inTheBox`) they always are. */
  readOnly?: boolean
  /** No frame of its own: inside a box that draws one, as the hover preview's. */
  bare?: boolean
}

/** A card's frame: 12px round it, 12px between what it holds. */
const CARD_CLASSES = 'flex flex-col gap-3 p-3'

/**
 * A link on a card, or its words alone: in a box being written in, where the card under the box follows no click,
 * as the chips in the box do not (Katerina, 30 Oct), and where there is nowhere to open (an empty `href`).
 */
function CardLink({ href, truncate = false, className, children }: { href: string; truncate?: boolean; className?: string; children: ReactNode }) {
  const boxed = useContext(inTheBox)
  if (boxed || !href) return <span className={cn(truncate && 'truncate', className)}>{children}</span>
  return (
    <Link href={href} variant="quiet" truncate={truncate} className={className}>
      {children}
    </Link>
  )
}

export function LinkCard({ link, readOnly = false, bare = false }: LinkCardProps) {
  // In a box being written in: the files' fill, and the values as words until it is sent.
  const boxed = useContext(inTheBox)
  if (link.state === 'loading') return <LinkCardLoading kind={link.kind} shape={link.shape} />
  if (link.state === 'unavailable') {
    if (link.url) return <WrittenUrl url={link.url} block />
    return <LinkUnavailable kind={link.kind} noun={link.noun} openIn={link.openIn} deleted={link.deleted} card />
  }
  const { linked } = link
  const body = linked.kind === 'message' && linked.author ? <SaidBody linked={linked} /> : <CardBody linked={linked} readOnly={readOnly || boxed} />
  if (bare) return <div className={CARD_CLASSES}>{body}</div>
  return (
    <Card fill={boxed ? 'elevated' : 'inset'} className={cn(CARD_CLASSES, 'max-w-[480px]')}>
      {body}
    </Card>
  )
}

function CardBody({ linked, readOnly }: { linked: Linked; readOnly: boolean }) {
  const boxed = useContext(inTheBox)
  const on = boxed ? 'elevated' : 'inset'
  const meta = linkMetaOf(linked)
  // Only when there is something to put there: a topic with a summary alone drew an empty row, 36px of nothing (Katerina, 30 Oct).
  const footed = Boolean(linked.status || linked.owner || linked.authors || linked.updated)
  return (
    <>
      <div className="flex items-center gap-3">
        <LinkTile kind={linked.kind} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="block min-w-0 text-body-2-strong text-text-primary">
            {/* One line, cut short: a long title truncates rather than wrapping (Katerina, 29 Oct). */}
            <CardLink href={linked.href} truncate className="block">
              {linked.title}
            </CardLink>
          </span>
          {meta && <span className="truncate text-caption text-text-secondary">{meta}</span>}
        </span>
        {(linked.done || linked.conversation || linked.members) && (
          // On the title's line, not halfway down the header: the ring, the count, the faces, as a row's (Katerina, 30 Oct).
          <span className="flex h-[19.6px] shrink-0 items-center gap-2 self-start">
            {linked.done && <ProgressRing done={linked.done.done} total={linked.done.total} />}
            {linked.conversation && <CommentCount conversation={linked.conversation} noun={linked.conversation.noun} />}
            {linked.members && <AvatarGroup members={linked.members} size={16} on={on} />}
          </span>
        )}
      </div>
      {linked.summary && <p className="line-clamp-2 text-body-2 text-text-secondary">{linked.summary}</p>}
      {linked.children && linked.children.length > 0 && (
        // In a box of their own, a hairline between them, as the card first drew them (Katerina, 29 Oct: "add back the borders").
        <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle leaf:divide-border-strong leaf:border-border-strong">
          {linked.children.map((child) => (
            <div key={child.id} className={cn('relative flex h-8 items-center gap-2 px-2', !boxed && 'hover:bg-bg-active')}>
              {/* The status is the row's icon: a list needs no kind icon on every row. */}
              <StatusMark status={child.status} />
              {child.key && <LinkKey>{child.key}</LinkKey>}
              {/* Each opens on its own; the link covers its row. */}
              <span className="contents text-body-2 text-text-primary">
                {boxed || !child.href ? (
                  <span className="min-w-0 flex-1 truncate">{child.title}</span>
                ) : (
                  <Link href={child.href} variant="quiet" cover truncate className="min-w-0 flex-1">
                    {child.title}
                  </Link>
                )}
              </span>
              {child.owner ? <Avatar name={child.owner.name} src={child.owner.picture} size={16} /> : <span className="size-4 shrink-0" aria-hidden />}
            </div>
          ))}
        </div>
      )}
      {linked.latest && (
        // 12px between the words "Latest conversation" and the quote they name (Katerina, 29 Oct).
        <div className="flex flex-col gap-3">
          {/* "Latest" in words: the card follows it, so this is not necessarily what the link was sent about. */}
          <span className="text-caption text-text-muted">Latest conversation</span>
          <div className={cn('flex flex-col gap-1', QUOTE_BAR_CLASSES)}>
            <span className="flex items-center gap-2 text-caption">
              <Avatar name={linked.latest.author.name} src={linked.latest.author.picture} size={16} />
              <span className="text-text-primary">{linked.latest.author.name}</span>
              <span className={cn('text-text-muted', TIME_CLASSES)}>{linked.latest.at}</span>
            </span>
            <p className="line-clamp-2 text-body-2 text-text-secondary">{linked.latest.body}</p>
          </div>
        </div>
      )}
      {footed && (
      <div className="flex min-h-6 items-center gap-2">
        {(linked.status || linked.owner) && <LinkPickers status={linked.status} owner={linked.owner} ownerLabel={linked.ownerLabel} readOnly={readOnly} />}
        {/* Faces only: names would not fit once several people wrote it. */}
        {linked.authors ? (
          <span className="flex min-w-0 items-center gap-2 text-caption text-text-secondary">
            <AvatarGroup members={linked.authors} size={16} on={on} />
            {/* Italic, as every "Updated …" on a card is (Katerina, 30 Oct). */}
            {linked.updated && <span className="shrink-0 italic">Updated {linked.updated}</span>}
          </span>
        ) : (
          !linked.status && !linked.owner && linked.updated && <span className="text-caption italic text-text-secondary">Updated {linked.updated}</span>
        )}
      </div>
      )}
    </>
  )
}

/** Words a person wrote, linked: their face, their name, the time beside it as the link (without a time, the name), and the words. */
function SaidBody({ linked }: { linked: Linked }) {
  const author = linked.author!
  return (
    <>
      <div className="flex items-center gap-2">
        <Avatar name={author.name} src={author.picture} size={24} />
        {/* No "Open" in a missing time's place (Katerina, 30 Oct): the name is the link then. */}
        <span className="text-body-2-strong text-text-primary">
          {linked.updated ? author.name : <CardLink href={linked.href}>{author.name}</CardLink>}
        </span>
        {linked.updated && (
          <span className={cn('text-caption text-text-muted', TIME_CLASSES)}>
            <CardLink href={linked.href}>{linked.updated}</CardLink>
          </span>
        )}
      </div>
      <p className="line-clamp-4 text-body-2 text-text-secondary">{linked.body ?? linked.title}</p>
    </>
  )
}

/** Each kind's usual card, for a placeholder when the app remembers nothing of it. */
const KIND_SHAPE: Record<LinkedKind, LoadingShape> = {
  issue: { subtitle: true, summary: true, footer: 'pickers' },
  project: { subtitle: true, summary: true, rows: 3, ring: true, footer: 'pickers' },
  topic: { subtitle: true, summary: true, latest: true, footer: 'line' },
  page: { subtitle: true, summary: true, footer: 'people' },
  file: { summary: false, footer: 'line' },
  message: { summary: true, footer: 'none' },
}

export interface LinkCardLoadingProps {
  kind: LinkedKind
  /** What the card will hold (`loadingShapeOf` from the last time it drew); the kind's usual card otherwise. */
  shape?: LoadingShape
}

/** The card it will become, drawn in bars in the card's own shape: the tile, its two lines, then what it holds. */
export function LinkCardLoading({ kind, shape }: LinkCardLoadingProps) {
  const { subtitle = false, summary = true, rows = 0, latest = false, ring = false, footer = 'line' } = shape ?? KIND_SHAPE[kind]
  const boxed = useContext(inTheBox)
  return (
    <div className="animate-skeleton-in" aria-busy>
      <Card fill={boxed ? 'elevated' : 'inset'} aria-hidden className={cn(CARD_CLASSES, 'max-w-[480px]')}>
        <div className="flex items-center gap-3">
          <span className={TYPE_TILE_CLASSES}>
            <LinkedIcon kind={kind} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <SkeletonBar on="inset" className="h-3.5 w-1/2" />
            {subtitle && <SkeletonBar on="inset" className="h-2.5 w-20" />}
          </span>
          {ring && <SkeletonBar on="inset" shape="round" className="size-4 self-start" />}
        </div>
        {summary && (
          <div className="flex h-[19.6px] items-center">
            <SkeletonBar on="inset" className="h-3 w-4/5" />
          </div>
        )}
        {rows > 0 && (
          <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle leaf:divide-border-strong leaf:border-border-strong">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex h-8 items-center px-2">
                <SkeletonBar on="inset" className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        )}
        {latest && (
          <div className="flex flex-col gap-3">
            <div className="flex h-[14.4px] items-center">
              <SkeletonBar on="inset" className="h-2.5 w-28" />
            </div>
            <div className={cn('flex h-[57.6px] flex-col justify-center gap-2', QUOTE_BAR_CLASSES)}>
              <SkeletonBar on="inset" className="h-2.5 w-24" />
              <SkeletonBar on="inset" className="h-3 w-full" />
              <SkeletonBar on="inset" className="h-3 w-3/5" />
            </div>
          </div>
        )}
        {footer !== 'none' && (
          <div className="flex min-h-6 items-center gap-2">
            {footer === 'pickers' ? (
              <>
                <SkeletonBar on="inset" shape="control" className="h-6 w-24" />
                <SkeletonBar on="inset" shape="control" className="h-6 w-28" />
              </>
            ) : footer === 'people' ? (
              <>
                <SkeletonBar on="inset" shape="round" className="size-4" />
                <SkeletonBar on="inset" className="h-3 w-40" />
              </>
            ) : (
              <SkeletonBar on="inset" className="h-3 w-40" />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
