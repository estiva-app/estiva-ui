import type { ReactNode } from 'react'
import { cn } from './cn'
import { TIME_CLASSES } from './looks'

const TONE_CLASSES = {
  muted: 'text-text-muted',
  secondary: 'text-text-secondary',
  success: 'text-success-default',
} as const

export interface MetaTextProps {
  children: ReactNode
  /** `muted` for a time; `secondary` and `success` for counts of open and resolved. */
  tone?: keyof typeof TONE_CLASSES
  /** `chip` beside a small name, as in a thread's resolve line. */
  size?: 'caption' | 'chip'
  /** Placement only: `shrink-0`, `contents`. */
  className?: string
}

/**
 * The small figure beside a name: a comment's time, a resolve line's time, a count. One line; in Signal the mono
 * micro-type with even digits. Peek's, moved with the conversation (Katerina, 31 October: Peek's way in every app).
 */
export function MetaText({ children, tone = 'muted', size = 'caption', className }: MetaTextProps) {
  return (
    <span
      className={cn(
        size === 'chip' ? 'text-chip font-normal' : 'text-caption',
        TONE_CLASSES[tone],
        TIME_CLASSES,
        className,
      )}
    >
      {children}
    </span>
  )
}
