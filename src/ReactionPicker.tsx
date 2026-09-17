import { cn } from './cn'
import { Toolbar, ToolbarButton } from './Toolbar'

/**
 * The reactions on offer, to choose one from — Peek's `ReactionPicker`
 * (2026-09-03), moved in at Katerina's request (2026-09-08).
 *
 * **`Reaction` is the answer; this is the question.** A `Reaction` is a pill
 * that says an emoji, a count and whether it is yours. This is the row you
 * pick from before any of that exists, and both apps need it: Peek draws one
 * from a card's action strip (`ConversationQuickMenu`), and Ship draws the
 * same row in `Reactions.tsx` from its own vocabulary.
 *
 * **It is a `Toolbar`** — icon buttons holding emoji, on the strip's own
 * elevated box — so the whole row is one Tab stop and the arrow keys walk it.
 * Peek's was five separate stops.
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
 * ## Picking, and nothing else
 *
 * **It does not show which reactions are yours.** That is `Reaction`'s job —
 * the pill with the count and the accent fill — and the two live in different
 * places: the reactions *made* sit in a row on the card, and this row is what
 * opens over it when you go to add one. A picker that also reported state
 * would be two components wearing one name (Katerina, 2026-09-08).
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
  /** Names the row. Default "Reactions". */
  'aria-label'?: string
  /**
   * The elevated box around the row, from `Toolbar`. **On by default**, which
   * is how a picker floats over a card. Off inside a `Popover`, which draws
   * that box already.
   */
  surface?: boolean
  /** The row's layout — its gap, its padding. */
  className?: string
}

export function ReactionPicker({ options, onSelect, 'aria-label': ariaLabel = 'Reactions', surface = true, className }: ReactionPickerProps) {
  return (
    <Toolbar aria-label={ariaLabel} surface={surface} className={cn('gap-0.5', className)}>
      {options.map((option) => (
        /*
          A `ToolbarButton`, not a button in a tooltip wrapper. The wrapper
          would become the toolbar's item and the button inside it would never
          join the walk — and it is unnecessary since stage 4, because an
          `IconButton` with a `tooltip` IS the trigger.

          The tooltip names it for a pointer, `aria-label` for everything else,
          and both say the meaning rather than the glyph.
        */
        <ToolbarButton
          key={option.emoji}
          aria-label={option.label}
          tooltip={option.label}
          onClick={() => onSelect(option.emoji)}
          /* Peek's geometry, verbatim: a 28px square rather than the
             IconButton's 24, and the emoji at 18px — larger than a `Reaction`
             pill's 16, because here the emoji is the whole control. */
          className="size-7"
        >
          {/* Decorative, as on `Reaction`: the control is named above. Its size is
              on the emoji itself, not pushed into the button (UIG-9). */}
          <span aria-hidden="true" className="text-h3 leading-none">
            {option.emoji}
          </span>
        </ToolbarButton>
      ))}
    </Toolbar>
  )
}
