import type { ReactNode } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * The bar across the top of a column — a list, a thread, a side panel: its
 * title, and the buttons that act on the whole column at the right edge.
 * Peek's ContainerHeader, moved into the package exactly as it looks
 * (Katerina, 2026-09-18, UIG-13).
 *
 * 48px tall, a hairline under it. A string title is one line in
 * `body-2-strong` and keeps its width; anything else — an EditableText, a
 * title over a caption — takes the room that is left and is drawn as given.
 *
 * Not a SectionHeader: that is the 32px row one section of a column starts
 * with. This is the column's own bar, one per column.
 */
export interface ContainerHeaderProps {
  /** A string keeps the one-line treatment; a node is drawn as given. */
  title: ReactNode
  /** A chevron after the title, for a title that opens something. */
  chevron?: boolean
  /** The column's own buttons, at the right edge: IconButtons with tooltips, 4px apart. */
  actions?: ReactNode
  className?: string
}

export function ContainerHeader({ title, chevron = false, actions, className }: ContainerHeaderProps) {
  const text = typeof title === 'string'
  return (
    <div className={cn('flex h-12 shrink-0 items-center justify-between overflow-hidden border-b border-border-subtle py-2 pr-4 pl-5', className)}>
      <div className={cn('flex items-center gap-2 overflow-hidden', text ? 'shrink-0' : 'min-w-0 flex-1')}>
        <div className={cn('flex items-center gap-1', text ? 'shrink-0' : 'min-w-0 flex-1')}>
          {text ? <span className="whitespace-nowrap text-body-2-strong text-text-primary">{title}</span> : <div className="min-w-0 flex-1">{title}</div>}
          {chevron && <IconChevronDown size={12} stroke={1.5} className="shrink-0 text-text-secondary" />}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center justify-end gap-3">
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        </div>
      )}
    </div>
  )
}
