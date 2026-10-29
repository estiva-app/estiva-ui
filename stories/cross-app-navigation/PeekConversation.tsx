import { Fragment, useState, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconChecks, IconChevronRight, IconMessage2, IconX } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { AvatarGroup } from '../../src/AvatarGroup'
import { Card } from '../../src/Card'
import { CardUnder } from '../../src/CardUnder'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { CommentBox, commentBoxRows } from '../../src/CommentBox'
import type { MentionPerson } from '../../src/ComposerTriggers'
import { IconButton } from '../../src/IconButton'
import { KindIcon } from '../../src/KindIcon'
import { LinkCard } from '../../src/LinkCard'
import type { LinkState } from '../../src/linked'
import { ReactionRow } from '../../src/ReactionRow'
import { PEOPLE, REACTION_OPTIONS, fileOf, teamOf, type FileRow, type HighlightType, type Message, type PersonId, type Reply } from './fixtures'

/**
 * Peek's topic conversation, from what is built and settled: each message is
 * peek-app's `ConversationCard` (origin/main, ui 0.88), drawn here from the same
 * ui parts it is made of — `Card`, `Avatar`, `ReactionRow`, its `RepliesRow`,
 * `HighlightPill` and resolution banner — because this Storybook cannot import
 * an app. The card a message was sent with is `CardUnder`, and the box is
 * `CommentBox`.
 *
 * What is new: the file a message was written on is the card's heading
 * (decision-briefs/navigation-assets/conversation-heading-inspiration.png),
 * and a thread bubbles up its highlighted replies as a short timeline down to
 * its resolution: heading, the first message, each highlight, the replies row,
 * the resolution.
 */

const nameOf = (id: string) => PEOPLE[id as PersonId]?.name ?? 'Someone'
const MENTION_PEOPLE: MentionPerson[] = (Object.keys(PEOPLE) as PersonId[]).map((id, i) => ({ id, name: PEOPLE[id].name, pubkey: String(i + 1).repeat(64) }))
const kindOf = (file: FileRow) => (file.app === 'ship' ? 'project' : 'file')

/** Peek's MetaText: the time beside a name. */
const META = 'whitespace-nowrap text-caption text-text-muted signal:font-mono signal:text-small signal:tracking-wide signal:tabular-nums'

/** Peek's HIGHLIGHT_META and HIGHLIGHT_FILL_CLASSES; Summary's colour is Peek's own token, here the accent it points to. */
const HIGHLIGHT: Record<HighlightType, { label: string; fill: string }> = {
  insight: { label: 'Insight', fill: 'bg-warning-default' },
  concern: { label: 'Concern', fill: 'bg-error-default' },
  conclusion: { label: 'Conclusion', fill: 'bg-success-default' },
  question: { label: 'Question', fill: 'bg-info-default' },
  summary: { label: 'Summary', fill: 'bg-accent-primary' },
}

function cardOf(file: FileRow, updated: string): LinkState {
  const [done, total] = file.progress?.split(' of ').map(Number) ?? []
  return {
    state: 'ready',
    linked: {
      id: file.id,
      kind: kindOf(file),
      title: file.title,
      href: '#',
      subtitle: `${file.app === 'ship' ? 'Ship project' : 'Leaf document'} · ${teamOf(file.team).name}`,
      done: total ? { done, total } : undefined,
      updated,
    },
  }
}

/** peek-app's HighlightPill: the highlight's colour square and its name. */
function HighlightPill({ type }: { type: HighlightType }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm bg-accent-muted px-1.5 py-0.5 text-chip">
      <span className={cn('size-2.5 shrink-0 rounded-sm', HIGHLIGHT[type].fill)} />
      <span className="text-text-primary signal:font-mono signal:text-small signal:font-semibold signal:tracking-wide">{HIGHLIGHT[type].label}</span>
    </span>
  )
}

/**
 * The left column under the avatar. `through` carries the timeline's line past
 * this row; `to-marker` ends it at this row's marker.
 */
