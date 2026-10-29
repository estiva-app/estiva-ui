import { useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconArrowNarrowRight, IconChecks, IconChevronRight, IconMessage2 } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { AvatarGroup } from '../../src/AvatarGroup'
import { Card } from '../../src/Card'
import { CardUnder } from '../../src/CardUnder'
import { Chip } from '../../src/Chip'
import { cn } from '../../src/cn'
import { CommentBox, commentBoxRows } from '../../src/CommentBox'
import type { MentionPerson } from '../../src/ComposerTriggers'
import { KindIcon } from '../../src/KindIcon'
import { LinkCard } from '../../src/LinkCard'
import type { LinkState } from '../../src/linked'
import { ReactionRow } from '../../src/ReactionRow'
import { PEOPLE, REACTION_OPTIONS, fileOf, teamOf, type FileRow, type Message, type PersonId } from './fixtures'

/**
 * Peek's topic conversation, from what is built and settled: each message is
 * peek-app's `ConversationCard` (origin/main, ui 0.88), drawn here from the same
 * ui parts it is made of — `Card`, `Avatar`, `ReactionRow`, its `RepliesRow`
 * and its resolution — because this Storybook cannot import an app. The card a
 * message was sent with is `CardUnder`, and the box is `CommentBox`.
 *
 * What is new: the file a message was written on is the card's heading, not a
 * label in its header, and a resolution sits under that heading
 * (decision-briefs/navigation-assets/conversation-heading-inspiration.png).
 */

const nameOf = (id: string) => PEOPLE[id as PersonId]?.name ?? 'Someone'
const MENTION_PEOPLE: MentionPerson[] = (Object.keys(PEOPLE) as PersonId[]).map((id, i) => ({ id, name: PEOPLE[id].name, pubkey: String(i + 1).repeat(64) }))
const kindOf = (file: FileRow) => (file.app === 'ship' ? 'project' : 'file')

/** Peek's MetaText: the time beside a name. */
const META = 'whitespace-nowrap text-caption text-text-muted signal:font-mono signal:text-small signal:tracking-wide signal:tabular-nums'

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

/** Who resolved the thread, and what they said: Peek's resolution line. */
function Resolution({ r, className }: { r: NonNullable<Message['resolved']>; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <IconChecks size={16} stroke={1.5} className="shrink-0 text-success-default signal:drop-shadow-glow-success" aria-hidden />
      <span className="whitespace-nowrap text-h5 text-success-default">{nameOf(r.by)} resolved</span>
      <IconArrowNarrowRight size={12} stroke={1.5} className="shrink-0 text-text-primary" aria-hidden />
      <span className="truncate text-h5 text-text-primary">{r.note}</span>
    </div>
  )
}

/** The file the message was written on, as the card's heading; its resolution hangs under it. */
function Heading({ file, resolved, onFile }: { file: FileRow; resolved?: Message['resolved']; onFile: (id: string) => void }) {
  return (
    <div className="grid w-full grid-cols-[24px_minmax(0,1fr)] gap-x-2 pb-2">
      <span className="flex size-6 items-center justify-center text-text-secondary">
        <KindIcon kind={kindOf(file)} size={16} />
      </span>
      <button type="button" onClick={() => onFile(file.id)} className="justify-self-start truncate rounded px-1 -mx-1 text-left text-body-2-strong text-text-primary hover:bg-bg-hover">
        {file.title}
      </button>
      {resolved && (
        <>
          <span className="mx-auto h-full w-px bg-border-subtle" aria-hidden />
          <Resolution r={resolved} className="py-1" />
        </>
      )}
    </div>
  )
}

/** peek-app's RepliesRow: who replied, "N replies", the last reply's time, and "1 new". */
function RepliesRow({ replies }: { replies: NonNullable<Message['replies']> }) {
  return (
    <div className="flex w-full items-center gap-2 pb-1.5 pl-8 pr-2">
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

/**
 * One message: peek-app's ConversationCard. `heading` draws the file it was
 * written on at the top; without it a resolution is Peek's banner at the bottom.
 */
export function PeekCard({ m, viewer, heading, onFile }: { m: Message; viewer: PersonId; heading: boolean; onFile: (id: string) => void }) {
  const [reactions, setReactions] = useState(m.reactions ?? [])
  const file = m.on ? fileOf(m.on) : undefined
  const under = m.card ? fileOf(m.card) : undefined
  const toggle = (emoji: string) =>
    setReactions((now) => {
      const held = now.find((r) => r.emoji === emoji)
      if (!held) return [...now, { emoji, by: [viewer] }]
      const by = held.by.includes(viewer) ? held.by.filter((p) => p !== viewer) : [...held.by, viewer]
      return now.map((r) => (r === held ? { emoji, by } : r)).filter((r) => r.by.length > 0)
    })
  return (
    <Card fill="surface" hover="fill" quietUntilHover className="relative">
      <div className="flex flex-col items-start px-2 pt-2">
        {file && heading && <Heading file={file} resolved={m.resolved} onFile={onFile} />}
        <div className="flex w-full items-center gap-2">
          <Avatar name={PEOPLE[m.by].name} size={24} />
          <span className="whitespace-nowrap text-body-2-strong text-text-primary">{PEOPLE[m.by].name}</span>
          <span className={META}>{m.at}</span>
        </div>
        <div className="w-full whitespace-pre-wrap pb-2 pl-8 pr-2 pt-1 text-body-2 text-text-primary">{m.body}</div>
        {under && (
          <div className="w-full pb-2 pl-8 pr-2">
            <CardUnder>
              <LinkCard link={cardOf(under, m.at)} />
            </CardUnder>
          </div>
        )}
        {reactions.length > 0 && (
          <div className="w-full pb-2 pl-8 pt-1">
            <ReactionRow reactions={reactions} options={REACTION_OPTIONS} nameOf={nameOf} viewer={viewer} onToggle={toggle} />
          </div>
        )}
        {m.replies && <RepliesRow replies={m.replies} />}
      </div>
      {m.resolved && !(file && heading) && (
        <div className="flex items-center gap-2 pb-2 pl-10 pr-3 signal:mb-2 signal:ml-10 signal:mr-3 signal:rounded-lg signal:border signal:border-success-outline signal:bg-success-wash signal:px-3 signal:py-2.5">
          <Resolution r={m.resolved} />
        </div>
      )}
    </Card>
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
export function PeekBox({ to, onSent }: { to: string; onSent: (body: string) => void }) {
  return (
    <CommentBox
      key={to}
      label={`Write to ${to}`}
      placeholder={`Write to ${to}…`}
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
