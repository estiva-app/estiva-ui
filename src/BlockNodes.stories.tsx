import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AttachmentCard } from './AttachmentCard'
import { InlineChip } from './InlineChip'
import { richTextClassName } from './RichText'
import { AttachmentNode, BlockId, ReferenceNode, UnknownBlock, type AttachmentViewProps, type ReferenceViewProps } from './BlockNodes'

/**
 * The nodes an editor of a block document adds to StarterKit: an id on every
 * block, a block it cannot edit kept whole, a reference and a file. The app
 * draws the reference and the file with its own views.
 */
const meta = {
  title: 'Primitives/BlockNodes',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

/** What an app hands `ReferenceNode`: here a chip with a fixed label. */
function Chip({ uri }: ReferenceViewProps) {
  return <InlineChip data-uri={uri}>Item one</InlineChip>
}

/** What an app hands `AttachmentNode`: here the package's card. */
function File({ attrs }: AttachmentViewProps) {
  return <AttachmentCard name={String(attrs.filename ?? 'File')} size={Number(attrs.size ?? 0)} contentType={String(attrs.m ?? '')} />
}

/*
  The editor's own JSON, as `@estiva-app/protocol`'s `toEditorDocument` hands
  it over: an id on each block, and an unknown block carrying its text.
*/
const DOCUMENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { blockId: 'b1' },
      content: [
        { type: 'text', text: 'A paragraph, with a reference in it: ' },
        { type: 'reference', attrs: { uri: 'nostr:naddr1example', marks: [] } },
      ],
    },
    {
      type: 'unknownBlock',
      attrs: { blockId: 'b2', source: { type: 'widget', id: 'b2' }, text: 'A block this editor has no design for, kept as it is.' },
    },
    { type: 'attachment', attrs: { blockId: 'b3', url: '', m: 'application/pdf', x: '', size: 20480, filename: 'Label.pdf' } },
    { type: 'paragraph', attrs: { blockId: 'b4' }, content: [{ type: 'text', text: 'Type here: every block keeps its id.' }] },
  ],
}

function WithAnEditor({ views }: { views: boolean }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      BlockId,
      UnknownBlock,
      ReferenceNode.configure({ view: views ? Chip : null }),
      AttachmentNode.configure({ view: views ? File : null }),
    ],
    content: DOCUMENT,
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return <EditorContent editor={editor} className="max-w-[560px]" />
}

/** A reference and a file drawn by the app's views, and a block kept whole. */
export const Default: Story = {
  render: () => <WithAnEditor views />,
}

/** No views given: the reference is its URI and the file its name, as text. */
export const WithoutViews: Story = {
  render: () => <WithAnEditor views={false} />,
}
