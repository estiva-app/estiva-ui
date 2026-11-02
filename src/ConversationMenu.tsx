import type { ReactElement, ReactNode } from 'react'
import { IconCircleCheck, IconCircleDashed, IconDotsVertical } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuSection, MenuSeparator } from './Menu'

export interface ConversationMenuProps {
  /** Resolved: the menu offers Reopen in place of Resolve. */
  resolved?: boolean
  onResolve?: () => void
  onReopen?: () => void
  /** Beside Resolve, how the app's box resolves too, as its key hint: Peek's "->". */
  resolveHint?: string
  /** The app's own rows, after Resolve: `MenuItem`s. */
  children?: ReactNode
  /** A heading over Resolve and the app's rows, in the app's words: Peek's "Utilities". */
  label?: string
  /** Offered on your own only. */
  onEdit?: () => void
  /** Edit's words: "Edit" by default; Peek's "Edit message". */
  editLabel?: string
  /** The app's own rows after Edit, before Delete: Peek's "View details". */
  after?: ReactNode
  /** Offered on your own only; the card asks before it deletes. */
  onDelete?: () => void
  /** Delete's words: "Delete" by default; Ship's "Delete message". */
  deleteLabel?: string
  /** Its own ⋯ button's name and tooltip, with no `trigger`: "More actions" by default; Ship's "Message actions". */
  moreLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The button that opens it: a `ToolbarButton` inside `ConversationActions`. Absent: an `IconButton`. */
  trigger?: ReactElement
}

/**
 * The ⋯ menu of a comment or a reply, in up to three groups: Resolve or Reopen and the app's rows; Edit on your own
 * and the app's rows after it; Delete on your own, apart, as it is destructive. A card offers it only when it has a
 * row to show. Peek's, moved with the conversation; what is Peek's own (its heading, its hint, its words, its rows)
 * Peek passes in, so its menu reads as it did (Katerina, 1 November).
 */
export function ConversationMenu({ resolved = false, onResolve, onReopen, resolveHint, children, label, onEdit, editLabel = 'Edit', after, onDelete, deleteLabel = 'Delete', moreLabel = 'More actions', open, onOpenChange, trigger }: ConversationMenuProps) {
  const resolves = resolved ? onReopen : onResolve
  const first = (resolves || children) && (
    <>
      {resolves &&
        (resolved ? (
          <MenuItem leading={<IconCircleDashed size={16} stroke={1.5} className="text-text-secondary" />} label="Reopen" onClick={onReopen} />
        ) : (
          <MenuItem leading={<IconCircleCheck size={16} stroke={1.5} className="text-text-secondary" />} label="Resolve" shortcut={resolveHint} onClick={onResolve} />
        ))}
      {children}
    </>
  )
  const middle = (onEdit || after) && (
    <>
      {onEdit && <MenuItem label={editLabel} onClick={onEdit} />}
      {after}
    </>
  )
  return (
    <Menu
      trigger={
        trigger ?? (
          <IconButton tooltip={moreLabel} aria-label={moreLabel}>
            <IconDotsVertical size={16} stroke={1.5} />
          </IconButton>
        )
      }
      align="right"
      open={open}
      onOpenChange={onOpenChange}
      className="w-[244px]"
    >
      {first && (label ? <MenuSection label={label}>{first}</MenuSection> : first)}
      {/* A line only between two groups that are both there. */}
      {first && middle && <MenuSeparator />}
      {middle}
      {onDelete && (first || middle) && <MenuSeparator />}
      {onDelete && <MenuItem label={deleteLabel} destructive onClick={onDelete} />}
    </Menu>
  )
}
