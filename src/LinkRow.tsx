/**
 * A link alone on its line, in look C (Katerina, 29 Oct): its kind in a file's
 * 36px tile, as an attached file has its type, the title and one line under
 * it (its key and its kind's word), and on the title's line its state, its
 * comments and its faces, the faces at the far right. Hovering it shows its
 * card; a tap opens it. Loading draws the row in bars; not available says so
 * in a row of the same shape.
 *
 * At most 480px in a message or a document, as a card is; in a box being
 * written in it fills the box.
 */
import { useContext } from 'react'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { Card } from './Card'
import { cn } from './cn'
import { Link } from './Link'
import { chosenOf, inTheBox, type Linked, type LinkedKind, type LinkState } from './linked'
import { CommentCount, kindNounOf, LinkedIcon, LinkTile, ProgressRing, StatusMark } from './LinkParts'
import { LinkPreview } from './LinkPreview'
import { TIME_CLASSES, TYPE_TILE_CLASSES } from './looks'
import { SkeletonBar } from './Skeleton'

export interface LinkUnavailableProps {
  kind: LinkedKind
  /** What it is, in a word: "Issue". Drawn as "Issue — not available.". */
  noun: string
  /** Where it may still open, for someone who can: its app and address. */
  openIn?: { app: string; href: string }
  /** In a card's place: a card's 12px round it. Default a row's. */
  card?: boolean
}

/** A row's frame: the tile, the two lines and the marks, 6px round the tile. */
const ROW_CLASSES = 'flex items-center gap-3 p-1.5 pr-3'

/**
 * Not available: deleted, or not this reader's to see, which read the same.
 * Drawn as the row or the card it would have been, on the same fill and edge
 * (Katerina, 29 Oct: "same styling as the linkcard default"), its words muted.
 * The way out stays, since the app it lives in may still open it for you.
 */
export function LinkUnavailable({ kind, noun, openIn, card = false }: LinkUnavailableProps) {
  const wide = useContext(inTheBox)
  return (
    <Card fill={wide ? 'elevated' : 'inset'} className={cn(card ? 'flex items-center gap-3 p-3' : ROW_CLASSES, !wide && 'max-w-[480px]')}>
      <span className={TYPE_TILE_CLASSES}>
        <LinkedIcon kind={kind} />
      </span>
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

/** The line under a row's or a card's title: its key and what it is, then where it lives and when, as far as the app says. */
export function linkMetaOf(linked: Linked, withWhen = false): string {
  return [linked.key, kindNounOf(linked), linked.subtitle, withWhen ? linked.updated : undefined].filter(Boolean).join(' · ')
}

export interface LinkRowProps {
  link: LinkState
  /** Hovering shows its card. */
  preview?: boolean
}

export function LinkRow({ link, preview = true }: LinkRowProps) {
  const wide = useContext(inTheBox)
  const width = !wide && 'max-w-[480px]'
  if (link.state === 'loading') {
    return (
      <div className="animate-skeleton-in" aria-busy>
        <Card fill="inset" aria-hidden className={cn(ROW_CLASSES, width)}>
          <span className={TYPE_TILE_CLASSES}>
            <LinkedIcon kind={link.kind} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <SkeletonBar on="inset" className="h-3 w-2/5" />
            <SkeletonBar on="inset" className="h-2.5 w-1/4" />
          </span>
        </Card>
      </div>
    )
  }
  if (link.state === 'unavailable') return <LinkUnavailable kind={link.kind} noun={link.noun} openIn={link.openIn} />
  const { linked } = link
  const status = chosenOf(linked.status)
  const owner = chosenOf(linked.owner)
  const said = linked.kind === 'message' ? linked.author : undefined
  const meta = said ? (linked.body ?? '') : linkMetaOf(linked, true) || linked.summary
  const row = (
    <Card fill="inset" hover="hairline" className={cn('relative', ROW_CLASSES, width)}>
      <LinkTile kind={linked.kind} author={said} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {said ? (
          // As a card of words a person wrote: the name, then the time beside it, muted.
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="contents text-body-2-strong text-text-primary">
              <Link href={linked.href} variant="quiet" cover truncate>
                {said.name}
              </Link>
            </span>
            {linked.updated && <span className={cn('shrink-0 text-caption text-text-muted', TIME_CLASSES)}>{linked.updated}</span>}
          </span>
        ) : (
          <span className="contents text-body-2-strong text-text-primary">
            <Link href={linked.href} variant="quiet" cover truncate>
              {linked.title}
            </Link>
          </span>
        )}
        {meta && <span className="truncate text-caption text-text-secondary">{meta}</span>}
      </span>
      {/* On the title's line, not halfway down the row: the state, the comments, then the faces at the far right. */}
      <span className="flex h-[19.6px] shrink-0 items-center gap-2 self-start">
        {/* A ring already says how far along it is. */}
        {linked.done ? <ProgressRing done={linked.done.done} total={linked.done.total} /> : status?.colour && <StatusMark status={{ label: status.label, colour: status.colour }} />}
        {linked.conversation && <CommentCount conversation={linked.conversation} noun={linked.conversation.noun} />}
        {owner && <Avatar name={owner.label} src={owner.picture} size={16} />}
        {linked.members && <AvatarGroup members={linked.members} size={16} on="inset" />}
        {linked.authors && <AvatarGroup members={linked.authors} size={16} on="inset" />}
      </span>
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
