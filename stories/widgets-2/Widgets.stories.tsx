import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { AttachmentCard } from '../../src/AttachmentCard'
import { ATTACHMENT, ATTACHMENT_FILE, ISSUE, MESSAGE, PAGE, PART, PICTURE, PROJECT, TOPIC, UNREADABLE, type Thing } from './fixtures'
import {
  AttachmentChip,
  CardLoading,
  CardUnavailable,
  CommentAnchor,
  CompactCard,
  DetailedCard,
  HoverPreviewOpen,
  loadingShapeOf,
  MessageCard,
  PartCard,
  ReferenceChip,
} from './proposed'
import {
  LeafCard,
  LeafChip,
  LeafSkeleton,
  PartBlocks,
  PeekCard,
  PeekChip,
  PeekChipQuiet,
  PeekNotAvailable,
  PeekPartNotAvailable,
  PeekSkeleton,
  ShipCard,
  ShipChip,
  ShipNotAvailable,
  ShipQuote,
  ShipSkeleton,
  TodayAttachment,
  TodayCommentAnchor,
  TodayPartCard,
} from './today'

/**
 * Widgets 2, the prototype of every widget (WID-2). One story per kind of
 * file: the proposed kit first, then how Peek, Ship and Leaf draw it today.
 * Columns: the chip in a sentence, compact, detailed, loading, not available.
 */
