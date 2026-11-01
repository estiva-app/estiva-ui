import { createContext, useContext, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { IconArrowNarrowRight, IconCircleCheck, IconDotsVertical } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { Card } from './Card'
import { Chip } from './Chip'
import { cn } from './cn'
import { ConfirmDialog } from './ConfirmDialog'
import { ConversationActions } from './ConversationActions'
import { ConversationMenu } from './ConversationMenu'
import { Divider } from './Divider'
import { EditedMarker } from './EditedMarker'
import { FieldLine } from './Field'
import { Link } from './Link'
import { MetaText } from './MetaText'
import { ReactionRow, type ReactionRowProps } from './ReactionRow'
import { RepliesRow, type RepliesRowProps } from './RepliesRow'
import { ResolutionHistory, ResolutionNote, ResolvedAnswer, ResolvedBadge, ResolvedFoot, ResolvedMark, ResolvedMeta, ResolvedNode, ResolvedOutcome, ResolvedOutcomePill, ResolvedReaction, ResolvedTab } from './Resolution'
import { ResolveDialog } from './ResolveDialog'
import { InConversationItem, InThreadCard, LineByLayout, ProposalLooks, useFaceLine } from './threadCard'
import { ToolbarButton } from './Toolbar'
import { WithTooltip } from './Tooltip'
import { UnreadDot } from './UnreadDot'
import { UrgentMark } from './UrgentMark'

/** Who wrote it: a name, and a picture when there is one (else the face draws initials). */
export interface ConversationPerson {
  name: string
  picture?: string
}

/** What a comment and a reply share. */
export interface ConversationEntryProps {
  author: ConversationPerson
  /** When it was written, in the app's words ("11:08 AM"). */
  time: ReactNode
  /** A link to it: the time is then the link, "Link to this", as a reply's is. */
  timeHref?: string
  /** When it was last edited, in the app's words for the tooltip ("Edited 11:20 AM"): draws "(edited)". */
  edited?: string
  /** The words, as the app draws them: text, mentions, links, attached cards, quoted blocks. */
  children: ReactNode
  /** Above the name: what it is about, a `QuotedLine` for a comment on a part of the page. */
  about?: ReactNode
  /** Pictures and files: `AttachmentCard`s, laid out under the words. */
  files?: ReactNode
  /** Its reactions: the kit's `ReactionRow`. With `onToggle`, the strip offers React too. */
  reactions?: ReactionRowProps
  /** Why the last reaction was refused, in plain words: said under the reactions. */
  reactionRefused?: string
  /** Not read yet: the dot, or the urgent mark with `urgent`, and a hairline. */
  isNew?: boolean
  urgent?: boolean
  /** It is yours: the menu offers Edit (with `editor`) and Delete (with `onDelete`). */
  own?: boolean
  /** Nothing can be changed (an archived page): no strip, reactions only shown. */
  readOnly?: boolean
  /** The box it is edited in, the app's `CommentBox` edit form; call `done` when it saves or cancels. */
  editor?: (done: () => void) => ReactNode
  /** Being edited, when the app holds it (an edit that was refused opens again). Absent: the card holds it. */
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
  /** Delete, after the card has asked. */
  onDelete?: () => Promise<boolean | void> | boolean | void
  /** The app's sentence in the delete question, what deleting does there. Absent: "It is deleted for everyone." */
  deleteNote?: ReactNode
  /** The app's own rows in the ⋯ menu: `MenuItem`s. */
  menu?: ReactNode
  /** Quieter: no fill or edge of its own, as where it is shown again in another list. Inside a thread drawn as one card it is so by itself. */
  subdued?: boolean
  /** Proposal (comments panel, 1 November): React (☺+) after the reactions only while the card is pointed at, as Slack's. */
  reactOnHover?: boolean
  /** Placement only. */
  className?: string
}

export interface ConversationCardProps extends ConversationEntryProps {
  /** Deleted: "This comment was deleted.", and its replies stay. */
  deleted?: boolean
  /** Its thread: how many replied, their faces, the last time, and whether one is new. Opening it is `onReply` or `onClick`. */
  replies?: Omit<RepliesRowProps, 'urgent'>
  /** Reply: offered on the strip. */
  onReply?: () => void
  /**
   * Resolved, by whom and with what note: the kit's green Chip on the card's top edge, "Resolved by Person two · the
   * note", the note in white, cut at the end of the line and whole on hover with when (5B, Katerina's pick, 31 October).
   * Nothing of the comment is hidden.
   */
  /** `at`: when, in the app's words, said with who. */
  resolved?: { by: string; note?: string; at?: string }
  /**
   * Proposal (31 October, round 2), until one is picked: how "resolved" is said. `bar` (today), `face`, `chip` and
   * `faded` above the name (`faded`: the words recede too), `band` across the card's top, `name` in the name row with
   * the note under the words. Round 3 (31 October), 3 and 5 in one and two columns: `joined` (3 · one line: open
   * under in one column, the line runs on into the thread and the node ends it), `short` (3 · the node under the words),
   * `tabsays` (5 · the note in the tab), `tabfoot` (5 · a green foot), `tabnode` (5 · 3's node at the foot).
   * Default `tabsays`: 5B, Katerina's pick (31 October); the others stay for the proposal boards.
   */
  resolvedLook?: 'bar' | 'face' | 'chip' | 'band' | 'name' | 'faded' | 'outcome' | 'answer' | 'node' | 'seal' | 'tab' | 'quiet' | 'reaction' | 'joined' | 'short' | 'tabsays' | 'tabfoot' | 'tabnode' | 'foot' | 'check' | 'folded' | 'fadedfoot'
  /** Resolve, with the note written in the dialog the card opens. Offered on the strip and in the menu. */
  onResolve?: (note: string) => Promise<boolean | void> | boolean | void
  onReopen?: () => void
  /** The one open beside its thread. */
  selected?: boolean
  /** A press on the card: its thread opens. */
  onClick?: () => void
  /** Proposal (comments panel, round 2): its latest reply, said in one line while closed, with the `preview` look. */
  latestReply?: { by: ConversationPerson; words: string }
}

export type ReplyCardProps = ConversationEntryProps

/** The face, the name, the time and "(edited)", with the new mark at the far right. */
function Head({ author, time, timeHref, edited, isNew, urgent, trailing, badge, meta, faded = false }: Pick<ConversationEntryProps, 'author' | 'time' | 'timeHref' | 'edited' | 'isNew' | 'urgent'> & { trailing?: ReactNode; badge?: ReactNode; meta?: ReactNode; faded?: boolean }) {
  const { newLook, compact } = useContext(ProposalLooks)
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span data-face className={cn('relative flex shrink-0 transition-opacity', faded && 'opacity-50 grayscale')}>
          <Avatar size={compact ? 20 : 24} src={author.picture} alt={author.name} />
          {badge}
        </span>
        <span className={cn('min-w-0 truncate text-body-2-strong', faded ? 'text-text-secondary' : 'text-text-primary')}>{author.name}</span>
        {timeHref ? (
          <WithTooltip label="Link to this" wrapperClassName="shrink-0">
            <MetaText className="contents">
              <Link href={timeHref} variant="quiet" data-interactive>
                {time}
              </Link>
            </MetaText>
          </WithTooltip>
        ) : (
          <MetaText className="shrink-0">{time}</MetaText>
        )}
        <EditedMarker edited={edited} />
        {meta}
      </div>
      {trailing}
      {/* Proposal (round 2): `label` says it in words, the chip the replies row already uses for "1 new". */}
      {isNew && (newLook === 'label' ? <Chip type={urgent ? 'warning' : 'brand'} label={urgent ? 'Urgent' : 'New'} /> : urgent ? <UrgentMark /> : <UnreadDot />)}
    </div>
  )
}

