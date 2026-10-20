import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { IconLink, IconMessage, IconSquareRounded } from '@tabler/icons-react'
import { descriptionTextToBlockDocument, documentForEditing, encodeNpub, publishableFromEditor, toEditorDocument, type ContentFormat, type EditorDocument } from '@estiva-app/protocol'
import { newlyNamedPeople } from '@estiva-app/conversation'
import { AttachmentCard } from './AttachmentCard'
import type { HandleBlock } from './BlockHandle'
import type { AttachmentViewProps, ReferenceViewProps } from './BlockNodes'
import { Button } from './Button'
import type { SelectionAnchor } from './CommentHighlights'
import type { CaptionedItem, MentionPerson, ReferenceSection } from './ComposerTriggers'
import { DocumentEditor, type DocumentCodec, type DocumentEditorProps, type HeldTyping } from './DocumentEditor'
import { InlineChip } from './InlineChip'
import { MenuItem } from './Menu'

/**
 * One document's text, always an editor. Every story is live: type, open `/`,
 * `[` or `@`, click away to save. The panel under the editor is the app's
 * side: what was saved, whom the save would add, and buttons for what happens
 * to a document from outside — someone else's save, a reload, the sign-in
 * ending. Pick the theme in the toolbar.
 */
const meta = {
  title: 'Primitives/DocumentEditor',
  component: DocumentEditor,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DocumentEditor>

export default meta
type Story = StoryObj

// ─── The app's side, played by @estiva-app/protocol and @estiva-app/conversation ───

const codec: DocumentCodec = {
  read: (value, format) => toEditorDocument(documentForEditing(value, format as ContentFormat), { links: true }) as JSONContent,
  write: (doc) => publishableFromEditor(doc as EditorDocument),
}
const readMarkdown = (text: string) => toEditorDocument(descriptionTextToBlockDocument(text)) as JSONContent
const FORMAT_TAG = 'estiva-blocks-1'

const PEOPLE: MentionPerson[] = ['one', 'two', 'three'].map((n, i) => ({ id: n, name: `Person ${n}`, pubkey: String.fromCharCode(98 + i).repeat(64) }))
const npubOf = (person: MentionPerson) => (person.pubkey ? `nostr:${encodeNpub(person.pubkey)}` : null)
const nameOfKey = (key: string) => PEOPLE.find((person) => person.pubkey === key)?.name ?? 'Someone'

const APP_LINK = 'https://app.example/item/one'
const ITEMS: CaptionedItem[] = ['one', 'two', 'three'].map((n) => ({ id: `item-${n}`, label: `Item ${n}`, snippet: '', uri: `nostr:naddr1item${n}` }))
const sections = (query: string): ReferenceSection[] => [{ label: 'Items', items: ITEMS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) }]
const linkChips = { referenceOf: (url: string) => (url === APP_LINK ? ITEMS[0].uri : undefined), ask: null, limit: 24 }

const SQUARE = <IconSquareRounded size={14} stroke={1.5} />

/** A chip as the app draws it: a person by name, an item by its label; it opens where it leads. */
function Chip({ uri, href }: ReferenceViewProps) {
  const person = PEOPLE.find((one) => npubOf(one) === uri)
  if (person) return <InlineChip tone="person">{`@${person.name}`}</InlineChip>
  const item = ITEMS.find((one) => one.uri === uri)
  return (
    <InlineChip icon={SQUARE} href={href ?? 'https://example.com/item'} target="_blank" rel="noreferrer">
      {item?.label ?? 'Item'}
    </InlineChip>
  )
}

function PlacedFile({ attrs }: AttachmentViewProps) {
  return <AttachmentCard name={String(attrs.filename ?? 'file')} size={Number(attrs.size) || undefined} contentType={String(attrs.m ?? '')} src={String(attrs.url ?? '') || undefined} />
}

