import { useState, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconArrowBackUp, IconChevronDown, IconChevronRight, IconCircleCheck, IconDots, IconWorld } from '@tabler/icons-react'
import { Avatar } from '../../src/Avatar'
import { Button } from '../../src/Button'
import { Card } from '../../src/Card'
import { cn } from '../../src/cn'
import { CommentBox, commentBoxRows, type BoxFile, type SendAnswer, type UploadAnswer } from '../../src/CommentBox'
import type { SlashCommand } from '../../src/ComposerTriggers'
import { IconButton } from '../../src/IconButton'
import { InlineChip } from '../../src/InlineChip'
import { LinkRow } from '../../src/LinkRow'
import { Menu, MenuItem } from '../../src/Menu'
import { AddReactionButton, ReactionRow } from '../../src/ReactionRow'
import { TextInput } from '../../src/TextInput'
import { ME, OPTIONS, PEOPLE, nameOf, type Comment, type Line, type Resolution, type Run } from './fixtures'

/**
 * The one conversation: the comment card, the reply card, the thread, the
 * Edit/Delete menu, Resolve, the deleted line, "edited" and the words for
 * what went wrong. An app hands it the comments and says where a thread
 * opens; the colours come from the theme.
 */

/**
 * The words for what went wrong, the same in every app (drafts for Katerina).
 * The box frames a send's and an edit's reason itself: "Not sent: <reason>.
 * Your text is back in the box." / "Not saved: <reason>. Your changes are
 * still in the box."
 */
export const REFUSED = {
  send: 'try again in a moment',
  edit: 'try again in a moment',
  reaction: 'Your reaction wasn’t added. Try again in a moment.',
  tooLarge: 'Too large to send.',
} as const

const LIMIT = 5 * 1024 * 1024

export type UrgentBar = 'grey' | 'red'

/** Where a thread opens: under its comment (Ship, Leaf, a phone) or in a column beside (Peek). */
export type ThreadOpens = 'under' | 'beside'

// ── the state a conversation keeps ────────────────────────────────────────────

const mapDeep = (all: Comment[], id: string, change: (c: Comment) => Comment): Comment[] =>
  all.map((c) => (c.id === id ? change(c) : c.replies ? { ...c, replies: mapDeep(c.replies, id, change) } : c))

const now = () => new Date().toTimeString().slice(0, 5)

const plain = (body: JSONContent): string =>
  body.text ?? (body.attrs?.label as string | undefined) ?? (body.content ?? []).map(plain).join(body.type === 'doc' ? '\n' : '')

/** The box's document as a comment's lines: words, `@` and `!@`. */
const linesOf = (body: JSONContent): Line[] =>
  (body.content ?? []).map((p) =>
    (p.content ?? []).map((n): Run => {
      if (n.type === 'mention') return { person: n.attrs?.id as string }
      if (n.type === 'urgentMention') return { urgent: n.attrs?.id as string }
      return { text: n.text ?? '' }
    }),
  )

/** A comment's words as the box opens them for an edit. */
const docOf = (lines: Line[]): JSONContent => ({
  type: 'doc',
  content: lines
    .filter((l): l is Run[] => Array.isArray(l))
    .map((runs) => ({
      type: 'paragraph',
      content: runs.map((r) => {
        if ('person' in r) return { type: 'mention', attrs: { id: r.person, label: nameOf(r.person), pubkey: '' } }
        if ('urgent' in r) return { type: 'urgentMention', attrs: { id: r.urgent, label: nameOf(r.urgent), pubkey: '' } }
        return { type: 'text', text: r.text }
      }),
    })),
})

export const resolutionOf = (c: Comment): Resolution | undefined => c.resolutions?.[c.resolutions.length - 1]
export const isResolved = (c: Comment) => resolutionOf(c)?.resolved === true

export interface ConversationState {
  comments: Comment[]
  editing?: string
  editRefused?: string
  refusedReaction?: string
  resolving?: string
  expanded: Set<string>
}

