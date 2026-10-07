import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconCircle, IconSquareRounded, IconTriangle } from '@tabler/icons-react'
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
  type ReferenceSection,
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

const DESCRIBED: CaptionedItem[] = ['four', 'five'].map((n) => ({
  id: `item-${n}`,
  label: 'Label',
  snippet: `Item ${n}`,
  uri: `nostr:item-${n}`,
  description: 'Label',
}))

const matching = (items: CaptionedItem[], query: string) => items.filter((item) => item.snippet.toLowerCase().includes(query.toLowerCase()))

const SECTIONS = (query: string): ReferenceSection[] => [
  { label: 'Group one', items: matching(ITEMS, query) },
  { label: 'Group two', items: matching(DESCRIBED, query) },
]

/* Three kinds of thing in one list, each row with its own icon, and the chip it inserts wearing the same. */
const KIND_ICONS = { circle: IconCircle, triangle: IconTriangle, square: IconSquareRounded } as const
type Kind = keyof typeof KIND_ICONS
const kindOf = (uri: string | null): Kind | undefined => (Object.keys(KIND_ICONS) as Kind[]).find((kind) => uri?.includes(kind))
const KINDS = (query: string): ReferenceSection[] => [
  {
    label: 'Items',
    items: matching(
      (['circle', 'triangle', 'square'] as const).map((kind, i) => {
        const Icon = KIND_ICONS[kind]
        return {
          id: `kind-${kind}`,
          label: `Item ${['one', 'two', 'three'][i]}`,
          snippet: '',
          uri: `nostr:${kind}`,
          icon: <Icon size={16} stroke={1.5} className="text-text-secondary" />,
        }
      }),
      query,
    ),
  },
]
const kindIcon = (uri: string | null) => {
  const kind = kindOf(uri)
  if (!kind) return undefined
  const Icon = KIND_ICONS[kind]
  return <Icon size={14} stroke={1.5} />
}

const INSERT: SlashSection = {
  label: 'Insert',
  commands: [
    { key: 'insert-@', row: { label: 'Mention', shortcut: '@' }, keywords: ['@'], run: typeTrigger('@') },
    { key: 'insert-[', row: { label: 'Reference', shortcut: '[' }, keywords: ['['], run: typeTrigger('[') },
  ],
}

function Composer({ code, sections, kinds = false }: { code: 'inline' | 'block'; sections?: typeof SECTIONS; kinds?: boolean }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      PersonMention.configure({ people: () => PEOPLE }),
      UrgentPersonMention.configure({ people: () => PEOPLE }),
      CaptionedReference.configure({ icon: <IconSquareRounded size={14} stroke={1.5} />, iconFor: kinds ? kindIcon : undefined }),
      ReferenceTrigger.configure({
        items: () => ITEMS,
        sections,
        ariaLabel: 'Items',
        sectionLabel: 'Items',
        icon: <IconSquareRounded size={16} stroke={1.5} className="text-text-secondary" />,
      }),
      SlashCommands.configure({ sections: [formatSection(code), INSERT] }),
    ],
    content: kinds
      ? '<p>Picked from [: <span data-captioned-reference="true" data-id="kind-circle" data-label="Item one" data-snippet="" data-uri="nostr:circle"></span> and <span data-captioned-reference="true" data-id="kind-triangle" data-label="Item two" data-snippet="" data-uri="nostr:triangle"></span>. Type [ for more: </p>'
      : '<p>Type @, !@, [ or / after a space: </p>',
    editorProps: { attributes: { class: richTextClassName('default', 'min-h-[80px] w-[480px] rounded-md border border-border-default p-3 outline-none') } },
  })
  return <EditorContent editor={editor} />
}

/** Code as a mark inside the line. */
export const Default: Story = { render: () => <Composer code="inline" /> }

/** Code as a block of its own, for an editor of a block document. */
export const CodeAsABlock: Story = { render: () => <Composer code="block" /> }

/** `[` with the app's own groups, each headed, a row with a second line. */
export const ReferencesInSections: Story = { render: () => <Composer code="inline" sections={SECTIONS} /> }

/**
 * `[` offering several kinds of thing: each row brings its own icon
 * (`CaptionedItem.icon`), and the chip it inserts wears the same one, from its
 * `uri` (`iconFor`). A row with no icon, or a chip `iconFor` cannot name, keeps
 * the list's and the chip's one icon.
 */
export const ReferencesOfSeveralKinds: Story = { render: () => <Composer code="inline" sections={KINDS} kinds /> }