/** Proposal (round 2): how a new or urgent card is marked, beyond the dot. `edge` is today's. */
function freshLook(newLook: string | undefined, fresh: boolean, urgent: boolean, inThreadCard: boolean) {
  const look = newLook ?? 'edge'
  const tone = urgent ? 'warning' : 'accent'
  return {
    attention: fresh && !inThreadCard && (look === 'edge' || look === 'measured') ? (tone as 'warning' | 'accent') : undefined,
    // Ship's and Leaf's 30% edge measured 1.3:1 and 1.5:1, no stronger than a plain hairline (1.4:1); at full strength, 3.1:1 and 4.5:1.
    className: cn(
      fresh && !inThreadCard && look === 'measured' && (urgent ? 'ship:border-warning-default leaf:border-warning-default' : 'ship:border-accent-primary leaf:border-accent-primary'),
      fresh && !inThreadCard && look === 'wash' && (urgent ? 'bg-warning-muted' : 'bg-accent-wash'),
    ),
    bar: fresh && look === 'bar' && !inThreadCard ? <span aria-hidden className={cn('absolute bottom-2 left-0 top-2 w-0.5 rounded-full', urgent ? 'bg-warning-default' : 'bg-accent-primary')} /> : null,
  }
}

/**
 * Folded (Katerina, 1 November): who resolved it and the note, "Person two → Keeping the first one. · 12:30 PM", in the
 * thread's own line (the dot in the faces' column). No "resolved": the check by the time says it.
 */
