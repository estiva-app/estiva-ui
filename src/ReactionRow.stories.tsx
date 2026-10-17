import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AddReactionButton, ReactionRow, type ReactionCount } from './ReactionRow'

/**
 * The one reaction row under a comment or a line. Live: press a pill to take
 * yours back or add it, and the add button for another. Hover a pill for who
 * reacted.
 */
const meta = {
  title: 'Primitives/ReactionRow',
  component: ReactionRow,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReactionRow>

export default meta
type Story = StoryObj

const OPTIONS = [
  { emoji: '👍', label: 'Makes sense' },
  { emoji: '💯', label: 'Agree' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👀', label: 'Looking' },
]

const ME = 'me'
const NAMES: Record<string, string> = { me: 'Me', a: 'Person one', b: 'Person two', c: 'Person three', d: 'Person four', e: 'Person five' }
const nameOf = (id: string) => NAMES[id] ?? 'Someone'

/** Yours on or off, as the relay would count it. */
const toggled = (reactions: ReactionCount[], emoji: string): ReactionCount[] => {
  const found = reactions.find((r) => r.emoji === emoji)
  if (!found) return [...reactions, { emoji, by: [ME] }]
  return reactions
    .map((r) => (r.emoji !== emoji ? r : { ...r, by: r.by.includes(ME) ? r.by.filter((id) => id !== ME) : [...r.by, ME] }))
    .filter((r) => r.by.length > 0)
}

function Live({ start, readOnly }: { start: ReactionCount[]; readOnly?: boolean }) {
  const [reactions, setReactions] = useState(start)
  return (
    <ReactionRow
      reactions={reactions}
      options={OPTIONS}
      nameOf={nameOf}
      viewer={ME}
      onToggle={readOnly ? undefined : (emoji) => setReactions((all) => toggled(all, emoji))}
    />
  )
}

/** A few reactions, yours lit. */
export const Default: Story = {
  render: () => (
    <Live
      start={[
        { emoji: '👍', by: ['a', ME] },
        { emoji: '🙏', by: ['b'] },
      ]}
    />
  ),
}

/** Many people on one emoji: the count, and who on hover. */
export const ManyPeople: Story = {
  render: () => (
    <Live
      start={[
        { emoji: '👍', by: ['a', 'b', 'c', 'd', 'e', ME] },
        { emoji: '🎉', by: ['c', 'd'] },
        { emoji: '👀', by: ['e'] },
      ]}
    />
  ),
}

/** Read-only: the pills show, and nothing can be added or taken back. */
export const ReadOnly: Story = { render: () => <Live readOnly start={[{ emoji: '👍', by: ['a', 'b'] }]} /> }

/** Nobody reacted: no row; the add button sits with the other actions. */
export const NoReactions: Story = {
  render: function NoReactions() {
    const [reactions, setReactions] = useState<ReactionCount[]>([])
    return reactions.length > 0 ? (
      <ReactionRow reactions={reactions} options={OPTIONS} nameOf={nameOf} viewer={ME} onToggle={(emoji) => setReactions((all) => toggled(all, emoji))} />
    ) : (
      <AddReactionButton options={OPTIONS} onPick={(emoji) => setReactions((all) => toggled(all, emoji))} />
    )
  },
}
