import { Fragment, useState, type MouseEvent, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconArrowBigUpLine, IconChecks, IconChevronRight, IconLock, IconMessage2, IconX } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { AvatarGroup } from '../../src/AvatarGroup'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { Checkbox } from '../../src/Checkbox'
import { CardUnder } from '../../src/CardUnder'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { CommentBox, commentBoxRows } from '../../src/CommentBox'
import type { MentionPerson } from '../../src/ComposerTriggers'
import { Field } from '../../src/Field'
import { IconButton } from '../../src/IconButton'
import { KindIcon } from '../../src/KindIcon'
import { LinkCard } from '../../src/LinkCard'
import type { LinkState } from '../../src/linked'
import { ReactionRow } from '../../src/ReactionRow'
import { TextInput } from '../../src/TextInput'
import { PEOPLE, REACTION_OPTIONS, fileOf, teamOf, type FileRow, type HighlightType, type Message, type PersonId, type Reply, type SentUp } from './fixtures'

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
 * and a thread's card draws its highlighted replies as a short timeline down to
 * its resolution: heading, the first message, each highlight, the replies row,
 * the resolution. A thread reaches a topic's Main only when someone sends it
 * there (decision-briefs/what-bubbles-up.html, option A).
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

export function cardOf(file: FileRow, updated: string): LinkState {
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

/** As Peek's card: a click opens the thread beside it, unless it was on a control inside. */
const opensOnClick = (onOpen?: () => void) => (e: MouseEvent) => {
  if (!onOpen || (e.target as HTMLElement).closest('button, [role="button"], [data-interactive]')) return
  onOpen()
}

/** One message: peek-app's ConversationCard. */
export function PeekCard({ m, viewer, heading, selected, onFile, onOpen }: { m: Message; viewer: PersonId; heading: boolean; selected: boolean; onFile: (id: string) => void; onOpen: () => void }) {
  return (
    <Card fill="surface" hover="fill" quietUntilHover selected={selected} className="relative" onClick={opensOnClick(onOpen)}>
      <MessageRows m={m} viewer={viewer} heading={heading} onFile={onFile} />
    </Card>
  )
}

/**
 * A thread sent up to the topic by hand (Miky, 29 Oct): a message on the topic
 * by whoever sent it, their own line, and under it the thread's mini-timeline.
 * Their line is the topic's, so everyone who reads the topic reads it; someone
 * who can't open the file sees a locked line in place of the thread.
 */
export function SentCard({ m, up, readable, viewer, selected, onFile, onOpen }: { m: Message; up: SentUp; readable: boolean; viewer: PersonId; selected: boolean; onFile: (id: string) => void; onOpen: () => void }) {
  return (
    <Card fill="surface" hover="fill" quietUntilHover selected={selected} className="relative" onClick={opensOnClick(readable ? onOpen : undefined)}>
      <div className="grid w-full grid-cols-[24px_minmax(0,1fr)] gap-x-2 px-2 pt-2">
        <Avatar name={nameOf(up.by)} size={24} />
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-body-2-strong text-text-primary">{nameOf(up.by)}</span>
          <span className="flex items-center gap-1 whitespace-nowrap text-caption text-accent-text">
            <IconArrowBigUpLine size={14} stroke={1.5} aria-hidden />
            sent this up
          </span>
          <span className={META}>{up.at}</span>
        </div>
        {up.note && (
          <>
            <span />
            <p className="whitespace-pre-wrap pb-1 pr-2 pt-1 text-body-2 text-text-primary">{up.note}</p>
          </>
        )}
        <span />
        <div className="pb-2 pr-2 pt-1">
          {readable ? (
            <div className="rounded-lg border border-border-subtle">
              <MessageRows m={m} viewer={viewer} heading onFile={onFile} />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-body-2 text-text-muted">
              <IconLock size={16} stroke={1.5} aria-hidden />A thread on a file you can’t open
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * A message's rows beside a left column. `heading` draws the file it was
 * written on at the top. A thread with highlighted replies draws them under the
 * message on a line that ends at its resolution, or at the last highlight.
 */
function MessageRows({ m, viewer, heading, onFile }: { m: Message; viewer: PersonId; heading: boolean; onFile: (id: string) => void }) {
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
    <div className="grid w-full grid-cols-[24px_minmax(0,1fr)] gap-x-2 px-2 pt-2">
        {file && heading && (
          <>
            <span className="mb-2 flex size-6 items-center justify-center text-text-secondary">
              <KindIcon kind={kindOf(file)} size={16} />
            </span>
            <span className="mb-2 flex min-w-0 items-center">
              <button type="button" onClick={() => onFile(file.id)} className="-mx-1 truncate rounded px-1 text-left text-h4 text-text-primary hover:bg-bg-hover">
                {file.title}
              </button>
            </span>
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
 *
 * A file's thread has Send to topic: nothing reaches a topic's Main by itself,
 * resolved or not (Miky, 29 Oct). `places` are the topics that list the file
 * and that the viewer reads; `sentTo` says where it already went, and by whom.
 */
export function ThreadPanel({
  m,
  viewer,
  places,
  sentTo,
  onSend,
  onClose,
}: {
  m: Message
  viewer: PersonId
  places: { id: string; title: string }[]
  sentTo: { topic: string; up: SentUp }[]
  onSend: (topics: string[], note: string) => void
  onClose: () => void
}) {
  const [sent, setSent] = useState<Reply[]>([])
  const [sending, setSending] = useState(false)
  const file = m.on ? fileOf(m.on) : undefined
  const open = places.filter((p) => !sentTo.some((s) => s.topic === p.id))
  const rows: Reply[] = [{ by: m.by, at: m.at, body: m.body }, ...(m.thread ?? []), ...sent]
  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-border-subtle">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <span className="flex-1 text-h4 text-text-primary">Thread</span>
        {file && (
          <Button
            variant="outlined"
            size="small"
            leadingIcon={<IconArrowBigUpLine size={16} stroke={1.5} />}
            disabledReason={open.length > 0 ? undefined : places.length === 0 ? 'No topic you read lists this file' : 'Already sent to every topic that lists this file'}
            onClick={() => setSending(true)}
          >
            Send to topic
          </Button>
        )}
        <IconButton aria-label="Close the thread" tooltip="Close" onClick={onClose}>
          <IconX size={16} stroke={1.5} />
        </IconButton>
      </div>
      {file && sending && open.length > 0 && (
        <SendToTopic
          file={file}
          places={open}
          onCancel={() => setSending(false)}
          onSend={(topics, note) => {
            onSend(topics, note)
            setSending(false)
          }}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {file && (
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-h4 text-text-primary">
              <KindIcon kind={kindOf(file)} />
              {file.title}
            </span>
            {sentTo.map(({ topic, up }) => (
              <span key={topic} className="flex items-center gap-1 text-caption text-text-muted">
                <IconArrowBigUpLine size={14} stroke={1.5} aria-hidden />
                {up.by === viewer ? 'You' : nameOf(up.by)} sent this to {places.find((p) => p.id === topic)?.title ?? 'a topic'} · {up.at}
              </span>
            ))}
          </div>
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

/**
 * Send to topic: pick one of the topics that list the file, and add a line of
 * your own if you like. The line goes to every reader of the topic, also those
 * who can't open the file, so the form says so.
 */
function SendToTopic({ file, places, onCancel, onSend }: { file: FileRow; places: { id: string; title: string }[]; onCancel: () => void; onSend: (topics: string[], note: string) => void }) {
  // The topic you are on is ticked; with several, tick more or all of them (Miky, 29 Oct).
  const [topics, setTopics] = useState([places[0].id])
  const [note, setNote] = useState('')
  const every = topics.length === places.length
  const tick = (id: string, on: boolean) => setTopics((now) => (on ? [...now, id] : now.filter((t) => t !== id)))
  return (
    <form
      className="flex flex-col gap-3 border-b border-border-subtle bg-bg-inset p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (topics.length > 0) onSend(topics, note.trim())
      }}
    >
      {places.length === 1 ? (
        <span className="flex items-center gap-2 text-body-2 text-text-primary">
          <KindIcon kind="topic" />
          {places[0].title}
        </span>
      ) : (
        <div role="group" aria-label="Topics" className="flex flex-col gap-0.5">
          <Checkbox row label={`All ${places.length} topics that list it`} checked={every} onChange={(on) => setTopics(on ? places.map((p) => p.id) : [])} />
          {places.map((p) => (
            <Checkbox key={p.id} row leading={<KindIcon kind="topic" />} label={p.title} checked={topics.includes(p.id)} onChange={(on) => tick(p.id, on)} />
          ))}
        </div>
      )}
      <Field label="Your line" helper={`Optional. Everyone who reads the topic sees it, also people who can’t open ${file.title}.`}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why the topic should see this…" />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="muted" size="small" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="small" type="submit" disabledReason={topics.length === 0 ? 'Tick a topic first' : undefined}>
          Send
        </Button>
      </div>
    </form>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** "Tue 11:40" as minutes into the week, to put the activity in order; "Now" is last. */
const minutesOf = (at: string) => {
  const [day, time] = at.split(' ')
  if (!time) return Infinity
  const [h, m] = time.split(':').map(Number)
  return DAYS.indexOf(day) * 1440 + h * 60 + m
}

interface ActivityItem {
  key: string
  thread: string
  by: PersonId
  at: string
  what: ReactNode
  mark: ReactNode
  on?: string
}

/**
 * What happened in the topic that is about you, newest first (Miky, 29 Oct):
 * someone mentioned you, highlighted a reply, or reacted to your message.
 * It is yours alone, so it never changes what Main shows anyone.
 */
function activityFor(viewer: PersonId, messages: Message[]): ActivityItem[] {
  const items: ActivityItem[] = []
  for (const m of messages) {
    if (m.mentions === viewer && m.by !== viewer)
      items.push({ key: `${m.id}-mention`, thread: m.id, by: m.by, at: m.at, on: m.on, what: 'mentioned you', mark: <span className="text-body-2-strong text-accent-text">@</span> })
    for (const [i, r] of (m.thread ?? []).entries()) {
      if (r.highlight && r.by !== viewer)
        items.push({ key: `${m.id}-h${i}`, thread: m.id, by: r.by, at: r.at, on: m.on, what: <>marked a {HIGHLIGHT[r.highlight].label}</>, mark: <span className={cn('size-2.5 rounded-sm', HIGHLIGHT[r.highlight].fill)} /> })
    }
    if (m.by === viewer)
      for (const r of m.reactions ?? [])
        for (const who of r.by.filter((p) => p !== viewer))
          items.push({ key: `${m.id}-${r.emoji}-${who}`, thread: m.id, by: who, at: m.at, on: m.on, what: 'reacted to your message', mark: <span className="text-body-2">{r.emoji}</span> })
  }
  return items.sort((a, b) => minutesOf(b.at) - minutesOf(a.at))
}

/** The topic's activity for you, above its listed files: each row opens its thread. */
export function TopicActivity({ viewer, messages, onOpen }: { viewer: PersonId; messages: Message[]; onOpen: (thread: string) => void }) {
  const items = activityFor(viewer, messages)
  return (
    <div className="flex flex-col gap-1">
      {items.length === 0 && <p className="px-2 text-body-2 text-text-muted">Nothing for you yet.</p>}
      {items.map((a) => (
        <button key={a.key} type="button" onClick={() => onOpen(a.thread)} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-bg-hover">
          <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
            {a.mark}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body-2 text-text-primary">
              <span className="text-body-2-strong">{nameOf(a.by)}</span> {a.what}
            </span>
            <span className="truncate text-caption text-text-muted">
              {a.on ? fileOf(a.on).title : 'On the topic'} · {a.at}
            </span>
          </span>
        </button>
      ))}
    </div>
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
