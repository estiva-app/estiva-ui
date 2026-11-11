import { cn } from './cn'

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
 */
export function UnreadDot({ className, quiet = false }: { className?: string; quiet?: boolean }) {
  return (
    <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center', className)} {...(quiet ? {} : { 'data-unread': '' })}>
      <div className={cn('h-1.5 w-1.5 rounded-full', quiet ? 'border border-border-strong' : 'bg-accent-primary')} />
    </div>
  )
}
