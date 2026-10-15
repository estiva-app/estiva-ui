/**
 * Short summary prototype: every place a file's summary is written or shown,
 * each redrawn class for class from its app's `main` (15 Oct) with the
 * summary added. Nothing here is wired; the apps' build tickets match these.
 *
 * The rules every drawing follows (Miky, 15 Oct; record
 * a-files-summary-is-its-own-field):
 * - the summary is its own line under the title, never the description cut short;
 * - no summary → the line is left out; only the file's own page offers
 *   "Add a summary", and only to someone who can edit it;
 * - a row, a picker row and a search row keep it to one line; a card and a
 *   board card to two; the file's own page shows all of it;
 * - it arrives with the title (the same fold), so loading is the place's own
 *   skeleton with one more bar, never a second wait.
 */
import { IconDots, IconMessage2, IconPencil, IconPlus, IconX } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { Avatar } from '../../src/Avatar'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { ContainerHeader } from '../../src/ContainerHeader'
import { EditableText } from '../../src/EditableText'
import { Field, FieldLine } from '../../src/Field'
import { IconButton } from '../../src/IconButton'
import { KindIcon } from '../../src/KindIcon'
import { Link } from '../../src/Link'
import { EnterHint, MenuItem } from '../../src/Menu'
import { Panel } from '../../src/Panel'
import { Person } from '../../src/Person'
import { SectionLabel } from '../../src/SectionLabel'
import { Select } from '../../src/Select'
import { SkeletonBar } from '../../src/Skeleton'
import { Textarea } from '../../src/Textarea'
import { TextInput } from '../../src/TextInput'
import { UnreadDot } from '../../src/UnreadDot'
import { StatusMark, ThingIcon } from '../widgets-2/proposed'
import { LIMIT, LONG_SUMMARY, REFUSAL, SUMMARY, summaryOf, type SummaryState, type Thing, type Viewer } from './fixtures'

const HREF = '#'

/* ------------------------------------------------------------ the line itself */

/** The summary as every row, card and picker shows it: secondary, cut at `lines`. */
export function SummaryLine({ summary, lines, className }: { summary?: string; lines: 1 | 2; className?: string }) {
  if (!summary) return null
  return <p className={cn('text-text-secondary', lines === 1 ? 'truncate' : 'line-clamp-2', className)}>{summary}</p>
}

/* ------------------------------------------------------------ writing it on the file's own page */

/** How the summary field is being shown: at rest, refused by the relay, or being typed past 240 in one of the two options. */
export type Editing = 'none' | 'refused' | 'counter' | 'stop'

/**
 * The summary under the title on the file's own page. Someone who can edit
 * clicks it to change it (the package's EditableText, as Leaf's title); an
 * empty one says "Add a summary", quietly. Someone who can't edit sees the
 * text, or nothing at all.
 */
export function OwnSummary({ state, viewer, editing = 'none', className }: { state: SummaryState; viewer: Viewer; editing?: Editing; className: string }) {
  const [value, setValue] = useState(summaryOf(state) ?? '')
  if (state === 'loading') return <SkeletonBar className="h-4 w-2/3" />
  if (editing !== 'none') return <SummaryBeingWritten editing={editing} className={className} />
  if (viewer === 'reader') return value ? <p className={cn('px-2 py-1 -mx-2 text-text-secondary', className)}>{value}</p> : null
  return (
    <EditableText
      multiline
      label="Summary"
      placeholder="Add a summary"
      value={value}
      onCommit={(next) => {
        setValue(next)
        return true
      }}
      className={cn('-mx-2', className, value && 'text-text-secondary')}
    />
  )
}

/**
 * The field open, in one of the three states worth drawing:
 * - refused: the relay refused the save; the old summary is back on the page
 *   for everyone else, and your text stays in the field with the reason
 *   (record a-refused-action-is-undone-and-your-text-comes-back);
 * - counter (open call 1, recommended): past about 240 a count appears, nothing is refused;
 * - stop (open call 1, the other option): the field takes no more than 240.
 */
