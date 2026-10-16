/**
 * A link's card: what a row cannot hold. The header is the row's line (icon
 * and title as the link; a ring or faces in the corner), then the key and
 * what it is in, its summary, the items inside it, the newest thing said in
 * it, and a footer: the pickers and the conversation count, or who and when.
 * Words a person wrote draw as themselves, with their face and the time.
 *
 * While it loads it holds the card's own height, so what is around it does
 * not jump; not available is one line.
 */
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { Card } from './Card'
import { Link } from './Link'
import type { Linked, LinkedKind, LinkState, LoadingShape } from './linked'
import { CommentCount, LinkedIcon, LinkKey, LinkPickers, ProgressRing, StatusMark } from './LinkParts'
import { LinkUnavailable } from './LinkRow'
import { SkeletonBar } from './Skeleton'

export interface LinkCardProps {
  link: LinkState
  /** The values read as words, never pickers: the hover preview. */
  readOnly?: boolean
  /** No frame of its own: inside a box that draws one, as the hover preview's. */
  bare?: boolean
}

export function LinkCard({ link, readOnly = false, bare = false }: LinkCardProps) {
  if (link.state === 'loading') return <LinkCardLoading kind={link.kind} shape={link.shape} />
  if (link.state === 'unavailable') return <LinkUnavailable kind={link.kind} noun={link.noun} openIn={link.openIn} />
  const { linked } = link
  if (linked.kind === 'message' && linked.author) return <SaidCard linked={linked} />
  const body = <CardBody linked={linked} readOnly={readOnly} />
  if (bare) return <div className="flex flex-col gap-2 p-3">{body}</div>
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      {body}
    </Card>
  )
}

