import type { MouseEvent, ReactNode } from 'react'
import { CollapsibleSection } from './CollapsibleSection'
import { EmptyState } from './EmptyState'
import { NavItem } from './NavItem'
import { SectionHeader } from './SectionHeader'
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
  /** The row's "More options" menu: `MenuItem`s. */
  menu?: ReactNode
  /** Rows under this one. Their row folds them; open unless `defaultOpen` says otherwise. */
  children?: NavTreeNode[]
  defaultOpen?: boolean
}

/** A group heading over its rows: the top of the tree. */
export interface NavTreeGroup {
  id: string
  title: string
  nodes: NavTreeNode[]
}

export interface NavTreeProps {
  /** The quiet label over the groups. Absent, none is drawn. */
  title?: string
  /** `null` while the first read is on its way: a skeleton in the rows' place. */
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

function holds(nodes: NavTreeNode[], id: string | undefined): boolean {
  return id !== undefined && nodes.some((node) => node.id === id || holds(node.children ?? [], id))
}

function Row({ node, selected, onSelect }: { node: NavTreeNode } & Pick<NavTreeProps, 'selected' | 'onSelect'>) {
  return (
    <NavItem
      href={node.href}
      label={node.label}
      icon={node.icon}
      count={node.count}
      countLabel={node.countLabel}
      hint={node.hint}
      menu={node.menu}
      active={node.id === selected}
      defaultOpen={node.defaultOpen ?? true}
      onClick={onSelect ? (event) => onSelect(node, event) : undefined}
    >
      {node.children?.length
        ? node.children.map((child) => <Row key={child.id} node={child} selected={selected} onSelect={onSelect} />)
        : undefined}
    </NavItem>
  )
}

/**
 * A sidebar's tree, from one nested list (Katerina, 2 October: Leaf's folder
 * tree): a quiet label, then each group as the standard heading folding its
 * rows, lightly indented under its title; rows under rows to any depth, each
 * row a link whose icon becomes the arrow that folds what is under it. Only
 * the group that holds the current row starts open.
 */
export function NavTree({ title, groups, selected, onSelect, emptyMessage, storageKey }: NavTreeProps) {
  return (
    <>
      {title && <SectionHeader title={title} look="quiet" className="mt-4 shrink-0" />}
      {groups === null ? (
        <SkeletonList rows={5} />
      ) : groups.length === 0 ? (
        // Level with the rows: a row pads itself, so the line takes a row's inset (Katerina, 14 September).
        <div className="px-2 py-1">
          <EmptyState scope="section" message={emptyMessage} />
        </div>
      ) : (
        groups.map((group) => (
          <CollapsibleSection
            key={group.id}
            title={group.title}
            indent
            defaultOpen={holds(group.nodes, selected)}
            storageKey={storageKey ? `${storageKey}.${group.id}` : undefined}
            className="mt-2 shrink-0"
            contentClassName="gap-px"
          >
            {group.nodes.map((node) => (
              <Row key={node.id} node={node} selected={selected} onSelect={onSelect} />
            ))}
          </CollapsibleSection>
        ))
      )}
    </>
  )
}
