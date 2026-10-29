import type { Meta, StoryObj } from '@storybook/react-vite'
// @estiva-escape(no-hand-rolled-behaviour): the slots ReferenceCards places inside the document are drawn into by a portal, which keeps the app's providers around its card
import { createPortal } from 'react-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode } from './BlockNodes'
import { Card } from './Card'
import { ReferenceCards, useReferenceCards } from './ReferenceCards'
import { richTextClassName } from './RichText'

/**
 * A chip that asks for a card gets a slot after its line, and the app draws
 * its card there. Here the "card" is a stand-in box naming the layout: the real
 * one is the app's, which knows how to resolve what the chip points at.
 */
const meta = {
  title: 'Writing/ReferenceCards',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const ref = (uri: string, embed?: string) => ({ type: 'reference', attrs: { uri, ...(embed ? { embed } : {}) } })

function Box() {
  const editor = useEditor({
    extensions: [StarterKit, BlockId, ReferenceNode, ReferenceCards],
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'Blocked by ' }, ref('nostr:naddr1first', 'detailed'), { type: 'text', text: ' until it ships.' }] },
        { type: 'paragraph', attrs: { blockId: 'p2' }, content: [{ type: 'text', text: 'See also ' }, ref('nostr:naddr1second')] },
        { type: 'paragraph', attrs: { blockId: 'p3' }, content: [ref('nostr:naddr1third', 'compact')] },
      ],
    },
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  const slots = useReferenceCards(editor)
  // @estiva-escape(no-hand-rolled-behaviour): the app's card goes into the slot ReferenceCards placed after its line, inside the document; no Base UI part owns a place in an editor's text
  return (
    <Card fill="surface" className="flex w-[520px] flex-col gap-2 p-3">
      <EditorContent editor={editor} />
      {slots.map((slot) =>
        createPortal(
          <div className="mt-2 flex flex-col gap-2">
            {slot.cards.map((card, i) => (
              <Card key={`${card.uri}-${i}`} fill="surface" className="p-3">
                <span className="text-body-2 text-text-secondary">
                  {card.layout} card for {card.uri}
                </span>
              </Card>
            ))}
          </div>,
          slot.element,
          slot.key,
        ),
      )}
    </Card>
  )
}

/** Three chips: a detailed card after the first line, none for the second, a compact one after the third. */
export const InAnEditor: Story = { render: () => <Box /> }
