import type { ReactNode } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn } from './cn'
import { MENU_TRIGGER_CLASSES } from './looks'
import { Menu } from './Menu'

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
  /**
   * The menu the title opens: `MenuItem`s — the column's views (Katerina,
   * 5 October: Peek's Topics column, Topics or Folders). The title and its
   * chevron are then one button, lit under the pointer; the chevron is drawn.
   */
  titleMenu?: ReactNode
  /** The column's own buttons, at the right edge: IconButtons with tooltips, 4px apart. */
  actions?: ReactNode
  className?: string
}

export function ContainerHeader({ title, chevron = false, titleMenu, actions, className }: ContainerHeaderProps) {
  const text = typeof title === 'string'
  const name = (
    <div className={cn('flex items-center gap-1', text ? 'shrink-0' : 'min-w-0 flex-1')}>
      {text ? <span className="whitespace-nowrap text-body-2-strong text-text-primary">{title}</span> : <div className="min-w-0 flex-1">{title}</div>}
      {(chevron || titleMenu != null) && <IconChevronDown size={12} stroke={1.5} className="shrink-0 text-text-secondary" />}
    </div>
  )
  return (
    // The title 16px in, where the column's content starts (Katerina, 7 October; it was 20px).
    // With a title menu the bar gives the button 6px of its left padding
    // (pl-2.5 + the button's px-1.5 = pl-4): the words stay where a title's
    // are, and the fill is inside the bar — a negative margin had it clipped
    // (Katerina, 5 October).
    <div className={cn('flex h-12 shrink-0 items-center justify-between overflow-hidden border-b border-border-subtle py-2 pr-4', titleMenu != null ? 'pl-2.5' : 'pl-4', className)}>
      <div className={cn('flex items-center gap-2 overflow-hidden', text ? 'shrink-0' : 'min-w-0 flex-1')}>
        {titleMenu != null ? (
          <Menu
            trigger={
              <BaseButton type="button" className={cn('flex min-w-0 items-center px-1.5 py-1', MENU_TRIGGER_CLASSES)}>
                {name}
              </BaseButton>
            }
          >
            {titleMenu}
          </Menu>
        ) : (
          name
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center justify-end gap-3">
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        </div>
      )}
    </div>
  )
}
