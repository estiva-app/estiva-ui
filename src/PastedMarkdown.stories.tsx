import type { Meta, StoryObj } from '@storybook/react-vite'
import type { JSONContent } from '@tiptap/core'
import { TableKit } from '@tiptap/extension-table'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from './Button'
import { Card } from './Card'
import { PastedMarkdown } from './PastedMarkdown'
import { richTextClassName } from './RichText'

/**
 * "Copy as plain text" puts the lines below the box on the clipboard as plain
 * text; paste them in and they land as a table. Paste them with
 * Ctrl/Cmd+Shift+V: they stay text.
 */
const meta = {
  title: 'Writing/Pasting/PastedMarkdown',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const SAMPLE = '| Item | Value |\n| --- | --- |\n| One | 1 |\n| Two | 2 |'

/*
  A stand-in for the app's reader, which is the protocol's and reads every
  block text spells. This one reads a table and nothing else, enough to show
  the paste.
*/
function readTable(text: string): JSONContent | undefined {
  const lines = text.trim().split('\n')
  if (lines.length < 2 || !/^\|( *:?-+:? *\|)+$/.test(lines[1].trim())) return undefined
  const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
  const cell = (type: string, text: string): JSONContent => ({ type, content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] })
  const rows = [lines[0], ...lines.slice(2)].map((line, r) => ({ type: 'tableRow', content: cells(line).map((text) => cell(r === 0 ? 'tableHeader' : 'tableCell', text)) }))
  return { type: 'doc', content: [{ type: 'table', content: rows }] }
}

function Box() {
  const editor = useEditor({
    extensions: [StarterKit, TableKit, PastedMarkdown.configure({ read: readTable })],
    content: '<p>Paste here.</p>',
    editorProps: { attributes: { class: richTextClassName('default', 'outline-none'), 'aria-label': 'Text' } },
  })
  return (
    <div className="flex w-[520px] flex-col gap-3">
      <Card fill="surface" className="p-3">
        <EditorContent editor={editor} />
      </Card>
      <pre className="text-caption text-text-secondary">{SAMPLE}</pre>
      <div className="flex items-center gap-2">
        <Button variant="outlined" size="small" onClick={() => void navigator.clipboard.writeText(SAMPLE)}>
          Copy as plain text
        </Button>
        <span className="text-caption text-text-secondary">then paste in the box. Selecting the lines above copies them with HTML, which pastes as before.</span>
      </div>
    </div>
  )
}

export const InAnEditor: Story = { render: () => <Box /> }
