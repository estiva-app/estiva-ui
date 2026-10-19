import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { userEvent, within } from 'storybook/test'
import { Button } from './Button'
import { CommentBox, commentBoxRows, type BoxUnder, type CommentBoxDraft, type CommentBoxProps, type SendAnswer, type UploadAnswer } from './CommentBox'
import type { CaptionedItem, MentionPerson, ReferenceSection } from './ComposerTriggers'
import { Kbd } from './Kbd'
import { LinkCard } from './LinkCard'
import { ITEM, ready } from './linked.examples'
import { PartCard } from './PartCard'

/**
 * The one box every app writes in. Every story is live: write, open a list,
 * send. A send is answered after a moment; write "refuse" anywhere to see a
 * refusal. Pick the theme in the toolbar.
 */
const meta = {
  title: 'Primitives/CommentBox',
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
 * What the app reads under the box: one item named gets its card; a link to
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
                  <p className="text-body-2 text-text-secondary">The block, as it is now. It changes when the text it came from changes.</p>
                </PartCard>
              ),
            },
          ]
        : [],
      names: [...(item ? ['item-one'] : []), ...(part ? ['item-two'] : [])],
    }
  },
}

/** One item named: its card under the box, with ✕ to take it off. Take the link out and put it back and the card comes back. */
export const CardUnderTheBox: Story = { render: () => <Live under={under} />, play: typeInto(`As in ${ITEM_URL} `) }

/** A link to a block: its live part under the box, and no card. */
export const PartUnderTheBox: Story = { render: () => <Live under={under} />, play: typeInto(`As in ${ITEM_URL} and ${PART_URL} `) }

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
  play: typeInto(`{End} ${ITEM_URL} `),
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
