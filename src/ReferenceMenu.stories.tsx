import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { Card } from './Card'
import { InlineChip } from './InlineChip'
import { LinkPlaces } from './LinkPlaces'
import { ReferenceMenu, ReferenceMenuView } from './ReferenceMenu'
import { richTextClassName } from './RichText'

/**
 * Click a link: its menu opens under it — Open, and alone on its line Show as
 * Row or Card. The link is a placeholder naming where it sits: the real chip,
 * row and card are the app's.
 */
const meta = {
  title: 'Writing/ReferenceMenu',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

function Placeholder({ place = 'chip' }: ReferenceViewProps) {
  if (place === 'chip') return <InlineChip>Item one</InlineChip>
  return (
    <Card fill="inset" className={place === 'card' ? 'flex h-24 items-start p-3' : 'flex h-9 items-center px-3'}>
      <span className="text-body-2 text-text-secondary">Item two, its {place}</span>
    </Card>
  )
}

function Box() {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), BlockId, ReferenceNode.configure({ view: Placeholder }), LinkPlaces, ReferenceMenu],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: 'p1' },
          content: [{ type: 'text', text: 'See ' }, { type: 'reference', attrs: { uri: 'nostr:naddr1one' } }, { type: 'text', text: ' for the details.' }],
        },
        { type: 'paragraph', attrs: { blockId: 'p2' }, content: [{ type: 'reference', attrs: { uri: 'nostr:naddr1two' } }] },
      ],
    },
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <Card fill="surface" className="flex w-[520px] flex-col gap-2 p-3">
      <EditorContent editor={editor} />
      <ReferenceMenuView editor={editor} />
    </Card>
  )
}

/** A link in a sentence, whose menu has Open only, and one alone on its line: choose Card, then Row. */
export const InAnEditor: Story = { render: () => <Box /> }