function CardBody({ linked, readOnly }: { linked: Linked; readOnly: boolean }) {
  return (
    <>
      <div className="flex min-h-[19.6px] items-center gap-2">
        {/* The icon opens it too, so the target is larger than the words. */}
        <span className="flex min-w-0 flex-1 text-body-2-strong text-text-primary">
          <Link href={linked.href} variant="quiet" className="flex min-w-0 flex-1 items-center gap-2">
            <LinkedIcon kind={linked.kind} />
            <span className="truncate">{linked.title}</span>
          </Link>
        </span>
        {linked.done && <ProgressRing done={linked.done.done} total={linked.done.total} />}
        {linked.members && <AvatarGroup members={linked.members} size={16} />}
      </div>
      {(linked.key || linked.subtitle) && <p className="-mt-1 pl-6 text-caption text-text-secondary">{[linked.key, linked.subtitle].filter(Boolean).join(' · ')}</p>}
      {linked.summary && <p className="line-clamp-2 text-body-2 text-text-secondary">{linked.summary}</p>}
      {linked.children && linked.children.length > 0 && (
        <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle leaf:divide-border-strong leaf:border-border-strong">
          {linked.children.map((child) => (
            <div key={child.id} className="relative flex h-8 items-center gap-2 px-2 hover:bg-bg-active">
              {/* The status is the row's icon: a list needs no kind icon on every row. */}
              <StatusMark status={child.status} />
              {child.key && <LinkKey>{child.key}</LinkKey>}
              {/* Each opens on its own; the link covers its row. */}
              <span className="contents text-body-2 text-text-primary">
                <Link href={child.href} variant="quiet" cover truncate className="min-w-0 flex-1">
                  {child.title}
                </Link>
              </span>
              {child.owner ? <Avatar name={child.owner.name} src={child.owner.picture} size={16} /> : <span className="size-4 shrink-0" aria-hidden />}
            </div>
          ))}
        </div>
      )}
      {linked.latest && (
        <div className="flex flex-col gap-1">
          {/* "Latest" in words: the card follows it, so this is not necessarily what the link was sent about. */}
          <span className="text-caption text-text-muted">Latest conversation</span>
          <div className="flex gap-2 rounded-md border border-border-subtle p-2 leaf:border-border-strong">
            <Avatar name={linked.latest.author.name} src={linked.latest.author.picture} size={16} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-caption">
                <span className="text-text-primary">{linked.latest.author.name}</span>
                <span className="text-text-muted">{linked.latest.at}</span>
              </div>
              <p className="line-clamp-2 text-body-2 text-text-secondary">{linked.latest.body}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex min-h-6 items-center gap-2 border-t border-border-subtle pt-2 leaf:border-border-strong">
        {(linked.status || linked.owner) && <LinkPickers status={linked.status} owner={linked.owner} ownerLabel={linked.ownerLabel} readOnly={readOnly} />}
        {/* Faces only: names would not fit once several people wrote it. */}
        {linked.authors ? (
          <span className="flex min-w-0 items-center gap-2 text-caption text-text-secondary">
            <AvatarGroup members={linked.authors} size={16} />
            {linked.updated && <span className="shrink-0">{linked.updated}</span>}
          </span>
        ) : (
          !linked.status && !linked.owner && linked.updated && <span className="text-caption text-text-secondary">Updated {linked.updated}</span>
        )}
        {linked.conversation && (
          <span className="ml-auto flex">
            <CommentCount conversation={linked.conversation} noun={linked.conversation.noun} />
          </span>
        )}
      </div>
    </>
  )
}

/** Words a person wrote, linked: their face, their name, the time as the link, and the words. */
function SaidCard({ linked }: { linked: Linked }) {
  const author = linked.author!
  return (
    <Card fill="inset" className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Avatar name={author.name} src={author.picture} size={24} />
        <span className="text-body-2-strong text-text-primary">{author.name}</span>
        <span className="text-caption text-text-muted">
          <Link href={linked.href} variant="quiet">
            {linked.updated ?? 'Open'}
          </Link>
        </span>
      </div>
      <p className="line-clamp-4 text-body-2 text-text-primary">{linked.body ?? linked.title}</p>
    </Card>
  )
}

/** Each kind's usual card, for a placeholder when the app remembers nothing of it. */
const KIND_SHAPE: Record<LinkedKind, LoadingShape> = {
  issue: { subtitle: true, summary: true, footer: 'pickers' },
  project: { subtitle: false, summary: true, rows: 3, ring: true, footer: 'pickers' },
  topic: { summary: true, latest: true, footer: 'line' },
  page: { subtitle: true, summary: true, footer: 'people' },
  file: { summary: false, footer: 'line' },
  message: { summary: true, footer: 'none' },
}

export interface LinkCardLoadingProps {
  kind: LinkedKind
  /** What the card will hold (`loadingShapeOf` from the last time it drew); the kind's usual card otherwise. */
  shape?: LoadingShape
}

/** The card it will become, drawn in bars at the card's own height. */
export function LinkCardLoading({ kind, shape }: LinkCardLoadingProps) {
  const { subtitle = false, summary = true, rows = 0, latest = false, ring = false, footer = 'line' } = shape ?? KIND_SHAPE[kind]
  return (
    <span className="block animate-skeleton-in" aria-busy>
      <Card fill="inset" aria-hidden className="flex flex-col gap-2 p-3">
        <div className="flex h-[19.6px] items-center gap-2">
          <LinkedIcon kind={kind} />
          <SkeletonBar on="inset" className="h-3.5 w-1/2" />
          {ring && <SkeletonBar on="inset" shape="round" className="ml-auto size-4" />}
        </div>
        {subtitle && (
          <div className="-mt-1 flex h-[14.4px] items-center pl-6">
            <SkeletonBar on="inset" className="h-2.5 w-20" />
          </div>
        )}
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
          <div className="flex flex-col gap-1">
            <div className="flex h-[14.4px] items-center">
              <SkeletonBar on="inset" className="h-2.5 w-28" />
            </div>
            <div className="flex h-[71.6px] flex-col justify-center gap-2 rounded-md border border-border-subtle p-2 leaf:border-border-strong">
              <SkeletonBar on="inset" className="h-2.5 w-24" />
              <SkeletonBar on="inset" className="h-3 w-full" />
              <SkeletonBar on="inset" className="h-3 w-3/5" />
            </div>
          </div>
        )}
        {footer !== 'none' && (
          <div className="flex min-h-6 items-center gap-2 border-t border-border-subtle pt-2 leaf:border-border-strong">
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
    </span>
  )
}
