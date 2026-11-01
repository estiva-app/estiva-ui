import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { documentForEditing, encodeNpub, publishableFromEditor, toEditorDocument, type ContentFormat, type EditorDocument } from '@estiva-app/protocol'
import { Button } from './Button'
import type { MentionPerson, ReferenceSection } from './ComposerTriggers'
import type { DocumentCodec } from './DocumentEditor'
import { DocumentField, type DocumentFieldProps } from './DocumentField'
import { Field } from './Field'
import { Form } from './Form'
import { Textarea } from './Textarea'
import { TextInput } from './TextInput'

/**
 * A form's field that holds a document. Every story is live: type, open `/`, `[` or `@`, pick words for the strip.
 * The line under it is what the form holds now: every edit goes there as it is typed. Pick the theme in the toolbar.
 */
const meta = {
  title: 'Writing/DocumentField',
  component: DocumentField,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DocumentField>

export default meta
type Story = StoryObj

// ─── The app's side, played by @estiva-app/protocol ───

const codec: DocumentCodec = {
  read: (value, format) => toEditorDocument(documentForEditing(value, format as ContentFormat), { links: true }) as JSONContent,
  write: (doc) => publishableFromEditor(doc as EditorDocument),
}
const PEOPLE: MentionPerson[] = ['one', 'two'].map((n, i) => ({ id: n, name: `Person ${n}`, pubkey: String.fromCharCode(98 + i).repeat(64) }))
const mentions = { people: () => PEOPLE, uriOf: (person: MentionPerson) => (person.pubkey ? `nostr:${encodeNpub(person.pubkey)}` : null) }
const SECTIONS: ReferenceSection[] = [{ label: 'Group one', items: [{ id: 'item-one', label: 'Item one', snippet: '', uri: 'nostr:naddr1itemone' }] }]
const references = { sections: () => SECTIONS, ariaLabel: 'Items', sectionLabel: 'Items' }

/** Written before: a line with bold words, then a list. */
const WRITTEN = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'paragraph', id: 'b1', content: [{ type: 'text', text: 'A line with ' }, { type: 'text', text: 'bold words', marks: [{ type: 'bold' }] }, { type: 'text', text: ', then a list.' }] },
    { type: 'bulletList', id: 'b2', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item one' }] }] }, { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item two' }] }] }] },
  ],
})

/** The field as a form holds it: the value and its format, each edit back as it is typed. */
function Held({ start = '', ...props }: Partial<DocumentFieldProps> & { start?: string }) {
  const [held, setHeld] = useState({ value: start, format: 'blocks' })
  return (
    <div className="flex w-[420px] flex-col gap-3">
      <Field label="Label">
        <DocumentField
          value={held.value}
          format={held.format}
          codec={codec}
          label="Label"
          onChange={(value, contentFormat) => setHeld({ value, format: contentFormat ? 'blocks' : 'marker' })}
          {...props}
        />
      </Field>
      <p className="text-caption text-text-muted">{held.value ? `Held: ${held.value.length} characters of a document.` : 'Held: nothing.'}</p>
    </div>
  )
}

/** Empty, with its placeholder. */
export const Empty: Story = { render: () => <Held placeholder="Write something…" /> }

/** Written before: what it holds loads as the document it is. */
export const Written: Story = { render: () => <Held start={WRITTEN} placeholder="Write something…" /> }

/** `[` lists what the app offers, `@` its people. */
export const WithReferencesAndMentions: Story = { render: () => <Held placeholder="Type [ or @" references={references} mentions={mentions} /> }

/** In a form, beside its other fields: the same box as a Textarea's. Ctrl+Enter sends the form from it. */
export const InAForm: Story = {
  render: () => {
    const [sent, setSent] = useState(0)
    const [title, setTitle] = useState('')
    const [notes, setNotes] = useState('')
    const [body, setBody] = useState({ value: '', format: 'blocks' })
    return (
      <Form onSubmit={() => setSent((n) => n + 1)} className="w-[420px]">
        <Field label="Label">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="One line" />
        </Field>
        <Field label="Label two">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Plain text" rows={3} />
        </Field>
        <Field label="Label three">
          <DocumentField
            value={body.value}
            format={body.format}
            codec={codec}
            label="Label three"
            placeholder="A document"
            onChange={(value, contentFormat) => setBody({ value, format: contentFormat ? 'blocks' : 'marker' })}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">
            Send
          </Button>
          <span className="text-caption text-text-muted">{sent ? `Sent ${sent} times.` : 'Not sent yet.'}</span>
        </div>
      </Form>
    )
  },
}
