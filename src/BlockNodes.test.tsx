// @vitest-environment jsdom
/**
 * The block nodes (MAN-9, moved from Ship's `editorSchema.tsx`): what the
 * editor must hand back unchanged for a save to keep every anchored comment.
 *
 * The JSON loaded here is what `@estiva-app/protocol`'s `toEditorDocument`
 * produces, and what `getJSON()` returns is what its `fromEditorDocument`
 * reads — so each test is a load, an edit or none, and a read back.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AttachmentNode, BlockId, ReferenceNode, UnknownBlock, type ReferenceViewProps } from './BlockNodes'

const EXTENSIONS = [StarterKit, BlockId, UnknownBlock, ReferenceNode, AttachmentNode]

const SOURCE = { type: 'widget', id: 'w1', content: [{ type: 'text', text: 'kept' }] }
const FILE = { url: '/media/f.png', m: 'image/png', x: 'f'.repeat(64), size: 4096 }

const DOCUMENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, blockId: 'h1' }, content: [{ type: 'text', text: 'Title' }] },
    {
      type: 'paragraph',
      attrs: { blockId: 'p1' },
      content: [
        { type: 'text', text: 'see ' },
        { type: 'reference', attrs: { uri: 'nostr:naddr1example', marks: ['bold'] } },
      ],
    },
    { type: 'unknownBlock', attrs: { blockId: 'w1', source: SOURCE, text: 'kept' } },
    { type: 'attachment', attrs: { blockId: 'a1', ...FILE, filename: 'shot.png' } },
    { type: 'bulletList', attrs: { blockId: 'l1' }, content: [{ type: 'listItem', attrs: { blockId: 'i1' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] }] },
  ],
}

type Json = { type: string; attrs?: Record<string, unknown>; content?: Json[] }

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
  cleanup()
})

describe('what the editor hands back', () => {
  it('keeps every block id through a load and a read', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const back = editor.getJSON() as Json
    expect(back.content?.map((n) => n.attrs?.blockId)).toEqual(['h1', 'p1', 'w1', 'a1', 'l1'])
    expect(back.content?.[4].content?.[0].attrs?.blockId).toBe('i1')
  })

  it('keeps a block id when its text is typed into', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    // The end of the heading's text: 1 opens the heading, 5 characters of "Title".
    editor.chain().setTextSelection(6).insertContent(', edited').run()
    const heading = (editor.getJSON() as Json).content?.[0]
    expect(heading?.attrs?.blockId).toBe('h1')
    expect(JSON.stringify(heading)).toContain('Title, edited')
  })

  it('carries an unknown block whole, source and all', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const kept = (editor.getJSON() as Json).content?.[2]
    expect(kept?.type).toBe('unknownBlock')
    expect(kept?.attrs?.source).toEqual(SOURCE)
  })

  it('keeps a reference an atom, with its uri and the marks it carries', () => {
    editor = new Editor({ extensions: EXTENSIONS, content: DOCUMENT })
    const reference = (editor.getJSON() as Json).content?.[1].content?.[1]
    expect(reference).toEqual({ type: 'reference', attrs: { uri: 'nostr:naddr1example', marks: ['bold'] } })
  })

  it('keeps every imeta field on a file, which ProseMirror drops when undeclared', () => {
    const rich = { ...FILE, dim: '800x600', thumb: '/media/f.thumb.jpg', alt: 'a picture', filename: 'shot.png' }
    editor = new Editor({ extensions: EXTENSIONS, content: { type: 'doc', content: [{ type: 'attachment', attrs: { blockId: 'a1', ...rich } }] } })
    expect((editor.getJSON() as Json).content?.[0].attrs).toEqual({ blockId: 'a1', ...rich })
  })
})

describe('what it draws', () => {
  function WithAnEditor({ view }: { view: ((props: ReferenceViewProps) => React.ReactNode) | null }) {
    const e = useEditor({
      extensions: [StarterKit, BlockId, UnknownBlock, ReferenceNode.configure({ view }), AttachmentNode],
      content: DOCUMENT,
    })
    return <EditorContent editor={e} />
  }

  it('draws a reference with the view it is given', async () => {
    render(<WithAnEditor view={({ uri }) => <span data-testid="chip">{uri}</span>} />)
    expect((await screen.findByTestId('chip')).textContent).toBe('nostr:naddr1example')
  })

  it('draws a reference as its uri without a view', async () => {
    const { container } = render(<WithAnEditor view={null} />)
    await screen.findByText('Title')
    expect(container.querySelector('[data-reference]')?.textContent).toBe('nostr:naddr1example')
  })

  it('draws an unknown block as its text, addressed by its id', async () => {
    const { container } = render(<WithAnEditor view={null} />)
    expect((await screen.findByText('kept')).closest('[data-block-id]')?.getAttribute('data-block-id')).toBe('w1')
    expect(container.querySelector('[data-block-type="widget"]')).not.toBeNull()
  })

  it('puts data-block-id on each block, as RichText does', async () => {
    const { container } = render(<WithAnEditor view={null} />)
    await screen.findByText('Title')
    expect(container.querySelector('h1')?.getAttribute('data-block-id')).toBe('h1')
  })
})