function Rail({ line = 'none', marker, banner = false }: { line?: 'none' | 'through' | 'to-marker' | 'dotted'; marker?: ReactNode; banner?: boolean }) {
  return (
    <div className="relative" aria-hidden>
      {line === 'dotted' && <span className="absolute bottom-0 left-1/2 top-0 -translate-x-1/2 border-l-2 border-dotted border-border-strong" />}
      {(line === 'through' || line === 'to-marker') && (
        <span className={cn('absolute left-1/2 top-0 w-0.5 -translate-x-1/2 bg-border-strong', line === 'through' ? 'bottom-0' : banner ? 'h-5' : 'h-2.5')} />
      )}
      {/* On a highlight's name line, or on the banner's first line. */}
      {marker && <span className={cn('absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2', banner ? 'top-5' : 'top-2.5')}>{marker}</span>}
    </div>
  )
}

/** The replies between two steps of the timeline, said quietly on a dotted stretch of its line. */
function Between({ n }: { n?: number }) {
  if (!n) return null
  return (
    <>
      <Rail line="dotted" />
      <span className="pb-2 text-caption text-text-muted signal:font-mono signal:text-small signal:tracking-wide">
        {n} {n === 1 ? 'reply' : 'replies'}
      </span>
    </>
  )
}

/** peek-app's RepliesRow: who replied, "N replies", the last reply's time, and "1 new". */
function RepliesRow({ replies }: { replies: NonNullable<Message['replies']> }) {
  return (
    <div className="flex w-full items-center gap-2 pb-1.5 pr-2">
      <div className="group/replies flex shrink-0 items-center gap-2 py-1.5 signal:rounded-lg signal:border signal:border-transparent signal:px-2 signal:transition-colors signal:hover:border-accent-outline signal:hover:bg-accent-wash">
        <div className="hidden shrink-0 items-center signal:flex">
          <AvatarGroup size={18} members={replies.by.map((id) => ({ name: nameOf(id) }))} />
        </div>
        <IconMessage2 size={16} stroke={1.5} className="shrink-0 text-text-secondary transition-colors group-hover/replies:text-text-primary signal:hidden" aria-hidden />
        <span className="text-chip text-text-secondary transition-colors group-hover/replies:text-text-primary signal:font-medium signal:text-text-interactive signal:group-hover/replies:text-text-primary">
          {replies.count} {replies.count === 1 ? 'reply' : 'replies'}
        </span>
        <span className="mt-px hidden font-mono text-small leading-3 tabular-nums text-text-muted signal:inline">{replies.last}</span>
        <IconChevronRight size={12} stroke={2} className="hidden text-text-muted transition-all group-hover/replies:translate-x-0.5 group-hover/replies:text-text-primary signal:block" aria-hidden />
      </div>
      {replies.unread && (
        <>
          <div className="size-0.5 shrink-0 rounded-full bg-text-muted" />
          <Chip type="brand" label="1 new" />
        </>
      )}
    </div>
  )
}

/** peek-app's resolution banner: who resolved, and what they said. */
function Resolution({ r }: { r: NonNullable<Message['resolved']> }) {
  return (
    // Peek's green banner, laid out as a highlight is (Miky, 29 Oct): who resolved it on a line of its own, the note under it.
    <div className="mb-2 mr-1 flex min-w-0 flex-col gap-1 signal:rounded-lg signal:border signal:border-success-outline signal:bg-success-wash signal:px-3 signal:py-2.5">
      <div className="flex h-5 items-center gap-2">
        <Avatar name={nameOf(r.by)} size={16} />
        <span className="whitespace-nowrap text-body-2-strong text-text-primary">{nameOf(r.by)}</span>
        <span className="flex items-center gap-1 text-h5 text-success-default">
          <IconChecks size={16} stroke={1.5} className="shrink-0 signal:drop-shadow-glow-success" aria-hidden />
          Resolved
        </span>
      </div>
      {r.note && <p className="text-body-2 text-text-primary">{r.note}</p>}
    </div>
  )
}

/**
 * One message: peek-app's ConversationCard, in rows beside a left column.
 * `heading` draws the file it was written on at the top. A thread with
 * highlighted replies draws them under the message on a line that ends at its
 * resolution, or at the last highlight.
 */
