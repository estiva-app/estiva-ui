import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { MenuPanel } from '../../src/Menu'
import { SearchInput } from '../../src/SearchInput'
import { SectionHeader } from '../../src/SectionHeader'
import { Card } from '../../src/Card'
import { DetailedCard, ThingIcon } from '../widgets-2/proposed'
import { SkeletonList } from '../../src/Skeleton'
import { LeafCard, LeafSkeleton, PeekSkeleton, ShipSkeleton } from '../widgets-2/today'
import { ISSUE, ISSUES, PAGE, PAGES, PROJECT, PROJECTS, STATES, TOPIC, TOPICS, withSummary, type SummaryState, type Thing } from './fixtures'
import {
  LeafFilePage,
  LeafNewDocument,
  LeafRecentRow,
  PeekDeskRow,
  PeekDetails,
  PeekFileCard,
  PeekFilePage,
  PeekStartTopic,
  PickerRow,
  SearchRow,
  ShipBoardCard,
  ShipFilePage,
  ShipIssueRow,
  ShipIssueRowLoading,
  ShipNewIssue,
  ShipNewProject,
  ShipProjectCard,
  ShipProjectCardLoading,
  ShipRelatedRow,
  ShipTable,
  SummaryLine,
  type CaptionOption,
} from './places'

/**
 * The short summary, prototyped in every place it is written or shown
 * (project "A short summary on every file", milestone 1). One story per group
 * of places; columns are the states, rows the apps.
 */
