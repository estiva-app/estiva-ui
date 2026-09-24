/**
 * Looks two or more parts share, written once (UIG-25).
 *
 * A look typed again by hand draws the same today and drifts the day one of
 * them changes: nothing fails, one screen just looks slightly off. So a look
 * more than one part wears lives here, and each part takes it from here. The
 * lint that finds a copied look reads a class list wherever it is written; a
 * constant of classes ends in `_CLASSES`, so it is read as one.
 *
 * Only looks — colour, text, border, corner, shadow. Where a part sits and how
 * much room it takes stay in the part.
 */

/** A field's box: TextInput and Textarea. The hairline strengthens on hover; focus comes after it, so a focused field keeps its colour under the pointer. */
export const FIELD_BOX_CLASSES = 'bg-bg-inset border border-border-default hover:border-border-strong focus:border-border-focus rounded-lg'

/** What a field's words look like, typed or waiting: TextInput, Textarea and Select. */
export const FIELD_TEXT_CLASSES = 'text-text-primary placeholder:text-text-muted'

/** A field that cannot be used: TextInput, Textarea and Select. */
export const FIELD_DISABLED_CLASSES = 'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled'

/** The ring a focused field wears in Signal: TextInput and Textarea. */
export const FIELD_FOCUS_RING_CLASSES = 'signal:transition-shadow signal:focus:shadow-focus-ring'

/** A field's two sizes, its padding and its words: TextInput, Textarea (default only) and Select. The small one is the small Select's trigger. */
export const FIELD_SIZE_CLASSES = {
  default: 'px-3 py-2 text-input-value',
  small: 'h-6 min-h-6 px-2 text-caption',
} as const

/** The box around an input that sits inside it, before its focus look: SearchInput and ChipInput. */
export const FIELD_SHELL_CLASSES = 'bg-bg-inset border border-border-default hover:border-border-strong rounded-lg transition-colors'

/** A panel that floats over the page: Menu's panel and Tooltip. */
export const FLOATING_SURFACE_CLASSES = 'rounded-lg border border-border-default bg-bg-elevated shadow-lg'

/** A chip's words: Chip's label and Reaction's count. */
export const CHIP_TEXT_CLASSES = 'text-chip signal:font-mono signal:text-small signal:font-semibold signal:tabular-nums'

/** Words typed straight into an input with no box of its own: SearchInput and ChipInput. */
export const BARE_INPUT_CLASSES = 'bg-transparent text-text-primary placeholder:text-text-muted outline-none'
