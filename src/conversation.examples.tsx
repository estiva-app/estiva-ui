// @estiva-escape(component-has-a-page, component-has-a-story): the conversation stories' shared placeholders (people, reactions, words, a box), not a part; nothing here is exported from the package
import { useState, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { AttachedCard } from './AttachedCard'
import { AttachmentCard } from './AttachmentCard'
import { CommentBox, type SendAnswer, type UploadAnswer } from './CommentBox'
import { InlineChip } from './InlineChip'
import { Link } from './Link'
import { ITEM, ready } from './linked.examples'
import { PartCard } from './PartCard'
import type { ReactionCount, ReactionRowProps } from './ReactionRow'
import { RichText } from './RichText'

export const OPTIONS = [
  { emoji: '👍', label: 'Makes sense' },
  { emoji: '💯', label: 'Agree' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👀', label: 'Looking' },
]

export const ME = 'me'
const NAMES: Record<string, string> = { me: 'You', a: 'Person one', b: 'Person two', c: 'Person three' }
export const nameOf = (id: string) => NAMES[id] ?? 'Someone'

export const ONE = { name: 'Person one' }
export const TWO = { name: 'Person two' }
export const THREE = { name: 'Person three' }
export const YOU = { name: 'You' }

/** A moment for a time's exact date under the pointer: 11:08 AM, on a placeholder day. */
export const AT = new Date(2026, 9, 31, 11, 8).getTime()

export const WORDS = 'A comment says what its author wrote. Its replies sit in the thread under it, and anyone here can react.'
export const SHORT = 'A reply answers the comment above it.'
export const LONG =
  'A long comment keeps its whole text. It runs on for several lines so the card can be seen at its full height: the face and the name stay at the top, the words wrap under them, and the strip of actions stays in the top right corner while the card is pointed at. Nothing is cut, and the reactions and the replies row sit under the last line, as they do under a short one.'

/** Yours on or off, as the relay would count it. */
export function toggled(reactions: readonly ReactionCount[], emoji: string): ReactionCount[] {
  const found = reactions.find((r) => r.emoji === emoji)
  if (!found) return [...reactions, { emoji, by: [ME] }]
  return reactions
    .map((r) => (r.emoji !== emoji ? r : { ...r, by: r.by.includes(ME) ? r.by.filter((id) => id !== ME) : [...r.by, ME] }))
    .filter((r) => r.by.length > 0)
}

export const SOME: ReactionCount[] = [
  { emoji: '👍', by: ['a', 'b'] },
  { emoji: '🎉', by: [ME] },
]

/** Reactions that answer a press, as an app's would. */
export function useReactions(start: readonly ReactionCount[] = []): ReactionRowProps {
  const [reactions, setReactions] = useState<readonly ReactionCount[]>(start)
  return { reactions, options: OPTIONS, nameOf, viewer: ME, onToggle: (emoji) => setReactions((now) => toggled(now, emoji)) }
}

/** Pictures and files under the words. */
export function Files() {
  return (
    <>
      <AttachmentCard name="picture-one.png" size={840_000} contentType="image/png" onOpen={() => {}} />
      <AttachmentCard name="summary.pdf" size={2_412_000} href="#file" onDownload={() => {}} />
    </>
  )
}

/** Words with a person named in them, and a link. */
export function Mentions() {
  return (
    <p>
      <InlineChip tone="person">Person two</InlineChip> can you check this against <Link href="#somewhere">the page it came from</Link> before it goes out?
    </p>
  )
}

/** Words, and a card its author attached. */
export function WithCard() {
  return (
    <>
      <p>{SHORT}</p>
      <AttachedCard link={ready(ITEM)} />
    </>
  )
}

const BLOCKS = [{ type: 'paragraph' as const, inline: [{ text: 'A block quoted from somewhere else, as it reads there now.', marks: [] }] }]

/** Words, and a block quoted from something else. */
export function WithBlock() {
  return (
    <>
      <p>{SHORT}</p>
      <PartCard state="ready" kind="issue" heading="Item one" partKey="ABC-2" href="#part">
        <RichText blocks={BLOCKS} size="small" />
      </PartCard>
    </>
  )
}

/**
 * What the relay (or Estiva ID, or the network) says for each cause of a refusal, as an app hands it over raw. The kit
 * says each in `@estiva-app/conversation`'s plain words; a story picks one to show its sentence.
 */
export const RELAY_SAYS = {
  'Too long': 'invalid: content exceeds maximum size of 262144 bytes',
  'Deleted, or no longer yours to write beside': 'invalid: edit target not found or not editable by you',
  'No longer a member': 'restricted: not a channel member',
  Archived: 'restricted: channel is archived',
  'Too many at once': 'rate-limited: slow down',
  'Wrong clock': 'invalid: event timestamp too far in the future',
  'Signed out': 'auth-required: authentication required',
  'Anything else': 'error: internal error',
} as const
export type RelaySays = keyof typeof RELAY_SAYS

/** What the server says when it refuses a file, as protocol's upload hands it over. */
export const SERVER_SAYS = {
  'Too large': 'upload failed: 413 {"error":"file too large: 11534336 bytes (max 10485760)"}',
  'Not a type it takes': 'upload failed: 415 unsupported content type',
  'Could not be read': 'upload failed: 422 invalid image metadata',
  'Too many at once': 'upload failed: 429 rate limit exceeded',
  'Signed out': 'upload failed: 401 authentication failed',
  'No longer a member': 'upload failed: 403 forbidden',
  'Anything else': 'upload failed: 500 internal error',
} as const
export type ServerSays = keyof typeof SERVER_SAYS

const saved = (): Promise<SendAnswer> => new Promise((resolve) => setTimeout(() => resolve({ accepted: true }), 400))
const refused = (reason: string): Promise<SendAnswer> => new Promise((resolve) => setTimeout(() => resolve({ accepted: false, reason }), 600))
const asBody = (text: string): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

/** The box a comment is edited in: the kit's CommentBox, as an app hands it to the card. `refuse`: why the relay says no. */
export function EditBox({ text, done, refuse }: { text: string; done: () => void; refuse?: RelaySays }) {
  const answer = () => (refuse ? refused(RELAY_SAYS[refuse]) : saved())
  return (
    <CommentBox
      people={[]}
      label="Edit"
      placeholder={null}
      send={answer}
      edit={{
        body: asBody(text),
        onCancel: done,
        onSave: async () => {
          const said = await answer()
          if (said.accepted) done()
          return said
        },
      }}
    />
  )
}

/** A file taken in a moment later, as an app's upload answers. */
const uploaded = (file: File): Promise<UploadAnswer> => new Promise((resolve) => setTimeout(() => resolve({ accepted: true, value: file.name }), 900))

/** The box a reply or a comment is written in, with its tools as an app gives them: the paperclip. */
export function WriteBox({ label = 'Reply', closed, onSend }: { label?: string; closed?: string; onSend?: (words: string) => void }) {
  // With `onSend`, the app draws what was written at once, as Peek does, before the answer.
  const send = onSend ? (body: JSONContent) => (onSend(plainOf(body)), saved()) : saved
  return <CommentBox people={[]} label={label} placeholder={`${label}…`} send={send} showsAtOnce={!!onSend} upload={uploaded} closed={closed ? { reason: closed } : undefined} />
}

/** The words of a box's body, plain. */
const plainOf = (body: JSONContent): string => (body.text ?? '') + (body.content ?? []).map(plainOf).join(body.type === 'doc' ? ' ' : '')

/** A column's width: 384px, every app's right column. */
export function Column({ children }: { children: ReactNode }) {
  return <div className="flex w-[384px] flex-col gap-2">{children}</div>
}
