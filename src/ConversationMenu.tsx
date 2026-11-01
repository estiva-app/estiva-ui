import type { ReactElement, ReactNode } from 'react'
import { IconCircleCheck, IconCircleDashed, IconDotsVertical } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuSeparator } from './Menu'

export interface ConversationMenuProps {
  /** Resolved: the menu offers Reopen in place of Resolve. */
  resolved?: boolean
  onResolve?: () => void
  onReopen?: () => void
  /** The app's own rows, between Resolve and Edit: `MenuItem`s. */
  children?: ReactNode
  /** Offered on your own only. */
  onEdit?: () => void
  /** Offered on your own only; the card asks before it deletes. */
  onDelete?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The button that opens it: a `ToolbarButton` inside `ConversationActions`. Absent: an `IconButton`. */
  trigger?: ReactElement
}

/**
 * The ⋯ menu of a comment or a reply: Resolve or Reopen and the app's own rows, then Edit and Delete on your own.
 * A card offers it only when it has a row to show.
 * Peek's, moved with the conversation; its "Utilities" heading went, as the kit names no app's furniture.
 */
export function ConversationMenu({ resolved = false, onResolve, onReopen, children, onEdit, onDelete, open, onOpenChange, trigger }: ConversationMenuProps) {
  const resolves = resolved ? onReopen : onResolve
  return (
    <Menu
      trigger={
        trigger ?? (
          <IconButton tooltip="More actions" aria-label="More actions">
            <IconDotsVertical size={16} stroke={1.5} />
          </IconButton>
        )
      }
      align="right"
      open={open}
      onOpenChange={onOpenChange}
      className="w-[244px]"
    >
      {resolves &&
        (resolved ? (
          <MenuItem leading={<IconCircleDashed size={16} stroke={1.5} className="text-text-secondary" />} label="Reopen" onClick={onReopen} />
        ) : (
          <MenuItem leading={<IconCircleCheck size={16} stroke={1.5} className="text-text-secondary" />} label="Resolve" onClick={onResolve} />
        ))}
      {children}
      {/* Edit and Delete are one group, as in Peek; the line only between two groups that are both there. */}
      {(resolves || children) && (onEdit || onDelete) && <MenuSeparator />}
      {onEdit && <MenuItem label="Edit" onClick={onEdit} />}
      {onDelete && <MenuItem label="Delete" destructive onClick={onDelete} />}
    </Menu>
  )
}
