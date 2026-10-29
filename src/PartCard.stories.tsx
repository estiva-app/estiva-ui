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

/** Still being looked up. */
export const Loading: Story = { args: { state: 'loading', kind: 'issue' } }

/** The part, or what it is part of, is gone or not this reader's to see. */
export const NotAvailable: Story = { args: { state: 'unavailable', kind: 'issue', noun: 'Issue', openIn: { app: 'App one', href: '#elsewhere' } } }
