import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId } from './BlockNodes'
import { CommentHighlights, commentPlace, setCommentAnchors, type CommentAnchor } from './CommentHighlights'
import { richTextClassName } from './RichText'

/**
 * Comments drawn where they are. Click a highlight: it becomes the open one.
 * Type over highlighted words and the line under the text says where each
 * comment is now.
 */
const meta = {
  title: 'Writing/CommentHighlights',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, blockId: 'b1' }, content: [{ type: 'text', text: 'Heading' }] },
    { type: 'paragraph', attrs: { blockId: 'b2' }, content: [{ type: 'text', text: 'A highlight is drawn on the words a comment quotes, found again in its block.' }] },
    { type: 'paragraph', attrs: { blockId: 'b3' }, content: [{ type: 'text', text: 'A selection across blocks keeps the words where it starts and where it ends.' }] },
    { type: 'paragraph', attrs: { blockId: 'b4' }, content: [{ type: 'text', text: 'A comment on whole blocks keeps no words, and is drawn on every block of its run.' }] },
    { type: 'paragraph', attrs: { blockId: 'b5' }, content: [{ type: 'text', text: 'Words that changed are not drawn.' }] },
  ],
}

const ANCHORS: CommentAnchor[] = [
  { id: 'one', blocks: ['b2'], quote: { start: 'the words a comment quotes' } },
  { id: 'two', blocks: ['b2', 'b3'], quote: { start: 'found again in its block.', end: 'A selection across blocks' } },
  { id: 'three', blocks: ['b4'] },
  { id: 'four', blocks: ['b5'], quote: { start: 'Items that changed' } },
  { id: 'five', blocks: ['gone'], quote: { start: 'Label' } },
]

function Highlighted({ initial }: { initial: string | null }) {
  const [active, setActive] = useState<string | null>(initial)
  const [, setVersion] = useState(0)
  const editor = useEditor({
    extensions: [StarterKit, BlockId, CommentHighlights],
    content: DOCUMENT,
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
    onUpdate: () => setVersion((v) => v + 1),
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
  const states = editor ? ANCHORS.map((a) => `${a.id}: ${commentPlace(editor, a).state}`).join(' · ') : ''
  return (
    <div className="flex max-w-[560px] flex-col gap-3">
      <EditorContent editor={editor} />
      <p className="text-caption text-text-muted">{`Open: ${active ?? 'none'} · ${states}`}</p>
    </div>
  )
}

/** Words, a run across two blocks and a whole block, the open one underlined. Click another to open it. */
export const Default: Story = { render: () => <Highlighted initial="two" /> }

/** Nothing open: every comment in the same light fill. */
export const NoneOpen: Story = { render: () => <Highlighted initial={null} /> }
