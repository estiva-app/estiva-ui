import { cn } from './cn'

/** A dot's colour: blue, the accent, for something new; orange for a second kind of new, such as a reaction to what you wrote. */
export type UnreadDotTone = 'blue' | 'orange'

/**
 * The disc's fill per tone, in one place. Orange is the warning family, the urgent mark's colour (ACT-7); if Katerina
 * gives it a token of its own, only this line changes.
 */
const TONE_FILL: Record<UnreadDotTone, string> = {
  blue: 'bg-accent-primary',
  orange: 'bg-warning-default',
}

/**
 * The accent dot that says "something new here": a 6px disc centred in a
 * 24px slot, so it sits where a control would and the row does not shift when
 * one replaces the other (Peek's UnreadDot, moved in on 2 October, Katerina).
 *
 * Purely visual: the row that draws it says "unread" in its own accessible
 * name, because a coloured disc reads as nothing to a screen reader.
 *
 * `quiet` draws the same 6px as a ring with nothing new: the dot beside a
 * page's title, which is always there because it opens the page's list
 * (ACT-4; the activity indicator prototype Miky approved, 10 November). A
 * quiet dot is not marked `data-unread`.
 *
 * `tone="orange"` fills the disc in the warning colour and marks it
 * `data-tone="orange"` beside `data-unread` (ACT-7; the same prototype). Which
 * tone a row shows is the caller's: a row with both kinds of new draws one
 * blue dot.
 */
export function UnreadDot({ className, quiet = false, tone = 'blue' }: { className?: string; quiet?: boolean; tone?: UnreadDotTone }) {
  const marks = quiet ? {} : tone === 'orange' ? { 'data-unread': '', 'data-tone': 'orange' } : { 'data-unread': '' }
  return (
    <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center', className)} {...marks}>
      <div className={cn('h-1.5 w-1.5 rounded-full', quiet ? 'border border-border-strong' : TONE_FILL[tone])} />
    </div>
  )
}