const meta = {
  title: 'Widgets 2/Every widget',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------ layout */

const COLUMNS = ['Chip', 'Compact', 'Detailed', 'Loading', 'Not available'] as const

function Sheet({ children }: { children: ReactNode }) {
  return <div className="min-h-screen overflow-x-auto bg-bg-surface p-6 text-text-primary">{children}</div>
}

/** One row of the sheet: a label, then a cell per column. */
function Row({ label, note, cells }: { label: string; note?: string; cells: ReactNode[] }) {
  return (
    <div className="grid grid-cols-[140px_270px_repeat(4,380px)] gap-4 border-t border-border-subtle py-4">
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

function Header({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-2">
      <h2 className="text-h4">{title}</h2>
      {children && <p className="mt-1 max-w-[880px] text-body-2 text-text-secondary">{children}</p>}
      <div className="mt-4 grid grid-cols-[140px_270px_repeat(4,380px)] gap-4 text-caption text-text-muted">
        <span />
        {COLUMNS.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
    </div>
  )
}

/** A chip at home: inside a sentence, where it has to sit level with the words. */
function Sentence({ children }: { children: ReactNode }) {
  return <p className="text-body-2 text-text-primary">See {children} for the rest of it.</p>
}

/** A cell with nothing to draw, and why. */
function None({ children }: { children: ReactNode }) {
  return <p className="text-caption italic text-text-muted">{children}</p>
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption text-text-muted">{label}</span>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------- rows */

function proposedRow(thing: Thing, opts: { detailed?: ReactNode | false; note?: string } = {}) {
  const detailedOffered = opts.detailed !== false
  return (
    <Row
      label="Proposed"
      note={opts.note ?? 'Hover the chip or the compact card for the detailed card.'}
      cells={[
        <Sentence key="c">
          <ReferenceChip thing={thing} preview />
        </Sentence>,
        <CompactCard key="k" thing={thing} preview />,
        detailedOffered ? (opts.detailed ?? <DetailedCard thing={thing} />) : <None key="d">Not offered: detailed would add nothing compact does not show (Decided 15 Oct).</None>,
        <>
          <Labelled label="Chip">
            <Sentence>
              <ReferenceChip thing={thing} state="loading" />
            </Sentence>
          </Labelled>
          <Labelled label="Compact">
            <CardLoading kind={thing.kind} layout="compact" />
          </Labelled>
          {detailedOffered && (
            <Labelled label="Detailed">
              <CardLoading kind={thing.kind} layout="detailed" shape={loadingShapeOf(thing)} />
            </Labelled>
          )}
        </>,
        <>
          <Labelled label="Chip">
            <Sentence>
              <ReferenceChip thing={thing} state="unavailable" />
            </Sentence>
          </Labelled>
          <Labelled label="Compact and detailed">
            <CardUnavailable kind={thing.kind} noun={thing.noun} app={thing.app} />
          </Labelled>
        </>,
      ]}
    />
  )
}

function todayRows(thing: Thing, opts: { shipDetailed?: ReactNode; peekDetailed?: ReactNode } = {}) {
  return (
    <>
      <Row
        label="Today in Peek"
        cells={[
          <Sentence key="c">
            <PeekChip thing={thing} />
          </Sentence>,
          <PeekCard key="k" thing={thing} layout="row" />,
          opts.peekDetailed ?? <PeekCard thing={thing} layout="card" />,
          <>
            <Labelled label="Chip">
              <Sentence>
                <PeekChipQuiet address={UNREADABLE.address} />
              </Sentence>
            </Labelled>
            <Labelled label="Compact">
              <PeekSkeleton thing={thing} layout="row" />
            </Labelled>
            <Labelled label="Detailed">
              <PeekSkeleton thing={thing} layout="card" />
            </Labelled>
          </>,
          <>
            <Labelled label="Chip">
              <Sentence>
                <PeekChipQuiet address={UNREADABLE.address} />
              </Sentence>
            </Labelled>
            <Labelled label="Compact and detailed">
              <PeekNotAvailable noun={thing.noun} app={thing.app} />
            </Labelled>
          </>,
        ]}
      />
      <Row
        label="Today in Ship"
        cells={[
          <Sentence key="c">
            <ShipChip thing={thing} />
          </Sentence>,
          thing.kind === 'message' ? <ShipQuote key="k" thing={thing} /> : <ShipCard key="k" thing={thing} layout="row" />,
          opts.shipDetailed ?? (thing.kind === 'message' ? <ShipQuote thing={thing} /> : <ShipCard thing={thing} layout="card" />),
          <Labelled key="l" label="Compact and detailed">
            <ShipSkeleton />
          </Labelled>,
          <Labelled key="n" label="Compact and detailed">
            <ShipNotAvailable noun={thing.noun} />
          </Labelled>,
        ]}
      />
      <Row
        label="Today in Leaf"
        cells={[
          <Sentence key="c">
            <LeafChip thing={thing} />
          </Sentence>,
          <LeafCard key="k" thing={thing} layout="compact" />,
          <LeafCard key="d" thing={thing} layout="detailed" />,
          <Labelled key="l" label="Compact and detailed">
            <LeafSkeleton />
          </Labelled>,
          <None key="n">Draws nothing.</None>,
        ]}
      />
    </>
  )
}

/* ----------------------------------------------------------- stories */

/** Every kind of file in the proposed kit, one row each. Start here. */
export const Overview: Story = {
  render: () => (
    <Sheet>
      <Header title="Every widget, proposed">
        One drawing per kind for Peek, Ship and Leaf alike. No noun and no &quot;Open in …&quot;: the icon says what it is, the title is the link. Compact is one line; detailed adds the short summary and what the kind owns, with its actions; hovering a chip or a compact card shows the detailed card. Loading is the card it becomes; not available is one line everywhere.
      </Header>
      {[
        { thing: ISSUE, label: 'Issue' },
        { thing: PROJECT, label: 'Project' },
        { thing: TOPIC, label: 'Topic' },
        { thing: MESSAGE, label: 'Message', detailed: <MessageCard thing={MESSAGE} /> },
        { thing: PAGE, label: 'Page' },
      ].map(({ thing, label, detailed }) => (
        <div key={label}>
          <h3 className="mt-4 text-h5">{label}</h3>
          {proposedRow(thing, { detailed })}
        </div>
      ))}
    </Sheet>
  ),
}

/** The detailed card on hover, drawn open; the canvases above open it on a real hover. */
export const Hover: Story = {
  name: 'On hover',
  render: () => (
    <Sheet>
      <h2 className="text-h4">On hover</h2>
      <p className="mt-1 max-w-[880px] text-body-2 text-text-secondary">
        Hovering a chip or a compact card shows its detailed card in the package&apos;s preview box (Miky, 15 Oct). Drawn open here; hover them in the other stories to see it for real.
      </p>
      <div className="mt-6 grid grid-cols-[repeat(4,380px)] gap-6">
        {[ISSUE, PROJECT, TOPIC, PAGE].map((thing) => (
          <div key={thing.title} className="flex flex-col gap-2">
            <span className="text-caption text-text-muted">{thing.noun}</span>
            <CompactCard thing={thing} />
            <HoverPreviewOpen thing={thing} />
          </div>
        ))}
      </div>
    </Sheet>
  ),
}

export const Issue: Story = {
  render: () => (
    <Sheet>
      <Header title="Issue">
        Proposed: the key before the title in the chip and compact; in detailed it moves under the title with the project, &quot;ABC-2 · Group one&quot;. Compact is one line with no actions, and shows the comment count only when you have something unread there. Detailed shows the summary, its status and assignee only as the pickers that change them, and the comment count with the unread dot.
      </Header>
      {proposedRow(ISSUE)}
      {todayRows(ISSUE)}
    </Sheet>
  ),
}

export const Project: Story = {
  render: () => (
    <Sheet>
      <Header title="Project">
        Proposed: progress as a small ring with &quot;3/8&quot; beside it, status and lead as pickers, the comment count, and each issue led by its status icon, with its key and assignee. Each issue&apos;s row opens that issue.
      </Header>
      {proposedRow(PROJECT)}
      {todayRows(PROJECT)}
    </Sheet>
  ),
}

export const Topic: Story = {
  render: () => (
    <Sheet>
      <Header title="Topic">
        Proposed: compact shows when the last conversation moved, how many there are with the same icon as every file&apos;s comments, and who is in it, with the unread dot when you have something unread there. Detailed adds the latest conversation, labelled &quot;Latest conversation&quot;, because it follows the topic and changes after the link was sent.
      </Header>
      {proposedRow(TOPIC)}
      {todayRows(TOPIC)}
    </Sheet>
  ),
}

export const Message: Story = {
  render: () => (
    <Sheet>
      <Header title="Message">
        &quot;Person Two&quot; is the person who wrote the message, so it is drawn with their face. A linked message is a card, not a quote (Miky, 15 Oct), so it needs nothing new on the wire.
      </Header>
      {proposedRow(MESSAGE, { detailed: <MessageCard thing={MESSAGE} /> })}
      {todayRows(MESSAGE)}
    </Sheet>
  ),
}

export const Page: Story = {
  render: () => (
    <Sheet>
      <Header title="Page">
        Proposed: a page gets its own icon (today every app draws it as another app&apos;s file). Compact shows when it was last edited and who wrote it; detailed adds its Folder, its summary, its authors&apos; faces (no names, which would not fit once several people wrote it), and its comment count.
      </Header>
      {proposedRow(PAGE)}
      {todayRows(PAGE)}
    </Sheet>
  ),
}

/** A block of a description, shared live: no compact or detailed, the part itself. */
export const PartOfADescription: Story = {
  name: 'Part of a description',
  render: () => (
    <Sheet>
      <Header title="Part of a description">
        A link to one block inserts the part itself, live, with no card offered (decision record: the author chooses a link&apos;s card). So the columns here are the chip, the part, loading, not available, and a comment&apos;s anchor. Proposed: the part wears a detailed card&apos;s header, so parts and cards read as one family.
      </Header>
      <Row
        label="Proposed"
        cells={[
          <Sentence key="c">
            <ReferenceChip thing={{ ...ISSUE, title: `${PART.heading} · ${PART.blocks[0]}`, status: undefined }} />
          </Sentence>,
          <None key="k">The part, next column.</None>,
          <PartCard key="p" kind="issue" partKey={ISSUE.key} heading={PART.heading} noun={PART.noun} app={PART.app}>
            <PartBlocks />
          </PartCard>,
          <PartCard key="l" kind="issue" heading="" noun={PART.noun} app={PART.app} state="loading" />,
          <>
            <PartCard kind="issue" heading="" noun={PART.noun} app={PART.app} state="unavailable" />
            <Labelled label="Comment anchor">
              <CommentAnchor text={PART.blocks[1]} />
            </Labelled>
            <Labelled label="Comment anchor, part deleted">
              <CommentAnchor />
            </Labelled>
          </>,
        ]}
      />
      <Row
        label="Today in Peek"
        cells={[
          <Sentence key="c">
            <PeekChip thing={{ ...ISSUE, title: `${PART.heading} · ${PART.blocks[0]}`, status: undefined }} />
          </Sentence>,
          <None key="k">The part, next column.</None>,
          <TodayPartCard key="p" app="Peek" />,
          <PeekSkeleton key="l" thing={ISSUE} layout="card" />,
          <>
            <PeekPartNotAvailable />
            <Labelled label="Comment anchor">
              <TodayCommentAnchor text={PART.blocks[1]} />
            </Labelled>
            <Labelled label="Comment anchor, part deleted">
              <TodayCommentAnchor />
            </Labelled>
          </>,
        ]}
      />
      <Row
        label="Today in Ship"
        cells={[
          <Sentence key="c">
            <ShipChip thing={{ ...ISSUE, title: `${PART.heading} · ${PART.blocks[0]}`, status: undefined }} />
          </Sentence>,
          <None key="k">The part, next column.</None>,
          <TodayPartCard key="p" app="Ship" />,
          <ShipSkeleton key="l" />,
          <None key="n">Same as Peek.</None>,
        ]}
      />
      <Row label="Today in Leaf" cells={[<None key="c">No parts yet.</None>, <span key="k" />, <span key="p" />, <span key="l" />, <span key="n" />]} />
    </Sheet>
  ),
}

export const Attachment: Story = {
  render: () => (
    <Sheet>
      <Header title="Attachment">
        The attachment card is already shared. Proposed: a chip for an attachment in running text, the file card as compact, and the picture as detailed, offered for pictures only.
      </Header>
      <Row
        label="Proposed"
        cells={[
          <Sentence key="c">
            <AttachmentChip name={ATTACHMENT.name} />
          </Sentence>,
          <AttachmentCard key="k" name={ATTACHMENT_FILE.name} size={ATTACHMENT_FILE.size} contentType={ATTACHMENT_FILE.contentType} download />,
          <>
            <AttachmentCard name={ATTACHMENT.name} size={ATTACHMENT.size} contentType={ATTACHMENT.contentType} src={PICTURE} download />
            <None>A file that is not a picture: compact only.</None>
          </>,
          <>
            <Sentence>
              <AttachmentChip name="" state="loading" />
            </Sentence>
            <AttachmentCard name={ATTACHMENT.name} contentType={ATTACHMENT.contentType} state="loading" />
          </>,
          <>
            <Sentence>
              <AttachmentChip name="" state="unavailable" />
            </Sentence>
            <AttachmentCard name={ATTACHMENT.name} contentType={ATTACHMENT.contentType} state="unreadable" />
          </>,
        ]}
      />
      <Row
        label="Today in Ship and Peek"
        cells={[
          <None key="c">No chip: an attachment is never in running text.</None>,
          <TodayAttachment key="k" {...ATTACHMENT_FILE} />,
          <TodayAttachment key="d" {...ATTACHMENT} />,
          <AttachmentCard key="l" name={ATTACHMENT.name} contentType={ATTACHMENT.contentType} state="loading" />,
          <AttachmentCard key="n" name={ATTACHMENT.name} contentType={ATTACHMENT.contentType} state="unreadable" />,
        ]}
      />
    </Sheet>
  ),
}

/** A file you cannot read: only its kind and its app are known, from the address. */
export const NotReadable: Story = {
  name: "A file you can't read",
  render: () => (
    <Sheet>
      <Header title="A file you can't read">
        Only the kind and the app are known, from the address. Deleted and unreadable read the same, &quot;not available.&quot; (Miky, 15 Oct). Proposed: the chip says so in words instead of showing the address.
      </Header>
      <Row
        label="Proposed"
        cells={[
          <Sentence key="c">
            <ReferenceChip thing={{ ...ISSUE, noun: UNREADABLE.noun }} state="unavailable" />
          </Sentence>,
          <CardUnavailable key="k" kind={UNREADABLE.kind} noun={UNREADABLE.noun} app={UNREADABLE.app} />,
          <None key="d">Same as compact: there is nothing more to show.</None>,
          <None key="l">Loading first, as for its kind.</None>,
          <CardUnavailable key="n" kind="file" noun="Another app's file" app="its app" />,
        ]}
      />
      <Row
        label="Today in Peek"
        cells={[
          <Sentence key="c">
            <PeekChipQuiet address={UNREADABLE.address} />
          </Sentence>,
          <PeekNotAvailable key="k" noun={UNREADABLE.noun} app={UNREADABLE.app} />,
          <PeekNotAvailable key="d" noun={UNREADABLE.noun} app={UNREADABLE.app} />,
          <span key="l" />,
          <None key="n">Without a chosen card: draws nothing.</None>,
        ]}
      />
      <Row
        label="Today in Ship"
        cells={[
          <Sentence key="c">
            <PeekChipQuiet address={UNREADABLE.address} />
          </Sentence>,
          <ShipNotAvailable key="k" noun={UNREADABLE.noun} />,
          <ShipNotAvailable key="d" noun={UNREADABLE.noun} />,
          <span key="l" />,
          <span key="n" />,
        ]}
      />
      <Row label="Today in Leaf" cells={[<Sentence key="c"><PeekChipQuiet address={UNREADABLE.address} /></Sentence>, <None key="k">Draws nothing.</None>, <None key="d">Draws nothing.</None>, <span key="l" />, <span key="n" />]} />
    </Sheet>
  ),
}
