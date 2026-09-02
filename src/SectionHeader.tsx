import { useState, type ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { SectionLabel } from './SectionLabel'

/**
 * The 32px row a section starts with (Peek's SectionHeader, 2026-09-01):
 * a SectionLabel, an optional collapse chevron that makes the whole row the
 * toggle, and actions that appear only while the row is hovered, as
 * IconButtons with tooltips.
 *
 * One API change from Peek's original, safe because no call site used the
 * old shape yet: the two hard-wired action slots (add, sort) became
 * `actions` — the caller brings the icon, the tooltip and the handler; the
 * header owns the hover reveal and stops the click from also toggling the
 * section. Peek's add/sort pair is the WithActions story, in its original
 * order.
 */
export interface SectionAction {
  /** 16px, stroke 1.5. */
  icon: ReactNode
  tooltip: string
  onClick: () => void
}

export interface SectionHeaderProps {
  title: string
  /** Collapsible: draws the chevron and makes the whole row the toggle. */
  chevron?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  /** Right-aligned, in the order given. */
  actions?: SectionAction[]
  /** `hover` reveals the actions only while the row is hovered; `always` keeps them. */
  showActions?: 'hover' | 'always'
  className?: string
}

export function SectionHeader({ title, chevron = false, isExpanded = true, onToggle, actions, showActions = 'hover', className }: SectionHeaderProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'flex h-[32px] items-center justify-between rounded-lg px-2 transition-colors',
        isHovered && 'bg-bg-hover',
        chevron && 'cursor-pointer',
        className,
      )}
      onClick={chevron ? onToggle : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex shrink-0 items-center gap-1">
        {chevron && (
          <IconChevronRight
            size={12}
            stroke={1.5}
            className={cn('text-text-secondary transition-transform duration-150', isExpanded && 'rotate-90')}
          />
        )}
        <SectionLabel>{title}</SectionLabel>
      </div>

      {(showActions === 'always' || isHovered) && actions && actions.length > 0 && (
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <IconButton
              key={action.tooltip}
              tooltip={action.tooltip}
              aria-label={action.tooltip}
              onClick={(event) => {
                event.stopPropagation()
                action.onClick()
              }}
            >
              {action.icon}
            </IconButton>
          ))}
        </div>
      )}
    </div>
  )
}
