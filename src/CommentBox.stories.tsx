import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { Editor, JSONContent } from '@tiptap/react'
import { IconSquareRounded } from '@tabler/icons-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import type { ReferenceViewProps } from './BlockNodes'
import { Button } from './Button'
import { CommentBox, commentBoxRows, type BoxUnder, type CommentBoxDraft, type CommentBoxProps, type SendAnswer, type UploadAnswer } from './CommentBox'
import type { CaptionedItem, MentionPerson, ReferenceSection, SlashCommand } from './ComposerTriggers'
import { InlineChip } from './InlineChip'
import { Kbd } from './Kbd'
import { LinkCard } from './LinkCard'
import { LinkChip } from './LinkChip'
import { ITEM, ITEM_NO_SUMMARY, ready } from './linked.examples'
import { PartCard } from './PartCard'
import { RichText } from './RichText'

/**
 * The one box every app writes in. Every story is live: write, open a list,
 * send. A send is answered after a moment; write "refuse" anywhere to see a
 * refusal. Pick the theme in the toolbar.
 */
const meta = {
  title: 'Writing/CommentBox',
  component: CommentBox,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommentBox>

export default meta
type Story = StoryObj

const PEOPLE: MentionPerson[] = ['one', 'two', 'three', 'four'].map((n, i) => ({ id: n, name: `Person ${n}`, pubkey: String(i + 1).repeat(64) }))

const ITEMS: CaptionedItem[] = ['one', 'two', 'three'].map((n, i) => ({
  id: String(i + 5).repeat(64),
  label: 'Label',
  snippet: `Item ${n}`,
  uri: `nostr:nevent1item${n}`,
}))

const references = (query: string): ReferenceSection[] => [
  { label: 'Group one', items: ITEMS.filter((item) => item.snippet.toLowerCase().includes(query.toLowerCase())) },
]

const INSERT = [commentBoxRows.file, commentBoxRows.mention, commentBoxRows.urgent, commentBoxRows.reference]

const plain = (body: JSONContent): string => (body.text ?? '') + (body.content ?? []).map(plain).join(' ')

/** A relay that answers after a moment, and refuses whatever says "refuse". */
const answering = (body: JSONContent): Promise<SendAnswer> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(/refuse/i.test(plain(body)) ? { accepted: false, reason: 'rate-limited, try again in a minute' } : { accepted: true }), 900),
  )

/** A relay that never answers. */
const silent = (): Promise<SendAnswer> => new Promise(() => {})

const uploads =
  (answer: 'ready' | 'failed' | 'never') =>
  (file: File): Promise<UploadAnswer> =>
    answer === 'never'
      ? new Promise(() => {})
      : new Promise((resolve) =>
          setTimeout(() => resolve(answer === 'ready' ? { accepted: true, value: file.name } : { accepted: false, reason: 'The file is larger than 20 MB.' }), 1800),
        )

const PLACEHOLDER = (
  <>
    <span>Write, or type</span>
    <Kbd>/</Kbd>
    <span>for commands</span>
  </>
)

const DRAFT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Half written, and still here when you come back' }] }],
}

const WITH_CHIPS: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Agreed with ' },
        { type: 'mention', attrs: { id: 'two', label: 'Person two', pubkey: '2'.repeat(64) } },
        { type: 'text', text: ', as in ' },
        { type: 'captionedReference', attrs: { id: ITEMS[0].id, label: 'Label', snippet: 'Item one', uri: ITEMS[0].uri } },
      ],
    },
  ],
}

/** The sent lines above the box, so a send can be seen to land. */
function Live({ start, ...props }: Partial<CommentBoxProps> & { start?: JSONContent }) {
  const [sent, setSent] = useState<string[]>([])
  const [kept] = useState(() => {
    let body = start
    const draft: CommentBoxDraft = { read: () => body, write: (b) => (body = b), clear: () => (body = undefined) }
    return draft
  })
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-3">
      {sent.map((line, i) => (
        <p key={i} className="text-body-2 text-text-primary">
          {line}
        </p>
      ))}
      {open ? (
        <CommentBox
          people={PEOPLE}
          references={references}
          insert={INSERT}
          send={answering}
          label="Write"
          placeholder={PLACEHOLDER}
          draft={kept}
          upload={uploads('ready')}
          onSent={(body) => setSent((all) => [...all, plain(body)])}
          {...props}
        />
      ) : (
        <p className="text-body-2 text-text-muted">The box is closed. Open it again: the words are kept.</p>
      )}
      {start && (
        <div>
          <Button variant="outlined" size="small" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close the box' : 'Open the box'}
          </Button>
        </div>
      )}
    </div>
  )
}

const typeInto = (text: string) =>
  async function play({ canvasElement }: { canvasElement: HTMLElement }) {
    const box = within(canvasElement).getByRole('textbox', { name: 'Write' })
    await userEvent.click(box)
    await userEvent.keyboard(text)
  }