export function useConversation(initial: Comment[], start: Partial<ConversationState> = {}) {
  const [s, set] = useState<ConversationState>({ comments: initial, expanded: new Set(), ...start })
  const change = (id: string, f: (c: Comment) => Comment) => set((x) => ({ ...x, comments: mapDeep(x.comments, id, f) }))
  return {
    ...s,
    react(id: string, emoji: string) {
      if (s.refusedReaction === `refuse:${id}`) return set((x) => ({ ...x, refusedReaction: id }))
      set((x) => ({ ...x, refusedReaction: x.refusedReaction === id ? undefined : x.refusedReaction }))
      change(id, (c) => {
        const list = c.reactions ?? []
        const had = list.find((r) => r.emoji === emoji)
        const reactions = had
          ? list.map((r) => (r.emoji === emoji ? { ...r, by: r.by.includes(ME) ? r.by.filter((b) => b !== ME) : [...r.by, ME] } : r))
          : [...list, { emoji, by: [ME] }]
        return { ...c, reactions: reactions.filter((r) => r.by.length) }
      })
    },
    startResolving: (id?: string) => set((x) => ({ ...x, resolving: id })),
    mark(id: string, resolved: boolean, note?: string) {
      set((x) => ({ ...x, resolving: undefined, expanded: new Set([...x.expanded].filter((e) => e !== id)) }))
      change(id, (c) => ({ ...c, resolutions: [...(c.resolutions ?? []), { resolved, by: ME, at: now(), note: note || undefined }] }))
    },
    toggle: (id: string) =>
      set((x) => {
        const expanded = new Set(x.expanded)
        if (expanded.has(id)) expanded.delete(id)
        else expanded.add(id)
        return { ...x, expanded }
      }),
    remove: (id: string) => change(id, (c) => ({ ...c, deleted: true, lines: [] })),
    edit: (id?: string) => set((x) => ({ ...x, editing: id, editRefused: undefined })),
    async save(id: string, body: JSONContent): Promise<SendAnswer> {
      if (/refuse/i.test(plain(body))) return { accepted: false, reason: REFUSED.edit }
      change(id, (c) => ({ ...c, lines: [...linesOf(body), ...c.lines.filter((l) => !Array.isArray(l))], edited: now() }))
      set((x) => ({ ...x, editing: undefined, editRefused: undefined }))
      return { accepted: true }
    },
    reply(threadId: string, body: JSONContent, resolves: boolean) {
      const reply: Comment = { id: `r${Date.now()}`, by: ME, at: now(), lines: linesOf(body), resolvesThread: resolves || undefined }
      change(threadId, (c) => ({
        ...c,
        replies: [...(c.replies ?? []), reply],
        resolutions: resolves ? [...(c.resolutions ?? []), { resolved: true, by: ME, at: reply.at }] : c.resolutions,
      }))
    },
    add: (body: JSONContent) => set((x) => ({ ...x, comments: [...x.comments, { id: `c${Date.now()}`, by: ME, at: now(), lines: linesOf(body) }] })),
  }
}

export type Conversation = ReturnType<typeof useConversation>

// ── the box ───────────────────────────────────────────────────────────────────

const answer = async (body: JSONContent): Promise<SendAnswer> => {
  await new Promise((r) => setTimeout(r, 300))
  return /refuse/i.test(plain(body)) ? { accepted: false, reason: REFUSED.send } : { accepted: true }
}

const upload = async (file: File): Promise<UploadAnswer> =>
  file.size > LIMIT ? { accepted: false, reason: REFUSED.tooLarge } : { accepted: true, value: file.name }

