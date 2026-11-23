import type { ReactNode } from 'react'
import { SectionHeader } from './SectionHeader'

export interface ListSectionProps {
  /** The heading: what the list under it holds. */
  title: string
  /** How many it holds, beside the heading. Leave it out while the list is read: a count that is not known yet is not 0. */
  count?: number
  /** The list: a `ListTable`, `ItemList`, or the skeleton or empty line in its place. */
  children: ReactNode
  /** Marks for the app's own tests and photo runs. */
  [data: `data-${string}`]: string | boolean | undefined
}

/**
 * A list under its heading on a page: the kit's `SectionHeader` with its count, nothing on it to act on, and the list
 * 4px under it. A page's lists stack 24px apart in the page's own column.
 *
 * Peek's team page, Ship's team and initiative pages and Leaf's initiative page each wrapped the heading and its list
 * by hand, class for class (review of 23 November, C10); Katerina asked for it in the kit the same day.
 */
export function ListSection({ title, count, children, ...rest }: ListSectionProps) {
  return (
    <section {...rest} className="flex flex-col gap-1">
      <SectionHeader title={title} {...(count !== undefined ? { count } : {})} hover="none" />
      {children}
    </section>
  )
}