function EndedLine({ by, note, at }: { by: string; note: string; at?: string }) {
  return (
    <div data-resolved="line" className="relative flex items-start py-1">
      <span className="flex h-[17px] w-10 shrink-0 items-center justify-center">
        {/* Above the face's line, which ends at its centre: the disc masks it. */}
        <span data-dot className="relative z-10 flex size-2 items-center justify-center rounded-full bg-bg-surface">
          <span className="size-1 rounded-full bg-success-default" />
        </span>
      </span>
      <p className="min-w-0 text-h5 leading-snug">
        {/* Who in the name's colour, the note in the words' (Katerina, 1 November). */}
        <span className="whitespace-nowrap text-text-primary">{by}</span>
        <IconArrowNarrowRight size={12} stroke={1.5} className="mx-1.5 -mt-px inline shrink-0 text-text-primary" />
        <span className="text-text-secondary">{note}</span>
        {at && <MetaText size="chip"> · {at}</MetaText>}
      </p>
    </div>
  )
}

/** Proposal (round 2, check and folded): after the time, a green check and "Resolved"; who, when and the note on hover. */
function ResolvedCheck({ by, note, at }: { by: string; note?: string; at?: string }) {
  const said = `Resolved by ${by}${at ? `, ${at}` : ''}${note ? `: ${note}` : ''}`
  return (
    <WithTooltip label={said} wrapperClassName="flex shrink-0">
      <span className="flex items-center gap-1 text-caption text-success-default">
        <IconCircleCheck size={14} stroke={1.5} />
        Resolved
      </span>
    </WithTooltip>
  )
}

/** The words' own look: Peek's message body, 14px secondary, blocks 8px apart. */
/** Proposal (node): a row's piece of the line from the face down to where it was resolved. */
/** Where the line from the face stands. Open under in one column (the card over the one card's edge): on the thread's own line, 0.5px right, so the two are one. */
const StemOnThreadLine = createContext(false)

/**
 * 2px, centred under the 24px face (Katerina, 1 November: the line from the face down to the resolved dot, thicker,
 * and the same in an open comment and its thread). `toDot`: it stops at the resolved line's dot, a closed comment's end.
 */
function Stem({ toDot = false }: { toDot?: boolean }) {
  // Open or closed, the same place: the thread's 2px line stands 19px in, under the face's centre (measured, 1 November).
  return <span aria-hidden className={cn('absolute left-[11px] w-0.5 bg-border-default', toDot ? 'top-0 h-3' : 'bottom-0 top-0')} />
}

function Words({ children, faded = false, stem = false, oneLine = false }: { children: ReactNode; faded?: boolean; stem?: boolean; oneLine?: boolean }) {
  const { compact } = useContext(ProposalLooks)
  return (
    <div className={cn('relative w-full break-words pb-2 pr-2 pt-1', compact ? 'pl-7' : 'pl-8', oneLine && '[&>div>*:not(p)]:hidden [&>div]:line-clamp-1')}>
      {stem && <Stem />}
      <div className={cn('flex flex-col gap-2 text-body-2', faded ? 'text-text-muted' : 'text-text-secondary')}>{children}</div>
    </div>
  )
}