export function SummaryBeingWritten({ editing, className }: { editing: Exclude<Editing, 'none'>; className?: string }) {
  const text = editing === 'refused' ? 'A new summary someone typed, which the relay did not take.' : editing === 'stop' ? LONG_SUMMARY.slice(0, LIMIT) : LONG_SUMMARY
  return (
    <div className="-mx-2 flex flex-col gap-1">
      <Textarea aria-label="Summary" defaultValue={text} maxLength={editing === 'stop' ? LIMIT : undefined} rows={editing === 'refused' ? 2 : 4} className={className} />
      {editing === 'refused' && <FieldLine tone="error">Summary not saved. {REFUSAL} Your text is still here.</FieldLine>}
      {editing === 'counter' && (
        <FieldLine tone="warning">
          {text.length} characters. A summary reads best in one or two sentences, under {LIMIT}.
        </FieldLine>
      )}
      {editing === 'stop' && <FieldLine>{LIMIT} of {LIMIT} characters.</FieldLine>}
    </div>
  )
}

/** A description, as the page draws it below the summary: two plain paragraphs. */
function DescriptionStandIn() {
  return (
    <div className="flex flex-col gap-3 text-body-2 text-text-primary">
      <p>A description long enough to need more than one line. It is the file’s whole text, and the summary is never cut from it.</p>
      <p>The rest is there when you open it.</p>
    </div>
  )
}

interface PageProps {
  thing: Thing
  state: SummaryState
  viewer: Viewer
  editing?: Editing
}

/** Ship's issue or project page: LiveHeader's column, the summary between the title and the description. */
export function ShipFilePage({ thing, state, viewer, editing }: PageProps) {
  if (state === 'loading') {
    // PageSkeleton shape="page": the title bar, then the list; one more bar for the summary.
    return (
      <div className="flex flex-col gap-4 px-6 py-5">
        <SkeletonBar className="h-3.5 w-40" />
        <div className="flex h-7 items-center">
          <SkeletonBar className="h-5 w-2/3" />
        </div>
        <SkeletonBar className="h-4 w-1/2" />
        <SkeletonBar className="h-3.5 w-full" />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <p className="text-caption text-text-muted">{thing.kind === 'issue' ? `${thing.subtitle} / ${thing.key}` : 'Projects'}</p>
      <div className="flex flex-col gap-1">
        <h1 className="-mx-2 px-2 py-1 text-h2 text-text-primary">{thing.title}</h1>
        <OwnSummary state={state} viewer={viewer} editing={editing} className="text-body-1" />
      </div>
      <DescriptionStandIn />
    </div>
  )
}

/** Leaf's page: DocumentView's column, the summary between the h1 and the document. */
export function LeafFilePage({ thing, state, viewer, editing }: PageProps) {
  if (state === 'loading') return <div className="px-12 pt-10 pb-10"><SkeletonBar className="mb-4 h-8 w-1/2" /><SkeletonBar className="mb-6 h-4 w-2/3" /><SkeletonBar className="h-3.5 w-full" /></div>
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-12 pt-10 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">
          <EditableText value={thing.title} placeholder="Untitled" label="Title" onCommit={() => true} className="-mx-2" readOnly={viewer === 'reader'} />
        </h1>
        <OwnSummary state={state} viewer={viewer} editing={editing} className="text-body-1" />
      </div>
      <DescriptionStandIn />
    </div>
  )
}

/**
 * Peek's topic page: the Panel's one-line title bar has no room, so the
 * summary opens the body. Peek writes a summary in Details (Miky, 15 Oct), so
 * "Add a summary" here opens Details rather than a field on the page.
 */