/** The one box, writing a new comment or a reply; `/` offers "Reply and resolve" in a thread that can be resolved. */
export function Box({
  label,
  placeholder,
  onSent,
  resolvable = false,
  closed,
}: {
  label: string
  placeholder: string
  onSent: (body: JSONContent, files: BoxFile[], resolves: boolean) => void
  resolvable?: boolean
  closed?: ReactNode
}) {
  const [resolves, setResolves] = useState(false)
  const resolveRow: SlashCommand = { key: 'reply-and-resolve', row: { label: 'Reply and resolve' }, keywords: ['resolve', 'done'], run: () => setResolves(true) }
  return (
    <div className="flex flex-col gap-1">
      {resolves && (
        <div className="flex items-center gap-1 text-caption text-text-secondary">
          <IconCircleCheck size={14} stroke={1.5} className="text-success-default" aria-hidden />
          <span className="flex-1">Sending this also resolves the thread.</span>
          <Button size="small" variant="muted" onClick={() => setResolves(false)}>
            Don’t resolve
          </Button>
        </div>
      )}
      <CommentBox
        people={PEOPLE}
        insert={resolvable ? [commentBoxRows.file, commentBoxRows.mention, commentBoxRows.urgent, resolveRow] : [commentBoxRows.file, commentBoxRows.mention, commentBoxRows.urgent]}
        send={answer}
        upload={upload}
        label={label}
        placeholder={placeholder}
        closed={closed ? { reason: closed } : undefined}
        onSent={(body, files) => {
          onSent(body, files, resolves)
          setResolves(false)
        }}
      />
    </div>
  )
}

// ── a card ────────────────────────────────────────────────────────────────────

function Words({ lines }: { lines: Line[] }) {
  return (
    <div className="flex flex-col gap-1.5 text-body-2 text-text-primary">
      {lines.map((line, i) => {
        if (Array.isArray(line))
          return (
            <p key={i} className="whitespace-pre-wrap break-words">
              {line.map((r, j) =>
                'person' in r ? (
                  <InlineChip key={j} tone="person" href="#person">
                    @{nameOf(r.person)}
                  </InlineChip>
                ) : 'urgent' in r ? (
                  <InlineChip key={j} tone="urgent" href="#person">
                    !@{nameOf(r.urgent)}
                  </InlineChip>
                ) : (
                  <span key={j}>{r.text}</span>
                ),
              )}
            </p>
          )
        if ('link' in line) return <LinkRow key={i} link={line.link} />
        return (
          <Card key={i} href="#web" className="flex h-9 items-center gap-2 px-3">
            <IconWorld size={16} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{line.web.title}</span>
            <span className="shrink-0 text-caption text-text-muted">{line.web.host}</span>
          </Card>
        )
      })}
    </div>
  )
}

function Quoted({ comment }: { comment: Comment }) {
  const q = comment.quote
  if (!q) return null
  return (
    <div className="flex min-w-0 items-baseline gap-1.5 border-l-2 border-border-strong pl-2 text-caption">
      <span className={cn('min-w-0 truncate', q.now === 'present' ? 'text-text-secondary' : 'text-text-muted')}>“{q.words}”</span>
      {q.now !== 'present' && <span className="shrink-0 text-text-muted">· {q.now === 'gone' ? 'No longer in the text' : 'Reworded since'}</span>}
    </div>
  )
}

/** Who resolved or reopened the thread, when, and the note: one line where it happened. */
export function ResolutionLine({ r, onReopen }: { r: Resolution; onReopen?: () => void }) {
  return (
    <div className="flex items-start gap-1.5 text-caption text-text-secondary">
      {r.resolved ? (
        <IconCircleCheck size={14} stroke={1.5} className="mt-px shrink-0 text-success-default" aria-hidden />
      ) : (
        <IconArrowBackUp size={14} stroke={1.5} className="mt-px shrink-0 text-text-muted" aria-hidden />
      )}
      <span className="min-w-0 flex-1">
        <span className="font-medium text-text-primary">{r.by === ME ? 'You' : nameOf(r.by)}</span> {r.resolved ? 'resolved this' : 'reopened this'} · {r.at}
        {r.note && <span className="text-text-primary"> — {r.note}</span>}
      </span>
      {onReopen && (
        <Button size="small" variant="muted" onClick={onReopen}>
          Reopen
        </Button>
      )}
    </div>
  )
}

