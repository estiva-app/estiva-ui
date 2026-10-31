import type { Meta, StoryObj } from '@storybook/react-vite'
import { PartCard } from './PartCard'
import { RichText, type RichTextBlock } from './RichText'

/** A part as it is quoted: a heading and the text under it. */
const PART_BLOCKS: RichTextBlock[] = [
  { type: 'heading', level: 2, inline: [{ text: 'A heading in the part', marks: [] }] },
  { type: 'paragraph', inline: [{ text: 'The blocks of the part, as they are now. They change when the text they came from changes.', marks: [] }] },
]

const meta = {
  title: 'Links & references/PartCard',
  component: PartCard,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="max-w-[480px]">{Story()}</div>],
} satisfies Meta<typeof PartCard>

export default meta
type Story = StoryObj<typeof meta>

/** A part of something longer, under the header of what it is part of. */
export const Default: Story = {
  args: {
    state: 'ready',
    kind: 'issue',
    heading: 'Item one',
    partKey: 'ABC-2',
    href: '#part',
    // As the apps draw a part's blocks: RichText in its small size (Peek's and Leaf's PartCard do), not sizes typed by hand.
    children: <RichText blocks={PART_BLOCKS} size="small" />,
  },
}

const LONG_BLOCKS: RichTextBlock[] = [
  { type: 'heading', level: 2, inline: [{ text: 'A heading in the part', marks: [] }] },
  ...Array.from({ length: 6 }, (_, i): RichTextBlock => ({ type: 'paragraph', inline: [{ text: `Paragraph ${i + 1} of the part, long enough to fill a line of the card and go on to a second one.`, marks: [] }] })),
]

/** As an app quotes a long part: cut behind Show more, under the quote bar. Its title is the way to it, in its own app. */
export const Long: Story = {
  args: {
    state: 'ready',
    kind: 'page',
    heading: 'Document one',
    href: '#part',
    maxHeight: 160,
    children: <RichText blocks={LONG_BLOCKS} size="small" />,
  },
}

/** Still being looked up. */
export const Loading: Story = { args: { state: 'loading', kind: 'issue' } }

/** The part, or what it is part of, is gone or not this reader's to see. */
export const NotAvailable: Story = { args: { state: 'unavailable', kind: 'issue', noun: 'Issue', openIn: { app: 'App one', href: '#elsewhere' } } }

/** What it is part of was deleted, as a trusted deletion naming it says: no title. */
export const Deleted: Story = { args: { state: 'deleted', kind: 'issue', noun: 'Issue' } }

/** What it is part of is still there, and the part's block is gone. */
export const Detached: Story = { args: { state: 'detached', kind: 'issue', heading: 'Item one' } }

/** What it is part of has no blocks to show a part of: the words open the whole of it. */
export const Unaddressable: Story = { args: { state: 'unaddressable', kind: 'file', heading: 'Item one', href: '#whole' } }
