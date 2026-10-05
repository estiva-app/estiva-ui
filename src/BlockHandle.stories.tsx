import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconLink, IconMessage } from '@tabler/icons-react'
import { BlockHandle, type HandleBlock } from './BlockHandle'
import { MenuItem } from './Menu'
import { RichText, type RichTextBlock } from './RichText'

/**
 * The handle left of the block under the pointer, over a document being read:
 * press it for the app's rows. In an editor, `EditorBlockHandle` adds the drag
 * and the editing rows.
 */
const meta = {
  title: 'Primitives/BlockHandle',
  // The handle sits 28px left of the content, in the page's margin.
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

/** The rows an app adds: here they only say which block they were pressed on. */
function rows(block: HandleBlock) {
  return (
    <>
      <MenuItem label="Copy link" leading={<IconLink size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => console.info('copy link', block.id)} />
      <MenuItem label="Comment" leading={<IconMessage size={16} stroke={1.5} className="text-text-secondary" />} onClick={() => console.info('comment', block.id)} />
    </>
  )
}

const READING: RichTextBlock[] = [
  { type: 'heading', level: 1, id: 'b1', inline: [{ text: 'A heading', marks: [] }] },
  { type: 'paragraph', id: 'b2', inline: [{ text: 'Someone who cannot edit this still gets the handle, with the app’s rows only.', marks: [] }] },
  { type: 'paragraph', id: 'b3', inline: [{ text: 'The second paragraph.', marks: [] }] },
]

/** Reading: no drag and no editing rows — only what the app adds. */
export const Default: Story = {
  render: () => (
    <BlockHandle actions={rows} className="ml-8 max-w-[560px]">
      <RichText blocks={READING} />
    </BlockHandle>
  ),
}