function Reactions({ reactions, refused, readOnly, lead, stem = false, add = true, trailing }: { reactions?: ReactionRowProps; refused?: string; readOnly: boolean; lead?: ReactNode; stem?: boolean; add?: boolean; trailing?: ReactNode }) {
  const { compact } = useContext(ProposalLooks)
  const shown = !!reactions && reactions.reactions.length > 0
  if (!shown && !refused && !lead && !trailing) return null
  if (trailing) {
    // Proposal (round 2, compact): the reactions and the way into the replies on one row.
    return (
      <div className={cn('relative flex w-full flex-wrap items-center gap-x-2 gap-y-1 pb-2 pr-2 pt-1', compact ? 'pl-7' : 'pl-8')}>
        {stem && <Stem />}
        {shown && reactions && <ReactionRow {...reactions} onToggle={readOnly ? undefined : reactions.onToggle} add={add} />}
        <span className="flex">{trailing}</span>
        {refused && <FieldLine tone="error">Not reacted: {refused}.</FieldLine>}
      </div>
    )
  }
  return (
    <div className={cn('relative flex w-full flex-col gap-1 pb-2 pt-1', compact ? 'pl-7' : 'pl-8')}>
      {stem && <Stem />}
      {lead ? (
        <div className="flex flex-wrap items-center gap-1">
          {lead}
          {reactions && <ReactionRow {...reactions} onToggle={readOnly ? undefined : reactions.onToggle} add={add} />}
        </div>
      ) : (
        reactions && <ReactionRow {...reactions} onToggle={readOnly ? undefined : reactions.onToggle} add={add} />
      )}
      {refused && <FieldLine tone="error">Not reacted: {refused}.</FieldLine>}
    </div>
  )
}

