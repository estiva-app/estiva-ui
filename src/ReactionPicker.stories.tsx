import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconMessage2, IconMoodPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { Popover } from './Popover'
import { Reaction } from './Reaction'
import { ReactionPicker, type ReactionOption } from './ReactionPicker'
import { Toolbar, ToolbarButton } from './Toolbar'

/**
 * The reactions on offer, to choose one from. **A `Reaction` is the answer;
 * this is the question.**
 *
 * Icon buttons holding emoji, on a `Toolbar` — so the strip carries the
 * elevated box a floating control needs, and the whole row is one Tab stop.
 *
 * The vocabulary is the app's: which emoji it offers and what each one means.
 * These canvases use a neutral set.
 */
const OPTIONS: ReactionOption[] = [
  { emoji: '👍', label: 'Agree' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '🚀', label: 'Ship it' },
  { emoji: '👀', label: 'Looking' },
]

const meta = {
  title: 'Primitives/ReactionPicker',
  component: ReactionPicker,
  args: { options: OPTIONS, onSelect: () => {} },
  argTypes: { options: { control: false }, onSelect: { control: false } },
} satisfies Meta<typeof ReactionPicker>

export default meta
type Story = StoryObj<typeof meta>

/** The picker, as it floats: the strip and its box. */
export const Default: Story = {}

/**
 * **Where it comes from.** A card carries a `Toolbar` of actions; one of them
 * opens the picker, and it opens **above** that control — what is being
 * reacted to is underneath.
 *
 * The box here is the `Popover`'s, so the picker passes `surface={false}`:
 * two boxes inside each other is the tell.
 */
export const FromATrigger: Story = {
  parameters: { controls: { disable: true }, layout: 'centered' },
  render: function FromTrigger() {
    const [chosen, setChosen] = useState<string | null>(null)
    return (
      <div className="flex w-[420px] flex-col items-end gap-3">
        <div className="w-full rounded-lg border border-border-default bg-bg-surface p-3 text-body-2 text-text-primary">
          A card. Its actions sit at the corner, and the picker opens above them.
        </div>
        <Toolbar aria-label="Card actions">
          <ToolbarButton aria-label="Reply" tooltip="Reply">
            <IconMessage2 size={16} stroke={1.5} />
          </ToolbarButton>
          <Popover
            side="top"
            align="right"
            ariaLabel="Reactions"
            className="w-auto min-w-0 p-1"
            trigger={
              <ToolbarButton aria-label="React" tooltip="React">
                <IconMoodPlus size={16} stroke={1.5} />
              </ToolbarButton>
            }
          >
            <ReactionPicker options={OPTIONS} surface={false} onSelect={setChosen} />
          </Popover>
        </Toolbar>
        <span className="text-caption text-text-secondary">
          {chosen ? `Chose ${chosen}` : 'Nothing chosen yet.'}
        </span>
      </div>
    )
  },
}

/**
 * **What it produces.** Picking puts a `Reaction` in the row on the card —
 * the pill with the count and, when it is yours, the accent fill. That state
 * belongs to `Reaction`; the picker only asks.
 */
export const AndWhatItProduces: Story = {
  parameters: { controls: { disable: true } },
  render: function Produces() {
    const [mine, setMine] = useState<string[]>(['👍'])
    return (
      <div className="flex w-[420px] flex-col gap-4">
        <ReactionPicker
          options={OPTIONS}
          onSelect={(emoji) => setMine((prev) => (prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]))}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {mine.length === 0 ? (
            <span className="text-caption text-text-muted">Nothing here yet.</span>
          ) : (
            mine.map((emoji) => {
              const option = OPTIONS.find((o) => o.emoji === emoji)!
              return (
                <Reaction
                  key={emoji}
                  emoji={emoji}
                  count={1}
                  pressed
                  aria-label={`${option.label}, 1`}
                  onClick={() => setMine((prev) => prev.filter((e) => e !== emoji))}
                />
              )
            })
          )}
        </div>
      </div>
    )
  },
}
