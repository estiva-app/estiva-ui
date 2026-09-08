import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

/**
 * A reaction: an emoji, how many people chose it, and whether you are one of
 * them.
 *
 * **This exists because both apps had already built it, and neither could use
 * the components that were here.** A reaction is a pill with a count that
 * toggles — `Chip` is a pill and rules itself out for anything clickable,
 * `Button` is clickable and is a 6px-radius rectangle, and `IconButton` has
 * nowhere to put the count. So Peek re-typed Chip's class list with a border
 * added, and Ship reached for a small Button with the count as its label. The
 * two apps' reactions do not look alike today, and neither is what was drawn.
 *
 * ## The one thing it does that nothing else here does
 *
 * **It says the reaction is yours.** That is the state a reaction has and a
 * chip does not: `pressed` fills it with the accent's muted tint and gives it
 * an accent edge, so a glance separates "two people, one of them me" from "two
 * people". Ship approximated it as `outlined` versus `muted` — measured at a
 * 1px hairline against no border at all — which is legible and is not the
 * signal Peek's accent fill gives.
 *
 * It is a real `<button>` with `aria-pressed`, so the state reaches assistive
 * tech as a toggle rather than as a colour.
 *
 * ## `aria-label` is required, and the reason is specific
 *
 * The emoji is decorative here — it is `aria-hidden`, because a glyph read
 * aloud is noise and its spoken name differs per screen reader — and the only
 * visible text is the count. Without a label the control is announced as
 * **"2"**, which is what Ship shipped and its own tests caught. Pass the
 * meaning and the count: `"Makes sense, 2"`.
 *
 * ## Geometry
 *
 * Chip's pill, at a control's height: fully rounded, 24px to match `Button`
 * `small`, the same 8px horizontal padding, the `chip` type token for the
 * count so it sits at 11px/500 like every other count in the system.
 */
export interface ReactionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The emoji, drawn decoratively — name the control with `aria-label`. */
  emoji: ReactNode
  /** How many people reacted. Drawn as-is; `0` is not a reaction and is not drawn. */
  count: number
  /** You are one of them: the accent tint and edge, and `aria-pressed`. */
  pressed?: boolean
  /**
   * Names the control. **Required** — the emoji is decorative and the count is
   * the only visible text, so without this it is announced as a bare number.
   */
  'aria-label': string
}

export function Reaction({ emoji, count, pressed = false, className, type, ...props }: ReactionProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-pressed={pressed}
      className={cn(
        // Chip's pill at a control's height, so a reaction and a status chip
        // read as the same family — 24px matches Button `small`.
        'inline-flex h-6 items-center justify-center gap-1.5 rounded-full px-2',
        'border transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        pressed
          ? 'border-accent-primary bg-accent-muted text-accent-primary hover:border-accent-hover'
          : 'border-border-default bg-bg-inset text-text-primary hover:border-border-strong hover:bg-bg-hover',
        className,
      )}
      {...props}
    >
      {/* Decorative: the control is named by `aria-label`, and a glyph read
          aloud is noise. 16px so the emoji is legible at chip scale. */}
      <span aria-hidden="true" className="shrink-0 text-[16px] leading-none">
        {emoji}
      </span>
      {/* `text-chip` stands alone here, so there is nothing to merge it with.
          The old note said it must NEVER be merged; that stopped being true
          when `cn()` was taught the ramp — `chip` is in it, and `cn.test.ts`
          pins that. */}
      <span className="text-chip signal:font-mono signal:text-[10px] signal:font-semibold signal:tabular-nums">
        {count}
      </span>
    </button>
  )
}
