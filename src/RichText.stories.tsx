import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { RichText, type RichTextBlock, type RichTextRun } from './RichText'
import { InlineChip } from './InlineChip'
import { Card } from './Card'

const t = (text: string, ...marks: string[]): RichTextRun => ({ text, marks })
const p = (...inline: RichTextRun[]): RichTextBlock => ({ type: 'paragraph', inline })
const items = (...texts: string[]): RichTextBlock[] => texts.map((text) => ({ type: 'listItem', inline: [t(text)] }))
const cell = (type: 'tableHeader' | 'tableCell', text: string): RichTextBlock => ({ type: 'unknown', typeName: type, children: [p(t(text))] })
const row = (type: 'tableHeader' | 'tableCell', ...texts: string[]): RichTextBlock => ({ type: 'unknown', typeName: 'tableRow', children: texts.map((x) => cell(type, x)) })

/** Every block the part draws, in the order a reader meets them. */
const EVERY_BLOCK: RichTextBlock[] = [
  { type: 'heading', level: 1, inline: [t('A heading')] },
  { type: 'heading', level: 2, inline: [t('A smaller heading')] },
  { type: 'heading', level: 3, inline: [t('A third level, in the text colour')] },
  p(t('Text can be '), t('bold', 'bold'), t(', '), t('italic', 'italic'), t(' or '), t('underlined', 'underline'), t(', and hold '), t('code', 'code'), t(' in a sentence.\nA line break stays a line break.')),
  { type: 'bulletList', children: items('An item', 'Another item') },
  { type: 'orderedList', children: items('The first step', 'The second step') },
  { type: 'blockquote', inline: [t('A quote, set in from a line.')] },
  { type: 'codeBlock', language: 'ts', inline: [t('const item = 1 // a long line of code folds onto the next line instead of scrolling sideways')] },
  { type: 'horizontalRule' },
  {
    type: 'table',
    children: [row('tableHeader', 'Label', 'Value'), row('tableCell', 'Item one', 'One'), row('tableCell', 'Item two', 'Two')],
  },
]

const meta = {
  title: 'Components/RichText',
  component: RichText,
  args: { blocks: EVERY_BLOCK, size: 'default' },
  argTypes: { size: { control: 'inline-radio', options: ['default', 'small'] } },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
} satisfies Meta<typeof RichText>

export default meta
type Story = StoryObj<typeof meta>

/** Every block: headings, text and its marks, both lists, a quote, code, a divider and a table. */
export const EveryBlock: Story = {}

/** One step down, with every heading, list, quote and table kept: an item shown inside a card. */
export const Small: Story = {
  args: { size: 'small' },
  render: (args) => (
    <Card className="p-3">
      <RichText {...args} />
    </Card>
  ),
}

/** A link written with its own words, and a bare address, which may break anywhere. Code is never read for links. */
export const Links: Story = {
  args: {
    blocks: [
      p(t('A link with its own words: [the guide](https://example.com/guide). A bare address: https://example.com/a/long/address/that/breaks/where/it/must.')),
      p(t('Inside code it stays text: '), t('[not a link](https://example.com)', 'code')),
    ],
  },
}

/** What an app draws itself: a run that stands for an address, and words it recognises in plain text. */
export const WithTheAppsOwnParts: Story = {
  args: {
    blocks: [
      p(
        t('Assigned to '),
        { text: 'nostr:npub1example', marks: [], reference: 'nostr:npub1example' },
        t(', see [[Item one]] for the rest.'),
      ),
    ],
    renderReference: () => <InlineChip tone="person">Name</InlineChip>,
    renderText: (text) =>
      text.split(/(\[\[[^\]]+\]\])/).map((part, i) =>
        part.startsWith('[[') ? (
          <InlineChip key={i} icon={<IconSquareRounded size={16} stroke={1.5} />}>{part.slice(2, -2)}</InlineChip>
        ) : (
          part
        ),
      ),
  },
}

/** A block this part has no design for, from a later version: its words are drawn, never dropped. */
export const UnknownBlock: Story = {
  args: {
    blocks: [p(t('The block below is of a kind this part does not know.')), { type: 'unknown', typeName: 'later', inline: [t('Its words are still here.')] }],
  },
}
