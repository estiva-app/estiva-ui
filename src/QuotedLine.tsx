import { cn } from './cn'
import { Link } from './Link'
import { WithTooltip } from './Tooltip'

export interface QuotedLineProps {
  /** The words the comment is on, as they were quoted. */
  words?: string
  /** `here`: still in the text. `reworded`: changed since. `gone`: their part was deleted from the page. */
  state?: 'here' | 'reworded' | 'gone'
  /** A part with no words, a picture or a whole block: what it is, in the app's words ("Picture: plan.png"). */
  label?: string
  /**
   * Where the words are in their file, when the reader is not looking at it: the words open it there. The page that
   * shows the file beside its comments gives none. Navigation is yours, as for every `Link`.
   */
  href?: string
  /** `href` is another app's: it opens in a new tab. */
  external?: boolean
}

const SINCE = { reworded: 'Changed since', gone: 'Deleted from the page' } as const

/**
 * What a comment on a part of the page is on: its words, two lines at most, in the page's own highlight, so the two
 * read as one. ConversationCard puts it under the name, above the comment's words ("above the message, not above the
 * person": Katerina, 1 November). Words changed since or deleted lose the highlight and say so; a part with no words
 * gives its name, on the grey: it is not words of the page. With `href`, the words are the way to them in their file
 * (Miky, 10 November: a reader in another app reaches the sentence in one click, as the part card's link did).
 */
export function QuotedLine({ words, state = 'here', label, href, external }: QuotedLineProps) {
  const shown = words ?? label ?? ''
  // The page's yellow only for words still in it; a part's name is not words of the page, so it takes the grey (Katerina, 3 November).
  const inThePage = !!words && state === 'here'
  const mark = <mark className={cn('rounded-sm px-0.5 text-text-primary [box-decoration-break:clone]', inThePage ? 'bg-warning-muted' : 'bg-bg-inset text-text-secondary', state === 'gone' && 'line-through')}>{shown}</mark>
  return (
    <div data-quoted={words ? state : 'part'} className="flex w-full min-w-0 flex-col gap-0.5">
      <WithTooltip label={shown} wrapperClassName="flex min-w-0">
        <p className="line-clamp-2 text-caption text-text-secondary">
          {href ? (
            <Link href={href} variant="quiet" external={external}>
              {mark}
            </Link>
          ) : (
            mark
          )}
        </p>
      </WithTooltip>
      {state !== 'here' && <span className="text-caption italic text-text-muted">{SINCE[state]}</span>}
    </div>
  )
}
