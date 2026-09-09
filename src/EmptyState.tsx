import type { ReactNode } from 'react'
import { IconMessage2 } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * The place where content will be once there is some, in two manners
 * (Katerina, 2026-09-09):
 *
 * - `page` — the whole page is empty: a 16px icon over a centred line of
 *   secondary text. Peek's EmptyState (2026-08-28), verbatim; the default,
 *   so nothing that took the component before this moves.
 * - `section` — one section of a page is empty, and the page has other
 *   things on it: the line alone, left-aligned, no icon. A section's
 *   emptiness is a line among the page's content, not a stage of its own.
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
    return <p className={cn('text-body-2 text-text-secondary', className)}>{message}</p>
  }
  return (
    <div className={cn('flex flex-col gap-2 items-center', className)}>
      <span className="text-text-secondary">{icon ?? <IconMessage2 size={16} stroke={1.5} />}</span>
      <p className="text-body-2 text-text-secondary text-center">{message}</p>
    </div>
  )
}
