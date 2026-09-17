import type { ReactNode, Ref } from 'react'
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar'
import { cn } from './cn'
import { IconButton, type IconButtonProps } from './IconButton'
import { MenuPanel } from './Menu'
import { TextInput, type TextInputProps } from './TextInput'

/**
 * A strip of controls that behaves as **one** control.
 *
 * New at Katerina's request, 2026-09-08, pulled forward from stage 6.
 *
 * **It exists because every strip in the suite is as many Tab stops as it has
 * buttons.** Ship's reaction row, Peek's composer strip and the editor's
 * formatting strip are each a hand-rolled `<div class="flex">` of
 * `IconButton`s: eight buttons, eight stops, and no way to get past them but
 * through them. A toolbar is one stop — Tab in, arrow keys along, Tab out —
 * which is what the `toolbar` role means and what Base UI's part implements.
 *
 * What it is not: a `Menu` (that is a list of *verbs* you open and choose
 * from, and it closes when you do) or a row of unrelated buttons (a form's
 * Cancel and Save are two separate answers, and each deserves its own stop).
 * A toolbar is a set of things you do *to* something that is still there.
 *
 * **It draws the box.** A toolbar floats over what it acts on — a card, a
 * paragraph, an image — so it carries the elevated surface that separates it
 * from that: the same `MenuPanel` a `Menu` draws, because a floating strip and
 * a floating list are the same box. Peek had built this twice and the two had
 * already drifted — `ConversationQuickMenu` is `rounded-sm` with `shadow-sm`
 * and a subtle border, `ReactionPicker` `rounded-lg` with `shadow-lg` and a
 * default one. There is one box now. `surface={false}` for a strip inside
 * something that already draws it.
 *
 * **The gap, stated: Home and End do nothing.** Base UI's composite has them
 * and its `Toolbar` does not switch them on (`enableHomeAndEndKeys`, read in
 * `useCompositeRoot`, not passed by `ToolbarRoot`) — so this page does not
 * claim them. The arrow keys wrap, which reaches both ends in one press of a
 * strip this size.
 */
export interface ToolbarProps {
  /**
   * Names the strip for assistive tech — "Formatting", "Reactions". A toolbar
   * is a landmark-ish grouping and is announced as a bare "toolbar" without
   * one, which says nothing when a page has two.
   */
  'aria-label': string
  /** `horizontal` walks with ← →, `vertical` with ↑ ↓. Default horizontal. */
  orientation?: 'horizontal' | 'vertical'
  /** Whether the arrow keys wrap at the ends. Default true, as Base UI's. */
  loopFocus?: boolean
  /**
   * The elevated box around the strip. **On by default** — a toolbar floats,
   * and this is what floating looks like here.
   *
   * Off for a strip inside a surface that already draws one: a `Popover`, a
   * dialog, a card's own panel. Two boxes inside each other is the tell.
   */
  surface?: boolean
  children: ReactNode
  /** The row's own layout — its gap, its padding, its wrapping. */
  className?: string
}

export function Toolbar({ 'aria-label': ariaLabel, orientation = 'horizontal', loopFocus = true, surface = true, children, className }: ToolbarProps) {
  const strip = (
    <BaseToolbar.Root
      aria-label={ariaLabel}
      orientation={orientation}
      loopFocus={loopFocus}
      className={cn('flex items-center gap-1', orientation === 'vertical' && 'flex-col', className)}
    >
      {children}
    </BaseToolbar.Root>
  )
  if (!surface) return strip
  /*
    The box WRAPS the strip rather than being composed onto it. `MenuPanel` is
    a flex COLUMN — right for a menu's rows, wrong for a row of controls — and
    Tailwind emits `flex-col` after `flex-row`, so a merged class list would
    stand the toolbar on its end whatever order the classes arrived in. One
    extra element, and the box keeps its single definition.

    `p-1` is the tighter of Peek's two paddings and the right one for a strip
    of 24px controls; `MenuPanel`'s own `p-2` is a menu's, where the rows run
    the full width.
  */
  return <MenuPanel className="w-fit p-1">{strip}</MenuPanel>
}

/**
 * One control in the strip. It is this package's `IconButton` — the same
 * square, the same variants, the same `tooltip` and `disabledReason` — joined
 * to the toolbar's roving focus.
 *
 * A disabled button **keeps its place in the walk**: a strip whose controls
 * come and go from the arrow keys as their state changes is a strip you cannot
 * learn. It is also what lets a `disabledReason` be read.
 *
 * **It must be inside a `Toolbar`.** Base UI throws otherwise —
 * "ToolbarRootContext is missing" — because a part with no strip has no walk
 * to join. A control beside a strip is an `IconButton`.
 */
export interface ToolbarButtonProps extends IconButtonProps {
  ref?: Ref<HTMLButtonElement>
}

/** An `IconButton` that is an item of a `Toolbar`: the arrow keys reach it, and
 *  a disabled one stays in the walk so its reason can still be read. */
export function ToolbarButton({ ref, disabled, disabledReason, ...props }: ToolbarButtonProps) {
  return (
    <BaseToolbar.Button
      ref={ref}
      /*
        The part has to be told, not only the button inside it. The toolbar
        keeps its own map of which items are disabled — it is what decides
        where an arrow key lands — and a `Toolbar.Button` that renders a
        disabled `IconButton` without saying so leaves the two disagreeing:
        measured, the element came out `aria-disabled="false"` over a button
        that was disabled.
      */
      disabled={disabled || !!disabledReason}
      /* Keep it in the walk either way. A strip whose controls come and go
         from the arrow keys as their state changes is a strip you cannot
         learn, and a `disabledReason` you cannot reach is a reason nobody
         reads. */
      focusableWhenDisabled
      render={<IconButton disabled={disabled} disabledReason={disabledReason} {...props} />}
    />
  )
}

/**
 * A text field inside the strip — the link editor in a selection toolbar.
 *
 * The arrow keys belong to the field while it has focus, which is the whole
 * point: ← and → move the caret. The toolbar's walk resumes at Tab. That is
 * Base UI's `Toolbar.Input`, and it is why a field in a toolbar cannot just be
 * a `TextInput` dropped in the row.
 */
export type ToolbarInputProps = TextInputProps

/** A `TextInput` that is an item of a `Toolbar`, so the arrow keys walk into the
 *  field and out of it again. */
export function ToolbarInput({ size, ...props }: ToolbarInputProps) {
  // `size` is TextInput's own (default or small), not the native attribute
  // Base UI's part would take, so it goes to the field it draws.
  return <BaseToolbar.Input render={<TextInput size={size} />} {...props} />
}

/**
 * The hairline between two groups of controls. It is `Divider`'s rule and
 * `Toolbar.Separator`'s role, so a screen reader hears the grouping a sighted
 * reader sees.
 */
export function ToolbarSeparator({ className }: { className?: string }) {
  return (
    <BaseToolbar.Separator
      orientation="vertical"
      /* `shrink-0` on a hairline in a flex row, always: without it a 1px rule
         renders at 0px and nobody notices (the package's own trap table). */
      className={cn('mx-1 h-4 w-px shrink-0 bg-border-default', className)}
    />
  )
}
