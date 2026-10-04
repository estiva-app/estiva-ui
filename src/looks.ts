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

/**
 * A field's box: TextInput and Textarea. The hairline strengthens on hover — of the box, or of anywhere in the `Field` around it, label included, so the field is one thing under the pointer (Katerina, 28 September) — and not while switched off: a label passes its hover to its box, switched off or not (FIELD_DISABLED_CLASSES holds it back). Focus outranks it, so a focused field keeps its colour under the pointer.
 */
export const FIELD_BOX_CLASSES = 'bg-bg-field border border-border-field shadow-field hover:border-border-strong group-hover/field:border-border-strong focus:border-border-focus group-hover/field:focus:border-border-focus rounded-lg'

/** What a field's words look like, typed or waiting: TextInput, Textarea and Select. */
export const FIELD_TEXT_CLASSES = 'text-text-primary placeholder:text-text-muted'

/** A field that cannot be used: TextInput, Textarea and Select. */
export const FIELD_DISABLED_CLASSES = 'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled disabled:border-border-field group-hover/field:disabled:border-border-field'

/** The ring a focused field wears in Signal: TextInput and Textarea. */
export const FIELD_FOCUS_RING_CLASSES = 'signal:transition-shadow signal:focus:shadow-focus-ring'

/** A field's two sizes, its padding and its words: TextInput, Textarea (default only) and Select. The small one is the small Select's trigger. */
export const FIELD_SIZE_CLASSES = {
  default: 'px-3 py-2 text-input-value',
  small: 'h-6 min-h-6 px-2 text-caption',
} as const

/** The box around an input that sits inside it, before its focus look: SearchInput and ChipInput. */
export const FIELD_SHELL_CLASSES = 'bg-bg-field border border-border-field shadow-field hover:border-border-strong group-hover/field:border-border-strong rounded-lg transition-colors'

/** A panel that floats over the page: Menu's panel and Tooltip. */
export const FLOATING_SURFACE_CLASSES = 'rounded-lg border border-border-default bg-bg-elevated shadow-lg'

/** A chip's words: Chip's label and Reaction's count. */
export const CHIP_TEXT_CLASSES = 'text-chip signal:font-mono signal:text-small signal:font-semibold signal:tabular-nums'

/** Words typed straight into an input with no box of its own: SearchInput and ChipInput. */
export const BARE_INPUT_CLASSES = 'bg-transparent text-text-primary placeholder:text-text-muted outline-none'

/** A sidebar row's shape and its words at rest, brightening under the pointer: NavItem, and SectionHeader's `row` (a folder among rows). */
// 8px corners, a MenuItem row's (Katerina, 2 October).
export const SIDEBAR_ROW_CLASSES = 'rounded-lg transition-colors'
export const SIDEBAR_ROW_TEXT_CLASSES = 'text-text-secondary hover:text-text-primary'

/**
 * A panel that slides open and shut on Base UI's Collapsible: Base UI measures
 * it and writes its height to a variable, `auto` again once the slide ends, and
 * the panel is 0 high on its opening and closing frames. None under
 * prefers-reduced-motion. CollapsibleSection's rows, and the rows under a NavItem.
 */
export const COLLAPSIBLE_PANEL_CLASSES = 'h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-150 ease-out motion-reduce:transition-none data-[starting-style]:h-0 data-[ending-style]:h-0'
