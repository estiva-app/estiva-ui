import { cn } from './cn'
import { Toolbar, ToolbarButton } from './Toolbar'

/**
 * The reactions on offer, to choose one from — Peek's `ReactionPicker`
 * (2026-09-03), moved in at Katerina's request (2026-09-08).
 *
 * **`Reaction` is the answer; this is the question.** A `Reaction` is a pill
 * that says an emoji, a count and whether it is yours. This is the row you
 * pick from before any of that exists, and both apps need it: Peek draws one
 * from its card quick-menus, and Ship's reaction strip is the same row with
 * nothing behind it yet.
 *
 * **It is a `Toolbar`**, so the whole row is one Tab stop and the arrow keys
 * walk it. Peek's was five separate stops in a hover panel, which is five
 * things to Tab past to reach anything after the card.
 *
 * ## What stays with the app
 *
 * **Which emoji, and what each one means.** Peek offers five and names them
 * ("Makes sense", "Agree", "Thank you", "Let's go!", "Congrats"); Ship will
 * offer its own. A vocabulary is product knowledge, so it arrives as
 * `options` — and the name is not optional, because the emoji is decorative
 * here for the same reason it is on `Reaction`: a glyph read aloud is noise,
 * and its spoken name differs per screen reader.
 *
 * ## What it does not draw
 *
 * **A surface.** Peek's version drew its own elevated panel — border, elevated
 * background, `p-1.5`, the large shadow — which is `MenuPanel`'s box typed
 * again by hand. This is the row alone, so it can sit in a `Popover` (which
 * draws that box), inline in a card's corner, or in a larger `Toolbar` beside
 * other controls. That is the "either" Katerina asked for.
 */
export interface ReactionOption {
  /** The emoji itself. Drawn decoratively — `label` names the control. */
  emoji: string
  /** What this reaction *means*: "Makes sense", "Congrats". Required, and it
   *  is what a screen reader and the tooltip both say. */
  label: string
}

export interface ReactionPickerProps {
  /** What is on offer, in the order it is drawn. The app's vocabulary. */
  options: ReactionOption[]
  onSelect: (emoji: string) => void
  /**
   * The emoji already yours, so the row can show what you have chosen rather
   * than offering it again as if new. Drawn with the accent fill `Reaction`
   * uses for the same state, and announced with `aria-pressed`.
   */
  selected?: string[]
  /** Names the row. Default "Reactions". */
  'aria-label'?: string
  /** The row's layout — its gap, its padding. */
  className?: string
}

export function ReactionPicker({ options, onSelect, selected = [], 'aria-label': ariaLabel = 'Reactions', className }: ReactionPickerProps) {
  return (
    <Toolbar aria-label={ariaLabel} className={cn('gap-0.5', className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.emoji)
        return (
          /*
            A `ToolbarButton`, not a button in a tooltip wrapper. The wrapper
            would become the toolbar's item and the button inside it would
            never join the walk — and it is unnecessary since stage 4, because
            an `IconButton` with a `tooltip` IS the trigger.

            The tooltip names it for a pointer, `aria-label` for everything
            else, and both say the meaning rather than the glyph.
          */
          <ToolbarButton
            key={option.emoji}
            aria-label={option.label}
            tooltip={option.label}
            aria-pressed={isSelected}
            onClick={() => onSelect(option.emoji)}
            /* Peek's geometry, verbatim: a 28px square rather than the
               IconButton's 24, and the emoji at 18px — larger than a
               `Reaction` pill's 16, because here the emoji is the control. */
            className={cn('size-7 text-[18px] leading-none', isSelected && 'bg-accent-muted')}
          >
            {/* Decorative, as on `Reaction`: the control is named above. */}
            <span aria-hidden="true">{option.emoji}</span>
          </ToolbarButton>
        )
      })}
    </Toolbar>
  )
}
