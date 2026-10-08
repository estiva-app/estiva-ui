import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card } from './Card'
import { CodeBlockColours } from './CodeBlockColours'
import { richTextClassName } from './RichText'

/**
 * Type in the code block: each word takes its colour as you write, the same
 * colours RichText reads it in. Change the theme to see each set.
 */
const meta = {
  title: 'Primitives/CodeBlockColours',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

function Box() {
  const editor = useEditor({
    extensions: [StarterKit.configure({ codeBlock: false }), CodeBlockColours],
    content: [
      '<p>A code block in a language takes its colours:</p>',
      '<pre><code class="language-ts">// Count the items that are done\nexport function countDone(items: Item[]): number {\n  const done = items.filter((item) =&gt; item.state === \'done\')\n  return done.length + 0\n}</code></pre>',
    ].join(''),
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <Card fill="surface" className="w-full max-w-lg p-3">
      <EditorContent editor={editor} />
    </Card>
  )
}

/** An editor with a code block in TypeScript. Type in it. */
export const InAnEditor: Story = { render: () => <Box /> }
