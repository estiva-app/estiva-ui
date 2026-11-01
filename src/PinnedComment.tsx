import type { ReactNode } from 'react'
import { Avatar } from './Avatar'
import { Card } from './Card'
import type { ConversationPerson } from './ConversationCard'
import { MetaText } from './MetaText'

export interface PinnedCommentProps {
  author: ConversationPerson
  /** When it was written, in the app's words, with its day: no day line stands above it here. */
  time: ReactNode
  /** Its words, cut to one line: plain words read best. */
  words: ReactNode
  /** It was deleted; its replies stay. */
  deleted?: boolean
}

/**
 * The comment a thread answers, pinned at the top of the replies column: who, when, and its first line, on a raised
 * card. Peek's pinned message, moved with the conversation.
 */
export function PinnedComment({ author, time, words, deleted = false }: PinnedCommentProps) {
  return (
    <Card fill="elevated" clip>
      {deleted ? (
        <p className="p-2 text-caption italic text-text-muted">This comment was deleted.</p>
      ) : (
        <div className="flex flex-col p-2">
          <div className="flex items-center gap-2">
            <Avatar size={24} src={author.picture} alt={author.name} />
            <span className="min-w-0 truncate text-body-2-strong text-text-primary">{author.name}</span>
            <MetaText className="shrink-0">{time}</MetaText>
          </div>
          <div className="pb-2 pl-8 pr-2 pt-1">
            <div className="truncate text-caption text-text-secondary">{words}</div>
          </div>
        </div>
      )}
    </Card>
  )
}