/** An upload that answers after a moment with the file's attributes; the picture is drawn from this page. */
const upload = (file: File): Promise<Record<string, unknown>> =>
  new Promise((resolve) => setTimeout(() => resolve({ url: URL.createObjectURL(file), m: file.type, x: '0'.repeat(64), size: file.size, filename: file.name }), 600))

const START = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', id: 'b1', attrs: { level: 1 }, content: [{ type: 'text', text: 'Label' }] },
    {
      type: 'paragraph',
      id: 'b2',
      content: [
        { type: 'text', text: 'Type / for formats, [ to link ' },
        { type: 'text', text: 'Item one', marks: [{ type: 'reference', attrs: { uri: ITEMS[0].uri } }] },
        { type: 'text', text: ', @ to name a person. Words can carry ' },
        { type: 'text', text: 'a link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'bulletList',
      id: 'b3',
      content: [
        { type: 'listItem', id: 'b4', attrs: { checked: true }, content: [{ type: 'text', text: 'Item one' }] },
        { type: 'listItem', id: 'b5', attrs: { checked: false }, content: [{ type: 'text', text: 'Item two' }] },
      ],
    },
    { type: 'blockquote', id: 'b6', attrs: { tone: 'note' }, content: [{ type: 'text', text: 'A note, kept with its tone.' }] },
  ],
})

/** An app's held-typing store: what each open editor holds is read when the sign-in ends. */
function heldStore() {
  const held = new Map<string, string>()
  const readers = new Map<string, () => string | undefined>()
  let ending = false
  const hold: HeldTyping = {
    text: (key) => held.get(key),
    release: (key) => void held.delete(key),
    register: (key, read) => {
      readers.set(key, read)
      return () => {
        readers.delete(key)
        if (!ending) held.delete(key)
      }
    },
    ended: () => ending,
  }
  return {
    hold,
    end: () => {
      ending = true
      for (const [key, read] of readers) {
        const text = read()
        if (text) held.set(key, text)
      }
    },
    back: () => {
      ending = false
    },
  }
}

/** The saved text's lines, and each link on words with where it goes. */
function savedLines(value: string): string[] {
  const lines: string[] = []
  const walk = (node: { text?: string; marks?: { type: string; attrs?: { href?: string } }[]; content?: unknown[] }, line: string[]) => {
    if (node.text !== undefined) {
      const link = node.marks?.find((mark) => mark.type === 'link')
      line.push(link ? `[${node.text}](${link.attrs?.href})` : node.text)
    }
    for (const child of (node.content ?? []) as (typeof node)[]) walk(child, line)
  }
  for (const block of (JSON.parse(value) as { content: { content?: unknown[] }[] }).content) {
    const line: string[] = []
    walk(block, line)
    lines.push(line.join(''))
  }
  return lines
}

type Bench = Pick<DocumentEditorProps, 'readOnly' | 'upload' | 'linkChips' | 'readMarkdown'> & {
  /** The app's `[` and `@`. */
  lists?: boolean
  /** Comments on a selection, as the app switches them on. */
  comments?: boolean
  /** The block handle's rows: Copy link, and Comment on the block. */
  rows?: boolean
}

