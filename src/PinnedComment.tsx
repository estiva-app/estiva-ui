import type { ReactNode } from 'react'
import { Avatar } from './Avatar'
import { Card } from './Card'
import type { ConversationPerson } from './ConversationCard'
import { MetaText } from './MetaText'
import { exactTime, momentOf } from './threadCard'
import { WithTooltip } from './Tooltip'

export interface PinnedCommentProps {
  author: ConversationPerson
  /** When it was written, in the app's words, with its day: no day line stands above it here. */
  time: ReactNode
  /** When it was written, as a moment (ms since 1970): the time then says the exact date and time under the pointer, as a comment's does. */
  at?: number
  /** Its words, cut to one line: plain words read best. */
  words: ReactNode
  /** It was deleted; its replies stay. */
  deleted?: boolean
  /** It wasn't read, and nothing says it was deleted: "This comment can't be shown.", and its replies stay (ONE-9). */
  unseen?: boolean
}

/** What stands in a comment's place when it is gone: deleted, or not shown (SPEC §6.5). */
export const goneWords = (deleted: boolean) => (deleted ? 'This comment was deleted.' : 'This comment can’t be shown.')

/**
 * The comment a thread answers, pinned at the top of the replies column: who, when, and its first line, on a raised
 * card. Peek's pinned message, moved with the conversation.
 */
export function PinnedComment({ author, time, at: given, words, deleted = false, unseen = false }: PinnedCommentProps) {
  const at = momentOf(given)
  return (
    <Card fill="elevated" clip>
      {deleted || unseen ? (
        <p className="p-2 text-caption italic text-text-muted">{goneWords(deleted)}</p>
      ) : (
        <div className="flex flex-col p-2">
          <div className="flex items-center gap-2">
            <Avatar size={24} src={author.picture} alt={author.name} bot={author.bot} />
            <span className="min-w-0 truncate text-body-2-strong text-text-primary">{author.name}</span>
            <MetaText className="shrink-0">
              {at === undefined ? (
                time
              ) : (
                <WithTooltip label={exactTime(at)}>
                  <time dateTime={new Date(at).toISOString()}>{time}</time>
                </WithTooltip>
              )}
            </MetaText>
          </div>
          <div className="pb-2 pl-8 pr-2 pt-1">
            <div className="truncate text-caption text-text-secondary">{words}</div>
          </div>
        </div>
      )}
    </Card>
  )
}
