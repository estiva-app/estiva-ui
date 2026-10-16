import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { IconCircleCheck, IconMessage, IconMessagePlus, IconX } from '@tabler/icons-react'
import { Card } from '../../src/Card'
import { Chip } from '../../src/Chip'
import { CollapsibleSection } from '../../src/CollapsibleSection'
import { Divider } from '../../src/Divider'
import { EmptyState } from '../../src/EmptyState'
import { IconButton } from '../../src/IconButton'
import { MenuItem } from '../../src/Menu'
import { Panel } from '../../src/Panel'
import { Person } from '../../src/Person'
import { richTextClassName } from '../../src/RichText'
import { WithTooltip } from '../../src/Tooltip'
import { BlockId } from '../../src/BlockNodes'
import { ComposeBox, ComposeKeys, COMPOSE_EDITOR_CLASSES } from '../../src/ComposeBox'
import { EditorBlockHandle } from '../../src/EditorBlockHandle'
import { SelectionToolbar } from '../../src/SelectionToolbar'
import {
  CommentHighlights,
  anchorOfSelection,
  commentElement,
  commentPlace,
  quoteText,
  setCommentAnchors,
  type CommentAnchor,
  type CommentPlace,
} from '../../src/CommentHighlights'
import { DOCUMENT, PEOPLE, THREADS, type PersonId, type Thread } from './fixtures'

/**
 * Leaf's document page with its comments column (Katerina's option A, from
 * leaf `proto/leaf-app`), cut to what a comment on a selection needs: the
 * text, the selection strip's Comment, the block handle's Comment, and a card
 * per thread in each of §13.6's states. Bodies are plain text here.
 */

type Draft = Omit<CommentAnchor, 'id'>

/** The draft's highlight id, so what is being commented on stays marked while you write. */
const DRAFT = 'draft'

/** What one block is called in a card's line: "On 2 paragraphs". */
function blockNoun(type: string, many: boolean): string {
  const nouns: Record<string, [string, string]> = {
    paragraph: ['paragraph', 'paragraphs'],
    heading: ['heading', 'headings'],
    listItem: ['item', 'items'],
    bulletList: ['list', 'lists'],
    orderedList: ['list', 'lists'],
    table: ['table', 'tables'],
  }
  const [one, more] = nouns[type] ?? ['block', 'blocks']
  return many ? more : one
}

/** "On the paragraph", "On 2 paragraphs", "On 3 blocks": a comment on whole blocks, said in a line. */
function wholeBlocksLine(editor: Editor | null, place: CommentPlace): string {
  if (!editor || place.state === 'detached') return 'On whole blocks'
  const types: string[] = []
  editor.state.doc.nodesBetween(place.from, place.to, (node, pos) => {
    if (pos < place.from || pos + node.nodeSize > place.to) return true
    types.push(node.type.name)
    return false
  })
  const same = types.every((t) => t === types[0])
  if (types.length === 1) return `On the ${blockNoun(types[0], false)}`
  return `On ${types.length} ${same ? blockNoun(types[0], true) : 'blocks'}`
}

/** The box a comment or a reply is written in: the package's ComposeBox. */
function Composer({ placeholder, onSend, autoFocus }: { placeholder: string; onSend: (text: string) => void; autoFocus?: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit, ComposeKeys],
    editorProps: { attributes: { class: COMPOSE_EDITOR_CLASSES, 'aria-label': placeholder } },
  })
  // A frame late: the selection strip gives the focus back to the text as it closes, after this box mounts.
  useEffect(() => {
    if (!autoFocus || !editor) return
    const frame = requestAnimationFrame(() => editor.commands.focus())
    return () => cancelAnimationFrame(frame)
  }, [autoFocus, editor])
  return <ComposeBox editor={editor} placeholder={<span>{placeholder}</span>} onSend={(ed) => onSend(ed.getText())} />
}

/** A tooltip's wrapper around a line that is cut: it must shrink with its row, which WithTooltip's `inline-flex shrink-0` does not. */
const LINE_WRAPPER = 'flex min-w-0 shrink'

