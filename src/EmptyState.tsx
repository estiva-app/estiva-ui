import type { ReactNode } from 'react'
import { IconMessage2 } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * Peek's EmptyState (2026-08-28), verbatim: a 16px icon over a centred line
 * of secondary text. The message is the caller's — a shared component has no
 * words of its own for what is missing.
 */
export interface EmptyStateProps {
  /** 16px, stroke 1.5. A speech bubble when absent. */
  icon?: ReactNode
  message: string
  className?: string
}

export function EmptyState({ icon, message, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col gap-2 items-center', className)}>
      <span className="text-text-secondary">{icon ?? <IconMessage2 size={16} stroke={1.5} />}</span>
      <p className="text-body-2 text-text-secondary text-center">{message}</p>
    </div>
  )
}
