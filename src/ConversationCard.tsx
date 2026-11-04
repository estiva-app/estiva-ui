import { useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { IconArrowNarrowRight, IconCircleCheck, IconDotsVertical } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { Card } from './Card'
import { cn } from './cn'
import { ConfirmDialog } from './ConfirmDialog'
import { ConversationActions } from './ConversationActions'
import { ConversationMenu } from './ConversationMenu'
import { repliesDrawn } from './conversationScroll'
import { EditedMarker } from './EditedMarker'
import { FieldLine } from './Field'
import { Link } from './Link'
import { MetaText } from './MetaText'
import { ReactionRow, type ReactionRowProps } from './ReactionRow'
import { RepliesRow, type RepliesRowProps } from './RepliesRow'
import { ResolveDialog } from './ResolveDialog'
import { exactTime, InConversationItem, InThreadCard, momentOf, SHOWN_CLASSES, useFaceLine } from './threadCard'
import { ToolbarButton } from './Toolbar'
import { WithTooltip } from './Tooltip'
import { UnreadDot } from './UnreadDot'
import { UrgentMark } from './UrgentMark'

/** Who wrote it: a name, and a picture when there is one (else the face draws initials). */
export interface ConversationPerson {
  name: string
  picture?: string
  /** An agent: its face is a robot, as Avatar's `bot`. */
  bot?: boolean
}

/** What a comment and a reply share. */
export interface ConversationEntryProps {
  author: ConversationPerson
  /** When it was written, in the app's words ("11:08 AM"). */
  time: ReactNode
  /** When it was written, as a moment (ms since 1970): the time then says the exact date and time under the pointer. */
  at?: number
  /** A link to it: the time is then the link, "Link to this", as a reply's is. */
  timeHref?: string
  /** The time's tooltip when it is a link, in the app's words: "Link to this" by default; Peek's "Link to this message". */
  timeLabel?: string
  /** When it was last edited, in the app's words for the tooltip ("Edited 11:20 AM"): draws "(edited)". */
  edited?: string
  /** The words, as the app draws them: text, mentions, links, attached cards, quoted blocks. */
  children: ReactNode
  /** What it is about, a `QuotedLine` for a comment on a part of the page: under the name, above the words. */
  about?: ReactNode
  /** Pictures and files: `AttachmentCard`s, laid out under the words. */
  files?: ReactNode
  /** Its reactions: the kit's `ReactionRow`. With `onToggle`, the strip offers React too. */
  reactions?: ReactionRowProps
  /** Why the last reaction was refused, in plain words: said under the reactions. */
  reactionRefused?: string
  /** Not read yet: the dot, or the urgent mark with `urgent`, and the card's edge in the theme's colour. */
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
  /**
   * The app's own words under the delete question, what deleting does there, in place of the kit's: "It is deleted for
   * everyone.", and on a comment how many replies stay. A string is one paragraph; a node is drawn as given.
   */
  deleteNote?: ReactNode
  /**
   * Why the last delete was refused, in plain words: said under the question, while it stays open (`onDelete` answered
   * `false`). Only in the question it answered: one opened again says nothing until its own Delete is refused.
   */
  deleteRefused?: string
  /** The app's own rows in the ⋯ menu, after Resolve: `MenuItem`s. */
  menu?: ReactNode
  /** The app's own rows in the ⋯ menu after Edit, before Delete: Peek's "View details". */
  menuAfter?: ReactNode
  /** A heading over the menu's first rows, in the app's words: Peek's "Utilities". */
  menuLabel?: string
  /** Edit's words in the ⋯ menu: "Edit" by default; Peek's "Edit message". */
  editLabel?: string
  /** Delete's words in the ⋯ menu: "Delete" by default; Ship's "Delete message". The question's button says `noun`'s. */
  deleteLabel?: string
  /** The ⋯ button's name and tooltip: "More actions" by default; Ship's "Message actions". */
  moreLabel?: string
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
   * Resolved, by whom, with what note and when (`at`, in the app's words): "✓ Resolved" by the time, who and the note on
   * hover; "Person two → the note · time" above the replies row. Nothing of the comment is hidden: its words, cards,
   * files and reactions stay (Katerina, 1 November: nothing folds, in any app).
   */
  resolved?: { by: string; note?: string; at?: string }
  /**
   * What the comment is called in the delete question: "Delete this comment?" by default. A direct message says
   * `message` (Katerina, 1 November: "comment" reads wrong in a private chat).
   */
  noun?: string
  /** Beside Resolve in the ⋯ menu, how the app's box resolves too, as its key hint: Peek's "->". */
  resolveHint?: string
  /** Resolve, with the note written in the dialog the card opens. Offered on the strip and in the menu. */
  onResolve?: (note: string) => Promise<boolean | void> | boolean | void
  /**
   * Why the last resolve was refused, in plain words: said under the note, while the dialog stays open (`onResolve`
   * answered `false`). Only in the dialog it answered: one opened again says nothing until its own Resolve is refused.
   */
  resolveRefused?: string
  onReopen?: () => void
  /** The one open beside its thread. */
  selected?: boolean
  /** A press on the card: its thread opens. */
  onClick?: () => void
}

export interface ReplyCardProps extends ConversationEntryProps {
  /** Its id, on the card as `data-reply-id`: what a link to it shows (`showInConversation`), and what `Thread` watches to say it was seen. */
  id?: string
  /** What the reply is called in the delete question: "Delete this reply?" by default; Ship's `message`. */
  noun?: string
}

/**
 * When it was written: the app's words, and with its moment the exact date and time under the pointer (B10: as Peek's
 * rows of another app's comments always said it, now on every comment and reply). A time that is a link says the exact
 * time, then where the link goes.
 */
function When({ time, at: given, timeHref, timeLabel = 'Link to this' }: Pick<ConversationEntryProps, 'time' | 'at' | 'timeHref' | 'timeLabel'>) {
  const at = momentOf(given)
  const exact = at === undefined ? undefined : exactTime(at)
  const said = at === undefined ? time : <time dateTime={new Date(at).toISOString()}>{time}</time>
  if (timeHref) {
    return (
      <WithTooltip label={exact ? `${exact} · ${timeLabel}` : timeLabel} wrapperClassName="shrink-0">
        <MetaText className="contents">
          <Link href={timeHref} variant="quiet" data-interactive>
            {said}
          </Link>
        </MetaText>
      </WithTooltip>
    )
  }
  // Drawn as Peek's rows of another app's comments drew it: the tooltip's own box round the time, inside its words' look.
  return <MetaText className="shrink-0">{exact ? <WithTooltip label={exact}>{said}</WithTooltip> : time}</MetaText>
}

/** The face, the name, the time and "(edited)", with the new mark at the far right. `meta`: after "(edited)". */
function Head({ author, time, at, timeHref, timeLabel, edited, isNew, urgent, meta }: Pick<ConversationEntryProps, 'author' | 'time' | 'at' | 'timeHref' | 'timeLabel' | 'edited' | 'isNew' | 'urgent'> & { meta?: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span data-face className="relative flex shrink-0">
          <Avatar size={24} src={author.picture} alt={author.name} bot={author.bot} />
        </span>
        <span className="min-w-0 truncate text-body-2-strong text-text-primary">{author.name}</span>
        <When time={time} at={at} timeHref={timeHref} timeLabel={timeLabel} />
        <EditedMarker edited={edited} />
        {meta}
      </div>
      {isNew && (urgent ? <UrgentMark /> : <UnreadDot />)}
    </div>
  )
}

/** New or urgent: the card's edge in the theme's accent or warning outline. Inside a thread card, the outer card is the edge, and the dot alone says it. */
function attentionOf(fresh: boolean, urgent: boolean, inThreadCard: boolean) {
  if (!fresh || inThreadCard) return undefined
  return urgent ? ('warning' as const) : ('accent' as const)
}

/**
 * Who resolved it and the note (Katerina, 1 November), "Person two → Keeping the first one. · 12:30 PM", in the
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

/** After the time: a green check and "Resolved"; who, when and the note on hover. */
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
function Words({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full break-words pb-2 pl-8 pr-2 pt-1">
      <div className="flex flex-col gap-2 text-body-2 text-text-secondary">{children}</div>
    </div>
  )
}

function Reactions({ reactions, refused, readOnly }: { reactions?: ReactionRowProps; refused?: string; readOnly: boolean }) {
  if ((!reactions || reactions.reactions.length === 0) && !refused) return null
  return (
    <div className="relative flex w-full flex-col gap-1 pb-2 pl-8 pt-1">
      {reactions && <ReactionRow {...reactions} onToggle={readOnly ? undefined : reactions.onToggle} />}
      {refused && <FieldLine tone="error">Not reacted: {refused}.</FieldLine>}
    </div>
  )
}

/** Being edited: the face beside the app's box, which holds the words, the files and the cards. */
function Editing({ author, children }: { author: ConversationPerson; children: ReactNode }) {
  return (
    <div className="p-2">
      <div className="flex items-start gap-2">
        <Avatar size={24} src={author.picture} alt={author.name} bot={author.bot} className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

/**
 * After its picker or its menu closes, a card keeps its strip only while it is still pointed at, or reached by the
 * keyboard. A pointer that left while they were open sent the card no leave, and the strip stayed (the review, 1 November).
 */
function stillHere(root: HTMLElement | null) {
  if (!root) return false
  try {
    return root.matches(':hover') || root.querySelector(':focus-visible') !== null
  } catch {
    return root.matches(':hover')
  }
}

/**
 * The card's questions, Delete and Resolve, each mounted only while it is open. The app's refusal is said only once
 * this opening's own press was answered: the app keeps the refusal in its own state and is not told when a question
 * closes, so the next one opened already saying the last one's "Could not … Try again." (Leaf's adoption review,
 * 4 November).
 */
function DeleteQuestion({ noun, onDelete, refused, onClose, children }: { noun: string; onDelete: NonNullable<ConversationEntryProps['onDelete']>; refused?: string; onClose: () => void; children: ReactNode }) {
  const [answered, setAnswered] = useState(false)
  return (
    <ConfirmDialog
      title={`Delete this ${noun}?`}
      confirmLabel={`Delete ${noun}`}
      destructive
      onConfirm={async () => {
        const ok = await onDelete()
        setAnswered(true)
        return ok
      }}
      onClose={onClose}
      refused={answered ? refused : undefined}
    >
      {children}
    </ConfirmDialog>
  )
}

function ResolveQuestion({ onResolve, refused, onClose }: { onResolve: NonNullable<ConversationCardProps['onResolve']>; refused?: string; onClose: () => void }) {
  const [answered, setAnswered] = useState(false)
  return (
    <ResolveDialog
      refused={answered ? refused : undefined}
      onCancel={onClose}
      onResolve={async (note) => {
        const ok = await onResolve(note)
        setAnswered(true)
        if (ok !== false) onClose()
        return ok
      }}
    />
  )
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
  const { author, about, files, reactions, reactionRefused, isNew = false, urgent = false, own = false, editor, deleted = false, replies, onReply, resolved, noun = 'comment', onResolve, resolveHint, resolveRefused, onReopen, selected, onClick, onDelete, deleteNote, deleteRefused, menu, menuAfter, menuLabel, editLabel, deleteLabel, moreLabel = 'More actions', className, children } = props
  const readOnly = (props.readOnly ?? false) || deleted
  const inThreadCard = useContext(InThreadCard)

  // In a ConversationLayout: a press opens its thread (in one column, a second closes it), Reply opens it, its replies
  // row says it is open, and beside it is marked. What the app passes wins.
  const item = useContext(InConversationItem)
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useEditing(props.editing, props.onEditingChange)
  const isEditing = editing && !readOnly && !!editor
  const overlay = menuOpen || picking || resolving || deleting
  const resolves = resolved ? onReopen : onResolve
  // Open under in one column, the face's line runs down to its thread, with replies or with only the box (Katerina, 1 November).
  const lined = inThreadCard
  // Resolved with a note: the face's line runs down to the resolved line's dot, closed too (Katerina, 1 November), one
  // bar measured from the face to the dot. Open in a ConversationLayout, the layout draws the whole line, face to the
  // thread's last reply, so the card draws no pieces of it; elsewhere (a card on its own) the pieces stay.
  const toDot = !lined && !!resolved?.note && !isEditing
  const root = useRef<HTMLDivElement>(null)
  const dotLine = useFaceLine(root, toDot, true)
  // Once its picker or menu has closed: the strip only if the card is still pointed at.
  const settle = () => requestAnimationFrame(() => setHovered(stillHere(root.current)))
  // The ⋯ menu only when it has a row to show: Resolve or Reopen, the app's rows, or Edit and Delete on your own.
  const offersMenu = !!resolves || !!menu || !!menuAfter || (own && (!!editor || !!onDelete))
  const showStrip = hovered && !isEditing && !readOnly
  const react = reactions?.onToggle
  // Read-only with no replies, there is nothing to open: no box to write in, no thread to read (Peek's way, Katerina, 1 November).
  const press = onClick ?? (readOnly && !replies?.count ? undefined : item?.toggle)
  const reply = onReply ?? item?.show
  const marked = selected ?? (item && !item.under ? item.open : undefined)
  const under = !!item?.under
  const repliesRow = replies && replies.count > 0 && (
    <RepliesRow {...replies} onOpen={replies.onOpen ?? (under ? item?.toggle : undefined)} open={replies.open ?? (under && !!item?.open)} urgent={urgent} />
  )
  return (
    <>
      <Card
        ref={root}
        // No fill of its own at rest, in any theme: it sits on its column's colour and lights up on hover. Peek's and
        // Leaf's columns are their surface, so nothing changes there; Ship's is its page base, where the surface fill
        // showed as a box round every comment (Katerina, 1 November: no background in Ship).
        fill="none"
        // Read-only with nothing to open: nothing on hover.
        hover={readOnly && !press ? 'none' : 'fill'}
        quietUntilHover
        hovered={hovered}
        selected={marked}
        active={isEditing}
        attention={attentionOf(isNew || (replies?.newCount ?? (replies?.isNew ? 1 : 0)) > 0, urgent, inThreadCard)}
        className={cn('relative', className)}
        // A press opens its thread, wherever it lands on the card but for what acts by itself (Card's `onPress`). Before,
        // the whole reactions row and the strip stopped every press, so a press beside the reactions did nothing
        // (Katerina, 31 October). Not while its menu or picker is open: a press there is theirs.
        onPress={press && !isEditing && !overlay ? press : undefined}
        // Tab stops on it, which shows its strip, and Enter or Space opens it — and it stays a Tab stop while its menu is
        // open, so focus has somewhere to come back to. Before, a comment with nothing focusable in it (no replies, no
        // link) could not be opened without a pointer.
        tabIndex={press && !isEditing ? 0 : undefined}
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
        {isEditing ? (
          <Editing author={author}>{editor(() => setEditing(false))}</Editing>
        ) : (
          <div data-comment-body className="flex flex-col items-start px-2 pt-2">
            {deleted ? (
              <>
                {/* What it was on stays, where the words start: its replies still talk about that place (Leaf's; Katerina, 3 November: every app). */}
                {!!about && <div className="relative w-full pl-8 pr-2">{about}</div>}
                {/* 4px under it, as the words sit under it on a comment that is there. */}
                <p className={cn('w-full pb-2 pl-8 pr-2 text-caption italic text-text-muted', !!about && 'pt-1')}>This comment was deleted.</p>
              </>
            ) : (
              <>
                <Head
                  author={author}
                  time={props.time}
                  at={props.at}
                  timeHref={props.timeHref}
                  timeLabel={props.timeLabel}
                  edited={props.edited}
                  isNew={isNew}
                  urgent={urgent}
                  meta={resolved && <ResolvedCheck by={resolved.by} note={resolved.note} at={resolved.at} />}
                />
                {!!about && (
                  // Under the name, above the words (Katerina, 1 November).
                  <div className="relative w-full pl-8 pr-2 pt-0.5">{about}</div>
                )}
                <Words>
                  {children}
                </Words>
              </>
            )}
            {!deleted && files && (
              <div className="relative flex w-full flex-wrap items-start gap-2 pb-2 pl-8 pr-2">{files}</div>
            )}
            <Reactions reactions={reactions} refused={reactionRefused} readOnly={readOnly} />
            {resolved?.note && (
              // Who resolved it and the note, above the way into the replies; the check by the time says "Resolved" (Katerina, 1 November).
              <div className="relative w-full pb-1">
                <div className="-ml-2 w-[calc(100%+8px)]">
                  <EndedLine by={resolved.by} note={resolved.note} at={resolved.at} />
                </div>
              </div>
            )}
            {repliesRow && <div className="relative w-full">{repliesRow}</div>}
          </div>
        )}
        {dotLine && (
          // One bar from the face to the dot, measured (useFaceLine): 2px, centred under the 24px face, 8px in.
          // Its top and height come from the measure: where the face ends and the dot stands are not known ahead.
          <span aria-hidden className="pointer-events-none absolute left-[19px] w-0.5 bg-border-default" style={{ top: dotLine.top, height: dotLine.height }} />
        )}
        {showStrip && (
          <div className="absolute right-1 top-1 z-10">
            <ConversationActions
              options={reactions?.options}
              onReact={react}
              onPickerOpenChange={(open) => {
                setPicking(open)
                if (!open) settle()
              }}
              onReply={reply}
              resolved={!!resolved}
              onResolve={onResolve && (() => setResolving(true))}
              onReopen={onReopen}
              more={
                offersMenu && (
                  <ConversationMenu
                    trigger={
                      <ToolbarButton tooltip={moreLabel} aria-label={moreLabel}>
                        <IconDotsVertical size={16} stroke={1.5} />
                      </ToolbarButton>
                    }
                    open={menuOpen}
                    onOpenChange={(open) => {
                      setMenuOpen(open)
                      if (!open) settle()
                    }}
                    resolved={!!resolved}
                    onResolve={onResolve && (() => setResolving(true))}
                    onReopen={onReopen}
                    resolveHint={resolveHint}
                    label={menuLabel}
                    onEdit={own && editor ? () => setEditing(true) : undefined}
                    editLabel={editLabel}
                    after={menuAfter}
                    onDelete={own && onDelete ? () => setDeleting(true) : undefined}
                    deleteLabel={deleteLabel}
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
        <DeleteQuestion noun={noun} onDelete={onDelete} refused={deleteRefused} onClose={() => setDeleting(false)}>
          {deleteNote !== undefined ? (
            typeof deleteNote === 'string' ? <p>{deleteNote}</p> : deleteNote
          ) : (
            <>
              <p>It is deleted for everyone.</p>
              {replies && replies.count > 0 && <p>Its {replies.count === 1 ? 'reply stays' : `${replies.count} replies stay`}.</p>}
            </>
          )}
        </DeleteQuestion>
      )}
      {resolving && onResolve && <ResolveQuestion onResolve={onResolve} refused={resolveRefused} onClose={() => setResolving(false)} />}
    </>
  )
}

/**
 * One reply in a thread: the same pieces as a comment, without replies of its own or Resolve. Its time is its link
 * when it has one. Peek's, moved with the conversation.
 */
export function ReplyCard(props: ReplyCardProps) {
  const { id, author, about, files, reactions, reactionRefused, isNew = false, urgent = false, own = false, editor, onDelete, deleteNote, deleteRefused, menu, menuAfter, menuLabel, editLabel, deleteLabel, moreLabel = 'More actions', noun = 'reply', className, children } = props
  const readOnly = props.readOnly ?? false
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useEditing(props.editing, props.onEditingChange)
  const isEditing = editing && !readOnly && !!editor
  const offersMenu = !!menu || !!menuAfter || (own && (!!editor || !!onDelete))
  const showStrip = hovered && !isEditing && !readOnly && (offersMenu || !!reactions?.onToggle)
  const root = useRef<HTMLDivElement>(null)
  const settle = () => requestAnimationFrame(() => setHovered(stillHere(root.current)))
  // In a Thread beside, a reply counts itself as it is first drawn: a new one takes the thread to its newest.
  const drawn = useContext(repliesDrawn)
  useLayoutEffect(() => {
    if (drawn) drawn.added += 1
  }, [drawn])
  return (
    <>
      <Card
        ref={root}
        // As a comment: no fill of its own at rest (Katerina, 1 November).
        fill="none"
        hover={readOnly ? 'none' : 'fill'}
        quietUntilHover
        hovered={hovered}
        active={isEditing}
        // A reply is marked inside its thread card too.
        attention={attentionOf(isNew, urgent, false)}
        data-reply-id={id}
        className={cn('relative', SHOWN_CLASSES, className)}
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
        {isEditing ? (
          <Editing author={author}>{editor(() => setEditing(false))}</Editing>
        ) : (
          <div className="flex flex-col items-start px-2 pt-2">
            <Head author={author} time={props.time} at={props.at} timeHref={props.timeHref} timeLabel={props.timeLabel} edited={props.edited} isNew={isNew} urgent={urgent} />
            {/* As on a comment: under the name, above the words. */}
            {about && <div className="w-full pl-8 pr-2 pt-0.5">{about}</div>}
            <Words>{children}</Words>
            {files && <div className="flex w-full flex-wrap items-start gap-2 pb-2 pl-8 pr-2">{files}</div>}
            <Reactions reactions={reactions} refused={reactionRefused} readOnly={readOnly} />
          </div>
        )}
        {showStrip && (
          <ConversationActions
            className="absolute right-1 top-1 z-10"
            options={reactions?.options}
            onReact={reactions?.onToggle}
            onPickerOpenChange={(open) => {
              setPicking(open)
              if (!open) settle()
            }}
            more={
              offersMenu && (
                <ConversationMenu
                  trigger={
                    <ToolbarButton tooltip={moreLabel} aria-label={moreLabel}>
                      <IconDotsVertical size={16} stroke={1.5} />
                    </ToolbarButton>
                  }
                  open={menuOpen}
                  onOpenChange={(next) => {
                    setMenuOpen(next)
                    if (!next) settle()
                  }}
                  label={menuLabel}
                  onEdit={own && editor ? () => setEditing(true) : undefined}
                  editLabel={editLabel}
                  after={menuAfter}
                  onDelete={own && onDelete ? () => setDeleting(true) : undefined}
                  deleteLabel={deleteLabel}
                >
                  {menu}
                </ConversationMenu>
              )
            }
          />
        )}
      </Card>
      {deleting && onDelete && (
        <DeleteQuestion noun={noun} onDelete={onDelete} refused={deleteRefused} onClose={() => setDeleting(false)}>
          {deleteNote === undefined ? <p>It is deleted for everyone.</p> : typeof deleteNote === 'string' ? <p>{deleteNote}</p> : deleteNote}
        </DeleteQuestion>
      )}
    </>
  )
}
