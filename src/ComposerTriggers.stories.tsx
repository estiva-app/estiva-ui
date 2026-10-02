import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { richTextClassName } from './RichText'
import {
  CaptionedReference,
  PersonMention,
  ReferenceTrigger,
  SlashCommands,
  UrgentPersonMention,
  formatSection,
  typeTrigger,
  type CaptionedItem,
  type MentionPerson,
  type SlashSection,
} from './ComposerTriggers'

/**
 * The four composer triggers: `@` and `!@` offer a person, `[` offers
 * something to reference, and `/` formats the line or inserts something.
 * Type one of them in the box.
 */
const meta = {
  title: 'Primitives/ComposerTriggers',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const PEOPLE: MentionPerson[] = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'].map((n, i) => ({
  id: `person-${n}`,
  name: `Person ${n}`,
  description: i % 2 === 0 ? 'Label' : undefined,
  pubkey: null,
}))

const ITEMS: CaptionedItem[] = ['one', 'two', 'three'].map((n) => ({
  id: `item-${n}`,
  label: 'Person one',
  snippet: `Item ${n}`,
  uri: `nostr:item-${n}`,
}))

const INSERT: SlashSection = {
  label: 'Insert',
  commands: [
    { key: 'insert-@', row: { label: 'Mention', shortcut: '@' }, keywords: ['@'], run: typeTrigger('@') },
    { key: 'insert-[', row: { label: 'Reference', shortcut: '[' }, keywords: ['['], run: typeTrigger('[') },
  ],
}

function Composer({ code }: { code: 'inline' | 'block' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      PersonMention.configure({ people: () => PEOPLE }),
      UrgentPersonMention.configure({ people: () => PEOPLE }),
      CaptionedReference.configure({ icon: <IconSquareRounded size={14} stroke={1.5} /> }),
      ReferenceTrigger.configure({
        items: () => ITEMS,
        ariaLabel: 'Items',
        sectionLabel: 'Items',
        icon: <IconSquareRounded size={16} stroke={1.5} className="text-text-secondary" />,
      }),
      SlashCommands.configure({ sections: [formatSection(code), INSERT] }),
    ],
    content: '<p>Type @, !@, [ or / after a space: </p>',
    editorProps: { attributes: { class: richTextClassName('default', 'min-h-[80px] w-[480px] rounded-md border border-border-default p-3 outline-none') } },
  })
  return <EditorContent editor={editor} />
}

/** Code as a mark inside the line. */
export const Default: Story = { render: () => <Composer code="inline" /> }

/** Code as a block of its own, for an editor of a block document. */
export const CodeAsABlock: Story = { render: () => <Composer code="block" /> }