/** Being edited: the face beside the app's box, which holds the words, the files and the cards. */
function Editing({ author, children }: { author: ConversationPerson; children: ReactNode }) {
  const { compact } = useContext(ProposalLooks)
  return (
    <div className="p-2">
      <div className="flex items-start gap-2">
        <Avatar size={compact ? 20 : 24} src={author.picture} alt={author.name} className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

/**
 * A press on the card opens its thread, wherever it lands on the card, but for what acts by itself: a button, a
 * link, the strip, a field. A press in a picker or a menu the card opened lands here too, through React's tree, from
 * outside the card: that is not a press on it. (Before, the whole reactions row and the strip stopped every press,
 * so a press beside the reactions did nothing: Katerina, 31 October.)
 */
function pressed(e: MouseEvent<HTMLDivElement>, press: () => void) {
  const target = e.target as HTMLElement
  if (!e.currentTarget.contains(target)) return
  if (target.closest('button, a, input, textarea, [contenteditable="true"], [role="button"], [role="toolbar"], [data-interactive]')) return
  press()
}

/** The editing state, held by the card or by the app. */
function useEditing(editing: boolean | undefined, onEditingChange: ((editing: boolean) => void) | undefined) {
  const [own, setOwn] = useState(false)
  const now = editing ?? own
  const set = (next: boolean) => {
    if (editing === undefined) setOwn(next)
    onEditingChange?.(next)
  }
  return [now, set] as const
}

/**
 * One comment: who, when, the words, files, cards, reactions, and the way into its replies, with the strip on hover
 * and the ⋯ menu. Resolved, it says who resolved it and the note; nothing of it is hidden.
 * The same card in every app, each in its own colours (the record that makes one conversation). Peek's, moved.
 */
export function ConversationCard(props: ConversationCardProps) {
  const { author, about, files, reactions, reactionRefused, isNew = false, urgent = false, own = false, editor, deleted = false, replies, onReply, resolved, onResolve, onReopen, selected, onClick, onDelete, deleteNote, menu, reactOnHover = false, latestReply, className, children } = props
  const readOnly = (props.readOnly ?? false) || deleted
  const inThreadCard = useContext(InThreadCard)
  const proposal = useContext(ProposalLooks)
  // Katerina's picks (1 November): resolved folds, with how it ended above its replies row; the quoted words in the page's highlight, above the words.
  const resolvedLook = props.resolvedLook ?? (proposal.resolvedLook as ConversationCardProps['resolvedLook']) ?? 'folded'
  const quoteLook = proposal.quoteLook ?? 'mark'

  // In a ConversationLayout: a press opens its thread (in one column, a second closes it), Reply opens it, its replies
  // row says it is open, and beside it is marked. What the app passes wins.
  const item = useContext(InConversationItem)
  const subdued = props.subdued ?? inThreadCard
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useEditing(props.editing, props.onEditingChange)
  const isEditing = editing && !readOnly && !!editor
  const overlay = menuOpen || picking || resolving || deleting
  const resolves = resolved ? onReopen : onResolve
  const above = resolvedLook === 'bar' || resolvedLook === 'face' || resolvedLook === 'chip' || resolvedLook === 'faded'
  const look = resolved ? resolvedLook : undefined
  // Round 3: the tab's family marks the card; the line's family runs a line from the face. Open under in one column,
  // the tab and the green edge go on the one card round the comment and its thread (ConversationLayout).
  const tabbed = look === 'tab' || look === 'tabsays' || look === 'tabfoot' || look === 'tabnode'
  // Open under in one column, the line runs from the face into the thread, whatever the look (Katerina, 31 October).
  // Open under in one column, the face's line runs down to its thread, with replies or with only the box (Katerina, 1 November).
  const lined = look === 'node' || look === 'joined' || inThreadCard
  // Folded with a note: the face's line runs down to the resolved line's dot, closed too (Katerina, 1 November), one
  // bar measured from the face to the dot. Open in a ConversationLayout, the layout draws the whole line, face to the
  // thread's last reply, so the card draws no pieces of it; elsewhere (a card on its own) the pieces stay.
  const toDot = !lined && look === 'folded' && !!resolved?.note && !isEditing
  const layoutLine = useContext(LineByLayout)
  const stemmed = lined && !layoutLine
  const root = useRef<HTMLDivElement>(null)
  const dotLine = useFaceLine(root, toDot, true)
  const nodeAtFoot = look === 'node' || (look === 'joined' && !inThreadCard) || look === 'tabnode'
  // Quiet: the card steps back until it is pointed at.
  const quiet = look === 'quiet' && !hovered && !(selected ?? (!!item && !item.under && item.open))
  // The ⋯ menu only when it has a row to show: Resolve or Reopen, the app's rows, or Edit and Delete on your own.
  const offersMenu = !!resolves || !!menu || (own && (!!editor || !!onDelete))
  const showStrip = hovered && !isEditing && !readOnly
  const react = reactions?.onToggle
  // Read-only with no replies, there is nothing to open: no box to write in, no thread to read (Peek's way, Katerina, 1 November).
  const press = onClick ?? (readOnly && !replies?.count ? undefined : item?.toggle)
  const reply = onReply ?? item?.show
  const marked = selected ?? (item && !item.under ? item.open : undefined)
  const under = !!item?.under
  // Proposal (round 3): a quieter card in one column; anything but `now` draws no fill and no fill on hover.
  const delicate = under && !!proposal.cardLook && proposal.cardLook !== 'now'
  // Proposal (round 2): the new mark, the resolved looks that need no edge, where the quoted words go.
  const fresh = freshLook(proposal.newLook, isNew || !!replies?.isNew, urgent, inThreadCard)
  const closed = !inThreadCard && !(item && !item.under && item.open)
  const foldedNow = look === 'folded' && closed
  const footLine = (look === 'foot' || look === 'fadedfoot') && !inThreadCard
  // Folded: "✓ Resolved" by the time, and the note above the replies row, "Person two → the note", open or closed, in one
  // column or two; the thread no longer says it among the replies (Katerina, 1 November).
  const endedAbove = look === 'folded'
  const checked = look === 'check' || look === 'folded'
  // Compact puts the replies on the reactions' row; a folded card keeps its own row, under the line.
  const merge = !!proposal.compact && !endedAbove
  const repliesRow = replies && replies.count > 0 && (
    <RepliesRow
      {...replies}
      // Compact, on the reactions' row: no time, so both fit in the 384px column.
      last={merge ? undefined : replies.last}
      onOpen={replies.onOpen ?? (under ? item?.toggle : undefined)}
      open={replies.open ?? (under && !!item?.open)}
      urgent={urgent}
      bare={merge}
    />
  )
  const aboutShown = !!about && !deleted
  return (
    <>
      {/* @estiva-escape(no-restyled-part): proposal 5 · Tab (31 October), a green edge on a resolved card until Katerina picks; it goes with the losing looks */}
      <Card
        ref={root}
        // No fill of its own at rest, in any theme: it sits on its column's colour and lights up on hover. Peek's and
        // Leaf's columns are their surface, so nothing changes there; Ship's is its page base, where the surface fill
        // showed as a box round every comment (Katerina, 1 November: no background in Ship).
        fill="none"
        // Read-only with nothing to open: nothing on hover. Round 3's quieter card: no fill on hover either.
        hover={(readOnly && !press) || delicate ? 'none' : 'fill'}
        quietUntilHover
        hovered={hovered}
        selected={marked}
        active={isEditing}
        // Open in a thread card, the outer card is its edge: the dot alone says it is new.
        attention={fresh.attention}
        // The tab's green edge: its own when closed; open in one column, the one card's, and green on hover as when
        // closed, so nothing changes colour as it opens and closes (Katerina, 31 October).
        className={cn('relative', tabbed && !inThreadCard && 'mt-2.5 border-success-outline', tabbed && 'hover:border-success-outline', delicate && press && 'cursor-pointer', fresh.className, className)}
        onClick={press && !isEditing && !overlay ? (e) => pressed(e, press) : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          if (picking || menuOpen) return
          setHovered(false)
        }}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (picking || menuOpen || e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setHovered(false)
        }}
      >
        {fresh.bar}
        {aboutShown && quoteLook === 'band' && !isEditing && about}
        {resolved && resolvedLook === 'band' && !isEditing && <ResolutionNote by={resolved.by} note={resolved.note} look="band" />}
        {resolved && tabbed && <ResolvedTab by={resolved.by} at={resolved.at} note={resolved.note} says={look === 'tabsays'} />}
        {isEditing ? (
          <Editing author={author}>{editor(() => setEditing(false))}</Editing>
        ) : (
          <StemOnThreadLine.Provider value={inThreadCard && lined}>
          <div data-comment-body className={cn('flex flex-col items-start px-2', tabbed ? 'pt-4' : 'pt-2')}>
            {resolved && above && (
              <div className="w-full pb-1.5 pr-2">
                <ResolutionNote by={resolved.by} note={resolved.note} look={resolvedLook === 'faded' ? 'face' : (resolvedLook as 'bar' | 'face' | 'chip')} />
              </div>
            )}
            {resolved && look === 'outcome' && (
              <div className="w-full pr-2">
                <ResolvedOutcome by={resolved.by} note={resolved.note} at={resolved.at} />
                <div className="py-2 pl-8">
                  <Divider />
                </div>
              </div>
            )}
            {aboutShown && (quoteLook === 'bar' || quoteLook === 'block') && <div className={cn('w-full', quoteLook === 'block' ? 'pb-2' : 'pb-1.5 pr-2')}>{about}</div>}
            {deleted ? (
              <p className="w-full pb-2 pl-8 pr-2 text-caption italic text-text-muted">This comment was deleted.</p>
            ) : (
              <>
                <Head
                  author={author}
                  time={props.time}
                  timeHref={props.timeHref}
                  edited={props.edited}
                  isNew={isNew}
                  urgent={urgent}
                  trailing={resolved && resolvedLook === 'name' && <ResolvedMark by={resolved.by} />}
                  badge={resolved && look === 'seal' && <ResolvedBadge by={resolved.by} at={resolved.at} />}
                  meta={
                    <>
                      {resolved && look === 'seal' && <ResolvedMeta by={resolved.by} at={resolved.at} />}
                      {resolved && checked && <ResolvedCheck by={resolved.by} note={resolved.note} at={resolved.at} />}
                      {aboutShown && quoteLook === 'icon' && about}
                    </>
                  }
                  faded={quiet}
                />
                {aboutShown && quoteLook === 'mark' && (
                  <div className={cn('relative w-full pr-2 pt-0.5', proposal.compact ? 'pl-7' : 'pl-8')}>
                    {stemmed && <Stem />}
                    {about}
                  </div>
                )}
                {resolved && look === 'quiet' && (
                  <div className="flex w-full pb-1 pl-8 pr-2 pt-1.5">
                    <ResolvedOutcomePill by={resolved.by} note={resolved.note} at={resolved.at} />
                  </div>
                )}
                <Words faded={(!!resolved && (resolvedLook === 'faded' || resolvedLook === 'outcome' || resolvedLook === 'fadedfoot')) || quiet} stem={stemmed || look === 'short'} oneLine={foldedNow}>
                  {children}
                </Words>
                {resolved && look === 'short' && <ResolvedNode by={resolved.by} note={resolved.note} at={resolved.at} through={inThreadCard && lined} />}
                {resolved && look === 'answer' && (
                  <div className="w-full pb-2 pl-8 pr-2">
                    <ResolvedAnswer by={resolved.by} note={resolved.note} at={resolved.at} onReopen={readOnly ? undefined : onReopen} />
                  </div>
                )}
                {resolved?.note && (look === 'seal' || look === 'tab') && (
                  <div className="w-full pb-2 pl-8 pr-2">
                    <ResolutionNote by={resolved.by} note={resolved.note} look="under" />
                  </div>
                )}
                {resolved?.note && resolvedLook === 'name' && (
                  <div className="w-full pb-2 pl-8 pr-2">
                    <ResolutionNote by={resolved.by} note={resolved.note} look="under" />
                  </div>
                )}
              </>
            )}
            {!deleted && files && !foldedNow && (
              <div className={cn('relative flex w-full flex-wrap items-start gap-2 pb-2 pr-2', proposal.compact ? 'pl-7' : 'pl-8')}>
                {stemmed && <Stem />}
                {files}
              </div>
            )}
            {!foldedNow && (
              <Reactions
                reactions={reactions}
                refused={reactionRefused}
                readOnly={readOnly}
                lead={resolved && look === 'reaction' && <ResolvedReaction by={resolved.by} note={resolved.note} at={resolved.at} onReopen={readOnly ? undefined : onReopen} />}
                stem={stemmed}
                add={!reactOnHover || hovered}
                trailing={merge ? repliesRow : undefined}
              />
            )}
            {/* Proposal (round 2, preview): the latest reply in one line, while the thread is closed. */}
            {proposal.preview && latestReply && closed && !foldedNow && (
              <div className={cn('flex w-full min-w-0 items-center gap-1.5 pb-1.5 pr-2', proposal.compact ? 'pl-7' : 'pl-8')}>
                <Avatar size={16} src={latestReply.by.picture} alt={latestReply.by.name} className="shrink-0" />
                <p className="min-w-0 truncate text-caption text-text-secondary">
                  <span className="font-medium text-text-primary">{latestReply.by.name}</span> {latestReply.words}
                </p>
              </div>
            )}
            {resolved?.note && endedAbove && (
              // Who resolved it and the note, above the way into the replies; the check by the time says "Resolved" (Katerina, 1 November).
              <div className="relative w-full pb-1">
                {stemmed && <Stem />}
                <div className="-ml-2 w-[calc(100%+8px)]">
                  <EndedLine by={resolved.by} note={resolved.note} at={resolved.at} />
                </div>
              </div>
            )}
            {repliesRow && !merge && (
              <div className="relative w-full">
                {stemmed && <Stem />}
                {repliesRow}
              </div>
            )}
            {resolved && footLine && (
              // Proposal (round 2, foot): how it ended, in the thread's own words and look, under the comment.
              <div className="-ml-2 w-[calc(100%+8px)] pb-1">
                <ResolutionHistory events={[{ id: 'foot', by: resolved.by, note: resolved.note, at: resolved.at }]} />
              </div>
            )}
            {resolved && nodeAtFoot && <ResolvedNode by={resolved.by} note={resolved.note} at={resolved.at} line={look !== 'tabnode'} through={inThreadCard && lined} />}
          </div>
          </StemOnThreadLine.Provider>
        )}
        {resolved && look === 'tabfoot' && !isEditing && <ResolvedFoot by={resolved.by} note={resolved.note} at={resolved.at} />}
        {dotLine && (
          // One bar from the face to the dot, measured (useFaceLine): 2px, centred under the 24px face, 8px in.
          // Its top and height come from the measure: where the face ends and the dot stands are not known ahead.
          <span aria-hidden className="pointer-events-none absolute left-[19px] w-0.5 bg-border-default" style={{ top: dotLine.top, height: dotLine.height }} />
        )}
        {showStrip && (
          // Above everything on the card, a resolved tab included (Katerina, 31 October). Proposal (round 2, compact): on the card's top edge, off the words.
          <div className={cn('absolute z-10', proposal.compact ? '-top-3.5 right-2' : 'right-1 top-1')}>
            <ConversationActions
              options={reactions?.options}
              onReact={react}
              onPickerOpenChange={setPicking}
              onReply={reply}
              resolved={!!resolved}
              onResolve={onResolve && (() => setResolving(true))}
              onReopen={onReopen}
              more={
                offersMenu && (
                  <ConversationMenu
                    trigger={
                      <ToolbarButton tooltip="More actions" aria-label="More actions">
                        <IconDotsVertical size={16} stroke={1.5} />
                      </ToolbarButton>
                    }
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    resolved={!!resolved}
                    onResolve={onResolve && (() => setResolving(true))}
                    onReopen={onReopen}
                    onEdit={own && editor ? () => setEditing(true) : undefined}
                    onDelete={own && onDelete ? () => setDeleting(true) : undefined}
                  >
                    {menu}
                  </ConversationMenu>
                )
              }
            />
          </div>
        )}
      </Card>
      {deleting && onDelete && (
        <ConfirmDialog title="Delete this comment?" confirmLabel="Delete comment" destructive onConfirm={onDelete} onClose={() => setDeleting(false)}>
          <p>{deleteNote ?? 'It is deleted for everyone.'}</p>
          {replies && replies.count > 0 && <p>Its {replies.count === 1 ? 'reply stays' : `${replies.count} replies stay`}.</p>}
        </ConfirmDialog>
      )}
      {resolving && onResolve && (
        <ResolveDialog
          onCancel={() => setResolving(false)}
          onResolve={async (note) => {
            const ok = await onResolve(note)
            if (ok !== false) setResolving(false)
            return ok
          }}
        />
      )}
    </>
  )
}

