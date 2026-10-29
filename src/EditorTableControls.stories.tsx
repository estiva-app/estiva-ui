import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { BlockId } from './BlockNodes'
import { EditorBlockHandle, blockDropCursor } from './EditorBlockHandle'
import { EditorTableControls } from './EditorTableControls'
import { richTextClassName } from './RichText'

/**
 * A table's controls in an editor. Point at a cell: a handle on its row's left
 * edge and on its column's top edge, and a ➕ bar under the table and right of
 * it.
 */
const meta = {
  title: 'Writing/Blocks/EditorTableControls',
  // The block handle sits 28px left of the content, and the column ➕ 16px right of the table.
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const text = (t: string) => [{ type: 'paragraph', content: [{ type: 'text', text: t }] }]
const row = (type: 'tableHeader' | 'tableCell', ...cells: string[]) => ({ type: 'tableRow', content: cells.map((c) => ({ type, content: text(c) })) })

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Point at a cell for its row and column handles.' }] },
    {
      type: 'table',
      content: [row('tableHeader', 'Label', 'Label', 'Label'), row('tableCell', 'Item one', 'Value', 'Value'), row('tableCell', 'Item two', 'Value', 'Value')],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'The bar under the table adds a row; the one right of it, a column.' }] },
  ],
}

const NO_HEADER = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'The first row’s handle turns the header row back on.' }] },
    { type: 'table', content: [row('tableCell', 'Item one', 'Value', 'Value'), row('tableCell', 'Item two', 'Value', 'Value')] },
  ],
}

function Editing({ editable, content = DOCUMENT }: { editable: boolean; content?: object }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ dropcursor: blockDropCursor }), TableKit.configure({ table: { resizable: false } }), BlockId],
    content,
    editable,
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <EditorBlockHandle editor={editor} className="ml-8 max-w-[560px]">
      <EditorTableControls editor={editor}>
        <EditorContent editor={editor} />
      </EditorTableControls>
    </EditorBlockHandle>
  )
}

/** Point at a cell; press a handle for Insert and Delete, or a ➕ bar to add a row or a column at the end. The first row's handle also has Header row, ticked while it is on. */
export const Default: Story = {
  render: () => <Editing editable />,
}

/** A table with its header row off: the first row is an ordinary row, and its handle's Header row is not ticked. */
export const NoHeaderRow: Story = {
  render: () => <Editing editable content={NO_HEADER} />,
}

/** An editor that is not editable: no controls. */
export const NotEditable: Story = {
  render: () => <Editing editable={false} />,
}
