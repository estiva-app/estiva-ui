/**
 * A link alone on its line, in look C (Katerina, 29 Oct): its kind in a file's
 * 36px tile, as an attached file has its type, the title and one line under
 * it (its key and its kind's word), and on the title's line its state, its
 * comments and its faces, the faces at the far right. Hovering it shows its
 * card; a tap opens it. Loading draws the row in bars; not available says so
 * in a row of the same shape.
 *
 * At most 480px wide, as a card is, in a box being written in too.
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
  /** What it is, in a word: "Issue". Drawn as "You can't open this issue", or "Issue deleted". */
  noun: string
  /** `noun` is its app's name ("App one"), its type having none: "You can't open this file in App one". */
  named?: boolean
  /** Its read failed (the network, a busy relay), which says nothing about access: "Couldn't load this issue". */
  failed?: boolean
  /** @deprecated Not drawn since 0.102.0: someone who can't open it has nowhere to go. */
  openIn?: { app: string; href: string }
  /** In a card's place: a card's 12px round it. Default a row's. */
  card?: boolean
  /** Deleted (SPEC §13.6.1): "Issue deleted", and no way out, since there is nothing left to open. */
  deleted?: boolean
}

/** A row's frame: the tile, the two lines and the marks, 6px round the tile. */
const ROW_CLASSES = 'flex items-center gap-3 p-1.5 pr-3'

/**
 * Not available: not this reader's to see, or deleted, which says so (SPEC
 * §13.6.1: deleted is not not-permitted). Drawn as the row or the card it
 * would have been, on the same fill and edge (Katerina, 29 Oct: "same styling
 * as the linkcard default"), its words muted. Not this reader's: "You can't
 * open this issue", the approved story's words, with no way out, since there
 * is nothing for them to open (Miky, ALO-4's review, 3 November). A read that
 * failed says "Couldn't load this issue" instead: it is not an answer about
 * access (Miky, 3 November).
 */
export function LinkUnavailable({ kind, noun, named = false, card = false, deleted = false, failed = false }: LinkUnavailableProps) {
  return <UnavailableRow kind={kind} words={unavailableWords(noun, { named, deleted, failed })} card={card} />
}

/** What a link that can't be opened says, row, card and chip alike: "You can't open this issue", "Couldn't load this issue", "Issue deleted". */
export function unavailableWords(noun: string, { named = false, deleted = false, failed = false }: { named?: boolean; deleted?: boolean; failed?: boolean } = {}): string {
  // A word ("Issue") reads in the sentence in small letters; an app's name is where the file lives: "file in Peek".
  const word = named ? `file in ${noun}` : /^[A-Z][a-z]*$/.test(noun) ? noun.toLowerCase() : noun
  return deleted ? `${named ? `File in ${noun}` : noun} deleted` : failed ? `Couldn't load this ${word}` : `You can't open this ${word}`
}

/** The not-available row with the words it is given; `href` makes the words a link (a part that can't be shown opens its whole file). */
export function UnavailableRow({ kind, words, href, card = false }: { kind: LinkedKind; words: string; href?: string; card?: boolean }) {
  const wide = useContext(inTheBox)
  return (
    <Card fill={wide ? 'elevated' : 'inset'} className={cn(card ? 'flex items-center gap-3 p-3' : ROW_CLASSES, 'max-w-[480px]')}>
      <span className={TYPE_TILE_CLASSES}>
        <LinkedIcon kind={kind} />
      </span>
      <span className="min-w-0 flex-1 truncate text-body-2 text-text-muted">
        {href && !wide ? (
          <Link href={href} variant="quiet">
            {words}
          </Link>
        ) : (
          words
        )}
      </span>
    </Card>
  )
}

/** The line under a row's or a card's title: its key and what it is, whether it is archived, then where it lives and when, as far as the app says. */
export function linkMetaOf(linked: Linked, withWhen = false): string {
  return [linked.key, kindNounOf(linked), linked.archived ? 'Archived' : undefined, linked.subtitle, withWhen ? linked.updated : undefined].filter(Boolean).join(' · ')
}

/**
 * A link written as a URL that cannot be shown stays that URL, a plain link as
 * a message draws one (SPEC §13.1, C21), in a chip's, a row's or a card's
 * place alike.
 */
export function WrittenUrl({ url, block = false }: { url: string; block?: boolean }) {
  const link = (
    <Link href={url} external>
      {url}
    </Link>
  )
  return block ? <span className="block min-w-0 truncate text-body-2">{link}</span> : link
}

export interface LinkRowProps {
  link: LinkState
  /** Hovering shows its card. */
  preview?: boolean
}

export function LinkRow({ link, preview = true }: LinkRowProps) {
  // At most 480px, in a box being written in too (Katerina, 30 Oct).
  const width = 'max-w-[480px]'
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
  if (link.state === 'unavailable') {
    if (link.url) return <WrittenUrl url={link.url} block />
    return <LinkUnavailable kind={link.kind} noun={link.noun} named={link.named} deleted={link.deleted} failed={link.failed} />
  }
  const { linked } = link
  const status = chosenOf(linked.status)
  const owner = chosenOf(linked.owner)
  const said = linked.kind === 'message' ? linked.author : undefined
  const meta = said ? '' : linkMetaOf(linked, true) || linked.summary
  const row = (
    <Card fill="inset" hover="hairline" className={cn('relative', ROW_CLASSES, width)}>
      <LinkTile kind={linked.kind} author={said} />
      {said ? (
        // Words a person wrote, on one line, as a quote is cut to one (Katerina, 30 Oct): the face, the name, the words
        // cut to fit, the time.
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="contents text-body-2-strong text-text-primary">
            {linked.href ? (
              <Link href={linked.href} variant="quiet" cover truncate className="min-w-0">
                {said.name}
              </Link>
            ) : (
              <span className="min-w-0 truncate">{said.name}</span>
            )}
          </span>
          {linked.body && <span className="min-w-0 flex-1 truncate text-caption text-text-secondary">{linked.body}</span>}
          {linked.updated && <span className={cn('ml-auto shrink-0 text-caption text-text-muted', TIME_CLASSES)}>{linked.updated}</span>}
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="contents text-body-2-strong text-text-primary">
            {/* Another app's file with no address to open (none over https): its title is words, not a link to nowhere. */}
            {linked.href ? (
              <Link href={linked.href} variant="quiet" cover truncate>
                {linked.title}
              </Link>
            ) : (
              <span className="truncate">{linked.title}</span>
            )}
          </span>
          {meta && <span className="truncate text-caption text-text-secondary">{meta}</span>}
        </span>
      )}
      {/* On the title's line, not halfway down the row: the state, the comments, then the faces at the far right. */}
      <span className="flex h-[19.6px] shrink-0 items-center gap-2 self-start">
        {/* A ring already says how far along it is. */}
        {linked.done ? <ProgressRing done={linked.done.done} total={linked.done.total} /> : status?.colour && <StatusMark status={{ label: status.label, colour: status.colour }} />}
        {linked.conversation && <CommentCount conversation={linked.conversation} noun={linked.conversation.noun} />}
        {owner && <Avatar name={owner.label} src={owner.picture} bot={owner.bot} size={16} />}
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
