import type { ReactNode } from 'react'
import { IconMessage2 } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * The place where content will be once there is some, in two manners
 * (Katerina, 2026-09-09):
 *
 * - `page` — the whole page is empty: a 16px icon over a centred line of
 *   secondary text, **in the middle of its box both ways** (Katerina,
 *   2026-09-09: it sat near the top). It grows to the room a flex column
 *   gives it (`flex-1`) and centres inside that; a caller that draws it
 *   straight into a page hands it the height (`className="h-full"`).
 *   Peek's EmptyState (2026-08-28) otherwise; the default.
 * - `section` — one section of a page is empty, and the page has other
 *   things on it: the line alone, left-aligned, no icon. A section's
 *   emptiness is a line among the page's content, not a stage of its own.
 *   It is the quiet line — caption size in the muted colour, as a Field's
 *   helper line is — so beside rows it reads as "nothing here", not as one
 *   more row (Katerina, 2026-09-15: "not that intense", "smaller font").
 *
 * The message is the caller's — a shared component has no words of its own
 * for what is missing.
 */
export interface EmptyStateProps {
  /** 16px, stroke 1.5. A speech bubble when absent. Drawn for a `page` only. */
  icon?: ReactNode
  message: string
  /** `page` when the whole page is empty; `section` when one part of it is. */
  scope?: 'page' | 'section'
  className?: string
}

export function EmptyState({ icon, message, scope = 'page', className }: EmptyStateProps) {
  if (scope === 'section') {
    return <p className={cn('text-caption text-text-muted', className)}>{message}</p>
  }
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-2', className)}>
      <span className="text-text-secondary">{icon ?? <IconMessage2 size={16} stroke={1.5} />}</span>
      <p className="text-body-2 text-text-secondary text-center">{message}</p>
    </div>
  )
}
