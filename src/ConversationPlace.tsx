import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Chip } from './Chip'
import { cn } from './cn'

export interface ConversationPlaceProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** How the conversation is related to the page it is shown on, in the app's words: "Mentioned in". */
  relation: string
  /** Where it was said: the place's name. Absent or empty while it resolves, and then nothing is drawn for it. */
  place?: string
  /** The conversation, as the app draws it: its card. */
  children?: ReactNode
}

/**
 * Where a conversation shown away from its place was said: a chip saying how it is related ("Mentioned in"), the
 * place's name beside it, and the conversation's card under them. Peek's Activity row (TopicActivity), moved, as it
 * draws it: a place not named yet is drawn as nothing, never as a placeholder ("Loading…" beside a real message reads
 * worse than a row that has not said where it is from yet).
 */
export function ConversationPlace({ relation, place, children, className, ...props }: ConversationPlaceProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <div className="flex items-center gap-2">
        <Chip type="neutral" label={relation} />
        {place && <span className="truncate text-caption text-text-muted">{place}</span>}
      </div>
      {children}
    </div>
  )
}
