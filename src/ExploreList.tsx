import { useState, type MouseEvent, type ReactNode } from 'react'
import type { AvatarGroupMember } from './AvatarGroup'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { ListTable, ListTableRow, type ListTableColumn } from './ListTable'
import { MembersPill } from './MembersPill'
import { Panel } from './Panel'
import { SearchInput } from './SearchInput'
import { SkeletonList } from './Skeleton'
import { Tabs } from './Tabs'

/** The four tabs, in their order. */
export type ExploreTab = 'all' | 'yours' | 'others' | 'archived'

const TAB_ORDER: ExploreTab[] = ['all', 'yours', 'others', 'archived']

/** Every word the page says about what it lists. */
export interface ExploreWords {
  /** The bar's title. */
  title: string
  tabs: Record<ExploreTab, string>
  /** What an empty tab says; with nothing listed at all, every open tab but Archived says `all`'s. */
  empty: Record<ExploreTab, string>
  /** The search field's placeholder and name. */
  find: string
  noMatch: (asked: string) => string
  failed: string
  signedOut: string
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * Every word of the page from what it lists, one and many, and the article before one: `exploreWords({ one: 'item',
 * many: 'items', a: 'an' })` says "Explore items", "Your items", "Find an item", "No item matches “…”." and the rest.
 */
export function exploreWords({ one, many, a }: { one: string; many: string; a: 'a' | 'an' }): ExploreWords {
  return {
    title: `Explore ${many}`,
    tabs: { all: 'All', yours: `Your ${many}`, others: `Other ${many}`, archived: 'Archived' },
    empty: {
      all: `No ${many} yet.`,
      yours: `You’re in no ${many} yet.`,
      others: `No other ${many}.`,
      archived: `No archived ${many}.`,
    },
    find: `Find ${a} ${one}`,
    noMatch: (asked) => `No ${one} matches “${asked}”.`,
    failed: `${capital(many)} didn’t load.`,
    signedOut: `Sign in to see ${many}.`,
  }
}

/** One place on the page. A fact left out (`undefined`) is not read yet: the kit's dash. */
export interface ExploreRow {
  /** Its address: the row's key, and what `joining` names. */
  id: string
  label: string
  href?: string
  /** Under the name, one line: its summary. */
  description?: string
  /** Its team's name. */
  team?: string
  /** Who is in it: up to three faces and how many. */
  members?: { faces: AvatarGroupMember[]; count: number }
  /** When anything last happened in it, in the app's words ("3d ago"). */
  active?: string
  /** You are in it: no Join. */
  yours: boolean
  /** Archived: no Join. */
  archived: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

/** The lists by tab; `loading` before they are read, `failed` when they were not, `signedOut` with nobody signed in. */
export type ExploreLists = Record<ExploreTab, ExploreRow[]> | 'loading' | 'failed' | 'signedOut'

export interface ExploreListProps {
  /** The lists by tab, or what stands in their place. */
  lists: ExploreLists
  tab: ExploreTab
  onTab: (tab: ExploreTab) => void
  /** Try again, on a page that did not load. */
  onRetry: () => void
  /** Join a live place you are not in. */
  onJoin: (row: ExploreRow) => void
  /** The ids whose Join is on its way: their button waits. */
  joining?: ReadonlySet<string>
  /** Every word it says: `exploreWords` makes them from what it lists. */
  words: ExploreWords
  /** The bar's title, when it is not `words.title` ("Team one · Initiatives"). */
  title?: string
  /** Each row's icon, its kind's: the one the column beside the page draws for it. */
  icon: ReactNode
  /** What the search starts with, for a story. */
  query?: string
}

/** Its team stays longest; who is in it and when it was last active give way first in a narrow window (Katerina, 16 November). */
const COLUMNS: ListTableColumn[] = [
  { label: 'Team', width: 'large' },
  // The members pill's width: three faces and the number (Katerina, 17 November).
  { label: 'Members', width: 'large', keep: 'low' },
  { label: 'Active', width: 'medium', keep: 'low' },
]

const wordsOf = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/**
 * Found when every typed word starts a word of its name, in any order: search matches word starts only, everywhere (Miky, 19 October).
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/search-matches-every-word-as-a-word-start.md
 */
export function findsByWordStart(name: string, query: string): boolean {
  const names = wordsOf(name)
  return wordsOf(query).every((word) => names.some((one) => one.startsWith(word)))
}

/**
 * **Explore**: every place you can open, to find one and join it, as Slack's browse channels (Miky, 3 November). The
 * page's panel with its title; tabs All, Yours, Others and Archived with their counts, a search beside them; one row per
 * place with its team, who is in it and when it was last active, and Join on a live one you are not in. It opens on
 * All (Miky, 10 November); a page that did not load says so with Try again.
 *
 * Peek's Explore initiatives, Ship's and Leaf's each drew it, the same words and columns, and laid the tabs and search
 * row out by hand (review of 23 November, C6); Katerina asked for it in the kit the same day.
 */
export function ExploreList({ lists, tab, onTab, onRetry, onJoin, joining, words, title = words.title, icon, query: firstQuery = '' }: ExploreListProps) {
  const [query, setQuery] = useState(firstQuery)
  const asked = query.trim()
  return (
    // 24px between the tabs and the list, the kit's step between a page's parts (Katerina, 16 November: 16 was too tight).
    <Panel title={title} bodyClassName="flex flex-col gap-6 px-6 py-5">
      {lists === 'loading' ? (
        <SkeletonList rows={8} />
      ) : lists === 'signedOut' ? (
        <EmptyState scope="page" message={words.signedOut} />
      ) : lists === 'failed' ? (
        <EmptyState icon={icon} scope="page" message={words.failed} action={{ label: 'Try again', onClick: onRetry }} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs<ExploreTab> aria-label={title} tabs={TAB_ORDER.map((id) => ({ id, label: words.tabs[id], count: lists[id].length }))} active={tab} onChange={onTab} />
            <div className="w-64">
              <SearchInput placeholder={words.find} aria-label={words.find} value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>
          <Rows lists={lists} tab={tab} asked={asked} words={words} title={title} icon={icon} onJoin={onJoin} joining={joining} />
        </>
      )}
    </Panel>
  )
}

function Rows({ lists, tab, asked, words, title, icon, onJoin, joining }: { lists: Record<ExploreTab, ExploreRow[]>; tab: ExploreTab; asked: string; words: ExploreWords; title: string; icon: ReactNode; onJoin: (row: ExploreRow) => void; joining: ReadonlySet<string> | undefined }) {
  const rows = asked ? lists[tab].filter((row) => findsByWordStart(row.label, asked)) : lists[tab]
  if (rows.length === 0) {
    return <EmptyState scope="section" message={asked ? words.noMatch(asked) : lists.all.length === 0 && tab !== 'archived' ? words.empty.all : words.empty[tab]} />
  }
  return (
    <ListTable aria-label={title} columns={COLUMNS} end>
      {rows.map((row) => (
        <ListTableRow
          key={row.id}
          {...(row.href ? { href: row.href } : {})}
          label={row.label}
          {...(row.description ? { description: row.description } : {})}
          icon={icon}
          {...(row.onClick ? { onClick: row.onClick } : {})}
          cells={[
            row.team,
            row.members === undefined ? undefined : row.members.count === 0 ? '0' : <MembersPill readOnly members={row.members.faces.slice(0, 3)} count={row.members.count} />,
            row.active,
          ]}
          end={
            // Outlined on a list's rows, where many are on screen; a place's own header has it primary (16 November).
            !row.yours && !row.archived && (
              <Button size="small" variant="outlined" onClick={() => onJoin(row)} disabled={joining?.has(row.id) ?? false}>
                Join
              </Button>
            )
          }
        />
      ))}
    </ListTable>
  )
}
