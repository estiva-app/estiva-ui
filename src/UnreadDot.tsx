import { cn } from './cn'

/**
 * What kind of new a dot says, named for what it is, not its colour: `blue`, the accent, for something new;
 * `reaction` for a reaction to you.
 */
export type UnreadDotTone = 'blue' | 'reaction'

/**
 * The disc's fill per tone, in one place. A reaction is drawn in the warning family, the urgent mark's colour (ACT-7);
 * if Katerina gives it a colour or a token of its own, only this line changes.
 */
const TONE_FILL: Record<UnreadDotTone, string> = {
  blue: 'bg-accent-primary',
  reaction: 'bg-warning-default',
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
 * `tone="reaction"` draws a reaction to you, in the warning colour (ACT-7; the
 * same prototype). A dot that is not quiet says its tone in `data-tone`,
 * `blue` or `reaction`, beside `data-unread`. Which tone a row shows is the
 * caller's: a row with both kinds of new draws one blue dot.
 */
export function UnreadDot({ className, quiet = false, tone = 'blue' }: { className?: string; quiet?: boolean; tone?: UnreadDotTone }) {
  return (
    <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center', className)} {...(quiet ? {} : { 'data-unread': '', 'data-tone': tone })}>
      <div className={cn('h-1.5 w-1.5 rounded-full', quiet ? 'border border-border-strong' : TONE_FILL[tone])} />
    </div>
  )
}
