import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { richTextClassName } from './RichText'
import { KeptSelection, SelectionToolbar, type MarkId } from './SelectionToolbar'

/**
 * Bold, italic, underline — and code or link where the editor has them — over
 * text you have already selected. It follows the selection by itself.
 */
const meta = {
  title: 'Primitives/SelectionToolbar',
  component: SelectionToolbar,
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

/**
 * A real editor with a few words selected as it opens, so the strip is on
 * screen without a drag — it appears the way it always does, once the
 * selection has stood still. Select other words to move it.
 */
function WithAnEditor({ marks, link, html, select }: { marks?: readonly MarkId[]; link?: boolean; html: string; select: [number, number] }) {
  const editor = useEditor({
    extensions: [StarterKit, KeptSelection],
    content: html,
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
    onCreate: ({ editor: e }) => {
      e.commands.focus()
      e.commands.setTextSelection({ from: select[0], to: select[1] })
    },
  })
  return (
    <div className="pt-16">
      <EditorContent editor={editor} className="max-w-[560px]" />
      <SelectionToolbar editor={editor} marks={marks} link={link} />
    </div>
  )
}

const TEXT = '<p>Select a few words in this line, and the strip appears over them.</p>'

/** The default strip: bold, italic, underline. */
export const Default: Story = {
  render: () => <WithAnEditor html={TEXT} select={[10, 19]} />,
}

/** `marks` chooses the buttons: here code as well. */
export const WithCode: Story = {
  render: () => <WithAnEditor html={TEXT} select={[10, 19]} marks={['bold', 'italic', 'underline', 'code']} />,
}

/** `link` adds the Link button, which opens one field for the address. */
export const WithALink: Story = {
  render: () => <WithAnEditor html={TEXT} select={[10, 19]} link />,
}

/** Words that are already a link open straight on the field, their address in it. */
export const OnALink: Story = {
  render: () => <WithAnEditor html={'<p>Select <a href="https://example.com">these words</a> to change where they go.</p>'} select={[8, 19]} link />,
}