const meta = {
  title: 'Short summary/Every place',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------ layout */

function Sheet({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-auto bg-bg-surface p-6 text-text-primary">
      <h2 className="text-h3">{title}</h2>
      {note && <div className="mt-1 max-w-3xl text-body-2 text-text-secondary">{note}</div>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

/** A row of the sheet: a label, then a cell per column, each `width` wide. */
function Row({ label, note, cells, width = 380 }: { label: string; note?: string; cells: ReactNode[]; width?: number }) {
  return (
    <div className="grid gap-4 border-t border-border-subtle py-4" style={{ gridTemplateColumns: `140px repeat(${cells.length}, ${width}px)` }}>
      <div>
        <div className="text-body-2-strong">{label}</div>
        {note && <div className="mt-1 text-caption text-text-secondary">{note}</div>}
      </div>
      {cells.map((cell, i) => (
        <div key={i} className="flex min-w-0 flex-col gap-3">
          {cell}
        </div>
      ))}
    </div>
  )
}

function Heads({ labels, width = 380 }: { labels: string[]; width?: number }) {
  return (
    <div className="grid gap-4 pb-2" style={{ gridTemplateColumns: `140px repeat(${labels.length}, ${width}px)` }}>
      <div />
      {labels.map((label) => (
        <div key={label} className="text-caption font-medium uppercase tracking-widest text-text-secondary">
          {label}
        </div>
      ))}
    </div>
  )
}

/** A file's own page sits in a frame the size of a narrow window. */
function Frame({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-base">{children}</div>
}

const PAGE_COLUMNS: { label: string; state: SummaryState; viewer: 'editor' | 'reader' }[] = [
  { label: 'Filled', state: 'filled', viewer: 'editor' },
  { label: 'Long, all of it', state: 'long', viewer: 'editor' },
  { label: 'Empty, can edit', state: 'empty', viewer: 'editor' },
  { label: 'Empty, can’t edit', state: 'empty', viewer: 'reader' },
  { label: 'Loading', state: 'loading', viewer: 'editor' },
  { label: 'Save refused', state: 'filled', viewer: 'editor' },
]

/* ------------------------------------------------------------ stories */

/** Under the title on the file's own page: the one place it shows whole, and where "Add a summary" lives. */
export const OnItsOwnPage: Story = {
  render: () => (
    <Sheet
      title="On the file’s own page"
      note="Under the title, all of it. Someone who can edit clicks it to change it; empty, they see a quiet “Add a summary”, and someone who can’t edit sees nothing. Peek writes it in Details (next story), so its “Add a summary” opens Details."
    >
      <Heads labels={PAGE_COLUMNS.map((c) => c.label)} />
      <Row
        label="Ship · issue"
        cells={PAGE_COLUMNS.map((c, i) => (
          <Frame key={i}>
            <ShipFilePage thing={ISSUE} state={c.state} viewer={c.viewer} editing={c.label === 'Save refused' ? 'refused' : 'none'} />
          </Frame>
        ))}
      />
      <Row
        label="Ship · project"
        cells={PAGE_COLUMNS.map((c, i) => (
          <Frame key={i}>
            <ShipFilePage thing={PROJECT} state={c.state} viewer={c.viewer} editing={c.label === 'Save refused' ? 'refused' : 'none'} />
          </Frame>
        ))}
      />
      <Row
        label="Leaf · page"
        cells={PAGE_COLUMNS.map((c, i) => (
          <Frame key={i}>
            <LeafFilePage thing={PAGE} state={c.state} viewer={c.viewer} editing={c.label === 'Save refused' ? 'refused' : 'none'} />
          </Frame>
        ))}
      />
      <Row
        label="Peek · topic"
        note="Written in Details; a refused save shows there."
        cells={PAGE_COLUMNS.slice(0, 5).map((c, i) => (
          <Frame key={i}>
            <PeekFilePage thing={TOPIC} state={c.state} viewer={c.viewer} />
          </Frame>
        ))}
      />
    </Sheet>
  ),
}

/** Peek's Details dialog, where a topic's summary is written (Miky, 15 Oct). */
export const InPeeksDetails: Story = {
  render: () => (
    <Sheet title="Peek’s Details" note="A Summary section under Name, written the way Rename is. Someone who can’t edit sees the text alone, like the name; with no summary the section is left out for them.">
      <div className="flex flex-wrap gap-6">
        {(
          [
            ['Filled, can edit', 'filled', 'editor', 'none'],
            ['Empty, can edit', 'empty', 'editor', 'none'],
            ['Filled, can’t edit', 'filled', 'reader', 'none'],
            ['Empty, can’t edit', 'empty', 'reader', 'none'],
            ['Loading', 'loading', 'editor', 'none'],
            ['Save refused', 'filled', 'editor', 'refused'],
          ] as const
        ).map(([label, state, viewer, editing]) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="text-caption font-medium uppercase tracking-widest text-text-secondary">{label}</div>
            <PeekDetails state={state} viewer={viewer} editing={editing} />
          </div>
        ))}
      </div>
    </Sheet>
  ),
}

/** Every New dialog gets the field, right under the title. Optional: nothing refuses a file without one. */
export const InTheNewDialogs: Story = {
  render: () => (
    <Sheet title="In the New dialogs" note="Optional, right under the title. A file created without one shows its title alone until someone adds it.">
      <Heads labels={['Empty', 'Filled']} width={502} />
      <Row label="Ship · New issue" width={502} cells={[<ShipNewIssue key="e" filled={false} />, <ShipNewIssue key="f" filled />]} />
      <Row label="Ship · New project" width={502} cells={[<ShipNewProject key="e" filled={false} />, <ShipNewProject key="f" filled />]} />
      <Row label="Peek · Start a topic" width={502} cells={[<PeekStartTopic key="e" filled={false} />, <PeekStartTopic key="f" filled />]} />
      <Row label="Leaf · New document" width={502} cells={[<LeafNewDocument key="e" filled={false} />, <LeafNewDocument key="f" filled />]} />
    </Sheet>
  ),
}

/** Open call 1: what happens past about 240 characters. */
export const PastTwoHundredForty: Story = {
  name: 'Past 240 characters (call 1)',
  render: () => (
    <Sheet
      title="Open call 1 · past about 240 characters"
      note="A (recommended): a count appears past 240 and nothing is refused, so a summary from another app or from Claude that runs longer is never cut. B: the field takes no more than 240. Either way every list and card cuts it at one or two lines."
    >
      <Heads labels={['A · a counter, nothing refused (recommended)', 'B · stops at 240']} width={502} />
      <Row
        label="Under the title"
        width={502}
        cells={[
          <Frame key="a"><ShipFilePage thing={ISSUE} state="long" viewer="editor" editing="counter" /></Frame>,
          <Frame key="b"><ShipFilePage thing={ISSUE} state="long" viewer="editor" editing="stop" /></Frame>,
        ]}
      />
      <Row label="A New dialog" width={502} cells={[<ShipNewIssue key="a" filled editing="counter" />, <ShipNewIssue key="b" filled editing="stop" />]} />
      <Row label="Peek’s Details" width={560} cells={[<PeekDetails key="a" state="long" viewer="editor" editing="counter" />, <PeekDetails key="b" state="long" viewer="editor" editing="stop" />]} />
    </Sheet>
  ),
}

/** Ship's issue list, board and table, and its project cards. */
export const InShipsLists: Story = {
  render: () => (
    <Sheet title="Ship’s list, board, table and project cards" note="A second line under the title: one line in the list and the table, two on a board card and a project card. No summary, no line: the row keeps today’s height.">
      <Row
        label="Issue list"
        width={760}
        cells={[
          <div key="l" className="flex flex-col">
            {ISSUES.map((thing) => <ShipIssueRow key={thing.key} thing={thing} />)}
            <ShipIssueRowLoading />
            <ShipIssueRowLoading />
          </div>,
        ]}
      />
      <Row
        label="Board"
        width={260}
        cells={[
          <section key="b" className="flex min-h-40 flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-2">
            {ISSUES.map((thing) => <ShipBoardCard key={thing.key} thing={thing} />)}
          </section>,
        ]}
      />
      <Row label="Table" width={900} cells={[<ShipTable key="t" things={ISSUES} />]} />
      <Row label="Table, loading" width={900} cells={[<ShipTable key="t" things={[]} loading />]} />
      <Row
        label="Project cards"
        note="The first is today’s: the description flattened, markup and all."
        width={270}
        cells={[
          <ShipProjectCard key="t" thing={PROJECTS[0]} today />,
          ...PROJECTS.map((thing) => <ShipProjectCard key={thing.title} thing={thing} />),
          <ShipProjectCardLoading key="l" />,
        ]}
      />
    </Sheet>
  ),
}

/** Peek's Desk and Leaf's Recent. */
export const OnTheDeskAndRecent: Story = {
  name: 'On Peek’s Desk and Leaf’s Recent',
  render: () => (
    <Sheet title="Peek’s Desk and Leaf’s Recent" note="One line of summary under the name. Loading stays each app’s own skeleton list.">
      <Row
        label="Peek · Desk"
        width={420}
        cells={[
          <div key="d" className="flex flex-col gap-0.5">{TOPICS.map((thing) => <PeekDeskRow key={thing.title} thing={thing} />)}</div>,
          <SkeletonList key="l" rows={3} />,
        ]}
      />
      <Row
        label="Leaf · Recent"
        width={640}
        cells={[
          <div key="r" className="flex flex-col gap-2">
            <SectionHeader title="Recent" />
            {PAGES.map((thing) => <LeafRecentRow key={thing.title} thing={thing} />)}
          </div>,
          <div key="l" className="flex flex-col gap-2">
            <SectionHeader title="Recent" />
            <SkeletonList rows={3} />
          </div>,
        ]}
      />
    </Sheet>
  ),
}

const PICKED: Thing[] = [ISSUES[0], ISSUES[1], ISSUES[2], { ...PROJECTS[0], subtitle: undefined }, { ...TOPICS[0] }, { ...PAGES[0], subtitle: undefined }]

function Picker({ option }: { option: CaptionOption }) {
  return (
    <MenuPanel className="w-[480px]">
      {PICKED.map((thing, i) => <PickerRow key={`${thing.title}${i}`} thing={thing} option={option} selected={i === 0} />)}
    </MenuPanel>
  )
}

function Search({ option }: { option: CaptionOption }) {
  return (
    <MenuPanel className="w-[480px]">
      <div className="p-2">
        <SearchInput defaultValue="item" />
      </div>
      {PICKED.map((thing, i) => <SearchRow key={`${thing.title}${i}`} thing={thing} option={option} selected={i === 0} />)}
    </MenuPanel>
  )
}

/** Open call 2: the `[` picker and Peek's search, where an issue's project is today's second line. */
export const InThePickerAndSearch: Story = {
  name: 'In the picker and search (call 2)',
  render: () => (
    <Sheet
      title="Open call 2 · the [ picker and Peek’s search"
      note="An issue’s second line is its project today. A (recommended): the project stays, after the title, and the summary is the second line. B: the summary replaces the project. Without a summary both keep today’s row. The same rule holds for any row with a caption."
    >
      <Heads labels={['A · project stays, summary second (recommended)', 'B · summary replaces project']} width={480} />
      <Row label="[ picker" note="Peek, Ship and Leaf draw the same row." width={480} cells={[<Picker key="a" option="caption" />, <Picker key="b" option="summary" />]} />
      <Row label="Peek · search" width={480} cells={[<Search key="a" option="caption" />, <Search key="b" option="summary" />]} />
    </Sheet>
  ),
}

/** The cards that already have room for it: they show it through the manifest's `subtitle` slot. */
export const OnTheCardsThatDrawToday: Story = {
  name: 'On the cards that draw today',
  render: () => (
    <Sheet
      title="On the cards that already draw"
      note="Each app’s manifest names the summary as its subtitle (record a-files-summary-is-its-own-field), so these show it with no new drawing. Widgets 2’s detailed card and hover come with Widgets 2: build; the last column is that card, for comparison."
    >
      <Heads labels={STATES.map((s) => s.label)} />
      <Row
        label="Ship · Related and Folder rows"
        cells={STATES.map(({ state }) => (state === 'loading' ? <ShipSkeleton key={state} /> : <ShipRelatedRow key={state} thing={withSummary(ISSUE, state)} />))}
      />
      <Row
        label="Peek · file card"
        note="The subtitle line gets a two-line clamp."
        cells={STATES.map(({ state }) => (state === 'loading' ? <PeekSkeleton key={state} thing={PAGE} layout="card" /> : <PeekFileCard key={state} thing={withSummary(PAGE, state)} />))}
      />
      <Row
        label="Leaf · reference card"
        note="Detailed: the summary in place of the noun."
        cells={STATES.map(({ state }) => {
          const thing = withSummary(ISSUE, state)
          return state === 'loading' ? (
            <LeafSkeleton key={state} />
          ) : thing.summary ? (
            <LeafSummaryCard key={state} thing={thing} />
          ) : (
            <LeafCard key={state} thing={thing} layout="detailed" />
          )
        })}
      />
      <Row label="Widgets 2 · detailed" note="For the build: the summary cut at two lines, left out when there is none." cells={STATES.filter((s) => s.state !== 'loading').map(({ state }) => <DetailedCard key={state} thing={withSummary(ISSUE, state)} />)} />
    </Sheet>
  ),
}

/** Leaf's ReferenceObject, detailed, with the summary where the noun was. */
function LeafSummaryCard({ thing }: { thing: Thing }) {
  return (
    <Card hover="fill" className="flex items-start gap-2 px-3 py-2">
      <span className="flex pt-0.5">
        <ThingIcon kind={thing.kind} tone="inherit" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body-2-strong text-text-primary">{thing.title}</span>
        <SummaryLine summary={thing.summary} lines={2} className="text-body-2" />
      </span>
    </Card>
  )
}
