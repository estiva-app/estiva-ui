import { useCallback, useState, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react'
import { cn } from '../../src/cn'
import { IconButton } from '../../src/IconButton'
import { Menu, MenuPanel, MenuItem } from '../../src/Menu'
import { typeTrigger, type SlashSection } from '../../src/ComposerTriggers'
import type { BoxFile, BoxStart, CommentBoxSupply, SendAnswer } from './CommentBox'
import { DRAFT, ME, MANY_REACTIONS, PEOPLE, REFUSED, SENDING, THREAD, WITH_CHIPS, referenceSections, type Comment } from './fixtures'
import { ReactButton, toggled } from './ReactionRow'

/** Every state a place is drawn in. */
export type BoxState =
  | 'empty'
  | 'typing'
  | 'replying'
  | 'mention'
  | 'urgent'
  | 'reference'
  | 'slash'
  | 'sending'
  | 'refused'
  | 'editing'
  | 'uploading'
  | 'uploadFailed'
  | 'archived'
  | 'signedOut'
  | 'noReactions'
  | 'manyReactions'

/** How the fake relay answers a send. */
export type Relay = 'answers' | 'refuses' | 'silent'

const REASON = 'rate-limited, try again in a minute'

const plain = (body: JSONContent): string => (body.text ?? '') + (body.content ?? []).map(plain).join(' ') + (body.attrs?.label ? String(body.attrs.label) : '')

/**
 * A send, as a relay would answer it after a moment. Live in every story:
 * write "refuse" anywhere in a comment and it is refused.
 */
export const fakeSend =
  (relay: Relay) =>
  (body: JSONContent): Promise<SendAnswer> =>
    relay === 'silent'
      ? new Promise(() => {})
      : new Promise((resolve) =>
          setTimeout(() => resolve(relay === 'refuses' || /refuse/i.test(plain(body)) ? { accepted: false, reason: REASON } : { accepted: true }), 900),
        )

/** The `/` rows every app takes from the kit: Mention, Urgent, Reference. */
const mentionRows = [
  {
    key: 'insert-@',
    row: { label: 'Mention', shortcut: '@' },
    keywords: ['@', 'person'],
    run: typeTrigger('@'),
  },
  {
    key: 'insert-!@',
    row: { label: 'Urgent', shortcut: '!@' },
    keywords: ['!@', 'urgent'],
    run: typeTrigger('!@'),
  },
  {
    key: 'insert-[',
    row: { label: 'Reference', shortcut: '[' },
    keywords: ['[', 'link'],
    run: typeTrigger('['),
  },
]

/** Asks the box around the editor for a file, as the paperclip does. */
const attachFile = (editor: { view: { dom: HTMLElement } }) => editor.view.dom.dispatchEvent(new CustomEvent('box:attach', { bubbles: true }))

/** Ship's Insert rows, which Leaf takes too (Miky, 16 Oct): File, Mention, Urgent, Reference. */
export const SHIP_INSERT: SlashSection = {
  label: 'Insert',
  commands: [
    {
      key: 'insert-file',
      row: { label: 'File' },
      keywords: ['attach', 'upload'],
      run: attachFile,
    },
    ...mentionRows,
  ],
}

const noop = () => {}

/** Peek's Insert rows: Mention, Urgent, Reference, Resolve and its five highlights. */
export const PEEK_INSERT: SlashSection = {
  label: 'Insert',
  commands: [
    ...mentionRows,
    {
      key: 'insert-resolve',
      row: { label: 'Resolve', shortcut: '->' },
      keywords: ['->', 'resolve'],
      run: typeTrigger('-> '),
    },
    ...['Insight', 'Concern', 'Conclusion', 'Question', 'Summary'].map((label) => ({
      key: `highlight-${label.toLowerCase()}`,
      row: { label },
      keywords: ['highlight'],
      run: noop,
    })),
  ],
}

/** What each app hands the box. */
export const supplyFor = (app: 'peek' | 'ship' | 'leaf', relay: Relay): CommentBoxSupply => ({
  people: PEOPLE,
  references: referenceSections,
  insert: app === 'peek' ? PEEK_INSERT : SHIP_INSERT,
  code: app === 'peek' ? 'inline' : 'block',
  send: fakeSend(relay),
  showsAtOnce: app === 'peek',
})

const FILE: Omit<BoxFile, 'state'> = {
  id: 'start-file',
  name: 'room-plan.pdf',
  size: 182_000,
  contentType: 'application/pdf',
}

/** Where the box opens for a state, and how the relay answers. */
export function boxStartFor(state: BoxState, showsAtOnce: boolean): { start?: BoxStart; relay: Relay } {
  switch (state) {
    case 'typing':
      return { start: { body: DRAFT }, relay: 'answers' }
    case 'mention':
      return { start: { body: DRAFT, open: '@' }, relay: 'answers' }
    case 'urgent':
      return { start: { body: DRAFT, open: '!@' }, relay: 'answers' }
    case 'reference':
      return { start: { body: DRAFT, open: '[' }, relay: 'answers' }
    case 'slash':
      return { start: { open: '/' }, relay: 'answers' }
    case 'sending':
      return {
        start: showsAtOnce ? undefined : { body: SENDING, sending: true },
        relay: 'silent',
      }
    case 'refused':
      return { start: { body: REFUSED, refused: REASON }, relay: 'answers' }
    case 'uploading':
      return {
        start: { body: DRAFT, files: [{ ...FILE, state: 'uploading' }] },
        relay: 'answers',
      }
    case 'uploadFailed':
      return {
        start: {
          body: DRAFT,
          files: [
            {
              ...FILE,
              state: 'failed',
              note: 'Upload failed: 413, the limit is 5 MB',
            },
          ],
        },
        relay: 'answers',
      }
    default:
      return { relay: 'answers' }
  }
}

/** The thread as a state starts it: reactions on, off or many; a sent comment already there while sending. */
export function threadFor(state: BoxState, showsAtOnce: boolean): Comment[] {
  const thread = THREAD.map((c) => ({
    ...c,
    reactions: state === 'noReactions' ? [] : c.id === 'c1' ? MANY_REACTIONS : c.id === 'c2' ? [{ emoji: '👍', by: ['ana'] }] : [],
  }))
  if (state === 'sending' && showsAtOnce) return [...thread, { id: 'sent', by: ME, when: 'now', body: SENDING, reactions: [] }]
  return thread
}

/** The comments a place holds, live: send, react, edit and delete as a relay would let you. */
export function useComments(initial: Comment[], editingFirst: boolean) {
  const [comments, setComments] = useState(initial)
  const [editing, setEditing] = useState<string | null>(editingFirst ? (initial.find((c) => c.by === ME)?.id ?? null) : null)
  const add = useCallback((body: JSONContent, files: BoxFile[]) => {
    setComments((all) => [
      ...all,
      {
        id: `new-${all.length}`,
        by: ME,
        when: 'now',
        body,
        reactions: [],
        files: files.map(({ name, size, contentType }) => ({
          name,
          size,
          contentType,
        })),
      },
    ])
  }, [])
  const dropLast = useCallback(() => setComments((all) => all.slice(0, -1)), [])
  const react = useCallback(
    (id: string, next: (r: Comment['reactions']) => Comment['reactions']) =>
      setComments((all) => all.map((c) => (c.id === id ? { ...c, reactions: next(c.reactions) } : c))),
    [],
  )
  const save = useCallback((id: string, body: JSONContent) => {
    setComments((all) => all.map((c) => (c.id === id ? { ...c, body, edited: true } : c)))
    setEditing(null)
  }, [])
  const remove = useCallback((id: string) => setComments((all) => all.filter((c) => c.id !== id)), [])
  return { comments, editing, setEditing, add, dropLast, react, save, remove }
}

/**
 * A comment's actions: React on every comment, and Edit and Delete on your own
 * only (record edit-and-delete-are-offered-only-on-your-own-message).
 */
export function CommentActions({ comment, c, className }: { comment: Comment; c: Comments; className?: string }) {
  return (
    <span className={cn('flex items-center', className)}>
      <ReactButton onPick={(emoji) => c.react(comment.id, (r) => toggled(r ?? [], emoji))} />
      {comment.by === ME && <OwnMenu onEdit={() => c.setEditing(comment.id)} onDelete={() => c.remove(comment.id)} />}
    </span>
  )
}

type Comments = ReturnType<typeof useComments>

function OwnMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <Menu
      align="right"
      trigger={
        <IconButton variant="muted" tooltip="More" aria-label="More">
          <IconDotsVertical size={16} stroke={1.5} />
        </IconButton>
      }
    >
      <MenuPanel className="min-w-[180px]">
        <MenuItem label="Edit message" leading={<IconPencil size={16} stroke={1.5} />} onClick={onEdit} />
        <MenuItem label="Delete message" destructive leading={<IconTrash size={16} stroke={1.5} />} onClick={onDelete} />
      </MenuPanel>
    </Menu>
  )
}

/** A place a box sits in. */
export type Place = 'leaf' | 'shipIssue' | 'peek' | 'shipChat'

/**
 * The line in place of a closed box, per place. An archived file takes no
 * comments in any app, a Ship issue included (Miky, 17 Oct).
 */
export const CLOSED_REASON: Record<Place, Record<'archived' | 'signedOut', ReactNode>> = {
  leaf: { archived: 'Archived by Ana Duarte · 14 Oct. It takes no new comments.', signedOut: 'Sign in to comment.' },
  shipIssue: { archived: 'Archived by Ana Duarte · 14 Oct. It takes no new comments.', signedOut: 'Sign in to comment.' },
  peek: { archived: 'Archived by Ana Duarte · 14 Oct. It takes no new replies.', signedOut: 'Sign in to reply.' },
  shipChat: { archived: 'Archived by Ana Duarte · 14 Oct. It takes no new messages.', signedOut: 'Sign in to write here.' },
}

/** The closed box's line for a state, or nothing when the box is open. */
export const closedFor = (place: Place, state: BoxState) => (state === 'archived' || state === 'signedOut' ? { reason: CLOSED_REASON[place][state] } : undefined)

export { WITH_CHIPS }
