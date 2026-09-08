import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MenuPanel } from './Menu'
import { Popover } from './Popover'
import { Reaction } from './Reaction'
import { ReactionPicker, type ReactionOption } from './ReactionPicker'
import { IconButton } from './IconButton'
import { IconMoodPlus } from '@tabler/icons-react'

/**
 * The reactions on offer, to choose one from. **`Reaction` is the answer; this
 * is the question.**
 *
 * The vocabulary is the app's — which emoji it offers and what each one means
 * — so it arrives as `options`. These canvases use a neutral set; a product
 * names its own.
 *
 * It draws no surface, so it can sit in a `Popover`, in a card's corner, or in
 * a larger toolbar. The canvases show all three.
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
  args: { options: OPTIONS, onSelect: () => {}, selected: [] },
  argTypes: { options: { control: false }, onSelect: { control: false } },
} satisfies Meta<typeof ReactionPicker>

export default meta
type Story = StoryObj<typeof meta>

/** The row alone, with no surface — which is what it is. */
export const Default: Story = {}

/** Two already chosen: the accent fill `Reaction` uses for the same state. */
export const SomeChosen: Story = {
  args: { selected: ['👍', '🚀'] },
}

/**
 * Live. Pick one and it joins the row of reactions below, or leaves it.
 *
 * The thing to try is the keyboard: Tab reaches the picker **once**, → walks
 * it, Enter chooses, and Tab leaves. Peek's version was five separate stops.
 */
export const Live: Story = {
  parameters: { controls: { disable: true } },
  render: function LivePicker() {
    const [mine, setMine] = useState<string[]>(['👍'])
    const toggle = (emoji: string) =>
      setMine((prev) => (prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]))
    return (
      <div className="flex w-[360px] flex-col gap-4">
        <ReactionPicker options={OPTIONS} selected={mine} onSelect={toggle} />
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
                  onClick={() => toggle(emoji)}
                />
              )
            })
          )}
        </div>
      </div>
    )
  },
}

/**
 * **In a panel**, which is how a card offers it: a `⋯`-style trigger opens a
 * `Popover`, and the picker is what is inside. The panel is the `Popover`'s,
 * not the picker's — the picker draws no box of its own, which is the whole
 * reason it can also sit inline.
 */
export const InAPopover: Story = {
  parameters: { controls: { disable: true } },
  render: function InPanel() {
    const [mine, setMine] = useState<string[]>([])
    return (
      <Popover
        trigger={
          <IconButton aria-label="React" tooltip="React">
            <IconMoodPlus size={16} stroke={1.5} />
          </IconButton>
        }
        ariaLabel="Reactions"
        className="w-auto min-w-0 p-1.5"
      >
        <ReactionPicker
          options={OPTIONS}
          selected={mine}
          onSelect={(emoji) => setMine((prev) => (prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]))}
        />
      </Popover>
    )
  },
}

/** Inline in a card's corner, on the surface that is already there. */
export const OnACard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[420px] gap-3">
      <span className="text-body-2 text-text-primary">
        A card. The row of reactions sits on the card's own surface, so the picker draws none.
      </span>
      <ReactionPicker options={OPTIONS} onSelect={() => {}} />
    </MenuPanel>
  ),
}