/**
 * What a thread is about, in one line — the one place the three new states
 * differ on a card.
 */
function AnchorLine({ thread, place, editor }: { thread: Thread; place: CommentPlace | null; editor: Editor | null }) {
  const anchor = thread.anchor
  if (!anchor || !place) return <p className="text-caption text-text-muted">On the whole document</p>
  const quoted = anchor.quote ? `“${quoteText(anchor.quote)}”` : null
  const by = PEOPLE[thread.comments[0].by]
  if (place.state === 'reworded' || (place.state === 'detached' && quoted)) {
    // §13.6 reworded, and detached with words: the words as the commenter quoted
    // them, never as what the page says (Miky, LEAF-7 /land).
    const where = place.state === 'reworded' ? 'No longer in the text' : 'Deleted from the page'
    return (
      <WithTooltip label={`${by} quoted: ${quoted}`} wrapperClassName={LINE_WRAPPER}>
        <p data-anchor-state={place.state} className="line-clamp-2 text-caption italic text-text-muted">{`${by} quoted: ${quoted} · ${where}`}</p>
      </WithTooltip>
    )
  }
  if (place.state === 'detached') return <p data-anchor-state="detached" className="text-caption italic text-text-muted">On blocks deleted from the page</p>
  if (!quoted) return <p data-anchor-state="blocks" className="text-caption text-text-secondary">{wholeBlocksLine(editor, place)}</p>
  return (
    <WithTooltip label={quoted} wrapperClassName={LINE_WRAPPER}>
      <p data-anchor-state="words" className="truncate text-caption text-text-secondary">{quoted}</p>
    </WithTooltip>
  )
}

/** A thread as a card in the column, as Leaf's prototype draws it. Clicking it finds its place in the text. */
function ThreadCard({
  thread,
  place,
  editor,
  active,
  onActivate,
  onResolve,
  onReply,
}: {
  thread: Thread
  place: CommentPlace | null
  editor: Editor | null
  active?: boolean
  onActivate?: () => void
  onResolve?: () => void
  onReply?: (text: string) => void
}) {
  const click = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"], [data-interactive], [contenteditable="true"]')) return
    onActivate?.()
  }
  return (
    <Card data-thread-id={thread.id} hover="fill" quietUntilHover selected={active} onClick={onActivate ? click : undefined} className="flex shrink-0 flex-col gap-3 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <AnchorLine thread={thread} place={place} editor={editor} />
        </div>
        {onResolve && (
          <IconButton variant="resolve" tooltip="Resolve" aria-label="Resolve" onClick={onResolve}>
            <IconCircleCheck size={16} stroke={1.5} />
          </IconButton>
        )}
      </div>
      {thread.comments.map((c) => (
        <div key={c.id} className="flex flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 text-body-2-strong text-text-primary">
              <Person name={PEOPLE[c.by]} />
            </span>
            <span className="whitespace-nowrap text-caption text-text-muted">{c.when}</span>
          </div>
          <p className="text-body-2 text-text-primary">{c.text}</p>
        </div>
      ))}
      {active && onReply && <Composer placeholder="Reply…" onSend={onReply} />}
    </Card>
  )
}

/** Scroll `box` — a Panel's body — until `el` shows. Only that box moves. */
function scrollWithin(box: HTMLElement | null, el: Element | null) {
  if (!box || !el) return
  const at = el.getBoundingClientRect()
  const view = box.getBoundingClientRect()
  if (at.top < view.top) box.scrollBy({ top: at.top - view.top - 16 })
  else if (at.bottom > view.bottom) box.scrollBy({ top: at.bottom - view.bottom + 16 })
}

export interface CommentsPageProps {
  /** The thread open at the start. */
  active?: string
  /** A comment being written at the start: what it would be on. */
  draft?: Draft
  /** The "On deleted blocks" section open at the start. */
  deletedOpen?: boolean
}

