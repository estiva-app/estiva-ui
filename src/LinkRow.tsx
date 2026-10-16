/**
 * A link alone on its line: one 36px row for every kind. Hovering it shows its
 * card; a tap opens it. Loading draws the row in bars; not available says so
 * in one line of the same height.
 */
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { Card } from './Card'
import { Link } from './Link'
import { chosenOf, type LinkedKind, type LinkState } from './linked'
import { CommentCount, LinkedIcon, LinkKey, ProgressRing, StatusMark } from './LinkParts'
import { LinkPreview } from './LinkPreview'
import { SkeletonBar } from './Skeleton'

export interface LinkUnavailableProps {
  kind: LinkedKind
  /** What it is, in a word: "Item". Drawn as "Item — not available.". */
  noun: string
  /** Where it may still open, for someone who can: its app and address. */
  openIn?: { app: string; href: string }
}

/**
 * Not available: deleted, or not this reader's to see, which read the same.
 * One line at a row's height, whether a row or a card was to draw. The way
 * out stays, since the app it lives in may still open it for you.
 */
export function LinkUnavailable({ kind, noun, openIn }: LinkUnavailableProps) {
  return (
    <Card fill="none" unreadable className="flex h-9 items-center gap-2 px-3">
      <LinkedIcon kind={kind} />
      <span className="min-w-0 flex-1 truncate text-body-2 text-text-muted">{noun} — not available.</span>
      {openIn && (
        <span className="shrink-0 text-caption text-text-secondary">
          <Link href={openIn.href} variant="quiet" external>
            Open in {openIn.app} ↗
          </Link>
        </span>
      )}
    </Card>
  )
}

export interface LinkRowProps {
  link: LinkState
  /** Hovering shows its card. */
  preview?: boolean
}

export function LinkRow({ link, preview = true }: LinkRowProps) {
  if (link.state === 'loading') {
    return (
      <span className="block animate-skeleton-in" aria-busy>
        <Card fill="inset" aria-hidden className="flex h-9 items-center gap-2 px-3">
          <LinkedIcon kind={link.kind} />
          <SkeletonBar on="inset" className="h-3 w-2/5" />
          <SkeletonBar on="inset" shape="round" className="ml-auto size-4" />
        </Card>
      </span>
    )
  }
  if (link.state === 'unavailable') return <LinkUnavailable kind={link.kind} noun={link.noun} openIn={link.openIn} />
  const { linked } = link
  const status = chosenOf(linked.status)
  const owner = chosenOf(linked.owner)
  const said = linked.kind === 'message' && linked.author
  const row = (
    <Card fill="inset" hover="hairline" className="relative flex h-9 items-center gap-2 px-3">
      {said ? <Avatar name={said.name} src={said.picture} size={16} /> : <LinkedIcon kind={linked.kind} />}
      {said ? (
        <span className="flex min-w-0 flex-1 items-baseline gap-2 text-body-2">
          <span className="shrink-0 text-body-2-strong text-text-primary">{said.name}</span>
          <span className="contents text-text-secondary">
            <Link href={linked.href} variant="quiet" cover truncate>
              {linked.body ?? linked.title}
            </Link>
          </span>
        </span>
      ) : (
        <>
          {linked.key && <LinkKey>{linked.key}</LinkKey>}
          <span className="contents text-body-2-strong text-text-primary">
            <Link href={linked.href} variant="quiet" cover truncate className="min-w-0 flex-1">
              {linked.title}
            </Link>
          </span>
        </>
      )}
      {linked.updated && <span className="shrink-0 text-caption text-text-secondary">{linked.updated}</span>}
      {/* A row keeps to one line: the count shows only when there is something unread in it, except where conversations are what it holds. */}
      {linked.conversation && (linked.conversation.unread || linked.kind === 'topic') && <CommentCount conversation={linked.conversation} noun={linked.conversation.noun} />}
      {/* A ring already says how far along it is. */}
      {status?.colour && !linked.done && <StatusMark status={{ label: status.label, colour: status.colour }} />}
      {linked.done && <ProgressRing done={linked.done.done} total={linked.done.total} />}
      {owner && <Avatar name={owner.label} src={owner.picture} size={16} />}
      {linked.members && <AvatarGroup members={linked.members} size={16} />}
      {linked.authors && <AvatarGroup members={linked.authors} size={16} />}
    </Card>
  )
  return preview ? (
    <LinkPreview linked={linked} block>
      {row}
    </LinkPreview>
  ) : (
    row
  )
}
