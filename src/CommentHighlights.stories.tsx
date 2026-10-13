import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId } from './BlockNodes'
import { CommentHighlights, commentRange, setCommentAnchors, type CommentAnchor } from './CommentHighlights'
import { richTextClassName } from './RichText'

/**
 * Comments drawn on the words they are about. Click a highlight: it becomes
 * the open one. The last comment's words are gone from the text, so it draws
 * nothing and is listed as detached.
 */
const meta = {
  title: 'Primitives/CommentHighlights',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, blockId: 'b1' }, content: [{ type: 'text', text: 'Goals' }] },
    { type: 'paragraph', attrs: { blockId: 'b2' }, content: [{ type: 'text', text: 'We start with the teams who asked first, and grow from what they tell us.' }] },
    { type: 'paragraph', attrs: { blockId: 'b3' }, content: [{ type: 'text', text: 'The first week feels calm, not busy.' }] },
  ],
}

const ANCHORS: CommentAnchor[] = [
  { id: 'one', block: 'b2', quote: 'the teams who asked first' },
  { id: 'two', block: 'b3', quote: 'calm, not busy' },
  { id: 'three', block: 'b1', quote: 'Aims' },
]

function Highlighted({ initial }: { initial: string | null }) {
  const [active, setActive] = useState<string | null>(initial)
  const editor = useEditor({
    extensions: [StarterKit, BlockId, CommentHighlights],
    content: DOCUMENT,
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  useEffect(() => {
    if (!editor) return
    setCommentAnchors(editor, ANCHORS, active)
    const select = ({ id }: { id: string }) => setActive(id)
    editor.on('commentSelect', select)
    return () => {
      editor.off('commentSelect', select)
    }
  }, [editor, active])
  const detached = editor ? ANCHORS.filter((a) => commentRange(editor, a) === null).map((a) => a.id) : []
  return (
    <div className="flex max-w-[560px] flex-col gap-3">
      <EditorContent editor={editor} />
      <p className="text-caption text-text-muted">{`Open: ${active ?? 'none'} · detached: ${detached.join(', ') || 'none'}`}</p>
    </div>
  )
}

/** Every comment's words, the open one underlined. Click another to open it. */
export const Default: Story = { render: () => <Highlighted initial="one" /> }

/** Nothing open: every commented run in the same light fill. */
export const NoneOpen: Story = { render: () => <Highlighted initial={null} /> }