/** Resolve, with an optional note, in place under the comment. */
function ResolveForm({ onResolve, onCancel }: { onResolve: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState('')
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onResolve(note)
      }}
    >
      <TextInput size="small" autoFocus aria-label="Note" placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button size="small" variant="muted" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="small" variant="primary" type="submit">
          Resolve
        </Button>
      </div>
    </form>
  )
}

export interface CardProps {
  comment: Comment
  c: Conversation
  /** A reply's card: a size smaller, no thread of its own. */
  reply?: boolean
  /** The file is archived: read-only, no menu, no reactions to add. */
  archived?: boolean
  urgentBar?: UrgentBar
  /** The way into the thread, drawn under the words: "2 replies" or "Reply". */
  threadLink?: ReactNode
}

/** One comment or reply, the same card in every app. */
export function NoteCard({ comment, c, reply = false, archived = false, urgentBar = 'grey', threadLink }: CardProps) {
  const mine = comment.by === ME
  const urgent = comment.lines.some((l) => Array.isArray(l) && l.some((r) => 'urgent' in r))
  const editing = c.editing === comment.id
  const size = reply ? 20 : 24
  if (comment.deleted)
    return (
      <div className="flex gap-2">
        <span className="shrink-0 rounded-full bg-bg-active" style={{ width: size, height: size }} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="flex min-h-6 items-center text-body-2 italic text-text-muted">This comment was deleted.</p>
          {threadLink}
        </div>
      </div>
    )
  return (
    <div
      className={cn(
        'group relative flex gap-2 rounded-md',
        urgent && 'border-l-2 pl-2',
        urgent && (urgentBar === 'red' ? 'border-error-default' : 'border-border-strong'),
      )}
    >
      <Avatar name={nameOf(comment.by)} size={size} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-h-6 items-center gap-2">
          <span className="truncate text-body-2 font-medium text-text-primary">{nameOf(comment.by)}</span>
          <span className="shrink-0 text-caption text-text-muted">{comment.at}</span>
          {comment.edited && <span className="shrink-0 text-caption text-text-muted">(edited {comment.edited})</span>}
          <span className="flex-1" />
          {!archived && !editing && (
            <span className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <AddReactionButton options={OPTIONS} onPick={(e) => c.react(comment.id, e)} />
              {mine && (
                <Menu align="right" trigger={<IconButton aria-label="More" tooltip="More"><IconDots size={16} stroke={1.5} /></IconButton>}>
                  <MenuItem label="Edit" onClick={() => c.edit(comment.id)} />
                  <MenuItem label="Delete" destructive onClick={() => c.remove(comment.id)} />
                </Menu>
              )}
            </span>
          )}
        </div>
        <Quoted comment={comment} />
        {editing ? (
          <CommentBox
            key={`${comment.id}:${c.editRefused ?? ''}`}
            people={PEOPLE}
            send={answer}
            label="Edit"
            placeholder="Write"
            edit={{ body: docOf(comment.lines), refused: c.editRefused, onCancel: () => c.edit(undefined), onSave: (body) => c.save(comment.id, body) }}
          />
        ) : (
          <Words lines={comment.lines} />
        )}
        {comment.resolvesThread && (
          <span className="flex items-center gap-1 text-caption text-text-secondary">
            <IconCircleCheck size={14} stroke={1.5} className="text-success-default" aria-hidden />
            Resolved the thread
          </span>
        )}
        <ReactionRow reactions={comment.reactions ?? []} options={OPTIONS} nameOf={nameOf} viewer={ME} onToggle={archived ? undefined : (e) => c.react(comment.id, e)} />
        {c.refusedReaction === comment.id && <p className="text-caption text-error-default">{REFUSED.reaction}</p>}
        {threadLink}
      </div>
    </div>
  )
}

// ── a thread ──────────────────────────────────────────────────────────────────

