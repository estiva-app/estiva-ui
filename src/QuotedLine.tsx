import { useContext, type ReactNode } from 'react'
import { IconHighlight, IconQuote } from '@tabler/icons-react'
import { Card } from './Card'
import { cn } from './cn'
import { ABOVE_NAME_BAR_CLASSES } from './looks'
import { ProposalLooks } from './threadCard'
import { WithTooltip } from './Tooltip'

export interface QuotedLineProps {
  /** The words the comment is on, as they were quoted. */
  words?: string
  /** `here`: still in the text. `reworded`: changed since. `gone`: their part was deleted from the page. */
  state?: 'here' | 'reworded' | 'gone'
  /** A part with no words, a picture or a whole block: what it is, in the app's words ("Picture: plan.png"). */
  label?: string
  /** Beside the label: its kind's icon, 14px. */
  icon?: ReactNode
}

const SINCE = { reworded: 'Changed since', gone: 'Deleted from the page' } as const

/**
 * Above a comment on a part of the page: the words it is on, two lines at most, set off by a bar in the document's
 * highlight colour so the two match (Katerina, 31 October, Notion's way). The bar stands under the face below.
 * Words changed since or deleted turn the bar grey and say so; a part with no words gives its name.
 */
export function QuotedLine({ words, state = 'here', label, icon }: QuotedLineProps) {
  const marked = state === 'here'
  // Katerina's pick (1 November): the page's highlight, above the words; `bar` was the look before.
  const look = useContext(ProposalLooks).quoteLook ?? 'mark'
  const shown = words ?? label ?? ''
  const since = state !== 'here' && <span className="text-caption italic text-text-muted">{SINCE[state]}</span>
  // Proposal (comments panel, round 2, 1 November): four other ways to say what a comment is on. The card places each.
  if (look === 'mark') {
    // Under the name, the words as the page marks them: the same highlight, so the two read as one.
    return (
      <div data-quoted={words ? state : 'part'} className="flex w-full min-w-0 flex-col gap-0.5">
        <WithTooltip label={shown} wrapperClassName="flex min-w-0">
          <p className="line-clamp-2 text-caption text-text-secondary">
            <mark className={cn('rounded-sm px-0.5 text-text-primary [box-decoration-break:clone]', marked ? 'bg-warning-muted' : 'bg-bg-inset text-text-secondary', state === 'gone' && 'line-through')}>{shown}</mark>
          </p>
        </WithTooltip>
        {since}
      </div>
    )
  }
  if (look === 'block') {
    // A quote block at the card's top, set in from its edge: what was quoted, then who said what about it.
    return (
      <Card fill="inset" data-quoted={words ? state : 'part'} className="flex w-full min-w-0 items-start gap-2 px-2.5 py-2">
        <IconQuote size={14} stroke={1.5} className={cn('mt-px shrink-0', marked ? 'text-warning-default' : 'text-text-muted')} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <WithTooltip label={shown} wrapperClassName="flex min-w-0">
            <p className={cn('line-clamp-2 text-caption italic', state === 'gone' ? 'text-text-muted line-through' : 'text-text-secondary')}>{shown}</p>
          </WithTooltip>
          {since}
        </span>
      </Card>
    )
  }
  if (look === 'band') {
    // The card's header: a band across its top, as a review thread names its line of code.
    return (
      <div data-quoted={words ? state : 'part'} className="flex w-full min-w-0 items-center gap-1.5 rounded-t-lg border-b border-border-subtle bg-bg-wash px-3 py-1.5">
        <IconHighlight size={14} stroke={1.5} className={cn('shrink-0', marked ? 'text-warning-default' : 'text-text-muted')} />
        <WithTooltip label={shown} wrapperClassName="flex min-w-0 flex-1">
          <p className={cn('truncate text-caption', state === 'gone' ? 'text-text-muted line-through' : 'text-text-secondary')}>{shown}</p>
        </WithTooltip>
        {since}
      </div>
    )
  }
  if (look === 'icon') {
    // Only an icon after the time: the words on hover, and on the page, where the comment marks them.
    return (
      <WithTooltip label={state === 'here' ? `On “${shown}”` : `On “${shown}” · ${SINCE[state]}`} wrapperClassName="flex shrink-0">
        <span data-quoted={words ? state : 'part'} className={cn('flex', marked ? 'text-warning-default' : 'text-text-muted')}>
          <IconHighlight size={14} stroke={1.5} aria-label={`On “${shown}”`} />
        </span>
      </WithTooltip>
    )
  }
  return (
    <div
      data-quoted={words ? state : 'part'}
      className={cn('flex w-full min-w-0 flex-col gap-0.5', ABOVE_NAME_BAR_CLASSES, marked ? 'border-warning-default' : 'border-border-default')}
    >
      {words ? (
        <WithTooltip label={words} wrapperClassName="flex min-w-0">
          <p className={cn('line-clamp-2 text-caption', state === 'gone' ? 'text-text-muted line-through' : 'text-text-secondary')}>{words}</p>
        </WithTooltip>
      ) : (
        <span className="flex min-w-0 items-center gap-1.5 text-caption text-text-secondary">
          {icon && <span className="flex shrink-0 text-text-muted">{icon}</span>}
          <span className="min-w-0 truncate">{label}</span>
        </span>
      )}
      {state !== 'here' && <span className="text-caption italic text-text-muted">{SINCE[state]}</span>}
    </div>
  )
}
