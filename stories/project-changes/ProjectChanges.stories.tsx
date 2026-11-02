import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import {
  ActivityDeleted,
  ArchivedView,
  DeletedNotice,
  LeafPage,
  NoAccessPage,
  PeekDeletedCard,
  PeekNoAccessCard,
  ProjectText,
  ShipProjectPage,
} from './places'

/**
 * What you see when someone changed a project's text before you, and where a
 * deleted project is (project "A load stays the same size as edits pile up",
 * milestone 1). One story per moment; rows are the places, columns the cases.
 */
const meta = {
  title: 'Project changes/Every place',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------ layout */

function Sheet({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    // As wide as its columns: the canvas scrolls, not the sheet.
    <div className="min-h-screen w-max min-w-full bg-bg-surface p-6 text-text-primary">
      <h2 className="text-h3">{title}</h2>
      {note && <div className="mt-1 max-w-3xl text-body-2 text-text-secondary">{note}</div>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

/** A row of the sheet: a label, then a cell per column, each `widths[i]` wide. */
function Row({ label, note, cells, widths }: { label: string; note?: string; cells: ReactNode[]; widths: number[] }) {
  return (
    <div className="grid gap-4 border-t border-border-subtle py-4" style={{ gridTemplateColumns: `140px ${widths.map((w) => `${w}px`).join(' ')}` }}>
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

function Heads({ labels, widths }: { labels: string[]; widths: number[] }) {
  return (
    <div className="grid gap-4 pb-2" style={{ gridTemplateColumns: `140px ${widths.map((w) => `${w}px`).join(' ')}` }}>
      <span />
      {labels.map((label) => (
        <span key={label} className="text-caption text-text-muted">
          {label}
        </span>
      ))}
    </div>
  )
}

/** A frame around one place, so each reads as its own screen. */
function Frame({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-base">{children}</div>
}

/* ------------------------------------------------------------ stories */

const PAGE_WIDTHS = [760, 380]

/** A block you both changed: their words in the text, yours beside it with Use mine, Copy and Dismiss. */
export const SameBlock: Story = {
  name: 'A block you both changed',
  render: () => (
    <Sheet
      title="A block you both changed"
      note="Someone saved the text while you were editing it, and you both changed the second block. Their words are in the text; yours sit beside that block until you choose. Use mine saves yours over theirs, Copy keeps yours on the clipboard, Dismiss drops it. Nobody else sees any of this. Had you changed different blocks, nothing would show: their words would just appear."
    >
      <Heads labels={['Wide', 'Phone width: yours under the block']} widths={PAGE_WIDTHS} />
      <Row
        label="Ship"
        note="The project's page"
        widths={PAGE_WIDTHS}
        cells={[
          <Frame key="w">
            <ShipProjectPage>
              <ProjectText />
            </ShipProjectPage>
          </Frame>,
          <Frame key="n">
            <ShipProjectPage>
              <ProjectText narrow />
            </ShipProjectPage>
          </Frame>,
        ]}
      />
      <Row
        label="Leaf"
        note="The page"
        widths={PAGE_WIDTHS}
        cells={[
          <Frame key="w">
            <LeafPage>
              <ProjectText />
            </LeafPage>
          </Frame>,
          <Frame key="n">
            <LeafPage>
              <ProjectText narrow />
            </LeafPage>
          </Frame>,
        ]}
      />
    </Sheet>
  ),
}

/** A tab opened before the switch tries to save: refused, in the same shape. */
export const OldTab: Story = {
  name: 'A tab opened before the switch',
  render: () => (
    <Sheet
      title="A tab opened before the switch"
      note="A tab left open from before the change tries to save. The save is refused, the page shows the text as it is now, and what you changed sits beside its block, as above."
    >
      <Heads labels={['Wide', 'Phone width']} widths={PAGE_WIDTHS} />
      <Row
        label="Ship"
        note="The project's page"
        widths={PAGE_WIDTHS}
        cells={[
          <Frame key="w">
            <ShipProjectPage>
              <ProjectText refused />
            </ShipProjectPage>
          </Frame>,
          <Frame key="n">
            <ShipProjectPage>
              <ProjectText refused narrow />
            </ShipProjectPage>
          </Frame>,
        ]}
      />
      <Row
        label="Leaf"
        note="The page"
        widths={PAGE_WIDTHS}
        cells={[
          <Frame key="w">
            <LeafPage>
              <ProjectText refused />
            </LeafPage>
          </Frame>,
          <Frame key="n">
            <LeafPage>
              <ProjectText refused narrow />
            </LeafPage>
          </Frame>,
        ]}
      />
    </Sheet>
  ),
}

const VIEWER_WIDTHS = [460, 460]

/** A deleted project, wherever something still points at it. */
export const Deleted: Story = {
  name: 'A deleted project',
  render: () => (
    <Sheet
      title="A deleted project"
      note="A deleted project is gone from every list and from search. Where something still points at it (a link, a card in a message, an Activity entry), it says who deleted it and when. Anyone who may edit the project can Restore it; someone who can only read it sees no button."
    >
      <Heads labels={['Someone who may edit it', 'Someone who can only read it']} widths={VIEWER_WIDTHS} />
      <Row
        label="Ship"
        note="A link to it opens its page"
        widths={VIEWER_WIDTHS}
        cells={(['editor', 'reader'] as const).map((viewer) => (
          <Frame key={viewer}>
            <ShipProjectPage>
              <DeletedNotice viewer={viewer} />
            </ShipProjectPage>
          </Frame>
        ))}
      />
      <Row
        label="Leaf"
        note="A link to it opens its page"
        widths={VIEWER_WIDTHS}
        cells={(['editor', 'reader'] as const).map((viewer) => (
          <Frame key={viewer}>
            <LeafPage>
              <DeletedNotice viewer={viewer} />
            </LeafPage>
          </Frame>
        ))}
      />
      <Row label="Peek" note="Its card under a message" widths={VIEWER_WIDTHS} cells={(['editor', 'reader'] as const).map((viewer) => <PeekDeletedCard key={viewer} viewer={viewer} />)} />
      <Row label="Activity" note="Its entry, in any app" widths={VIEWER_WIDTHS} cells={(['editor', 'reader'] as const).map((viewer) => <ActivityDeleted key={viewer} viewer={viewer} />)} />
    </Sheet>
  ),
}

/** The Archived view's Deleted filter: every deleted project, with who deleted it. */
export const DeletedFilter: Story = {
  name: 'Deleted, in the Archived view',
  render: () => (
    <Sheet
      title="Deleted, in the Archived view"
      note="The Archived view gains a filter: Archived as today, and Deleted, listing every deleted project with who deleted it and when. Leaf has no Archived view of its own."
    >
      <Heads labels={['Someone who may edit them', 'Someone who can only read them']} widths={VIEWER_WIDTHS} />
      <Row label="Ship" note="The Archived tab of Projects" widths={VIEWER_WIDTHS} cells={(['editor', 'reader'] as const).map((viewer) => <Frame key={viewer}><ArchivedView app="ship" viewer={viewer} /></Frame>)} />
      <Row label="Peek" note="Archive" widths={VIEWER_WIDTHS} cells={(['editor', 'reader'] as const).map((viewer) => <Frame key={viewer}><ArchivedView app="peek" viewer={viewer} /></Frame>)} />
    </Sheet>
  ),
}

/** No access: the line, and no title. */
export const NoAccess: Story = {
  name: 'No access',
  render: () => (
    <Sheet title="No access" note="A link or card for a project you can't read says so and nothing more: not even its title.">
      <Heads labels={['Where it draws']} widths={[460]} />
      <Row label="Ship" note="A link to it" widths={[460]} cells={[<Frame key="s"><ShipProjectPage title={null}><NoAccessPage /></ShipProjectPage></Frame>]} />
      <Row label="Leaf" note="A link to it" widths={[460]} cells={[<Frame key="l"><LeafPage title={null}><NoAccessPage /></LeafPage></Frame>]} />
      <Row label="Peek" note="Its card under a message" widths={[460]} cells={[<PeekNoAccessCard key="p" />]} />
    </Sheet>
  ),
}
