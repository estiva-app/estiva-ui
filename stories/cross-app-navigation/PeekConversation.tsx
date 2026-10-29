import { Fragment, createContext, useContext, useState, type MouseEvent, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconArrowForwardUp, IconChecks, IconCircleCheck, IconShare3, IconChevronRight, IconLock, IconMessage2, IconX } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { AvatarGroup } from '../../src/AvatarGroup'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { CardUnder } from '../../src/CardUnder'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { CommentBox, commentBoxRows } from '../../src/CommentBox'
import { Divider } from '../../src/Divider'
import type { MentionPerson } from '../../src/ComposerTriggers'
import { Field } from '../../src/Field'
import { IconButton } from '../../src/IconButton'
import { KindIcon } from '../../src/KindIcon'
import { LinkCard } from '../../src/LinkCard'
import type { LinkState } from '../../src/linked'
import { ReactionRow } from '../../src/ReactionRow'
import { SearchInput } from '../../src/SearchInput'
import { TextInput } from '../../src/TextInput'
import { PreviewCard } from '../../src/PreviewCard'
import { ScrollArea } from '../../src/ScrollArea'
import { MESSAGES, NEW_SINCE, PEOPLE, REACTION_OPTIONS, canReadFile, fileOf, teamOf, type FileRow, type HighlightType, type Message, type PersonId, type Reply, type SentUp } from './fixtures'

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
  // New with this prototype (Miky, 29 Oct); its colour is a placeholder until Katerina picks one.
  update: { label: 'Update', fill: 'bg-text-secondary' },
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
          {/* No verb on the card: the sender, their line and the thread say enough (Miky, 29 Oct, to judge). */}
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
          {m.highlight && <HighlightPill type={m.highlight} />}
          <span className={META}>{m.at}</span>
        </div>
        {m.status && (
          <>
            <Rail line={body} />
            {/* The status change the Update came with, from the file's own app. */}
            <span className="flex items-center gap-1 pt-1 text-caption text-success-default">
              <IconCircleCheck size={14} stroke={1.5} aria-hidden />
              {file?.app === 'ship' ? 'Project' : 'File'} marked {m.status}
            </span>
          </>
        )}
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
 * Every thread has Share: nothing reaches a topic's Main by itself, resolved
 * or not (Miky, 29 Oct). `places` are every conversation the viewer reads;
 * `main` is the topic they are on, when it has a Main; `sentTo` says where it
 * already went, and by whom.
 */
/** Where Activity lives: its own column beside the files, or behind a dot by the title (Miky, 29 Oct, to compare). */
export const ActivityVariant = createContext<'column' | 'dot'>('column')
/**
 * How you follow a topic is its icon, Important or All, in place of All | Main
 * (Miky, 29 Oct): on in Per app, off in Lens, which stays as it was to compare.
 */
export const Following = createContext(false)
/** Main is Important wherever you follow a topic (Miky, 29 Oct). */
export const useMainWord = () => (useContext(Following) ? 'Important' : 'Main')