export function PeekCard({ m, viewer, heading, selected, onFile, onOpen }: { m: Message; viewer: PersonId; heading: boolean; selected: boolean; onFile: (id: string) => void; onOpen: () => void }) {
  const [reactions, setReactions] = useState(m.reactions ?? [])
  const file = m.on ? fileOf(m.on) : undefined
  const under = m.card ? fileOf(m.card) : undefined
  const { steps: highlights, rest } = stepsOf(m.thread ?? [])
  const timeline = highlights.length > 0
  const body = timeline ? 'through' : 'none'
  const toggle = (emoji: string) =>
    setReactions((now) => {
      const held = now.find((r) => r.emoji === emoji)
      if (!held) return [...now, { emoji, by: [viewer] }]
      const by = held.by.includes(viewer) ? held.by.filter((p) => p !== viewer) : [...held.by, viewer]
      return now.map((r) => (r === held ? { emoji, by } : r)).filter((r) => r.by.length > 0)
    })
  return (
    <Card
      fill="surface"
      hover="fill"
      quietUntilHover
      selected={selected}
      className="relative"
      // As Peek's card: a click opens the thread beside it, unless it was on a control inside.
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, [role="button"], [data-interactive]')) return
        onOpen()
      }}
    >
      <div className="grid w-full grid-cols-[24px_minmax(0,1fr)] gap-x-2 px-2 pt-2">
        {file && heading && (
          <>
            <span className="mb-2 flex size-6 items-center justify-center text-text-secondary">
              <KindIcon kind={kindOf(file)} size={16} />
            </span>
            <button type="button" onClick={() => onFile(file.id)} className="-mx-1 mb-2 justify-self-start truncate rounded px-1 text-left text-h4 text-text-primary hover:bg-bg-hover">
              {file.title}
            </button>
          </>
        )}
        <Avatar name={PEOPLE[m.by].name} size={24} />
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-body-2-strong text-text-primary">{PEOPLE[m.by].name}</span>
          <span className={META}>{m.at}</span>
        </div>
        <Rail line={body} />
        <div className="whitespace-pre-wrap pb-2 pr-2 pt-1 text-body-2 text-text-primary">{m.body}</div>
        {under && (
          <>
            <Rail line={body} />
            <div className="pb-2 pr-2">
              <CardUnder>
                <LinkCard link={cardOf(under, m.at)} />
              </CardUnder>
            </div>
          </>
        )}
        {reactions.length > 0 && (
          <>
            <Rail line={body} />
            <div className="pb-2 pt-1">
              <ReactionRow reactions={reactions} options={REACTION_OPTIONS} nameOf={nameOf} viewer={viewer} onToggle={toggle} />
            </div>
          </>
        )}
        {highlights.map((s, i) => (
          <Fragment key={i}>
            <Between n={s.after} />
            <HighlightRow h={s.reply} line={i === highlights.length - 1 && !m.resolved ? 'to-marker' : 'through'} />
          </Fragment>
        ))}
        {/* Without a timeline, Peek's order: the replies, then the resolution. */}
        {m.replies && !timeline && (
          <>
            <span />
            <RepliesRow replies={m.replies} />
          </>
        )}
        {m.resolved && (
          <>
            {timeline && <Between n={rest} />}
            <Rail line={timeline ? 'to-marker' : 'none'} banner marker={timeline && <span className="size-2 rounded-full bg-success-default" />} />
            <Resolution r={m.resolved} />
          </>
        )}
        {/* With one, the replies row closes the card: the way into the whole thread. */}
        {m.replies && timeline && (
          <>
            <span />
            <RepliesRow replies={m.replies} />
          </>
        )}
      </div>
    </Card>
  )
}

/** The thread's highlighted replies, each with how many plain replies came since the step before; `rest` came after the last. */
function stepsOf(thread: Reply[]) {
  const steps: { reply: Reply; after: number }[] = []
  let plain = 0
  for (const reply of thread) {
    if (!reply.highlight) plain++
    else {
      steps.push({ reply, after: plain })
      plain = 0
    }
  }
  return { steps, rest: plain }
}

