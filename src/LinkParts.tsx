/**
 * The small parts every link widget is built from: the icon for what a link
 * stands for, a status as its shape, progress as a ring, the conversation
 * count with its unread dot, and the pickers. LinkChip, LinkRow and LinkCard
 * place them; an app may place them too.
 */
import { IconCircle, IconCircleCheck, IconCircleDashed, IconCircleHalf2, IconCircleX, IconFileText, IconMessage2 } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { cn } from './cn'
import { KindIcon } from './KindIcon'
import { Link } from './Link'
import { chosenOf, type LinkedConversation, type LinkedKind, type LinkedPicker, type LinkedStatus, type StatusColour } from './linked'
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

/** A key, the way people say it ("ABC-2"): before the title, quieter than it. */
export function LinkKey({ children }: { children: string }) {
  return <span className="shrink-0 text-caption tabular-nums text-text-muted">{children}</span>
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
      <span className="inline-flex shrink-0 items-center gap-1 text-caption tabular-nums text-text-secondary">
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
 * conversation.
 */
export function CommentCount({ conversation, noun = 'comments' }: { conversation: LinkedConversation; noun?: string }) {
  const { count, href, unread = false } = conversation
  return (
    <span className={cn('relative z-10 -mx-1 inline-flex shrink-0 rounded-sm px-1 text-caption tabular-nums hover:bg-bg-active', unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>
      <Link href={href} variant="plain" className="inline-flex items-center gap-1">
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
    <span className="flex h-6 min-w-0 items-center gap-2 text-caption text-text-secondary">
      {status &&
        (statusWords ? (
          <span className="inline-flex shrink-0 items-center gap-1">
            {statusNow?.colour && <StatusIcon colour={statusNow.colour} />}
            {statusNow?.label ?? 'No status'}
          </span>
        ) : (
          <Select
            size="small"
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
