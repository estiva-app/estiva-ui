import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BlockId, ReferenceNode, type ReferenceViewProps } from './BlockNodes'
import { Card } from './Card'
import { InlineChip } from './InlineChip'
import { LinkChips } from './LinkChips'
import { ReferenceCards } from './ReferenceCards'
import { richTextClassName } from './RichText'

/**
 * A URL the app recognises reads as a chip; one it does not stays text. Here
 * the app is a stand-in that recognises one address, after a short wait, and
 * the chip is a placeholder naming what it points at: the real one is the
 * app's, which knows how to resolve it.
 */
const meta = {
  title: 'Primitives/LinkChips',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const KNOWN = 'https://example.com/item/one'
const answered = new Map<string, string>()

function Placeholder({ uri }: ReferenceViewProps) {
  return <InlineChip>Item for {uri}</InlineChip>
}

function Box() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      BlockId,
      ReferenceNode.configure({ view: Placeholder }),
      ReferenceCards,
      LinkChips.configure({
        referenceOf: (url) => answered.get(url),
        ask: (urls) =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              if (urls.includes(KNOWN)) answered.set(KNOWN, 'nostr:naddr1one')
              resolve()
            }, 600),
          ),
      }),
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: `Recognised: ${KNOWN}` }] },
        { type: 'paragraph', attrs: { blockId: 'p2' }, content: [{ type: 'text', text: 'Not recognised: https://example.com/elsewhere' }] },
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

/** Two URLs: the first turns into its chip once the stand-in answers, the second stays text. */
export const InAnEditor: Story = { render: () => <Box /> }
