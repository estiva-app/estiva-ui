import { IconChevronRight, IconMessage2 } from '@tabler/icons-react'
import { AvatarGroup } from './AvatarGroup'
import { Chip } from './Chip'
import { cn } from './cn'
import { TIME_CLASSES } from './looks'

export interface RepliesRowProps {
  /** How many replies. */
  count: number
  /** Who replied: their faces. */
  faces?: readonly { name: string; picture?: string; bot?: boolean }[]
  /** The last reply's time, in the app's words. */
  last?: string
  /** "1 new": a reply you have not read. */
  isNew?: boolean
  /** How many replies you have not read: "2 new", and the row's name says it too. Given, it decides over `isNew`; 0 is none. */
  newCount?: number
  /** The "1 new" chip in the warning colour, for an urgent thread. */
  urgent?: boolean
  /** Opens the thread. Absent, the row only says how many (the card around it opens the thread). */
  onOpen?: () => void
  /** Its thread is open under it, in one column: the chevron turns down and the row stays marked; a press closes it (Katerina, 31 October). */
  open?: boolean
}

const ROW_CLASSES = 'flex w-full items-center gap-2 pb-1.5 pl-8 pr-2'
/** Open: the row keeps the look a pointer gives it, so it reads as the thread's open way in. */
const OPEN_CLASSES = 'border-accent-outline bg-accent-wash'
const BOX_CLASSES =
  'group/replies flex shrink-0 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-accent-outline hover:bg-accent-wash'

/**
 * The way into a thread, under its comment: who replied, "2 replies", the last reply's time, and how many are new
 * ("2 new") until they are read. Peek's, moved with the conversation; in every app the row a thread opens from, the same in every theme
 * (Katerina, 31 October), each in its own colours.
 */
export function RepliesRow({ count, faces, last, isNew = false, newCount, urgent = false, onOpen, open = false }: RepliesRowProps) {
  const withFaces = !!faces && faces.length > 0
  const label = `${count} ${count === 1 ? 'reply' : 'replies'}`
  // How many are new: the app's count, or one for `isNew` (all an app without a count can say).
  const fresh = newCount ?? (isNew ? 1 : 0)
  // Its name says how many are new only with the app's count: with `isNew` alone it stays as it was.
  const name = newCount ? `${label}, ${newCount} new` : label
  const inner = (
    <>
      {withFaces && (
        <span className="flex shrink-0 items-center">
          <AvatarGroup size={18} members={faces.map((f) => ({ name: f.name, picture: f.picture, bot: f.bot }))} />
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
  const chip = fresh > 0 && (
    <>
      <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-text-muted" />
      <Chip type={urgent ? 'warning' : 'brand'} label={`${fresh} new`} />
    </>
  )
  if (!onOpen) {
    return (
      <div className={ROW_CLASSES}>
        <div className={BOX_CLASSES}>{inner}</div>
        {chip}
      </div>
    )
  }
  return (
    // @estiva-escape(no-raw-element): the row is the thread's way in, Peek's replies row; no kit button takes a face stack, a count, a time and the new chip in one press
    <button type="button" className={cn(ROW_CLASSES, 'cursor-pointer text-left')} onClick={onOpen} aria-expanded={open} aria-label={`${name}, ${open ? 'close' : 'open'} the thread`} data-interactive>
      <span className={cn(BOX_CLASSES, open && OPEN_CLASSES)}>{inner}</span>
      {chip}
    </button>
  )
}