export function PeekFilePage({ thing, state, viewer }: Omit<PageProps, 'editing'>) {
  const summary = summaryOf(state)
  return (
    <Panel
      title={
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-body-2-strong text-text-primary">{thing.title}</p>
        </div>
      }
      actions={
        <IconButton tooltip="More" aria-label="More">
          <IconDots size={16} stroke={1.5} />
        </IconButton>
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      {state === 'loading' && <SkeletonBar className="h-3.5 w-2/3" />}
      {summary && <p className="text-body-2 text-text-secondary">{summary}</p>}
      {state === 'empty' && viewer === 'editor' && (
        <button type="button" className="self-start text-body-2 text-text-muted hover:text-text-secondary">
          Add a summary
        </button>
      )}
      <div className={cn('flex items-center gap-2 text-caption text-text-muted', (state !== 'empty' || viewer === 'editor') && 'border-t border-border-subtle pt-3')}>
        <Avatar name="Person One" size={24} />
        The topic’s conversations start here.
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------ dialogs */

/** DialogShell's card, drawn in place so several sit on one sheet (the real one is a modal). */
function DialogCard({ title, width = 502, children, submit, cancel = 'Cancel' }: { title: string; width?: number; children: ReactNode; submit?: string; cancel?: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated shadow-lg" style={{ width }}>
      <ContainerHeader
        className="pl-5"
        title={<span className="block truncate text-h4 text-text-primary">{title}</span>}
        actions={
          <IconButton tooltip="Close" aria-label="Close">
            <IconX size={16} stroke={1.5} />
          </IconButton>
        }
      />
      <div className="flex flex-col gap-6 border-b border-border-subtle py-4 pl-5 pr-4">{children}</div>
      <div className="flex h-12 shrink-0 items-center justify-end gap-2 pl-5 pr-4">
        <Button variant={submit ? 'muted' : 'outlined'}>{cancel}</Button>
        {submit && <Button variant="primary">{submit}</Button>}
      </div>
    </div>
  )
}

/** The summary field every New dialog gets, right under the title. Optional; empty is fine. */
export function SummaryField({ filled, editing }: { filled: boolean; editing?: 'counter' | 'stop' }) {
  if (editing) {
    const text = editing === 'stop' ? LONG_SUMMARY.slice(0, LIMIT) : LONG_SUMMARY
    return (
      <Field label="Summary">
        <Textarea defaultValue={text} maxLength={editing === 'stop' ? LIMIT : undefined} className="h-[80px]" />
        {editing === 'counter' ? (
          <FieldLine tone="warning">
            {text.length} characters. A summary reads best in one or two sentences, under {LIMIT}.
          </FieldLine>
        ) : (
          <FieldLine>{LIMIT} of {LIMIT} characters.</FieldLine>
        )}
      </Field>
    )
  }
  return (
    <Field label="Summary" helper="One or two sentences. It shows under the title, in lists and on cards.">
      <Textarea defaultValue={filled ? SUMMARY : ''} placeholder="What is it for, in a sentence?" className="h-[60px]" />
    </Field>
  )
}

export interface NewDialogProps {
  filled: boolean
  editing?: 'counter' | 'stop'
}

/** Ship's NewIssueDialog: Title, then the summary, then Description and Project. */
export function ShipNewIssue({ filled, editing }: NewDialogProps) {
  return (
    <DialogCard title="New issue" submit="Create issue">
      <Field label="Title" required>
        <TextInput defaultValue={filled ? 'Item one' : ''} />
      </Field>
      <SummaryField filled={filled} editing={editing} />
      <Field label="Description">
        <Textarea className="h-[80px]" />
      </Field>
    </DialogCard>
  )
}

/** Ship's NewProjectDialog: Title, the summary, Key, Description, Folder. */
export function ShipNewProject({ filled, editing }: NewDialogProps) {
  return (
    <DialogCard title="New project" submit="Create project">
      <Field label="Title" required>
        <TextInput defaultValue={filled ? 'Group one' : ''} />
      </Field>
      <SummaryField filled={filled} editing={editing} />
      <Field label="Key" helper="Two to five letters, before each issue’s number.">
        <TextInput defaultValue={filled ? 'ABC' : ''} />
      </Field>
      <Field label="Description">
        <Textarea className="h-[80px]" />
      </Field>
    </DialogCard>
  )
}

/** Peek's StartTopicDialog: the lead sentence, Title, then the summary (it has no description). */
export function PeekStartTopic({ filled, editing }: NewDialogProps) {
  return (
    <DialogCard title="Start a topic" submit="Create">
      <p className="text-body-2 text-text-secondary">A topic is a place for conversations about one thing.</p>
      <Field label="Title" required>
        <TextInput defaultValue={filled ? 'Place one' : ''} />
      </Field>
      <SummaryField filled={filled} editing={editing} />
    </DialogCard>
  )
}

/** Leaf's NewDocumentDialog: the sentence, Title, the summary, Folder. */
export function LeafNewDocument({ filled, editing }: NewDialogProps) {
  return (
    <DialogCard title="New document" submit="Create">
      <p className="text-body-2 text-text-secondary">Everyone in Folder one can read it.</p>
      <Field label="Title" required>
        <TextInput defaultValue={filled ? 'Page one' : ''} placeholder="What is it about?" />
      </Field>
      <SummaryField filled={filled} editing={editing} />
      <Field label="Folder">
        <Select ariaLabel="Folder" value="one" onChange={() => {}} options={[{ value: 'one', label: 'Folder one' }]} />
      </Field>
    </DialogCard>
  )
}

/** One of Details' sections: a SectionLabel over its content. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  )
}

/**
 * Peek's FileDetailsDialog with a Summary section under Name, written the way
 * Rename is: the text and an Edit button, then a field with Save and Cancel.
 * Someone who can't edit sees the text alone, like the name; with no summary
 * the section is left out for them.
 */
export function PeekDetails({ state, viewer, editing = 'none' }: { state: SummaryState; viewer: Viewer; editing?: Editing }) {
  const summary = summaryOf(state)
  const editor = viewer === 'editor'
  return (
    <DialogCard title="Details" width={560} cancel="Close">
      <Section label="Name">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">Place one</span>
          {editor && (
            <Button variant="outlined" size="small" leadingIcon={<IconPencil size={14} stroke={1.5} />}>
              Rename
            </Button>
          )}
        </div>
      </Section>
      {state === 'loading' && (
        <Section label="Summary">
          <SkeletonBar className="h-3.5 w-2/3" />
        </Section>
      )}
      {state !== 'loading' && editing !== 'none' && (
        <Section label="Summary">
          <div className="flex flex-col gap-2">
            <Textarea
              aria-label="Summary"
              defaultValue={editing === 'refused' ? 'A new summary someone typed, which the relay did not take.' : editing === 'stop' ? LONG_SUMMARY.slice(0, LIMIT) : LONG_SUMMARY}
              maxLength={editing === 'stop' ? LIMIT : undefined}
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="small">
                Save
              </Button>
              <Button variant="outlined" size="small">
                Cancel
              </Button>
            </div>
            {editing === 'refused' && <FieldLine tone="error">Summary not saved. {REFUSAL} Your text is still here.</FieldLine>}
            {editing === 'counter' && <FieldLine tone="warning">{LONG_SUMMARY.length} characters. A summary reads best in one or two sentences, under {LIMIT}.</FieldLine>}
            {editing === 'stop' && <FieldLine>{LIMIT} of {LIMIT} characters.</FieldLine>}
          </div>
        </Section>
      )}
      {state !== 'loading' && editing === 'none' && (summary || editor) && (
        <Section label="Summary">
          <div className="flex items-start gap-2">
            {summary ? <p className="min-w-0 flex-1 text-body-2 text-text-primary">{summary}</p> : <p className="min-w-0 flex-1 text-body-2 text-text-muted">No summary yet.</p>}
            {editor && (
              <Button variant="outlined" size="small" leadingIcon={summary ? <IconPencil size={14} stroke={1.5} /> : <IconPlus size={14} stroke={1.5} />}>
                {summary ? 'Edit' : 'Add a summary'}
              </Button>
            )}
          </div>
        </Section>
      )}
      <Section label="Created by">
        <Person name="Person One" size={24} />
      </Section>
    </DialogCard>
  )
}

/* ------------------------------------------------------------ lists and boards */

/** Ship's IssueRow: one line today (Katerina, 9 Sep, took the description out); the summary is its second line, under the title. */
export function ShipIssueRow({ thing }: { thing: Thing }) {
  return (
    <div className={cn('relative flex min-w-0 items-start gap-3 rounded-md px-3 transition-colors hover:bg-bg-hover', thing.summary ? 'py-1.5' : 'h-9 items-center')}>
      <Link href={HREF} variant="quiet" cover className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn('w-20 shrink-0 truncate pr-2 font-mono text-caption text-text-muted', thing.summary && 'pt-0.5')}>{thing.key}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            {thing.status && <StatusMark status={thing.status} />}
            <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{thing.title}</span>
          </span>
          <SummaryLine summary={thing.summary} lines={1} className="pl-[22px] text-caption" />
        </span>
      </Link>
      <span className={cn('flex shrink-0 items-center gap-3', thing.summary && 'pt-0.5')}>
        {thing.comments !== undefined && (
          <span className="flex items-center gap-1 text-caption tabular-nums text-text-muted">
            <IconMessage2 size={14} stroke={1.5} aria-hidden />
            {thing.comments}
          </span>
        )}
        <Chip label={thing.subtitle} />
        {thing.assignee ? <Avatar name={thing.assignee} size={16} /> : <span className="size-4" />}
        <span className="w-16 shrink-0 text-right text-caption tabular-nums text-text-muted">2h</span>
      </span>
    </div>
  )
}

/** The list's skeleton row, with a second bar for the summary. */
export function ShipIssueRowLoading() {
  return (
    <div className="flex gap-2 px-2 py-1.5">
      <SkeletonBar className="size-4" />
      <div className="flex flex-1 flex-col gap-1.5">
        <SkeletonBar className="h-3.5 w-[130px]" />
        <SkeletonBar className="h-3 w-[220px]" />
      </div>
    </div>
  )
}

/** Ship's BoardCard: the key, the title, the summary in two lines, the assignee. */
export function ShipBoardCard({ thing }: { thing: Thing }) {
  return (
    <Card fill="elevated" className="flex flex-col gap-1.5 p-2">
      <span className="font-mono text-caption text-text-muted">{thing.key}</span>
      <span className="text-body-2 text-text-primary">{thing.title}</span>
      <SummaryLine summary={thing.summary} lines={2} className="text-caption" />
      {thing.assignee && (
        <span className="contents text-caption text-text-secondary">
          <Person name={thing.assignee} size={16} />
        </span>
      )}
    </Card>
  )
}

/** Ship's IssuesTable, the summary under the title in the Title cell. */
export function ShipTable({ things, loading = false }: { things: Thing[]; loading?: boolean }) {
  const th = 'h-9 px-3 text-left text-menu font-medium uppercase tracking-widest text-text-secondary'
  return (
    <table className="w-full min-w-[840px] table-fixed">
      <thead>
        <tr className="border-b border-border-subtle">
          <th className={cn(th, 'w-24')}>Ref</th>
          <th className={th}>Title</th>
          <th className={cn(th, 'w-32')}>Status</th>
          <th className={cn(th, 'w-40')}>Assignee</th>
          <th className={cn(th, 'w-24')}>Updated</th>
        </tr>
      </thead>
      <tbody>
        {loading
          ? [0, 1].map((i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="h-10 px-3"><SkeletonBar className="h-3 w-12" /></td>
                <td className="px-3 py-2"><SkeletonBar className="mb-1.5 h-3.5 w-1/2" /><SkeletonBar className="h-3 w-3/4" /></td>
                <td className="px-3"><SkeletonBar className="h-3 w-16" /></td>
                <td className="px-3"><SkeletonBar className="h-3 w-20" /></td>
                <td className="px-3"><SkeletonBar className="h-3 w-10" /></td>
              </tr>
            ))
          : things.map((thing) => (
              <tr key={thing.key} className="border-b border-border-subtle">
                <td className="h-10 px-3 font-mono text-caption text-text-muted">{thing.key}</td>
                <td className={cn('px-3 text-body-2', thing.summary && 'py-1.5')}>
                  <Link href={HREF} variant="quiet" truncate className="block text-text-primary">
                    {thing.title}
                  </Link>
                  <SummaryLine summary={thing.summary} lines={1} className="text-caption" />
                </td>
                <td className="px-3 text-body-2">{thing.status && <span className="flex items-center gap-1.5"><StatusMark status={thing.status} />{thing.status.label}</span>}</td>
                <td className="px-3 text-body-2">{thing.assignee && <Person name={thing.assignee} size={16} />}</td>
                <td className="px-3 text-body-2 tabular-nums text-text-muted">2h</td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}

/**
 * Ship's ProjectCard. Today it shows the description flattened and cut to two
 * lines, holding two lines' height even when empty; the summary takes that
 * place, and with none the card is shorter.
 */
export function ShipProjectCard({ thing, today = false }: { thing: Thing; today?: boolean }) {
  return (
    <Card fill="surface" className="flex flex-col gap-2 p-3">
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 truncate text-body-2-strong text-text-primary">{thing.title}</span>
      </div>
      {today ? (
        <p className="mb-1 line-clamp-2 min-h-[2lh] text-body-2 text-text-secondary">## Context A description long enough to need more than one line, flattened from its blocks, headings and all.</p>
      ) : (
        <SummaryLine summary={thing.summary} lines={2} className="mb-1 text-body-2" />
      )}
      <div className="flex items-center gap-2.5 text-caption text-text-muted">
        {thing.status && <span className="flex items-center gap-1"><StatusMark status={thing.status} />{thing.status.label}</span>}
        <span aria-hidden>·</span>
        <span>8 issues</span>
        <span aria-hidden>·</span>
        <span>{thing.progress}</span>
      </div>
      <div className="flex items-center gap-2.5 text-caption text-text-muted">
        <span className="flex items-center gap-1.5">
          by <Person name={thing.assignee} size={16} />
        </span>
        <span aria-hidden>·</span>
        <span>3d ago</span>
      </div>
    </Card>
  )
}

/** ProjectCardSkeleton, one bar for the summary in place of the description's two. */
export function ShipProjectCardLoading() {
  return (
    <Card fill="surface" className="flex flex-col gap-2 p-3">
      <SkeletonBar className="h-4 w-1/2" />
      <div className="mb-1 flex flex-col gap-1.5">
        <SkeletonBar className="h-3.5 w-full" />
        <SkeletonBar className="h-3.5 w-3/4" />
      </div>
      <SkeletonBar className="h-3 w-1/3" />
      <div className="flex items-center gap-2">
        <SkeletonBar className="size-4" />
        <SkeletonBar className="h-3 w-20" />
      </div>
    </Card>
  )
}

/** Peek's Desk row (PersonRow): 32px today; with a summary it takes a second line. */
export function PeekDeskRow({ thing }: { thing: Thing }) {
  return (
    <div className={cn('flex cursor-pointer gap-2 rounded-lg px-2 transition-colors hover:bg-bg-hover', thing.summary ? 'items-start py-1.5' : 'h-[32px] items-center')}>
      <span className={cn('flex shrink-0', thing.summary && 'pt-0.5')}>
        <ThingIcon kind="topic" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate text-body-2', thing.unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>{thing.title}</span>
        <SummaryLine summary={thing.summary} lines={1} className="text-caption" />
      </span>
      {thing.unread && (
        <span className={cn('flex shrink-0', thing.summary && 'pt-1.5')}>
          <UnreadDot />
        </span>
      )}
    </div>
  )
}

/** Leaf's Recent row (a Card in HomePage): the summary under the title, the Folder and who at the right. */
export function LeafRecentRow({ thing }: { thing: Thing }) {
  return (
    <Card href={HREF} hover="fill" quietUntilHover className={cn('flex gap-3 px-3 py-2', thing.summary ? 'items-start' : 'items-center')}>
      <span className={cn('flex shrink-0', thing.summary && 'pt-0.5')}>
        <KindIcon kind="file" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="block truncate text-body-2-strong text-text-primary">{thing.title}</span>
        <SummaryLine summary={thing.summary} lines={1} className="text-body-2" />
      </span>
      <span className={cn('shrink-0 text-caption text-text-muted', thing.summary && 'pt-0.5')}>
        {thing.subtitle} · Person One, yesterday
      </span>
    </Card>
  )
}

/* ------------------------------------------------------------ picker and search */

/**
 * Open call 2: in a one-line row with a caption, does an issue keep its
 * project?
 * - `caption` (recommended): the project stays, after the title, and the
 *   summary is the second line;
 * - `summary`: the summary replaces the project.
 * Without a summary both are today's row: the project as the second line.
 */
export type CaptionOption = 'caption' | 'summary'

function RowMiddle({ thing, option }: { thing: Thing; option: CaptionOption }) {
  const second = thing.summary ?? thing.subtitle
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-body-2 text-text-primary">{thing.title}</span>
        {option === 'caption' && thing.summary && thing.subtitle && <span className="shrink-0 text-caption text-text-muted">{thing.subtitle}</span>}
      </span>
      {second && <span className="truncate text-caption text-text-secondary">{second}</span>}
    </span>
  )
}

/** The `[` picker's file row (SuggestionMenu's default MenuItem): the kind's icon, the title, the second line. */
export function PickerRow({ thing, option, selected = false }: { thing: Thing; option: CaptionOption; selected?: boolean }) {
  return (
    <MenuItem role="option" tabIndex={-1} selected={selected} leading={<ThingIcon kind={thing.kind} />} hint={<EnterHint />}>
      <RowMiddle thing={thing} option={option} />
    </MenuItem>
  )
}

/** Peek's search (CommandPalette) file row: the tall row with its 32px tile. Files have no second line there today. */
export function SearchRow({ thing, option, selected = false }: { thing: Thing; option: CaptionOption; selected?: boolean }) {
  return (
    <MenuItem
      role="option"
      tabIndex={-1}
      size="tall"
      selected={selected}
      leading={
        <span className="flex size-8 items-center justify-center rounded-sm bg-bg-inset">
          <ThingIcon kind={thing.kind} />
        </span>
      }
      hint={<EnterHint />}
    >
      <RowMiddle thing={{ ...thing, subtitle: thing.kind === 'issue' ? thing.subtitle : undefined }} option={option} />
    </MenuItem>
  )
}

/* ------------------------------------------------------------ the cards that already draw */

/**
 * Peek's ForeignObjectCard, whole: the title and its noun, then the subtitle
 * line, which now carries the summary. Today that line has no clamp (it held
 * a project's name); a summary needs two lines at most.
 */
export function PeekFileCard({ thing }: { thing: Thing }) {
  return (
    <Card fill="inset" className="mt-1 p-3">
      <div className="flex items-baseline gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-body-2 font-semibold text-text-primary">
          <Link href={HREF} variant="quiet" external truncate>
            {thing.title}
          </Link>
        </span>
        <SectionLabel className="shrink-0">{thing.kind === 'page' ? thing.app : thing.noun}</SectionLabel>
      </div>
      <SummaryLine summary={thing.summary} lines={2} className="mt-1 text-caption" />
    </Card>
  )
}

/** Ship's Related (and Folder) row: the title and its type, then the subtitle slot, which now carries the summary. */
export function ShipRelatedRow({ thing }: { thing: Thing }) {
  return (
    <Card href={HREF} fill="none" hover="fill" quietUntilHover className="grid grid-cols-[minmax(0,1fr)_7rem_4rem] items-center gap-3 px-2 py-1.5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-body-2 text-text-primary">{thing.title}</span>
          <span className="shrink-0 text-caption text-text-muted">{thing.noun}</span>
        </span>
        {thing.summary && (
          <span className="flex min-w-0 items-center gap-1.5 text-caption text-text-muted">
            <span className="truncate">{thing.summary}</span>
          </span>
        )}
      </span>
      <span className="flex min-w-0 text-caption text-text-secondary">{thing.status && <span className="flex items-center gap-1"><StatusMark status={thing.status} />{thing.status.label}</span>}</span>
      <span className="flex justify-end text-caption tabular-nums text-text-muted">{thing.comments}</span>
    </Card>
  )
}