const pickAFile = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const input = canvasElement.querySelector('input[type=file]') as HTMLInputElement
  await userEvent.upload(input, new File(['placeholder'], 'plan.pdf', { type: 'application/pdf' }))
}

/** Nothing written. */
export const Empty: Story = { render: () => <Live /> }

/** Words half written. Close the box and open it again: they are still there. */
export const WithADraft: Story = { render: () => <Live start={DRAFT} /> }

/** `@`: the people the app supplies. */
export const MentionOpen: Story = { render: () => <Live />, play: typeInto('Asking @') }

/** `!@`: the same people, urgently. */
export const UrgentOpen: Story = { render: () => <Live />, play: typeInto('Asking !@') }

/** `[`: what the app's sections list. */
export const ReferenceOpen: Story = { render: () => <Live />, play: typeInto('As in [[') }

/** `/`: the shared Format section, then the app's Insert rows. */
export const CommandsOpen: Story = { render: () => <Live />, play: typeInto('/') }

/** Held until the relay answers: the words stay, shut. */
export const Sending: Story = { render: () => <Live send={silent} />, play: typeInto('On its way{Enter}') }

/** The relay said no: the words are back in the box, and a line says why. */
export const Refused: Story = { render: () => <Live />, play: typeInto('Please refuse this{Enter}') }

/** Shown at once: the box empties now, and a refusal puts the words back. Write "refuse" to see it. */
export const ShownAtOnce: Story = { render: () => <Live showsAtOnce /> }

/** Editing something sent: the chips stay chips; only the keys on the left. */
export const Editing: Story = {
  render: () => <Live edit={{ body: WITH_CHIPS, onCancel: () => {}, onSave: answering }} />,
}

/** A save the relay refused: "Saving…" while it waits, then a line under the box; the changes stay. */
export const EditingRefused: Story = {
  render: () => (
    <Live
      edit={{
        body: WITH_CHIPS,
        onCancel: () => {},
        onSave: () => new Promise((resolve) => setTimeout(() => resolve({ accepted: false, reason: 'rate-limited, try again in a minute' }), 900)),
      }}
    />
  ),
  play: typeInto('{Enter}'),
}

/** A file attached and ready: its card under the text, and Send can send it with no words. */
export const WithAFile: Story = { render: () => <Live />, play: pickAFile }

/** A file uploading: Send waits for it. */
export const FileUploading: Story = { render: () => <Live upload={uploads('never')} />, play: pickAFile }

/** A file that failed: it says why, Send holds, and its ✕ removes it. */
export const FileFailed: Story = { render: () => <Live upload={uploads('failed')} />, play: pickAFile }

/** Read-only, archived: a line in the box's place. */
export const ReadOnlyArchived: Story = { render: () => <Live closed={{ reason: 'This is archived, so nothing new can be written here.' }} /> }

/** Read-only, signed out: a line in the box's place. */
export const ReadOnlySignedOut: Story = { render: () => <Live closed={{ reason: 'Sign in to write here.' }} /> }

const ITEM_URL = 'https://app.example/item/one'
const PART_URL = 'https://app.example/page/two#block'

/**
 * What the app reads for the box: one item named gets its card; a link to
 * a block of something is its live part, and then no card.
 */
const under: BoxUnder = {
  read: (body) => {
    const text = plain(body)
    const item = text.includes(ITEM_URL)
    const part = text.includes(PART_URL)
    return {
      card: item && !part ? { value: 'item-one', view: <LinkCard link={ready(ITEM)} /> } : undefined,
      parts: part
        ? [
            {
              key: 'item-two',
              view: (
                <PartCard state="ready" kind="issue" heading="Item two" partKey="ABC-3" href="#part">
                  {/* As the apps draw a part's blocks: RichText in its small size. */}
                  <RichText blocks={[{ type: 'paragraph', inline: [{ text: 'The block, as it is now. It changes when the text it came from changes.', marks: [] }] }]} size="small" />
                </PartCard>
              ),
            },
          ]
        : [],
      names: [...(item ? ['item-one'] : []), ...(part ? ['item-two'] : [])],
    }
  },
}

/** One item named: its card in the box, under the text; point at it for the ✕ that takes it off. Take the link out and put it back and the card comes back. */
export const WithACard: Story = { render: () => <Live under={under} />, play: typeInto(`As in ${ITEM_URL} `) }

/** A file and a card: both in the box, on the same fill, with the same ✕ on hover. */
export const WithAFileAndACard: Story = {
  render: () => <Live under={under} />,
  play: async (ctx) => {
    await pickAFile(ctx)
    await typeInto(`As in ${ITEM_URL} `)(ctx)
  },
}

