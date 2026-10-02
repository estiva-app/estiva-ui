import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { CollapsibleSection } from './CollapsibleSection'
import { EmptyState } from './EmptyState'
import { NavItem } from './NavItem'
import { SectionHeader, type SectionAction } from './SectionHeader'
import { SkeletonList } from './Skeleton'

/** One row of the tree, and the rows under it. */
export interface NavTreeNode {
  id: string
  label: string
  href: string
  /** 16px, stroke 1.5. */
  icon?: ReactNode
  /** `0` or absent renders no counter. */
  count?: number
  /** What the count counts, for the tooltip. */
  countLabel?: string
  /** Shown only while the row is pointed at or focused, left of the count: a neutral `Chip`, typically. */
  hint?: ReactNode
  /** Something new here: NavItem's `unread`. */
  unread?: boolean
  /** With `unread`: the warning badge in the dot's place. */
  urgent?: boolean
  /** The row's "More options" menu: `MenuItem`s. */
  menu?: ReactNode
  /**
   * Rows under this one. `null` while they are being read: the row has its
   * arrow, and a skeleton under it once open. Absent with `hasChildren`, the
   * same — for rows read only when the row opens.
   */
  children?: NavTreeNode[] | null
  /** The row has rows under it that are not read yet: it gets its arrow, and `onOpenChange` says when to read them. */
  hasChildren?: boolean
  /** Said under the row, level with its rows, in place of them: "Nothing in this yet.", "This could not be read." The caller's words. */
  childrenMessage?: string
  defaultOpen?: boolean
  /** The caller owns whether its rows are open. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** A group heading over its rows: the top of the tree. */
export interface NavTreeGroup {
  id: string
  title: string
  /** The rows. `null` while they are being read: a skeleton in their place. */
  nodes: NavTreeNode[] | null
  /** Said in the rows' place, level with them: "Nothing in this yet.", "This could not be read." The caller's words. */
  message?: string
  /** Beside the title, always shown: an `UnreadDot`, typically. */
  trailing?: ReactNode
  /** Beside the title, shown on hover or focus: "Open", typically. */
  actions?: SectionAction[]
  defaultOpen?: boolean
  /** The caller owns whether the group is open. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * The pointer rests on the group, or the keyboard reaches it: read its rows
   * now, so opening it draws them. Resting, not passing — a pointer sweeping
   * down the column calls nothing.
   */
  onIntent?: () => void
}

export interface NavTreeProps {
  /** The quiet label over the groups. Absent, none is drawn. */
  title?: string
  /** Beside the label, always shown: "New", typically. */
  titleActions?: SectionAction[]
  /** `null` while the first read is on its way: a skeleton in the groups' place. */
  groups: NavTreeGroup[] | null
  /** The row that is current: `active`, and its group starts open. */
  selected?: string
  /** A row was clicked. A router app prevents the default and navigates. */
  onSelect?: (node: NavTreeNode, event: MouseEvent<HTMLAnchorElement>) => void
  /** What to say when there are no groups. The words are the caller's. */
  emptyMessage: string
  /** Remember each group open or closed in this browser, under this key and the group's id. The app prefixes it. */
  storageKey?: string
}

/** How long the pointer rests on a group before `onIntent` (Peek's FolderTree, 150ms). */
export const NAV_TREE_INTENT_MS = 150

function holds(nodes: NavTreeNode[] | null, id: string | undefined): boolean {
  return !!nodes && id !== undefined && nodes.some((node) => node.id === id || holds(node.children ?? null, id))
}

/** A line in the rows' place: level with the rows, which pad themselves (Katerina, 14 September). */
function Line({ message }: { message: string }) {
  return (
    <div className="px-2 py-1">
      <EmptyState scope="section" message={message} />
    </div>
  )
}

function Row({ node, selected, onSelect }: { node: NavTreeNode } & Pick<NavTreeProps, 'selected' | 'onSelect'>) {
  const under =
    node.childrenMessage !== undefined ? (
      <Line message={node.childrenMessage} />
    ) : node.children?.length ? (
      node.children.map((child) => <Row key={child.id} node={child} selected={selected} onSelect={onSelect} />)
    ) : node.children === null || (node.hasChildren && node.children === undefined) ? (
      <SkeletonList rows={2} />
    ) : undefined
  return (
    <NavItem
      href={node.href}
      label={node.label}
      icon={node.icon}
      count={node.count}
      countLabel={node.countLabel}
      hint={node.hint}
      unread={node.unread}
      urgent={node.urgent}
      menu={node.menu}
      active={node.id === selected}
      defaultOpen={node.defaultOpen ?? true}
      open={node.open}
      onOpenChange={node.onOpenChange}
      onClick={onSelect ? (event) => onSelect(node, event) : undefined}
    >
      {under}
    </NavItem>
  )
}

function Group({ group, selected, onSelect, storageKey }: { group: NavTreeGroup } & Pick<NavTreeProps, 'selected' | 'onSelect' | 'storageKey'>) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const intent = group.onIntent
  return (
    <div
      className="shrink-0"
      onPointerEnter={intent ? () => { clearTimeout(timer.current); timer.current = setTimeout(intent, NAV_TREE_INTENT_MS) } : undefined}
      onPointerLeave={intent ? () => clearTimeout(timer.current) : undefined}
      onFocus={intent}
    >
      <CollapsibleSection
        title={group.title}
        indent
        defaultOpen={group.defaultOpen ?? holds(group.nodes, selected)}
        open={group.open}
        onOpenChange={group.onOpenChange}
        storageKey={storageKey ? `${storageKey}.${group.id}` : undefined}
        trailing={group.trailing}
        actions={group.actions}
        className="mt-2 shrink-0"
        contentClassName="gap-px"
      >
        {group.message !== undefined ? (
          <Line message={group.message} />
        ) : group.nodes === null ? (
          <SkeletonList rows={3} />
        ) : (
          group.nodes.map((node) => <Row key={node.id} node={node} selected={selected} onSelect={onSelect} />)
        )}
      </CollapsibleSection>
    </div>
  )
}

/**
 * A sidebar's tree, from one nested list (Katerina, 2 October: Leaf's folder
 * tree, then Peek's and Ship's): a quiet label with its actions, then each
 * group as the standard heading folding its rows, lightly indented under its
 * title; rows under rows to any depth, each row a link whose icon becomes the
 * arrow that folds what is under it. Groups and rows can be read when they
 * open. Only the group that holds the current row starts open, unless the
 * caller owns it.
 */
export function NavTree({ title, titleActions, groups, selected, onSelect, emptyMessage, storageKey }: NavTreeProps) {
  return (
    <>
      {title && <SectionHeader title={title} look="quiet" showActions="always" actions={titleActions} className="mt-4 shrink-0" />}
      {groups === null ? (
        <SkeletonList rows={5} />
      ) : groups.length === 0 ? (
        <Line message={emptyMessage} />
      ) : (
        groups.map((group) => <Group key={group.id} group={group} selected={selected} onSelect={onSelect} storageKey={storageKey} />)
      )}
    </>
  )
}
