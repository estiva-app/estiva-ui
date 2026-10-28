import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconChecks, IconChevronDown, IconChevronRight, IconCircleCheck, IconDots, IconWorld } from '@tabler/icons-react'
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
    reply(threadId: string, body: JSONContent) {
      const reply: Comment = { id: `r${Date.now()}`, by: ME, at: now(), lines: linesOf(body) }
      change(threadId, (c) => ({ ...c, replies: [...(c.replies ?? []), reply] }))
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

/**
 * The one box, writing a new comment or a reply. In a thread that can be
 * resolved, Resolve (the button, or `/` → Resolve) turns this same box into the
 * resolution's: a green bar, "→ Resolution message", and what is sent is the
 * note, not a reply. Whatever was typed stays and becomes the note.
 */
export function Box({
  label,
  placeholder,
  onSent,
  resolving,
  closed,
}: {
  label: string
  placeholder: string
  /** `resolves` is true when the box was resolving: the words are the note. */
  onSent: (body: JSONContent, files: BoxFile[], resolves: boolean) => void
  /** Only in a thread that can be resolved: whether the box is resolving now, and the way in and out. */
  resolving?: { on: boolean; set: (on: boolean) => void; withoutNote: () => void }
  closed?: ReactNode
}) {
  const on = resolving?.on === true
  const resolveRow: SlashCommand = { key: 'resolve', row: { label: 'Resolve' }, keywords: ['resolve', 'done'], run: () => resolving?.set(true) }
  const rows = [commentBoxRows.file, commentBoxRows.mention, commentBoxRows.urgent]
  return (
    <div className="flex flex-col gap-1">
      {on && (
        <div className="flex items-center gap-1 text-caption text-text-secondary">
          <IconChecks size={14} stroke={1.5} className="text-success-default" aria-hidden />
          <span className="flex-1">Resolving the thread</span>
          <Button size="small" variant="muted" onClick={resolving.withoutNote}>
            Resolve without a note
          </Button>
          <Button size="small" variant="muted" onClick={() => resolving.set(false)}>
            Cancel
          </Button>
        </div>
      )}
      <CommentBox
        people={PEOPLE}
        insert={resolving && !on ? [...rows, resolveRow] : rows}
        send={answer}
        upload={upload}
        label={on ? 'Resolution message' : label}
        placeholder={on ? <span className="pl-2">→ Resolution message</span> : placeholder}
        className={cn(on && '[&_[data-composer-editor]]:border-l-4 [&_[data-composer-editor]]:border-success-default [&_[data-composer-editor]]:pl-2')}
        closed={closed ? { reason: closed } : undefined}
        onSent={(body, files) => onSent(body, files, on)}
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

const who = (r: Resolution) => `${r.by === ME ? 'You' : nameOf(r.by)} ${r.resolved ? 'resolved' : 'reopened'}`

/**
 * Under a resolved comment, in the list: who resolved it → the note, in a green
 * box. A long note folds to three lines, with Show all.
 */
export function ResolutionBanner({ r, onReopen }: { r: Resolution; onReopen?: () => void }) {
  const note = useRef<HTMLParagraphElement>(null)
  const [long, setLong] = useState(false)
  const [all, setAll] = useState(false)
  useLayoutEffect(() => {
    const el = note.current
    if (el && !all) setLong(el.scrollHeight > el.clientHeight + 1)
  }, [r.note, all])
  const reopen = onReopen && (
    <Button size="small" variant="muted" onClick={onReopen}>
      Reopen
    </Button>
  )
  return (
    <div className="flex items-start gap-2 rounded-md border border-success-outline bg-success-wash px-3 py-2">
      <IconChecks size={16} stroke={1.5} className="mt-0.5 shrink-0 text-success-default" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <p ref={note} className={cn('whitespace-pre-line text-body-2 text-text-primary', !all && 'line-clamp-3')}>
          <span className="font-medium text-success-default">{who(r)}</span>
          {r.note && <> → {r.note}</>}
        </p>
        {/* A long note takes the box's width; Show all and Reopen sit under it. */}
        {(long || all) && (
          <div className="flex gap-1">
            <Button size="small" variant="muted" onClick={() => setAll(!all)}>
              {all ? 'Show less' : 'Show all'}
            </Button>
            {reopen}
          </div>
        )}
      </div>
      {!(long || all) && reopen}
    </div>
  )
}

/**
 * In the thread, in time order among the replies: a dot, who resolved or
 * reopened it → the note, and when. A long note wraps under the first words,
 * whole: the thread is where it is read.
 */
export function ResolutionEvent({ r }: { r: Resolution }) {
  return (
    <div className="flex items-start gap-2 pl-1.5">
      <span className={cn('mt-2 size-1.5 shrink-0 rounded-full', r.resolved ? 'bg-success-default' : 'bg-text-muted')} aria-hidden />
      <p className="min-w-0 flex-1 whitespace-pre-line text-body-2 text-text-primary">
        <span className={cn('font-medium', r.resolved ? 'text-success-default' : 'text-text-secondary')}>{who(r)}</span>
        {r.note && <> → {r.note}</>}
        <span className="text-caption text-text-muted"> · {r.at}</span>
      </p>
    </div>
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
        {/* One way to add a reaction, the one beside ⋯ (Miky, 28 October): the row's own add button is hidden here; the build gives ReactionRow a prop for it. */}
        <ReactionRow
          reactions={comment.reactions ?? []}
          options={OPTIONS}
          nameOf={nameOf}
          viewer={ME}
          onToggle={archived ? undefined : (e) => c.react(comment.id, e)}
          className={cn(!archived && '[&>:last-child]:hidden')}
        />
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
  const closed = comment.deleted ? 'The comment was deleted, so its thread takes no new replies.' : undefined
  const canResolve = !archived && !comment.deleted && !isResolved(comment)
  // Replies and resolve/reopen lines, in the order they happened; a resolve at a reply's minute comes after it.
  const timeline = [
    ...(comment.replies ?? []).map((reply) => ({ at: reply.at, reply })),
    ...(comment.resolutions ?? []).map((res, i) => ({ at: res.at, res, i })),
  ].sort((a, b) => a.at.localeCompare(b.at))
  return (
    <div className="flex flex-col gap-3">
      <NoteCard comment={comment} c={c} archived={archived} urgentBar={urgentBar} threadLink={threadLink} />
      <div className="flex flex-col gap-3 border-l border-border-subtle pl-3">
        {timeline.map((t) => ('reply' in t && t.reply ? <NoteCard key={t.reply.id} comment={t.reply} c={c} reply archived={archived} urgentBar={urgentBar} /> : 'res' in t && t.res ? <ResolutionEvent key={`res${t.i}`} r={t.res} /> : null))}
      </div>
      {c.resolving !== comment.id && <ThreadActions comment={comment} c={c} archived={archived} />}
      {/* An archived file says so once, in place of the box under the whole conversation. */}
      {!archived && (
        <Box
          label="Reply"
          placeholder="Reply…"
          closed={closed}
          resolving={canResolve ? { on: c.resolving === comment.id, set: (on) => c.startResolving(on ? comment.id : undefined), withoutNote: () => c.mark(comment.id, true) } : undefined}
          onSent={(body, _f, resolves) => (resolves ? c.mark(comment.id, true, plain(body).trim()) : c.reply(comment.id, body))}
        />
      )}
    </div>
  )
}

/** Resolve or Reopen for a thread; neither on a deleted comment or an archived file. Resolve turns the box below into the resolution's. */
function ThreadActions({ comment, c, archived }: { comment: Comment; c: Conversation; archived: boolean }) {
  if (archived || comment.deleted) return null
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
  const n = comment.replies?.length ?? 0
  // The comment's own card, folded: its head and first line, then who resolved it → the note.
  return (
    <div className="flex gap-2">
      <Avatar name={nameOf(comment.by)} size={24} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <button type="button" onClick={onOpen} aria-label="Open the resolved thread" className="-mx-1 flex min-w-0 flex-col rounded-md px-1 text-left hover:bg-bg-hover">
          <span className="flex min-h-6 items-center gap-2">
            <span className="truncate text-body-2 font-medium text-text-primary">{nameOf(comment.by)}</span>
            <span className="shrink-0 text-caption text-text-muted">{comment.at}</span>
            {n > 0 && <span className="shrink-0 text-caption text-text-muted">· {n === 1 ? '1 reply' : `${n} replies`}</span>}
            <IconChevronRight size={14} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
          </span>
          <span className="truncate text-body-2 text-text-secondary">{text}</span>
        </button>
        <ResolutionBanner r={r} onReopen={archived || comment.deleted ? undefined : () => c.mark(comment.id, false)} />
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
