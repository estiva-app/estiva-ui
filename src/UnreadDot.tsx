import { cn } from './cn'

/**
 * The accent dot that says "something new here": a 6px disc centred in a
 * 24px slot, so it sits where a control would and the row does not shift when
 * one replaces the other (Peek's UnreadDot, moved in on 2 October, Katerina).
 *
 * Purely visual: the row that draws it says "unread" in its own accessible
 * name, because a coloured disc reads as nothing to a screen reader.
 */
export function UnreadDot({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center', className)} data-unread>
      <div className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
    </div>
  )
}