export function CommentsPage({ active: initialActive, draft: initialDraft, deletedOpen = false }: CommentsPageProps) {
  const [threads, setThreads] = useState(THREADS)
  const [active, setActive] = useState<string | null>(initialActive ?? null)
  const [draft, setDraft] = useState<Draft | null>(initialDraft ?? null)
  // Every edit re-reads where each comment is: type over highlighted words and watch its card.
  const [version, setVersion] = useState(0)
  const docBody = useRef<HTMLDivElement>(null)
  const columnBody = useRef<HTMLDivElement>(null)

  const startComment = useCallback((next: Draft) => {
    setActive(null)
    setDraft(next)
  }, [])

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false, strike: false, heading: { levels: [1, 2, 3] } }), BlockId, CommentHighlights],
    content: DOCUMENT,
    editorProps: { attributes: { 'aria-label': 'Document', role: 'textbox', 'aria-multiline': 'true', class: richTextClassName('default', 'outline-none') } },
    onUpdate: () => setVersion((v) => v + 1),
  })

  // Where each thread is now, read again after every edit (`version`).
  const places = useMemo(
    () => new Map(threads.map((t) => [t.id, editor && t.anchor && version >= 0 ? commentPlace(editor, { id: t.id, ...t.anchor }) : null])),
    [threads, editor, version],
  )
  const placeOf = (t: Thread): CommentPlace | null => places.get(t.id) ?? null

  // Open threads in the order of the text; the whole document's last; deleted ones in their own section.
  const at = (t: Thread) => {
    const place = placeOf(t)
    return place && place.state !== 'detached' ? place.from : Number.MAX_SAFE_INTEGER
  }
  const live = threads.filter((t) => !t.resolved)
  const open = live.filter((t) => placeOf(t)?.state !== 'detached').sort((a, b) => at(a) - at(b))
  const deleted = live.filter((t) => placeOf(t)?.state === 'detached')
  const resolved = threads.filter((t) => t.resolved)

  // A highlight clicked in the text: its thread.
  useEffect(() => {
    if (!editor) return
    const select = ({ id }: { id: string }) => {
      if (id === DRAFT) return
      setDraft(null)
      setActive(id)
    }
    editor.on('commentSelect', select)
    return () => {
      editor.off('commentSelect', select)
    }
  }, [editor])

  // Draw every open comment, and the draft's selection while it is written.
  useEffect(() => {
    if (!editor) return
    const anchors: CommentAnchor[] = threads.flatMap((t) => (!t.resolved && t.anchor ? [{ id: t.id, ...t.anchor }] : []))
    if (draft) anchors.push({ id: DRAFT, ...draft })
    setCommentAnchors(editor, anchors, draft ? DRAFT : active)
  }, [editor, threads, draft, active])

  // A card chosen: its place comes into view (its words, or its first block when they are gone). A highlight chosen: its card does.
  useEffect(() => {
    if (!active || !editor) return
    const thread = threads.find((t) => t.id === active)
    const frame = requestAnimationFrame(() => {
      if (thread?.anchor) scrollWithin(docBody.current, commentElement(editor, { id: thread.id, ...thread.anchor }))
      scrollWithin(columnBody.current, columnBody.current?.querySelector(`[data-thread-id="${active}"]`) ?? null)
    })
    return () => cancelAnimationFrame(frame)
  }, [active, editor, threads])

  const send = (text: string) => {
    const id = `t${Date.now()}`
    setThreads((all) => [...all, { id, anchor: draft ?? undefined, comments: [{ id: `c${Date.now()}`, by: 'me' as PersonId, when: 'Just now', text }] }])
    setDraft(null)
    setActive(id)
  }
  const reply = (id: string, text: string) =>
    setThreads((all) => all.map((t) => (t.id === id ? { ...t, comments: [...t.comments, { id: `c${Date.now()}`, by: 'me' as PersonId, when: 'Just now', text }] } : t)))
  const resolve = (id: string) => {
    setThreads((all) => all.map((t) => (t.id === id ? { ...t, resolved: true } : t)))
    setActive(null)
  }

  const draftPlace = editor && draft ? commentPlace(editor, { id: DRAFT, ...draft }) : null
  const draftLine = draft?.quote ? `On “${quoteText(draft.quote)}”` : draftPlace ? wholeBlocksLine(editor, draftPlace) : ''

  const card = (t: Thread) => (
    <ThreadCard
      key={t.id}
      thread={t}
      place={placeOf(t)}
      editor={editor}
      active={t.id === active}
      onActivate={() => {
        setDraft(null)
        setActive(t.id === active ? null : t.id)
      }}
      onResolve={() => resolve(t.id)}
      onReply={(text) => reply(t.id, text)}
    />
  )

  return (
    <div className="flex h-screen min-h-0 bg-bg-base [contain:size]">
      <div className="flex min-w-0 flex-1 flex-col">
        <Panel title={<p className="truncate text-body-2-strong text-text-primary">Launch plan</p>} bodyRef={docBody} bodyClassName="px-12 pt-10 pb-24">
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            <h1 className="text-h1 text-text-primary">Launch plan</h1>
            <p className="mt-2 text-caption text-text-muted">Launch · edited 2 minutes ago by Ana Duarte</p>
            <EditorBlockHandle
              editor={editor}
              actions={(block) =>
                block.id ? (
                  <MenuItem
                    label="Comment"
                    leading={<IconMessage size={16} stroke={1.5} className="text-text-secondary" />}
                    onClick={() => startComment({ blocks: [block.id!] })}
                  />
                ) : null
              }
              className="mt-8"
            >
              <EditorContent editor={editor} />
            </EditorBlockHandle>
            <SelectionToolbar
              editor={editor}
              actions={[
                {
                  label: 'Comment',
                  icon: <IconMessagePlus size={16} stroke={1.5} />,
                  run: (ed) => {
                    const anchor = anchorOfSelection(ed)
                    if (!anchor) return
                    // The selection stays marked by the draft's highlight; the selection itself can go.
                    ed.commands.setTextSelection(ed.state.selection.to)
                    startComment(anchor)
                  },
                },
              ]}
            />
          </div>
        </Panel>
      </div>
      <Divider orientation="vertical" />
      <div className="flex w-[380px] flex-none flex-col">
        <Panel
          title={
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-body-2-strong text-text-primary">Comments</p>
              {open.length > 0 && <Chip type="neutral" label={String(open.length)} className="shrink-0" />}
            </div>
          }
          bodyRef={columnBody}
          bodyClassName="flex flex-col gap-3 p-3"
          footer={
            <div className="flex flex-col gap-2 p-3">
              {draft && (
                <div className="flex items-center gap-2">
                  <WithTooltip label={draftLine} wrapperClassName={`${LINE_WRAPPER} flex-1`}>
                    <p data-draft-line className="truncate text-caption text-text-secondary">{draftLine}</p>
                  </WithTooltip>
                  <IconButton tooltip="Comment on the whole document instead" aria-label="Comment on the whole document instead" onClick={() => setDraft(null)}>
                    <IconX size={16} stroke={1.5} />
                  </IconButton>
                </div>
              )}
              <Composer
                key={draft ? JSON.stringify(draft) : 'document'}
                placeholder={draft ? (draft.quote ? 'Comment on these words…' : 'Comment on these blocks…') : 'Comment on this document…'}
                onSend={send}
                autoFocus={!!draft}
              />
            </div>
          }
        >
          {open.length === 0 && deleted.length === 0 && resolved.length === 0 ? (
            <EmptyState scope="section" message="No comments yet. Select words and press Comment, or write below." />
          ) : (
            <>
              {open.map(card)}
              {deleted.length > 0 && (
                <CollapsibleSection title="On deleted blocks" trailing={<Chip type="neutral" label={String(deleted.length)} />} defaultOpen={deletedOpen} className="shrink-0" contentClassName="flex flex-col gap-3">
                  {deleted.map(card)}
                </CollapsibleSection>
              )}
              {resolved.length > 0 && (
                <CollapsibleSection title="Resolved" trailing={<Chip type="neutral" label={String(resolved.length)} />} defaultOpen={false} className="shrink-0" contentClassName="flex flex-col gap-3">
                  {resolved.map((t) => (
                    <ThreadCard key={t.id} thread={t} place={placeOf(t)} editor={editor} />
                  ))}
                </CollapsibleSection>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
