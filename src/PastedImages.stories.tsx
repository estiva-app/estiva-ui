import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AttachmentCard } from './AttachmentCard'
import { Card } from './Card'
import { PastedImages } from './PastedImages'
import { richTextClassName } from './RichText'

/**
 * Paste a screenshot into the box: it arrives as a named file under the text,
 * the way the app's file picker would hand it. Copy some text and paste it:
 * the text wins.
 */
const meta = {
  title: 'Primitives/PastedImages',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

function Box() {
  const [files, setFiles] = useState<File[]>([])
  const editor = useEditor({
    extensions: [
      StarterKit,
      PastedImages.configure({
        onImages: (pasted) => {
          setFiles((held) => [...held, ...pasted])
          return true
        },
      }),
    ],
    content: '<p>Paste a screenshot here.</p>',
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <Card fill="surface" className="flex w-[520px] flex-col gap-2 p-3">
      <EditorContent editor={editor} />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <AttachmentCard key={`${file.name}-${i}`} name={file.name} size={file.size} contentType={file.type} />
          ))}
        </div>
      )}
    </Card>
  )
}

/** A box that attaches what is pasted. Try it with a screenshot on the clipboard. */
export const InAnEditor: Story = { render: () => <Box /> }
