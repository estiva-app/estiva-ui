import { useState } from 'react'
import { IconMoodPlus } from '@tabler/icons-react'
import { cn } from '../../src/cn'
import { IconButton } from '../../src/IconButton'
import { Popover } from '../../src/Popover'
import { Reaction } from '../../src/Reaction'
import { ReactionPicker } from '../../src/ReactionPicker'
import { WithTooltip } from '../../src/Tooltip'
import { ME, NAME, REACTIONS, type ReactionCount } from './fixtures'

/**
 * The shared reaction row, as a prototype: the package's `Reaction` pills, in
 * the order they were first chosen, each saying who reacted on hover, then the
 * add button with the package's `ReactionPicker`. A comment nobody reacted to
 * draws no row; its React button sits with the comment's other actions. What a
 * reaction writes and how they are counted stays in @estiva-app/conversation.
 */

const meaning = (emoji: string) => REACTIONS.find((r) => r.emoji === emoji)?.label ?? emoji

/** "Ana Duarte, Ravi Mehta and you reacted with Makes sense". */
export function whoReacted(reaction: ReactionCount): string {
  const names = [...reaction.by.filter((id) => id !== ME).map((id) => NAME[id] ?? 'Someone'), ...(reaction.by.includes(ME) ? ['you'] : [])]
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
  return `${list[0].toUpperCase()}${list.slice(1)} reacted with ${meaning(reaction.emoji)}`
}

/** The add button: the picker opens over it. */
export function ReactButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [picking, setPicking] = useState(false)
  return (
    <Popover
      open={picking}
      onOpenChange={setPicking}
      side="top"
      align="left"
      ariaLabel="Add a reaction"
      contentClassName="p-1"
      trigger={
        <IconButton variant="muted" tooltip="Add a reaction" aria-label="Add a reaction">
          <IconMoodPlus size={16} stroke={1.5} />
        </IconButton>
      }
    >
      <ReactionPicker
        options={REACTIONS}
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
  reactions: ReactionCount[]
  /** Toggling your own reaction; absent, the row only shows (read-only, signed out). */
  onToggle?: (emoji: string) => void
  className?: string
}

export function ReactionRow({ reactions, onToggle, className }: ReactionRowProps) {
  const shown = reactions.filter((r) => r.by.length > 0)
  if (shown.length === 0) return null
  return (
    <div data-reaction-row className={cn('flex flex-wrap items-center gap-1', className)}>
      {shown.map((r) => (
        <WithTooltip key={r.emoji} label={whoReacted(r)}>
          <Reaction
            emoji={r.emoji}
            count={r.by.length}
            pressed={r.by.includes(ME)}
            disabled={!onToggle}
            aria-label={`${meaning(r.emoji)}, ${r.by.length}`}
            onClick={() => onToggle?.(r.emoji)}
          />
        </WithTooltip>
      ))}
      {onToggle && <ReactButton onPick={onToggle} />}
    </div>
  )
}

/** Your reaction on or off, as a fake relay would count it. */
export function toggled(reactions: ReactionCount[], emoji: string): ReactionCount[] {
  const found = reactions.find((r) => r.emoji === emoji)
  if (!found) return [...reactions, { emoji, by: [ME] }]
  return reactions
    .map((r) => (r.emoji !== emoji ? r : { ...r, by: r.by.includes(ME) ? r.by.filter((id) => id !== ME) : [...r.by, ME] }))
    .filter((r) => r.by.length > 0)
}
