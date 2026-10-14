import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { Card } from './Card'
import { InlineChip } from './InlineChip'
import { ReferenceCards, useReferenceCards } from './ReferenceCards'
import { ReferenceMenu, ReferenceMenuView } from './ReferenceMenu'
import { richTextClassName } from './RichText'

/**
 * Click the chip: its menu opens under it — Open, and a card of none, compact
 * or detailed. The chip is a placeholder naming what it points at, and the
 * card a line naming its layout: the real ones are the app's.
 */
const meta = {
  title: 'Primitives/ReferenceMenu',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

function Placeholder({ uri }: ReferenceViewProps) {
  return <InlineChip>Item for {uri}</InlineChip>
}

function Box() {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), BlockId, ReferenceNode.configure({ view: Placeholder }), ReferenceCards, ReferenceMenu],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: 'p1' },
          content: [
            { type: 'text', text: 'See ' },
            { type: 'reference', attrs: { uri: 'nostr:naddr1one' } },
            { type: 'text', text: ' for the details.' },
          ],
        },
      ],
    },
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  const slots = useReferenceCards(editor)
  const cards = slots.flatMap((slot) => slot.cards.map((card) => `${card.layout} card for ${card.uri}`))
  return (
    <Card fill="surface" className="flex w-[520px] flex-col gap-2 p-3">
      <EditorContent editor={editor} />
      <ReferenceMenuView editor={editor} />
      <p className="text-caption text-text-secondary">{cards.length ? cards.join(', ') : 'No card'}</p>
    </Card>
  )
}

/** A chip in a sentence: click it to open its menu, and choose a card. */
export const InAnEditor: Story = { render: () => <Box /> }
