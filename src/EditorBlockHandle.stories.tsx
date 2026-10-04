import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { IconLink, IconMessage } from '@tabler/icons-react'
import type { HandleBlock } from './BlockHandle'
import { BlockId } from './BlockNodes'
import { EditorBlockHandle, blockDropCursor, type BlockTurnInto } from './EditorBlockHandle'
import { MenuItem } from './Menu'
import { richTextClassName } from './RichText'

/**
 * `BlockHandle` in an editor. Drag the handle to move a block; press it for
 * Turn into, Duplicate, Delete, then the app's rows.
 */
const meta = {
  title: 'Primitives/EditorBlockHandle',
  // The handle sits 28px left of the content, in the page's margin.
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, blockId: 'b1' }, content: [{ type: 'text', text: 'A heading' }] },
    { type: 'paragraph', attrs: { blockId: 'b2' }, content: [{ type: 'text', text: 'The first paragraph. Drag its handle below the list.' }] },
    { type: 'paragraph', attrs: { blockId: 'b3' }, content: [{ type: 'text', text: 'The second paragraph.' }] },
    {
      type: 'bulletList',
      attrs: { blockId: 'b4' },
      content: [
        { type: 'listItem', attrs: { blockId: 'b5' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item one' }] }] },
        { type: 'listItem', attrs: { blockId: 'b6' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item two' }] }] },
      ],
    },
    { type: 'paragraph', attrs: { blockId: 'b7' }, content: [{ type: 'text', text: 'The last paragraph.' }] },
  ],
}

const TURN_INTO: BlockTurnInto[] = [
  { label: 'Text', run: (editor) => editor.chain().setParagraph().run(), active: (node) => node.type.name === 'paragraph' },
  { label: 'Heading', run: (editor) => editor.chain().setHeading({ level: 1 }).run(), active: (node) => node.type.name === 'heading' && node.attrs.level === 1 },
  { label: 'Subheading', run: (editor) => editor.chain().setHeading({ level: 2 }).run(), active: (node) => node.type.name === 'heading' && node.attrs.level === 2 },
  { label: 'Code', run: (editor) => editor.chain().setCodeBlock().run(), active: (node) => node.type.name === 'codeBlock' },
]

/** The rows an app adds: here they only say which block they were pressed on. */
function rows(block: HandleBlock) {
  return (
    <>
      <MenuItem label="Copy link" leading={<IconLink size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => console.info('copy link', block.id)} />
      <MenuItem label="Comment" leading={<IconMessage size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => console.info('comment', block.id)} />
    </>
  )
}

function Editing({ editable }: { editable: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ dropcursor: blockDropCursor }), BlockId],
    content: DOCUMENT,
    editable,
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <EditorBlockHandle editor={editor} turnInto={TURN_INTO} actions={rows} className="ml-8 max-w-[560px]">
      <EditorContent editor={editor} />
    </EditorBlockHandle>
  )
}

/** Drag to move; Turn into, Duplicate and Delete; then the app's rows. */
export const Default: Story = {
  render: () => <Editing editable />,
}

/** An editor that is not editable: no drag, and only the app's rows. */
export const NotEditable: Story = {
  render: () => <Editing editable={false} />,
}
