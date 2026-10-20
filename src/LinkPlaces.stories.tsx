import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { Card } from './Card'
import { InlineChip } from './InlineChip'
import { LinkPlaces } from './LinkPlaces'
import { richTextClassName } from './RichText'

/**
 * Each link in a document is told where it sits, and the app draws it there:
 * its chip in a sentence, its row alone on its line, its card in the row's
 * place. Here the row and card are stand-in boxes naming the place; the real
 * ones are the app's, which knows how to resolve what the link points at.
 */
const meta = {
  title: 'Primitives/LinkPlaces',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const ref = (uri: string, embed?: string) => ({ type: 'reference', attrs: { uri, ...(embed ? { embed } : {}) } })

/** A stand-in for the app's drawing of a link, by its place. */
function Placed({ uri, place = 'chip' }: ReferenceViewProps) {
  const name = uri.endsWith('one') ? 'Item one' : uri.endsWith('two') ? 'Item two' : 'Item three'
  if (place === 'chip') return <InlineChip>{name}</InlineChip>
  return (
    <Card fill="inset" className={place === 'card' ? 'flex h-24 items-start p-3' : 'flex h-9 items-center px-3'}>
      <span className="text-body-2 text-text-secondary">
        {name}, its {place}
      </span>
    </Card>
  )
}

function Box() {
  const editor = useEditor({
    extensions: [StarterKit, BlockId, ReferenceNode.configure({ view: Placed }), LinkPlaces],
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'A sentence that names ' }, ref('nostr:naddr1one'), { type: 'text', text: ' in passing.' }] },
        { type: 'paragraph', attrs: { blockId: 'p2' }, content: [ref('nostr:naddr1two')] },
        { type: 'paragraph', attrs: { blockId: 'p3' }, content: [ref('nostr:naddr1three', 'detailed')] },
      ],
    },
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <Card fill="surface" className="flex w-[520px] flex-col gap-2 p-3">
      <EditorContent editor={editor} />
    </Card>
  )
}

/** A chip in a sentence, a row alone on its line, and a card chosen for the third. Type beside the row: it becomes a chip. */
export const InAnEditor: Story = { render: () => <Box /> }
