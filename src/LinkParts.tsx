/**
 * The small parts every link widget is built from: the icon for what a link
 * stands for, a status as its shape, progress as a ring, the conversation
 * count with its unread dot, and the pickers. LinkChip, LinkRow and LinkCard
 * place them; an app may place them too.
 */
import { useContext } from 'react'
import { IconCircle, IconCircleCheck, IconCircleDashed, IconCircleHalf2, IconCircleX, IconFileText, IconMessage2 } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { cn } from './cn'
import { KindIcon } from './KindIcon'
import { Link } from './Link'
import { chosenOf, inTheBox, type Linked, type LinkedConversation, type LinkedKind, type LinkedPicker, type LinkedStatus, type StatusColour } from './linked'
import { TYPE_TILE_CLASSES } from './looks'
import { Select } from './Select'
import { WithTooltip } from './Tooltip'
import { UnreadDot } from './UnreadDot'

const STATUS_ICON: Record<StatusColour, { Icon: typeof IconCircle; tone: string }> = {
  neutral: { Icon: IconCircleDashed, tone: 'text-text-secondary' },
  blue: { Icon: IconCircleHalf2, tone: 'text-info-default' },
  green: { Icon: IconCircleCheck, tone: 'text-success-default' },
  muted: { Icon: IconCircleX, tone: 'text-text-muted' },
}

/** A status's shape alone, beside words that already name it. */
function StatusIcon({ colour }: { colour: StatusColour }) {
  const { Icon, tone } = STATUS_ICON[colour]
  return <Icon size={14} stroke={1.5} className={cn('shrink-0', tone)} aria-hidden />
}

/** A status as its shape, which reads without colour; its words on hover and to a screen reader. */
export function StatusMark({ status }: { status: LinkedStatus }) {
  return (
    <WithTooltip label={status.label} inline wrapperClassName="inline-flex shrink-0 items-center">
      <StatusIcon colour={status.colour} />
      <span className="sr-only">{status.label}</span>
    </WithTooltip>
  )
}

/** The icon for what a link stands for. A page of text has its own. */
export function LinkedIcon({ kind, size = 16, tone = 'secondary' }: { kind: LinkedKind; size?: 14 | 16; tone?: 'secondary' | 'inherit' }) {
  if (kind === 'page') return <IconFileText size={size} stroke={1.5} className={cn('shrink-0', tone === 'secondary' && 'text-text-secondary')} aria-hidden />
  return <KindIcon kind={kind} size={size} tone={tone} />
}

/**
 * A key, the way people say it ("ABC-2"): before the title, quieter than it. `secondary` is a step brighter, for a chip
 * in a sentence, where the muted grey on the chip's fill was hard to read (Katerina, 29 Oct).
 */
export function LinkKey({ children, tone = 'muted' }: { children: string; tone?: 'muted' | 'secondary' }) {
  return <span className={cn('shrink-0 text-caption tabular-nums', tone === 'secondary' ? 'text-text-secondary' : 'text-text-muted')}>{children}</span>
}

/** The kinds the apps have, in the words they use for them (Katerina, 29 Oct: "topic, project, issue, page or document"). */
const KIND_NOUN: Partial<Record<LinkedKind, string>> = { issue: 'Issue', project: 'Project', topic: 'Topic', page: 'Document' }

/** What it is, in a word: the app's own word, else its kind's. Another app's file, or words a person wrote, have none. */
export function kindNounOf(linked: Pick<Linked, 'kind' | 'noun'>): string | undefined {
  return linked.noun ?? KIND_NOUN[linked.kind]
}

/** The 36px tile a link's kind sits in, as a file's type does in AttachmentCard; words a person wrote show their face. */
export function LinkTile({ kind, author }: { kind: LinkedKind; author?: { name: string; picture?: string } }) {
  if (author) return <Avatar name={author.name} src={author.picture} size={36} />
  return (
    <span className={TYPE_TILE_CLASSES}>
      <LinkedIcon kind={kind} />
    </span>
  )
}

/** Progress as a small ring, with the count beside it. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const size = 16
  const stroke = 2
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const share = total > 0 ? Math.min(done, total) / total : 0
  return (
    <WithTooltip label={`${done} of ${total} done`} inline wrapperClassName="inline-flex shrink-0">
      {/* 6px between the ring and its count (Katerina, 29 Oct: 4px read as one mark). */}
      {/* The count in the small size: a mark beside the ring, not words (Katerina, 29 Oct). */}
      <span className="inline-flex shrink-0 items-center gap-1.5 text-small tabular-nums text-text-secondary">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border-default" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * share} ${c}`} className="stroke-success-default" />
        </svg>
        {done}/{total}
      </span>
    </WithTooltip>
  )
}

