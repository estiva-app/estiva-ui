import { cn } from './cn'
import { WithTooltip } from './Tooltip'

export interface QuotedLineProps {
  /** The words the comment is on, as they were quoted. */
  words?: string
  /** `here`: still in the text. `reworded`: changed since. `gone`: their part was deleted from the page. */
  state?: 'here' | 'reworded' | 'gone'
  /** A part with no words, a picture or a whole block: what it is, in the app's words ("Picture: plan.png"). */
  label?: string
}

const SINCE = { reworded: 'Changed since', gone: 'Deleted from the page' } as const

/**
 * What a comment on a part of the page is on: its words, two lines at most, in the page's own highlight, so the two
 * read as one. ConversationCard puts it under the name, above the comment's words ("above the message, not above the
 * person": Katerina, 1 November). Words changed since or deleted lose the highlight and say so; a part with no words
 * gives its name.
 */
export function QuotedLine({ words, state = 'here', label }: QuotedLineProps) {
  const shown = words ?? label ?? ''
  return (
    <div data-quoted={words ? state : 'part'} className="flex w-full min-w-0 flex-col gap-0.5">
      <WithTooltip label={shown} wrapperClassName="flex min-w-0">
        <p className="line-clamp-2 text-caption text-text-secondary">
          <mark className={cn('rounded-sm px-0.5 text-text-primary [box-decoration-break:clone]', state === 'here' ? 'bg-warning-muted' : 'bg-bg-inset text-text-secondary', state === 'gone' && 'line-through')}>{shown}</mark>
        </p>
      </WithTooltip>
      {state !== 'here' && <span className="text-caption italic text-text-muted">{SINCE[state]}</span>}
    </div>
  )
}
