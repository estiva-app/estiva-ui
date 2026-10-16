import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { IconPaperclip } from '@tabler/icons-react'
import { useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AttachmentCard } from './AttachmentCard'
import { Kbd } from './Kbd'
import { ToolbarButton } from './Toolbar'
import { ComposeBox, ComposeKeys, COMPOSE_EDITOR_CLASSES } from './ComposeBox'
import { KeptSelection } from './SelectionToolbar'

/**
 * The box a message, a reply or a comment is written in. Type, select
 * words for the strip, Enter to send, Shift+Enter for a new line.
 */
const meta = {
  title: 'Primitives/ComposeBox',
  component: ComposeBox,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ComposeBox>

export default meta
type Story = StoryObj

function Writing({ tools, placeholder, file }: { tools?: boolean; placeholder: 'new' | 'reply'; file?: boolean }) {
  const [sent, setSent] = useState<string[]>([])
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), KeptSelection, ComposeKeys],
    editorProps: { attributes: { class: COMPOSE_EDITOR_CLASSES } },
  })
  return (
    <div className="flex flex-col gap-3">
      {sent.map((text, i) => (
        <p key={i} className="text-body-2 text-text-primary">
          {text}
        </p>
      ))}
      <ComposeBox
        editor={editor}
        onSend={(ed: Editor) => setSent((all) => [...all, ed.getText()])}
        selection={{ link: true }}
        ready={file}
        attachments={file ? <AttachmentCard pending name="brief.pdf" size={182_000} contentType="application/pdf" state="ready" onRemove={() => {}} /> : undefined}
        placeholder={
          placeholder === 'reply' ? (
            <span>Reply…</span>
          ) : (
            <>
              <span>Start a new conversation or type</span>
              <Kbd>/</Kbd>
              <span>for commands</span>
            </>
          )
        }
        tools={
          tools ? (
            <ToolbarButton tooltip="Attach files" aria-label="Attach files">
              <IconPaperclip size={16} stroke={1.5} />
            </ToolbarButton>
          ) : undefined
        }
      />
    </div>
  )
}

/** A new message, with a tool under the text. */
export const Default: Story = { render: () => <Writing placeholder="new" tools /> }

/** A reply: no tools, only Send. */
export const Reply: Story = { render: () => <Writing placeholder="reply" /> }

/** A file waiting to be sent: under the text, and Send is ready with no words. */
export const WithAFile: Story = { render: () => <Writing placeholder="new" tools file /> }
