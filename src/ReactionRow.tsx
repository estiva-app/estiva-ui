import { useState } from 'react'
import { IconMoodPlus } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Popover } from './Popover'
import { Reaction } from './Reaction'
import { ReactionPicker, type ReactionOption } from './ReactionPicker'
import { WithTooltip } from './Tooltip'

/**
 * The one reaction row every app draws under a comment or a chat line, from
 * the approved prototype (`concept/comments-everywhere`, Miky 17 October):
 * `Reaction` pills in the order they were first chosen, each saying who
 * reacted on hover, then the add button with `ReactionPicker`. Nobody reacted:
 * no row; the add button sits with the other actions (`AddReactionButton`).
 *
 * What a reaction writes and how reactions are counted stay in
 * `@estiva-app/conversation` (SPEC §6.6): its `groupReactions` answers the
 * `reactions` this takes, and its `REACTION_EMOJI` the five `options`.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/every-app-writes-and-reacts-with-one-shared-box.md
 */

/** One emoji on one target, and who put it there, in the order they reacted. */
export interface ReactionCount {
  emoji: string
  by: readonly string[]
}

/** Names past this many are counted, not listed. */
const NAMED = 8

const meaningOf = (options: readonly ReactionOption[], emoji: string) => options.find((o) => o.emoji === emoji)?.label ?? emoji

/** "Person one, Person two and you reacted with Makes sense". */
export function whoReacted(reaction: ReactionCount, nameOf: (id: string) => string, options: readonly ReactionOption[], viewer?: string): string {
  const others = reaction.by.filter((id) => id !== viewer).map(nameOf)
  const you = viewer !== undefined && reaction.by.includes(viewer)
  const named = others.slice(0, you ? NAMED - 1 : NAMED)
  const rest = others.length - named.length
  const names = [...named, ...(rest > 0 ? [`${rest} more`] : []), ...(you ? ['you'] : [])]
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '')
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} reacted with ${meaningOf(options, reaction.emoji)}`
}

export interface AddReactionButtonProps {
  /** The emoji offered, each named. */
  options: readonly ReactionOption[]
  onPick: (emoji: string) => void
  className?: string
}

/** The add button: `ReactionPicker` opens over it. */
export function AddReactionButton({ options, onPick, className }: AddReactionButtonProps) {
  const [picking, setPicking] = useState(false)
  return (
    <Popover
      open={picking}
      onOpenChange={setPicking}
      side="top"
      align="left"
      ariaLabel="Add a reaction"
      contentClassName="p-1"
      className={className}
      trigger={
        <IconButton variant="muted" tooltip="Add a reaction" aria-label="Add a reaction">
          <IconMoodPlus size={16} stroke={1.5} />
        </IconButton>
      }
    >
      <ReactionPicker
        options={[...options]}
        surface={false}
        onSelect={(emoji) => {
          setPicking(false)
          onPick(emoji)
        }}
      />
    </Popover>
  )
}

export interface ReactionRowProps {
  /** Each emoji and who chose it, in the order first chosen. An emoji nobody holds is not drawn. */
  reactions: readonly ReactionCount[]
  /** The emoji offered, each named; also what a pill's name is read from. */
  options: readonly ReactionOption[]
  /** A reactor's name, as "who reacted" says it. */
  nameOf: (id: string) => string
  /** Who is looking: their pills are lit, and "who reacted" says "you". */
  viewer?: string
  /** Your reaction on or off. Absent, the row only shows (read-only, signed out). */
  onToggle?: (emoji: string) => void
  className?: string
}

export function ReactionRow({ reactions, options, nameOf, viewer, onToggle, className }: ReactionRowProps) {
  const shown = reactions.filter((r) => r.by.length > 0)
  if (shown.length === 0) return null
  return (
    <div data-reaction-row className={cn('flex flex-wrap items-center gap-1', className)}>
      {shown.map((r) => (
        <WithTooltip key={r.emoji} label={whoReacted(r, nameOf, options, viewer)}>
          <Reaction
            emoji={r.emoji}
            count={r.by.length}
            pressed={viewer !== undefined && r.by.includes(viewer)}
            disabled={!onToggle}
            aria-label={`${meaningOf(options, r.emoji)}, ${r.by.length}`}
            onClick={() => onToggle?.(r.emoji)}
          />
        </WithTooltip>
      ))}
      {onToggle && <AddReactionButton options={options} onPick={onToggle} />}
    </div>
  )
}
