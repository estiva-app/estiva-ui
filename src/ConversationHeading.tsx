import type { ReactNode } from 'react'
import { isPlainClick } from './AppProvider'
import { cn } from './cn'

export interface ConversationHeadingProps {
  /** What kind of place it is: a `KindIcon`, 16px. Drawn in the face's column, so the name lines up with the author's. */
  icon: ReactNode
  /** The place's name, cut to the column. */
  name: string
  /** Pressing the name opens the place. Without it (and without `href`) the name is plain text. */
  onOpen?: () => void
  /** Or a link to the place. With `onOpen` too, a plain click calls `onOpen` and the link only serves a new tab. */
  href?: string
  /** Placement only. */
  className?: string
}

const NAME = '-mx-1 min-w-0 truncate rounded px-1 text-left text-h4 text-text-primary'

/**
 * Where a conversation was said, above its first message, when one list mixes conversations from several places: the
 * place's icon in the face's column and its name beside it, which opens the place. Goes in a `ConversationCard`'s
 * `heading`, so it sits inside the card, as the Per-app prototype draws it (29 October). A press on the name opens the
 * place, never the thread: the card leaves a press on a button or a link alone.
 */
export function ConversationHeading({ icon, name, onOpen, href, className }: ConversationHeadingProps) {
  const label = href ? (
    <a
      href={href}
      // A plain click is the app's to route (onOpen); a new tab or window is the browser's.
      onClick={(event) => {
        if (!onOpen || !isPlainClick(event)) return
        event.preventDefault()
        onOpen()
      }}
      className={cn(NAME, 'hover:bg-bg-hover')}
    >
      {name}
    </a>
  ) : onOpen ? (
    <button type="button" onClick={onOpen} className={cn(NAME, 'hover:bg-bg-hover')}>
      {name}
    </button>
  ) : (
    <span className={NAME}>{name}</span>
  )
  return (
    <div data-conversation-heading className={cn('flex w-full items-center gap-2', className)}>
      <span aria-hidden className="flex size-6 shrink-0 items-center justify-center text-text-secondary">
        {icon}
      </span>
      {label}
    </div>
  )
}
