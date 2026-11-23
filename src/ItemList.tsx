import type { MouseEvent, ReactNode } from 'react'
import { Avatar } from './Avatar'
import type { AvatarGroupMember } from './AvatarGroup'
import { ListTable, ListTableRow, type ListTableColumn } from './ListTable'
import { MembersPill } from './MembersPill'
import { ProgressRing, StatusIcon } from './LinkParts'
import type { LinkedStatus } from './linked'

/** One person on a row: who owns it, or who changed it last. */
export interface ItemListPerson {
  name?: string
  picture?: string
  bot?: boolean
}

/**
 * One row of an {@link ItemList}. Every fact sits in the same column whatever the row's kind. Each fact is one of three:
 * given, it is drawn; `null`, this kind has none and the cell is empty; left out (`undefined`), it is not read yet and
 * the cell is the kit's dash.
 */
export interface ItemListRow {
  /** Its address or id: the row's key. */
  id: string
  /** Its name, one line. */
  label: string
  /** 16px, before the name: its kind (`KindIcon`). */
  icon: ReactNode
  /** Where it opens. Absent: nowhere, and its name is words, not a link. */
  href?: string
  /** Another app's or site's: it opens there, in a new tab. */
  external?: boolean
  /** Under the name, one line: what it is about, what it is in, or what type it is. */
  description?: string
  /** Its status in words, its shape before them. */
  status?: LinkedStatus | null
  /** One face (`person`), or the people in a place as the members pill (`members`: up to three faces and how many). */
  people?: { person: ItemListPerson } | { members: { faces: AvatarGroupMember[]; count: number } } | null
  /** Done of all, as the small ring. */
  progress?: { done: number; total: number } | null
  /** When it last moved, in the app's words: "Ana, 1h ago", "3d ago". */
  when?: string | null
  /** Rows under it, in the same columns, folding. */
  rows?: ItemListRow[]
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * The four columns, the same for every kind, so like facts stack down a page holding several lists (Katerina,
 * 18 November: "relevant items are aligned"). Who and when give way first in a narrow window.
 */
const COLUMNS: ListTableColumn[] = [
  { label: 'Status', width: 'medium' },
  { label: 'People', width: 'large', keep: 'low' },
  { label: 'Progress', width: 'small' },
  { label: 'When', width: 'medium', keep: 'low' },
]

/** A fact this kind does not have: `ListTableRow` draws its dash only for an absent cell, so an empty string is an empty cell. */
const NONE = ''

/** A fact as its cell: drawn, empty (`null`), or the dash (`undefined`, not read yet). */
function cell<T>(fact: T | null | undefined, draw: (fact: T) => ReactNode): ReactNode {
  if (fact === undefined) return undefined
  if (fact === null) return NONE
  return draw(fact)
}

/** A status it cannot change here: its shape and its words, as `LinkPickers` writes one read-only. */
function StatusWords({ status }: { status: LinkedStatus }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-caption text-text-secondary">
      <StatusIcon colour={status.colour} />
      {status.label}
    </span>
  )
}

function People({ people }: { people: NonNullable<ItemListRow['people']> }) {
  if ('person' in people) {
    const { person } = people
    return <Avatar name={person.name} src={person.picture} bot={person.bot} size={16} label={person.name} />
  }
  const { members } = people
  return members.count === 0 ? '0' : <MembersPill readOnly members={members.faces.slice(0, 3)} count={members.count} />
}

/**
 * **Items in four columns**: each row its kind's icon and name, then **Status**, **People**, **Progress** and **When**,
 * the same columns for every kind, so a page listing several kinds in several lists keeps each fact in one column down
 * the page. A fact a kind does not have is an empty cell; one not read yet, the dash. No headings on screen: the heading
 * over the list names it (`ListSection`).
 *
 * Ship's team and initiative pages (`WorkList`) and Leaf's initiative page (`FileRows`) each built it on `ListTable`,
 * with the same widths and the same empty-string trick (review of 23 November, C4). Its status is the kit's words, the
 * ones `LinkPickers` writes for a status it cannot change (C3: one status part in both lists).
 */
export function ItemList({ 'aria-label': label, rows }: { 'aria-label': string; rows: ItemListRow[] }) {
  const draw = (row: ItemListRow): ReactNode => (
    <ListTableRow
      key={row.id}
      {...(row.href ? { href: row.href, external: !!row.external } : {})}
      label={row.label}
      {...(row.description ? { description: row.description } : {})}
      icon={row.icon}
      {...(row.onClick ? { onClick: row.onClick } : {})}
      cells={[
        cell(row.status, (status) => <StatusWords status={status} />),
        cell(row.people, (people) => <People people={people} />),
        cell(row.progress, (progress) => <ProgressRing done={progress.done} total={progress.total} />),
        cell(row.when, (when) => when),
      ]}
    >
      {row.rows?.length ? row.rows.map(draw) : undefined}
    </ListTableRow>
  )
  return (
    <ListTable aria-label={label} columns={COLUMNS} headings={false}>
      {rows.map(draw)}
    </ListTable>
  )
}