/**
 * One reply in a thread: the same pieces as a comment, without replies of its own or Resolve. Its time is its link
 * when it has one. Peek's, moved with the conversation.
 */
export function ReplyCard(props: ReplyCardProps) {
  const { author, about, files, reactions, reactionRefused, isNew = false, urgent = false, own = false, editor, onDelete, deleteNote, menu, reactOnHover = false, className, children } = props
  const readOnly = props.readOnly ?? false
  const inThreadCard = useContext(InThreadCard)
  const proposal = useContext(ProposalLooks)
  // A reply is marked inside its thread card too, as today's edge is there.
  const fresh = freshLook(proposal.newLook, isNew, urgent, false)
  const subdued = props.subdued ?? inThreadCard
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useEditing(props.editing, props.onEditingChange)
  const isEditing = editing && !readOnly && !!editor
  const offersMenu = !!menu || (own && (!!editor || !!onDelete))
  const showStrip = hovered && !isEditing && !readOnly && (offersMenu || !!reactions?.onToggle)
  return (
    <>
      <Card
        // As a comment: no fill of its own at rest (Katerina, 1 November).
        fill="none"
        hover={readOnly || (!!proposal.cardLook && proposal.cardLook !== 'now') ? 'none' : 'fill'}
        quietUntilHover
        hovered={hovered}
        active={isEditing}
        attention={fresh.attention}
        className={cn('relative', fresh.className, className)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          if (picking || menuOpen) return
          setHovered(false)
        }}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (picking || menuOpen || e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setHovered(false)
        }}
      >
        {fresh.bar}
        {isEditing ? (
          <Editing author={author}>{editor(() => setEditing(false))}</Editing>
        ) : (
          <div className="flex flex-col items-start px-2 pt-2">
            {about && <div className="w-full pb-1.5 pr-2">{about}</div>}
            <Head author={author} time={props.time} timeHref={props.timeHref} edited={props.edited} isNew={isNew} urgent={urgent} />
            <Words>{children}</Words>
            {files && <div className={cn('flex w-full flex-wrap items-start gap-2 pb-2 pr-2', proposal.compact ? 'pl-7' : 'pl-8')}>{files}</div>}
            <Reactions reactions={reactions} refused={reactionRefused} readOnly={readOnly} add={!reactOnHover || hovered} />
          </div>
        )}
        {showStrip && (
          <ConversationActions
            className={cn('absolute z-10', proposal.compact ? '-top-3.5 right-2' : 'right-1 top-1')}
            options={reactions?.options}
            onReact={reactions?.onToggle}
            onPickerOpenChange={setPicking}
            more={
              offersMenu && (
                <ConversationMenu
                  trigger={
                    <ToolbarButton tooltip="More actions" aria-label="More actions">
                      <IconDotsVertical size={16} stroke={1.5} />
                    </ToolbarButton>
                  }
                  open={menuOpen}
                  onOpenChange={(next) => {
                    setMenuOpen(next)
                    if (!next) setHovered(false)
                  }}
                  onEdit={own && editor ? () => setEditing(true) : undefined}
                  onDelete={own && onDelete ? () => setDeleting(true) : undefined}
                >
                  {menu}
                </ConversationMenu>
              )
            }
          />
        )}
      </Card>
      {deleting && onDelete && (
        <ConfirmDialog title="Delete this reply?" confirmLabel="Delete reply" destructive onConfirm={onDelete} onClose={() => setDeleting(false)}>
          <p>{deleteNote ?? 'It is deleted for everyone.'}</p>
        </ConfirmDialog>
      )}
    </>
  )
}
