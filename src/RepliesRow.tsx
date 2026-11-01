import { IconChevronRight, IconMessage2 } from '@tabler/icons-react'
import { AvatarGroup } from './AvatarGroup'
import { Chip } from './Chip'
import { useContext } from 'react'
import { cn } from './cn'
import { TIME_CLASSES } from './looks'
import { ProposalLooks } from './threadCard'

export interface RepliesRowProps {
  /** How many replies. */
  count: number
  /** Who replied: their faces. */
  faces?: readonly { name: string; picture?: string }[]
  /** The last reply's time, in the app's words. */
  last?: string
  /** "1 new": a reply you have not read. */
  isNew?: boolean
  /** The "1 new" chip in the warning colour, for an urgent thread. */
  urgent?: boolean
  /** Opens the thread. Absent, the row only says how many (the card around it opens the thread). */
  onOpen?: () => void
  /** Its thread is open under it, in one column: the chevron turns down and the row stays marked; a press closes it (Katerina, 31 October). */
  open?: boolean
  /** Proposal (comments panel, round 2, compact): no row of its own, to stand on the reactions' row. */
  bare?: boolean
}

const ROW_CLASSES = 'flex w-full items-center gap-2 pb-1.5 pl-8 pr-2'
/** Open: the row keeps the look a pointer gives it, so it reads as the thread's open way in. */
const OPEN_CLASSES = 'border-accent-outline bg-accent-wash'
const QUIET_BOX_CLASSES = 'group/replies flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors'
const BOX_CLASSES =
  'group/replies flex shrink-0 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-accent-outline hover:bg-accent-wash'

/**
 * The way into a thread, under its comment: who replied, "2 replies", the last reply's time, and "1 new" until it is
 * read. Peek's, moved with the conversation; in every app the row a thread opens from, the same in every theme
 * (Katerina, 31 October), each in its own colours.
 */
export function RepliesRow({ count, faces, last, isNew = false, urgent = false, onOpen, open = false, bare = false }: RepliesRowProps) {
  const row = bare ? 'flex items-center gap-2' : ROW_CLASSES
  // Round 3's quieter card: no edge or wash on hover or open; the words and the chevron say it.
  const cardLook = useContext(ProposalLooks).cardLook
  const quiet = !!cardLook && cardLook !== 'now'
  const box = quiet ? QUIET_BOX_CLASSES : BOX_CLASSES
  const withFaces = !!faces && faces.length > 0
  const label = `${count} ${count === 1 ? 'reply' : 'replies'}`
  const inner = (
    <>
      {withFaces && (
        <span className="flex shrink-0 items-center">
          <AvatarGroup size={18} members={faces.map((f) => ({ name: f.name, picture: f.picture }))} />
        </span>
      )}
      <IconMessage2
        size={16}
        stroke={1.5}
        className={cn(
          'shrink-0 text-text-interactive transition-colors group-hover/replies:text-text-primary',
          withFaces && 'hidden',
        )}
      />
      <span className="text-chip font-medium text-text-interactive transition-colors group-hover/replies:text-text-primary">
        {label}
      </span>
      {last && <span className={cn('mt-px text-small leading-3 text-text-muted', TIME_CLASSES)}>{last}</span>}
      {/* Turned down while its thread is open, as a tree row's chevron is. */}
      <IconChevronRight
        size={12}
        stroke={2}
        className={cn('transition-all group-hover/replies:text-text-primary', open ? 'rotate-90 text-text-primary' : 'text-text-muted group-hover/replies:translate-x-0.5')}
      />
    </>
  )
  const chip = isNew && (
    <>
      <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-text-muted" />
      <Chip type={urgent ? 'warning' : 'brand'} label="1 new" />
    </>
  )
  if (!onOpen) {
    return (
      <div className={row}>
        <div className={box}>{inner}</div>
        {chip}
      </div>
    )
  }
  return (
    // @estiva-escape(no-raw-element): the row is the thread's way in, Peek's replies row; no kit button takes a face stack, a count, a time and the new chip in one press
    <button type="button" className={cn(row, 'cursor-pointer text-left')} onClick={onOpen} aria-expanded={open} aria-label={`${label}, ${open ? 'close' : 'open'} the thread`} data-interactive>
      <span className={cn(box, open && !quiet && OPEN_CLASSES)}>{inner}</span>
      {chip}
    </button>
  )
}