/** One highlighted reply, bubbled up into the thread's card: who, the highlight, when, and the words. */
function HighlightRow({ h, line }: { h: Reply; line: 'through' | 'to-marker' }) {
  const type = h.highlight!
  return (
    <>
      <Rail line={line} marker={<span className={cn('size-2 rounded-sm', HIGHLIGHT[type].fill)} />} />
      <div className="flex min-w-0 flex-col gap-1 pb-3 pr-2">
        <div className="flex h-5 items-center gap-2">
          <Avatar name={PEOPLE[h.by].name} size={16} />
          <span className="whitespace-nowrap text-body-2-strong text-text-primary">{PEOPLE[h.by].name}</span>
          <HighlightPill type={type} />
          <span className={META}>{h.at}</span>
        </div>
        <p className="text-body-2 text-text-primary">{h.body}</p>
      </div>
    </>
  )
}

/**
 * The thread beside the conversation, as Peek opens it: the message, every
 * reply (a highlighted one with its pill), the resolution, and a box to reply.
 * The file it was written on heads the thread and scrolls away with it; the
 * panel's own header says only "Thread" (Miky, 29 Oct).
 */
export function ThreadPanel({ m, viewer, onClose }: { m: Message; viewer: PersonId; onClose: () => void }) {
  const [sent, setSent] = useState<Reply[]>([])
  const file = m.on ? fileOf(m.on) : undefined
  const rows: Reply[] = [{ by: m.by, at: m.at, body: m.body }, ...(m.thread ?? []), ...sent]
  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-border-subtle">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <span className="flex-1 text-h4 text-text-primary">Thread</span>
        <IconButton aria-label="Close the thread" tooltip="Close" onClick={onClose}>
          <IconX size={16} stroke={1.5} />
        </IconButton>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {file && (
          <span className="flex items-center gap-2 text-h4 text-text-primary">
            <KindIcon kind={kindOf(file)} />
            {file.title}
          </span>
        )}
        {rows.map((r, i) => (
          <Fragment key={i}>
            <div className="flex gap-2">
              <Avatar name={PEOPLE[r.by].name} size={24} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="whitespace-nowrap text-body-2-strong text-text-primary">{PEOPLE[r.by].name}</span>
                  {r.highlight && <HighlightPill type={r.highlight} />}
                  <span className={META}>{r.at}</span>
                </div>
                <p className="whitespace-pre-wrap text-body-2 text-text-primary">{r.body}</p>
              </div>
            </div>
            {i === 0 && rows.length > 1 && (
              <div className="flex items-center gap-2 text-caption text-text-muted">
                {rows.length - 1} {rows.length === 2 ? 'reply' : 'replies'}
                <span className="h-px flex-1 bg-border-subtle" />
              </div>
            )}
          </Fragment>
        ))}
        {m.resolved && <Resolution r={m.resolved} />}
      </div>
      <div className="border-t border-border-subtle p-3">
        <PeekBox to="the thread" label="Reply" onSent={(body) => setSent((now) => [...now, { by: viewer, at: 'Now', body }])} />
      </div>
    </aside>
  )
}

/** The words of a sent box, for the prototype's own new message. */
function textOf(node: JSONContent): string {
  if (node.text) return node.text
  if (node.attrs?.label) return `@${node.attrs.label}`
  const inner = (node.content ?? []).map(textOf)
  return node.type === 'doc' ? inner.join('\n') : inner.join('')
}

/** Peek's box under the conversation: the shared CommentBox. Sending adds the message here. */
export function PeekBox({ to, label, onSent }: { to: string; label?: string; onSent: (body: string) => void }) {
  return (
    <CommentBox
      key={to}
      label={label ?? `Write to ${to}`}
      placeholder={label ? `${label}…` : `Write to ${to}…`}
      people={MENTION_PEOPLE}
      insert={[commentBoxRows.mention, commentBoxRows.urgent]}
      showsAtOnce
      send={async () => ({ accepted: true })}
      onSent={(body) => {
        const text = textOf(body).trim()
        if (text) onSent(text)
      }}
    />
  )
}