/** A link in the box, on words: drawn as a link, the link icon before its words (it read as plain words before). */
export const WithALink: Story = {
  render: () => (
    <Live
      start={{
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'The plan is in ' },
              { type: 'text', text: 'the guide', marks: [{ type: 'link', attrs: { href: 'https://example.com/guide' } }] },
              { type: 'text', text: ' for now.' },
            ],
          },
        ],
      }}
    />
  ),
}

/** A link to a block: its live part in the box, and no card. */
export const WithAPart: Story = { render: () => <Live under={under} />, play: typeInto(`As in ${ITEM_URL} and ${PART_URL} `) }

/** Editing: a link the edit adds shows the card Save will add. A part never shows here, since an edit carries none. */
export const EditingWithACard: Story = {
  render: () => (
    <Live
      under={under}
      edit={{
        body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'As in' }] }] },
        onCancel: () => {},
        onSave: answering,
      }}
    />
  ),
  // The edit box puts the caret at the end as it opens; a click would move it.
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('textbox', { name: 'Write' })
    await waitFor(() => expect(box.ownerDocument.activeElement).toBe(box))
    await userEvent.keyboard(` ${ITEM_URL} `)
  },
}

/** The app's view of a link the box holds: the kit's chip, with no preview while it is written. */
const KitChip = ({ uri, editing }: ReferenceViewProps) => <LinkChip link={ready(uri === ITEMS[0].uri ? ITEM : ITEM_NO_SUMMARY)} preview={!editing} />

const WITH_LINKS: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Picked with [: ' },
        { type: 'captionedReference', attrs: { id: ITEMS[0].id, label: 'Label', snippet: 'Item one', uri: ITEMS[0].uri } },
        { type: 'text', text: ' and pasted: ' },
        { type: 'reference', attrs: { uri: ITEMS[1].uri } },
      ],
    },
  ],
}

/**
 * Every link in the box is the kit's chip, through the app's `referenceView`: a
 * `[` pick and a pasted link alike, each with its key, its title cut short and
 * its status as a mark. Neither previews while written, and a click on one
 * stays in the box. Type `[` to pick another.
 */
export const WithLinkChips: Story = { render: () => <Live start={WITH_LINKS} referenceView={KitChip} /> }

/** An app's own `/` rows, after the kit's: each puts a label at the start of the box, which the app marks. */
const OWN_ROWS: SlashCommand[] = ['one', 'two', 'three', 'four', 'five'].map((n) => ({
  key: `own-${n}`,
  row: { label: `Item ${n}` },
  keywords: ['item'],
  run: (editor) => editor.chain().focus().insertContentAt(1, `Item ${n}: `).run(),
}))

/** The app's own chip for a reference the box holds. */
const OwnChip = ({ uri }: ReferenceViewProps) => (
  <InlineChip icon={<IconSquareRounded size={16} stroke={1.5} />}>{uri.endsWith('one') ? 'Item one' : 'Item'}</InlineChip>
)

const WITH_A_REFERENCE: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'As in ' }, { type: 'reference', attrs: { uri: 'nostr:item-one' } }] }],
}

/** What an app adds around the box: its own rows and mark, its chip, and a control outside the box that writes into the box last used. */
function AppAround() {
  const [last, setLast] = useState<Editor | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button variant="outlined" size="small" disabled={!last} onClick={() => last?.chain().focus('end').insertContent(' Written from outside the box.').run()}>
          Write into the box
        </Button>
      </div>
      <Live
        start={WITH_A_REFERENCE}
        insert={[...INSERT, ...OWN_ROWS]}
        referenceView={OwnChip}
        marked={(editor) => editor.getText().startsWith('Item ')}
        onEditor={(editor) => setLast(editor)}
      />
    </div>
  )
}

/**
 * An app's own `/` rows after the kit's, its own mark (the bar down the text,
 * as an urgent mention draws it), its chip for a reference, a pasted picture
 * becoming a file, and a control outside the box writing into it.
 */
export const WithAnAppsOwnRows: Story = { render: () => <AppAround />, play: typeInto('/item') }

/** An urgent mention in the box: the bar down the text while it is there. */
export const UrgentMarked: Story = {
  render: () => (
    <Live
      start={{
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'urgentMention', attrs: { id: 'two', label: 'Person two', pubkey: '2'.repeat(64) } }, { type: 'text', text: ' please look' }] }],
      }}
    />
  ),
}

/** A draft longer than the box: it stops at half the window and scrolls inside, so its first line can be reached. */
export const LongDraft: Story = {
  render: () => (
    <Live
      start={{
        type: 'doc',
        content: Array.from({ length: 40 }, (_, i) => ({ type: 'paragraph', content: [{ type: 'text', text: `Line ${i + 1} of a long draft.` }] })),
      }}
    />
  ),
}

/** The narrowest column it sits in, 320px, with a file uploading. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
  render: () => <Live upload={uploads('never')} start={DRAFT} />,
  play: pickAFile,
}