/**
 * The count of what was said, a link to where it is read. With something
 * unread there the words are brighter and a dot follows. It sits above a
 * row's covering link, so the row opens the thing and the count its
 * conversation. In a box being written in it is the count alone, no link: the
 * draft is not left for it (Katerina, 30 Oct).
 */
export function CommentCount({ conversation, noun = 'comments' }: { conversation: LinkedConversation; noun?: string }) {
  const { count, href, unread = false } = conversation
  const boxed = useContext(inTheBox)
  if (boxed) {
    return (
      <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 px-1.5 text-small tabular-nums', unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>
        <IconMessage2 size={14} stroke={1.5} aria-hidden />
        {count}
        <span className="sr-only">{unread ? `${noun}, unread` : noun}</span>
        {unread && <UnreadDot className="h-auto w-auto" />}
      </span>
    )
  }
  return (
    /*
     * A small button's shape, as Button's small one is: 24px tall like the pickers beside it, 6px each side, its corners
     * and its hover. It was 15px tall, 1px above and below its icon and 4px at the sides, and read as squashed
     * (Katerina, 29 Oct). The link fills the box, so all of it opens the conversation. The box keeps its own room:
     * its 6px and the row's gap part it from the faces and the ring beside it (14px to its icon). The count is in
     * the small size (10px).
     */
    <span className={cn('relative z-10 inline-flex h-6 shrink-0 rounded-md text-small tabular-nums transition-colors hover:bg-bg-hover', unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>
      <Link href={href} variant="plain" className="flex h-full items-center gap-1 px-1.5">
        <IconMessage2 size={14} stroke={1.5} aria-hidden />
        {count}
        <span className="sr-only">{unread ? `${noun}, unread — open the conversation` : `${noun} — open the conversation`}</span>
        {unread && <UnreadDot className="h-auto w-auto" />}
      </Link>
    </span>
  )
}

export interface LinkPickersProps {
  status?: LinkedPicker
  owner?: LinkedPicker
  /** The owner's word: "Assignee", "Lead". */
  ownerLabel?: string
  /** Draws the values as words even where they could be changed: the hover preview. */
  readOnly?: boolean
}

/**
 * A status and an owner, where the reader can change them from the card. A
 * picker whose app passed no `onChange` reads as words in the same place: the
 * reader may not change it. The hover preview is always words.
 */
export function LinkPickers({ status, owner, ownerLabel = 'Owner', readOnly = false }: LinkPickersProps) {
  const statusNow = chosenOf(status)
  const ownerNow = chosenOf(owner)
  const statusWords = status && (readOnly || !status.onChange)
  const ownerWords = owner && (readOnly || !owner.onChange)
  return (
    // As words, 16px apart, so the status and the person read as two things; as boxed pickers their borders already part them (Katerina, 29 Oct).
    // Boxed, they are see-through as the card they sit in is: a field's fill was a dark hole on a selected message (Katerina, 30 Oct).
    <span className={cn('flex h-6 min-w-0 items-center text-caption text-text-secondary', statusWords || ownerWords ? 'gap-4' : 'gap-2')}>
      {status &&
        (statusWords ? (
          <span className="inline-flex shrink-0 items-center gap-1">
            {statusNow?.colour && <StatusIcon colour={statusNow.colour} />}
            {statusNow?.label ?? 'No status'}
          </span>
        ) : (
          <Select
            size="small"
            fill="wash"
            className="w-auto"
            value={status.value ?? ''}
            onChange={(value) => status.onChange?.(value)}
            ariaLabel="Status"
            options={status.options.map((option) => ({ value: option.value, label: option.label, leading: option.colour && <StatusIcon colour={option.colour} /> }))}
          />
        ))}
      {owner &&
        (ownerWords ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <Avatar name={ownerNow?.label} src={ownerNow?.picture} size={16} />
            <span className="truncate">{ownerNow?.label ?? 'Unassigned'}</span>
          </span>
        ) : (
          <Select
            size="small"
            fill="wash"
            className="w-auto"
            value={owner.value ?? ''}
            placeholder="Unassigned"
            onChange={(value) => owner.onChange?.(value)}
            ariaLabel={ownerLabel}
            options={owner.options.map((option) => ({ value: option.value, label: option.label, leading: <Avatar name={option.label} src={option.picture} size={16} /> }))}
          />
        ))}
    </span>
  )
}