/** The editor and the app around it. */
function Workbench({ lists = true, comments = false, rows = false, readOnly = false, ...rest }: Bench) {
  const [value, setValue] = useState(START)
  const [changedBy, setChangedBy] = useState<{ name: string } | null>(null)
  const [opened, setOpened] = useState(0)
  const [signedIn, setSignedIn] = useState(true)
  const [added, setAdded] = useState<string[] | null>(null)
  const [said, setSaid] = useState<string | null>(null)
  const store = useRef(heldStore()).current

  const onCommit: DocumentEditorProps['onCommit'] = async (next, contentFormat, editedFrom) => {
    setAdded(newlyNamedPeople({ content: next, format: contentFormat }, { content: editedFrom, format: FORMAT_TAG }).map(nameOfKey))
    setValue(next)
    setChangedBy(null)
    return true
  }
  const someoneElse = () => {
    const doc = JSON.parse(value) as { type: 'doc'; content: object[] }
    doc.content.push({ type: 'paragraph', id: `other-${Date.now()}`, content: [{ type: 'text', text: 'A line someone else added.' }] })
    setValue(JSON.stringify(doc))
    setChangedBy({ name: 'Person two' })
  }
  const blockRows = (block: HandleBlock) =>
    block.id ? (
      <>
        <MenuItem label="Copy link" leading={<IconLink size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => setSaid(`Copied the link to block ${block.id}.`)} />
        <MenuItem label="Comment" leading={<IconMessage size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => setSaid(`A comment on block ${block.id}.`)} />
      </>
    ) : null
  const onCommentOnSelection = (anchor: SelectionAnchor) => setSaid(`A comment on ${anchor.quote ? `“${anchor.quote.start}${anchor.quote.end ? ` … ${anchor.quote.end}` : ''}”` : `block ${anchor.blocks.join(', ')}`}.`)

  return (
    <div className="flex max-w-2xl flex-col gap-4 pl-10">
      {signedIn ? (
        <DocumentEditor
          key={opened}
          value={value}
          format="blocks"
          codec={codec}
          onCommit={onCommit}
          label="Document"
          placeholder="Type / for headings and lists."
          readOnly={readOnly}
          changedBy={changedBy}
          hold={store.hold}
          holdKey="document-one"
          referenceView={Chip}
          attachmentView={PlacedFile}
          {...(lists ? { references: { sections, ariaLabel: 'Items', sectionLabel: 'Items' }, mentions: { people: () => PEOPLE, uriOf: npubOf } } : {})}
          {...(comments ? { onCommentOnSelection } : {})}
          {...(rows ? { blockRows } : {})}
          {...rest}
        />
      ) : (
        <p className="text-body-2 text-text-secondary">The sign-in ended. What was typed is kept on this device.</p>
      )}
      <div className="flex flex-col gap-2 rounded-md border border-border-default p-3 text-body-2 text-text-secondary">
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            // Pressing it keeps you in the editor, so their save arrives while you are typing.
            <Button variant="outlined" size="small" onMouseDown={(event) => event.preventDefault()} onClick={someoneElse}>
              Someone else saves
            </Button>
          )}
          <Button variant="outlined" size="small" onClick={() => setOpened((n) => n + 1)}>
            Reload
          </Button>
          {!readOnly &&
            (signedIn ? (
              <Button
                variant="outlined"
                size="small"
                // An ending comes from outside, with the text still being typed: pressing it must not leave the editor, which saves.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  store.end()
                  setSignedIn(false)
                }}
              >
                End the sign-in
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  store.back()
                  setSignedIn(true)
                }}
              >
                Sign in again
              </Button>
            ))}
        </div>
        {said && <p>{said}</p>}
        {added && <p>{added.length > 0 ? `This save adds ${added.join(', ')}.` : 'This save adds nobody.'}</p>}
        <p className="text-caption">Saved:</p>
        <ul className="flex flex-col gap-1 text-caption">
          {savedLines(value).map((line, at) => (
            <li key={at}>{line || ' '}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** `[`, `/`, `@`, comments on a selection, and the handle's Copy link and Comment. */
export const WithComments: Story = {
  render: () => <Workbench comments rows linkChips={linkChips} readMarkdown={readMarkdown} />,
}

/**
 * Files: `/` → File and a pasted picture, uploaded first. A pasted app URL
 * (`https://app.example/item/one`) becomes its chip. The handle has Copy link
 * and Comment; a selection has no Comment.
 */
export const WithFiles: Story = {
  render: () => <Workbench rows upload={upload} linkChips={linkChips} readMarkdown={readMarkdown} />,
}

/** Nothing of the app's but its chips: no `[`, no `@`, no rows, no comments. */
export const Plain: Story = {
  render: () => <Workbench lists={false} linkChips={linkChips} />,
}

/** For reading: the same drawing, nothing typed or saved. Chips open; a selection still has Comment. */
export const ReadOnly: Story = {
  render: () => <Workbench readOnly comments rows />,
}