export function ThreadPanel({
  m,
  viewer,
  main,
  places,
  sentTo,
  onSend,
  onClose,
}: {
  m: Message
  viewer: PersonId
  main?: string
  places: Place[]
  sentTo: { topic: string; up: SentUp }[]
  onSend: (topics: string[], note: string, forwarded: boolean) => void
  onClose: () => void
}) {
  const [sent, setSent] = useState<Reply[]>([])
  const [sending, setSending] = useState(false)
  const word = useMainWord()
  const file = m.on ? fileOf(m.on) : undefined
  const open = places.filter((p) => !sentTo.some((s) => s.topic === p.id))
  // Share to Main only for a file's thread, on a topic that lists the file and has a Main.
  const toMain = file ? open.find((p) => p.id === main && p.listed) : undefined
  const elsewhere = open.filter((p) => p.id !== main)
  const rows: Reply[] = [{ by: m.by, at: m.at, body: m.body, highlight: m.highlight }, ...(m.thread ?? []), ...sent]
  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-border-subtle">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <span className="flex-1 text-h4 text-text-primary">Thread</span>
        <Button
          variant="outlined"
          size="small"
          leadingIcon={<IconShare3 size={16} stroke={1.5} />}
          disabledReason={toMain || elsewhere.length > 0 ? undefined : 'Already shared everywhere you read'}
          onClick={() => setSending(true)}
        >
          {/* Share, the action's word (Miky, 29 Oct). */}
          Share
        </Button>
        <IconButton aria-label="Close the thread" tooltip="Close" onClick={onClose}>
          <IconX size={16} stroke={1.5} />
        </IconButton>
      </div>
      {sending && (toMain || elsewhere.length > 0) && (
        <ShareThread
          file={file}
          main={toMain}
          places={elsewhere}
          onCancel={() => setSending(false)}
          onSend={(topics, note, forwarded) => {
            onSend(topics, note, forwarded)
            setSending(false)
          }}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {(file || sentTo.length > 0) && (
          <div className="flex flex-col gap-1">
            {file && (
              <span className="flex items-center gap-2 text-h4 text-text-primary">
                <KindIcon kind={kindOf(file)} />
                {file.title}
              </span>
            )}
            {sentTo.map(({ topic, up }) => (
              <span key={topic} className="flex items-center gap-1 text-caption text-text-muted">
                {up.forwarded ? <IconArrowForwardUp size={14} stroke={1.5} aria-hidden /> : <IconShare3 size={14} stroke={1.5} aria-hidden />}
                {up.by === viewer ? 'You' : nameOf(up.by)} {up.forwarded ? 'forwarded this to' : `shared this to ${word} in`} {places.find((p) => p.id === topic)?.title ?? 'a conversation'} · {up.at}
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

/** A conversation a thread can be shared to: a topic, a team's chat or a shared space. */
export interface Place {
  id: string
  title: string
  icon: ReactNode
  /** Whether it lists the thread's file. */
  listed: boolean
}

/** Word starts only, as Peek's search (Miky, 19 Oct). */
const startsAWord = (title: string, query: string) => ` ${title.toLowerCase()}`.includes(` ${query.toLowerCase()}`)

/** One of Share's two choices: a row with its icon, its name and what it does. */
function Choice({ on, icon, label, hint, onPick }: { on: boolean; icon: ReactNode; label: string; hint: string; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-left', on ? 'border-accent-outline bg-accent-wash' : 'border-border-subtle hover:bg-bg-hover')}
    >
      <span className="mt-0.5 text-text-secondary">{icon}</span>
      <span className="flex flex-col">
        <span className="text-body-2-strong text-text-primary">{label}</span>
        <span className="text-caption text-text-muted">{hint}</span>
      </span>
    </button>
  )
}

/**
 * Share, opinionated (Miky, 29 Oct): share this important thread to the Main
 * of the topic you are on, or forward it to one conversation somewhere else.
 * A message on the topic itself is already there, so it can only be forwarded.
 * A line of your own goes to every reader of where it goes, also those who
 * can't open the file, so the form says so.
 */
function ShareThread({ file, main, places, onCancel, onSend }: { file?: FileRow; main?: Place; places: Place[]; onCancel: () => void; onSend: (topics: string[], note: string, forwarded: boolean) => void }) {
  const [how, setHow] = useState<'main' | 'forward'>(main ? 'main' : 'forward')
  const [to, setTo] = useState<Place>()
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const word = useMainWord()
  const matches = query.trim() ? places.filter((p) => startsAWord(p.title, query.trim())).slice(0, 5) : []
  const target = how === 'main' ? main : to
  return (
    <form
      className="flex flex-col gap-3 border-b border-border-subtle bg-bg-inset p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (target) onSend([target.id], note.trim(), how === 'forward')
      }}
    >
      {main && (
        <div role="radiogroup" aria-label="Share" className="flex flex-col gap-1.5">
          <Choice on={how === 'main'} icon={<IconShare3 size={16} stroke={1.5} />} label={`Share to ${word} in ${main.title}`} hint={`An important update: everyone in the topic sees it${word === 'Main' ? ' in Main' : ', however they follow it'}.`} onPick={() => setHow('main')} />
          <Choice on={how === 'forward'} icon={<IconArrowForwardUp size={16} stroke={1.5} />} label="Forward somewhere else" hint="To one conversation you read." onPick={() => setHow('forward')} />
        </div>
      )}
      {how === 'forward' &&
        (to ? (
          <span className="flex items-center gap-2 rounded-md border border-border-subtle px-2 py-1.5 text-body-2 text-text-primary">
            {to.icon}
            <span className="flex-1">{to.title}</span>
            <IconButton aria-label="Pick another" tooltip="Pick another" onClick={() => setTo(undefined)}>
              <IconX size={14} stroke={1.5} />
            </IconButton>
          </span>
        ) : (
          <div className="flex flex-col gap-1">
            <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Forward to…" aria-label="Forward to" autoFocus />
            {query.trim() && matches.length === 0 && <p className="px-2 py-1 text-caption text-text-muted">Nothing matches.</p>}
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-body-2 text-text-primary hover:bg-bg-hover"
                onClick={() => {
                  setTo(p)
                  setQuery('')
                }}
              >
                {p.icon}
                {p.title}
              </button>
            ))}
          </div>
        ))}
      <Field label="Your line" helper={`Optional. Everyone who reads where it goes sees it${file ? `, also people who can’t open ${file.title}` : ''}.`}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why they should see this…" />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="muted" size="small" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="small" type="submit" disabledReason={target ? undefined : 'Pick where it goes first'}>
          {how === 'main' ? `Share to ${word}` : 'Forward'}
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
    if (m.highlight && m.by !== viewer)
      items.push({ key: `${m.id}-h`, thread: m.id, by: m.by, at: m.at, on: m.on, what: <>shared an {HIGHLIGHT[m.highlight].label}</>, mark: <span className={cn('size-2.5 rounded-sm', HIGHLIGHT[m.highlight].fill)} /> })
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

/** The prototype's today: the newest day in the fixtures. "Now" is today too. */
const TODAY = 'Sat'
const DAY_NAMES: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
/** "Tue 11:40" → the day's divider: Today, Yesterday, or the weekday. */
const dayOf = (at: string) => {
  const [day, time] = at.split(' ')
  if (!time || day === TODAY) return 'Today'
  return DAYS.indexOf(day) === DAYS.indexOf(TODAY) - 1 ? 'Yesterday' : DAY_NAMES[day]
}
const timeOf = (at: string) => at.split(' ')[1] ?? at

const isNew = (viewer: PersonId, a: { at: string }) => minutesOf(a.at) > minutesOf(NEW_SINCE[viewer])
const readableIn = (viewer: PersonId, id: string) => (MESSAGES[id] ?? []).filter((m) => !m.on || canReadFile(viewer, fileOf(m.on)))
/** Whether a conversation has activity about you since you last looked: the sidebar's orange dot. */
export const hasNewActivity = (viewer: PersonId, id: string, messages = readableIn(viewer, id)) => activityFor(viewer, messages).some((a) => isNew(viewer, a))

/** A 6px dot: blue for new messages, orange for new activity only (Miky, 29 Oct). */
export function NewDot({ tone }: { tone: 'conversation' | 'activity' }) {
  return <span className={cn('size-1.5 shrink-0 rounded-full', tone === 'conversation' ? 'bg-accent-primary' : 'bg-warning-default')} aria-hidden />
}

/** A message or a reply someone else wrote since you last looked, newest first: the blue dot's list. */
function newMessagesFor(viewer: PersonId, messages: Message[]) {
  const items: { key: string; thread: string; by: PersonId; at: string; body: string; reply: boolean; on?: string }[] = []
  for (const m of messages) {
    if (m.by !== viewer && isNew(viewer, m)) items.push({ key: m.id, thread: m.id, by: m.by, at: m.at, body: m.body, reply: false, on: m.on })
    for (const [i, r] of (m.thread ?? []).entries())
      if (r.by !== viewer && isNew(viewer, r)) items.push({ key: `${m.id}-r${i}`, thread: m.id, by: r.by, at: r.at, body: r.body, reply: true, on: m.on })
  }
  return items.sort((a, b) => minutesOf(b.at) - minutesOf(a.at))
}

export const hasNewMessages = (viewer: PersonId, messages: Message[]) => newMessagesFor(viewer, messages).length > 0

/**
 * The blue dot's list (Miky, 29 Oct): the new messages and replies, and a
 * click scrolls the conversation to the message they are in.
 */
function NewMessages({ viewer, messages, onJump }: { viewer: PersonId; messages: Message[]; onJump: (thread: string) => void }) {
  const items = newMessagesFor(viewer, messages)
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 px-2 text-h5 text-text-secondary">
        <NewDot tone="conversation" />
        New messages
      </span>
      {items.map((n) => (
        <button key={n.key} type="button" onClick={() => onJump(n.thread)} className="flex flex-col gap-0.5 rounded-md bg-accent-wash px-2 py-1.5 text-left hover:bg-bg-hover">
          <span className="text-caption text-text-muted">
            {dayOf(n.at) === 'Today' ? timeOf(n.at) : `${dayOf(n.at)} ${timeOf(n.at)}`}
            {n.on && ` · ${fileOf(n.on).title}`}
          </span>
          <span className="line-clamp-2 text-body-2 text-text-primary">
            <span className="text-body-2-strong">{nameOf(n.by)}</span>
            {n.reply ? ' replied: ' : ': '}
            {n.body}
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * The Activity dot beside a conversation's title (Miky, 29 Oct, to compare
 * with the column): blue with new messages, orange with new activity only, a
 * quiet ring with neither. Hovering it shows the activity, the new rows marked;
 * when it is blue, the new messages and replies first, each scrolling to its
 * message (`onJump`).
 */
export function ActivityDot({ viewer, messages, news = messages, unread, onOpen, onJump }: { viewer: PersonId; messages: Message[]; news?: Message[]; unread: boolean; onOpen: (thread: string) => void; onJump: (thread: string) => void }) {
  const fresh = hasNewActivity(viewer, '', messages)
  return (
    <PreviewCard
      side="bottom"
      className="w-80"
      content={
        <div className="flex flex-col gap-2">
          {unread && <NewMessages viewer={viewer} messages={news} onJump={onJump} />}
          <span className="px-2 text-h5 text-text-secondary">Activity</span>
          <ScrollArea viewportClassName="max-h-[320px]">
            <TopicActivity viewer={viewer} messages={messages} onOpen={onOpen} topicLine="" markNew />
          </ScrollArea>
        </div>
      }
    >
      <button type="button" aria-label={unread ? 'New messages; show your activity' : fresh ? 'New activity; show it' : 'Show your activity'} className="flex size-6 items-center justify-center rounded-full hover:bg-bg-hover">
        {unread || fresh ? <NewDot tone={unread ? 'conversation' : 'activity'} /> : <span className="size-1.5 rounded-full border border-border-strong" aria-hidden />}
      </button>
    </PreviewCard>
  )
}

/**
 * The topic's activity for you, above its listed files: each row opens its thread.
 * Divided by day as the conversation is, each row headed by its time (Miky, 29 Oct).
 */
export function TopicActivity({ viewer, messages, onOpen, topicLine = 'On the topic', markNew = false }: { viewer: PersonId; messages: Message[]; onOpen: (thread: string) => void; topicLine?: string; markNew?: boolean }) {
  const items = activityFor(viewer, messages)
  return (
    <div className="flex flex-col gap-1">
      {items.length === 0 && <p className="px-2 text-body-2 text-text-muted">Nothing for you yet.</p>}
      {items.map((a, i) => (
        <Fragment key={a.key}>
          {(i === 0 || dayOf(items[i - 1].at) !== dayOf(a.at)) && <Divider label={dayOf(a.at)} className="my-1" />}
          <button type="button" onClick={() => onOpen(a.thread)} className={cn('flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-bg-hover', markNew && isNew(viewer, a) && 'bg-warning-muted')}>
            <span className="flex items-center gap-1.5 text-caption text-text-muted">
              {timeOf(a.at)}
              {/* What is new since you last looked, in the dot's orange (Miky, 29 Oct). */}
              {markNew && isNew(viewer, a) && <span className="text-caption text-warning-default">New</span>}
            </span>
            <span className="flex items-start gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
                {a.mark}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-2 text-text-primary">
                  <span className="text-body-2-strong">{nameOf(a.by)}</span> {a.what}
                </span>
                {(a.on || topicLine) && <span className="truncate text-caption text-text-muted">{a.on ? fileOf(a.on).title : topicLine}</span>}
              </span>
            </span>
          </button>
        </Fragment>
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