/**
 * A comment and everything under it: the resolve lines, the replies and the
 * box. Where it opens is the app's; what is inside is the same.
 */
export function Thread({
  comment,
  c,
  archived = false,
  urgentBar,
  threadLink,
}: {
  comment: Comment
  c: Conversation
  archived?: boolean
  urgentBar?: UrgentBar
  /** Under the comment, where the thread opens under it: the way to fold it again. */
  threadLink?: ReactNode
}) {
  const r = resolutionOf(comment)
  const closed = comment.deleted ? 'The comment was deleted, so its thread takes no new replies.' : undefined
  return (
    <div className="flex flex-col gap-3">
      <NoteCard comment={comment} c={c} archived={archived} urgentBar={urgentBar} threadLink={threadLink} />
      {(comment.resolutions ?? []).map((res, i) => (
        <ResolutionLine key={i} r={res} />
      ))}
      <div className="flex flex-col gap-3 border-l border-border-subtle pl-3">
        {(comment.replies ?? []).map((reply) => (
          <NoteCard key={reply.id} comment={reply} c={c} reply archived={archived} urgentBar={urgentBar} />
        ))}
      </div>
      <ThreadActions comment={comment} c={c} archived={archived} />
      {/* An archived file says so once, in place of the box under the whole conversation. */}
      {!archived && (
        <Box label="Reply" placeholder="Reply…" resolvable={!r?.resolved} closed={closed} onSent={(body, _f, resolves) => c.reply(comment.id, body, resolves)} />
      )}
    </div>
  )
}

/** Resolve or Reopen for a thread; neither on a deleted comment or an archived file. */
function ThreadActions({ comment, c, archived }: { comment: Comment; c: Conversation; archived: boolean }) {
  if (archived || comment.deleted) return null
  if (c.resolving === comment.id) return <ResolveForm onResolve={(note) => c.mark(comment.id, true, note)} onCancel={() => c.startResolving(undefined)} />
  return (
    <div className="flex justify-end">
      {isResolved(comment) ? (
        <Button size="small" variant="muted" onClick={() => c.mark(comment.id, false)}>
          Reopen
        </Button>
      ) : (
        <Button size="small" variant="resolve" leadingIcon={<IconCircleCheck />} onClick={() => c.startResolving(comment.id)}>
          Resolve
        </Button>
      )}
    </div>
  )
}

/** A resolved thread, collapsed where it was said: its first line, who resolved it and the note. */
export function Collapsed({ comment, c, onOpen, archived = false }: { comment: Comment; c: Conversation; onOpen: () => void; archived?: boolean }) {
  const first = comment.lines.find((l): l is Run[] => Array.isArray(l))
  const text = first?.map((r) => ('text' in r ? r.text : `@${nameOf('person' in r ? r.person : r.urgent)}`)).join('') ?? 'This comment was deleted.'
  const r = resolutionOf(comment)!
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2 rounded-md text-left hover:bg-bg-hover">
        <IconChevronRight size={14} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
        <Avatar name={nameOf(comment.by)} size={20} />
        <span className="shrink-0 text-body-2 font-medium text-text-primary">{nameOf(comment.by)}</span>
        <span className="min-w-0 flex-1 truncate text-body-2 text-text-secondary">{text}</span>
      </button>
      <div className="pl-5">
        <ResolutionLine r={r} onReopen={archived || comment.deleted ? undefined : () => c.mark(comment.id, false)} />
      </div>
    </div>
  )
}

/** "2 replies" or "Reply", under a comment. */
export function ThreadLink({ comment, open, onClick }: { comment: Comment; open?: boolean; onClick: () => void }) {
  const n = comment.replies?.length ?? 0
  if (comment.deleted && n === 0) return null
  return (
    <div>
      <Button size="small" variant="muted" leadingIcon={open ? <IconChevronDown /> : undefined} onClick={onClick}>
        {n === 0 ? 'Reply' : n === 1 ? '1 reply' : `${n} replies`}
      </Button>
    </div>
  )
}
