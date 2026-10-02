import type { ReactNode } from 'react'
import { Extension, type Editor } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Mention, { type MentionOptions } from '@tiptap/extension-mention'
import Suggestion from '@tiptap/suggestion'
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'
import { Avatar } from './Avatar'
import { EnterHint } from './Menu'
import { inlineChipClassName } from './InlineChip'
import type { SuggestionMenuRow } from './SuggestionMenu'
import { suggestionPopup, type SuggestionPopupOptions } from './suggestionPopup'

/*
 * The four composer triggers every Estiva app shares — `@`, `!@`, `[` and `/`
 * (CON-26, Miky 2026-10-02). Peek built them first and they move here unchanged
 * (CON-27); an app passes in only its own data: its people, the things `[` can
 * reference, and the `/` rows it can perform beside the shared Format section.
 *
 * **What a pick writes is not here.** The text a chip becomes in the body and
 * the tags it earns are `@estiva-app/conversation`'s (`mentionText`,
 * `messageReference`, `urgentTagsFor`), so a client without React writes the
 * same bytes. A chip here carries what that needs: a person's `pubkey`, a
 * reference's `uri`.
 */

// ─── @ and !@ ───

/** A person `@` and `!@` offer. */
export interface MentionPerson {
  /** The app's own key for the person — the row's key and the chip's `id`. */
  id: string
  name: string
  /** The second line of the row: a role, a team. */
  description?: string
  /** Their Nostr key, when they have one — what the body is written with (SPEC §13.1). */
  pubkey?: string | null
  /** The face at the row's start. Default: the package `Avatar` for the name. */
  avatar?: ReactNode
}

/** How many people the list shows. */
export const PEOPLE_LIMIT = 6

/** The people whose name holds the query, the first {@link PEOPLE_LIMIT} of them. */
export function filterPeople(people: readonly MentionPerson[], query: string): MentionPerson[] {
  const q = query.toLowerCase()
  return people.filter((person) => q === '' || person.name.toLowerCase().includes(q)).slice(0, PEOPLE_LIMIT)
}

/**
 * The people list `@` and `!@` open: the face, the name, the second line, and
 * the Enter hint while highlighted — `MenuItem` at its tall size.
 */
export function peopleMenu(urgent: boolean): SuggestionPopupOptions<MentionPerson> {
  const section = urgent ? 'Urgent mention' : 'People'
  return {
    ariaLabel: section,
    // The people and the reference lists are the same box: 658px, capped at 360.
    width: 'w-[658px]',
    maxHeight: 'max-h-[360px]',
    sections: (people) => [{ label: section, items: people, className: 'px-3 py-1' }],
    itemKey: (person) => person.id,
    row: (person) => ({
      label: person.name,
      description: person.description,
      leading: person.avatar ?? <Avatar size={32} alt={person.name} />,
      hint: <EnterHint />,
      size: 'tall',
    }),
  }
}

export interface PersonMentionOptions {
  /** Everyone the list can offer, asked each time the query changes. */
  people: () => readonly MentionPerson[]
}

type Doc = { descendants: (cb: (node: { type: { name: string }; attrs: Record<string, unknown> }) => boolean | void) => void }

function optionsOf<T>(editor: Editor, name: string): T | undefined {
  return editor.extensionManager.extensions.find((one) => one.name === name)?.options as T | undefined
}

/** `@`'s list and pick, or `!@`'s: the node it inserts is `urgentMention` or `mention`. */
function personSuggestion(urgent: boolean) {
  const name = urgent ? 'urgentMention' : 'mention'
  return {
    ...(urgent ? { char: '!@' } : {}),
    items: ({ query, editor }: { query: string; editor: Editor }) => filterPeople(optionsOf<PersonMentionOptions>(editor, name)?.people() ?? [], query),
    render: suggestionPopup(peopleMenu(urgent)),
    command: ({ editor, range, props: person }: { editor: Editor; range: { from: number; to: number }; props: MentionPerson }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: name, attrs: { id: person.id, label: person.name, pubkey: person.pubkey ?? null } },
          { type: 'text', text: ' ' },
        ])
        .run()
    },
  }
}

const personAttributes = () => ({
  id: { default: null },
  label: { default: null },
  /**
   * The person's Nostr key, when they have one — SPEC §13.1. `id` is the app's
   * own and means nothing to another app; this is what the body is written
   * with, so a mention survives a rename.
   */
  pubkey: { default: null },
})

/**
 * `@` — a person, as a chip that writes their key (SPEC §13.1).
 *
 *     PersonMention.configure({ people: () => directory })
 *
 * Its `pubkey` and `label` are what `mentionText` takes.
 */
export const PersonMention = Mention.extend<MentionOptions<MentionPerson, MentionPerson> & PersonMentionOptions>({
  name: 'mention',
  addOptions() {
    return { ...this.parent!(), HTMLAttributes: {}, people: () => [], suggestion: personSuggestion(false) }
  },
  addAttributes: personAttributes,
  renderHTML({ node }) {
    // No node view, so this spec is what the editor draws: the one chip.
    return ['span', { 'data-mention': 'true', 'data-id': node.attrs.id, class: inlineChipClassName('person', 'cursor-default') }, `@${node.attrs.label}`]
  },
  parseHTML() {
    return [{ tag: 'span[data-mention]' }]
  },
})

/**
 * `!@` — a person, urgently: the same chip in the urgent tone. Its text is an
 * ordinary mention; the urgency travels as a tag (`urgentTagsFor`), so hand the
 * write {@link urgentPubkeys}.
 */
export const UrgentPersonMention = Mention.extend<MentionOptions<MentionPerson, MentionPerson> & PersonMentionOptions>({
  name: 'urgentMention',
  addOptions() {
    return { ...this.parent!(), HTMLAttributes: {}, people: () => [], suggestion: personSuggestion(true) }
  },
  addAttributes: personAttributes,
  renderHTML({ node }) {
    return [
      'span',
      { 'data-urgent-mention': 'true', 'data-id': node.attrs.id, class: inlineChipClassName('urgent', 'cursor-default') },
      `@${node.attrs.label}`,
    ]
  },
  parseHTML() {
    return [{ tag: 'span[data-urgent-mention]' }]
  },
})

/**
 * The keys the document's urgent mentions name — what the write turns into
 * `["urgent", <pubkey>]` tags. A chip with no key has no tag to carry; its text
 * is the old `!@Name`.
 */
export function urgentPubkeys(editor: { state: { doc: Doc } }): string[] | undefined {
  const urgent: string[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'urgentMention' && typeof node.attrs.pubkey === 'string' && node.attrs.pubkey) urgent.push(node.attrs.pubkey)
  })
  return urgent.length > 0 ? urgent : undefined
}

// ─── [ ───

/** Something `[` offers: a reference drawn as who said it and how it opens. */
export interface CaptionedItem {
  /** The referenced thing's id — the row's key and the chip's `id`. */
  id: string
  /** Who, as the list shows them. */
  label: string
  /** The opening words, marks stripped: the caption the row and the chip wear. */
  snippet: string
  /** `nostr:…`, exactly as the body will carry it (`messageReference`). */
  uri: string
  /** What the query is matched against beside `label`. Default: `snippet`. */
  search?: string
}

/** How many references the list shows. */
export const REFERENCE_LIMIT = 6

/**
 * The references whose label or text holds the query — the last
 * {@link REFERENCE_LIMIT}, in the order given: a thread is unbounded, and a
 * list that grew with it would be a hundred rows of prose.
 */
export function filterReferences(items: readonly CaptionedItem[], query: string): CaptionedItem[] {
  const q = query.toLowerCase()
  const shown = q ? items.filter((item) => (item.search ?? item.snippet).toLowerCase().includes(q) || item.label.toLowerCase().includes(q)) : [...items]
  return shown.slice(-REFERENCE_LIMIT)
}

const captionOf = (label: string, snippet: string) => (snippet ? `${label}: ${snippet}` : label)

export interface CaptionedReferenceOptions {
  /** Drawn before the caption: a 14px icon. */
  icon: ReactNode
}

/**
 * A reference mid-sentence, drawn as `label: snippet` and written as its `uri`
 * verbatim (SPEC §13.1). The caption is the snapshot it was picked with — a
 * caption, never parsed. Inserted by {@link ReferenceTrigger}, a paste or a
 * draft; it opens no list of its own.
 */
export const CaptionedReference = Mention.extend<MentionOptions & CaptionedReferenceOptions>({
  name: 'captionedReference',
  group: 'inline',
  inline: true,
  atom: true,
  addOptions() {
    return { ...this.parent!(), HTMLAttributes: {}, icon: null, suggestion: { char: '\0', items: () => [] } }
  },
  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
      snippet: { default: '' },
      uri: { default: null },
    }
  },
  renderHTML({ node }) {
    return [
      'span',
      { [`data-${this.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`]: 'true', 'data-id': node.attrs.id, class: inlineChipClassName('neutral', 'cursor-default') },
      captionOf(node.attrs.label, node.attrs.snippet),
    ]
  },
  parseHTML() {
    return [{ tag: `span[data-${this.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]` }]
  },
  addNodeView() {
    const icon = this.options.icon
    return ReactNodeViewRenderer(
      ({ node }: ReactNodeViewProps) => (
        <NodeViewWrapper as="span" className={inlineChipClassName('neutral', 'max-w-[24ch] cursor-default')}>
          <span className="flex size-4 shrink-0 items-center justify-center text-text-secondary">{icon}</span>
          <span className="truncate">{captionOf(node.attrs.label, node.attrs.snippet)}</span>
        </NodeViewWrapper>
      ),
      { as: 'span' },
    )
  },
})

export interface ReferenceMenuOptions {
  /** Names the list, e.g. what can be referenced. */
  ariaLabel: string
  /** The section's heading. */
  sectionLabel: string
  /** At each row's start: a 16px icon. */
  icon: ReactNode
}

/** The list `[` opens: one section of `label: snippet` rows, the same box as the people list. */
export function referenceMenu({ ariaLabel, sectionLabel, icon }: ReferenceMenuOptions): SuggestionPopupOptions<CaptionedItem> {
  return {
    ariaLabel,
    width: 'w-[658px]',
    maxHeight: 'max-h-[360px]',
    sections: (items) => [{ label: sectionLabel, items, className: 'px-2' }],
    itemKey: (item) => `reference-${item.id}`,
    row: (item) => ({ leading: icon, label: captionOf(item.label, item.snippet), hint: <EnterHint /> }),
  }
}

export interface ReferenceTriggerOptions extends ReferenceMenuOptions {
  /** Everything `[` can offer, asked each time the query changes. */
  items: () => readonly CaptionedItem[]
  /** The node a pick inserts. Default `captionedReference`. */
  nodeName: string
}

/**
 * `[` — reference something, inserted as a {@link CaptionedReference} chip.
 *
 * Its own extension rather than the chip's suggestion, so the chip's text (its
 * `renderText`) does not change with the key that summons the list.
 */
export const ReferenceTrigger = Extension.create<ReferenceTriggerOptions>({
  name: 'referenceTrigger',
  addOptions() {
    return { items: () => [], nodeName: 'captionedReference', ariaLabel: 'References', sectionLabel: 'References', icon: null }
  },
  addProseMirrorPlugins() {
    const options = this.options
    return [
      Suggestion<CaptionedItem>({
        editor: this.editor,
        char: '[',
        pluginKey: new PluginKey('referenceTrigger'),
        // As a mention's: only where the chip may go.
        allow: ({ state, range }) => {
          const type = state.schema.nodes[options.nodeName]
          return !!type && !!state.doc.resolve(range.from).parent.type.contentMatch.matchType(type)
        },
        items: ({ query }) => filterReferences(options.items(), query),
        render: suggestionPopup(referenceMenu(options)),
        command: ({ editor, range, props: item }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              { type: options.nodeName, attrs: { id: item.id, label: item.label, snippet: item.snippet, uri: item.uri } },
              { type: 'text', text: ' ' },
            ])
            .run()
        },
      }),
    ]
  },
})

// ─── / ───

/** A row of the `/` list, and what choosing it does. */
export interface SlashCommand {
  key: string
  row: SuggestionMenuRow
  /** Matched beside the row's label: an id, a trigger, a description. */
  keywords?: readonly string[]
  /** Runs once the `/query` that summoned the list has been removed. */
  run: (editor: Editor) => void
}

export interface SlashSection {
  label: string
  commands: readonly SlashCommand[]
}

export type FormatId = 'paragraph' | 'heading' | 'subheading' | 'quote' | 'bulletList' | 'orderedList' | 'code'

export interface FormatDef {
  id: FormatId
  label: string
  /** What you type to get it — the input rule the extension registers. Blank when there is none. */
  trigger?: string
}

/**
 * The formats `/` offers, in order. The hint is what you would type, not a key
 * chord. Bold, italic and underline are absent: they act on text already
 * written, so they are the selection toolbar's.
 */
export const FORMATS: readonly FormatDef[] = [
  { id: 'paragraph', label: 'Text' },
  { id: 'heading', label: 'Heading', trigger: '#' },
  { id: 'subheading', label: 'Subheading', trigger: '##' },
  { id: 'quote', label: 'Quote', trigger: '>' },
  { id: 'code', label: 'Code', trigger: '`' },
  { id: 'bulletList', label: 'Bulleted list', trigger: '-' },
  { id: 'orderedList', label: 'Numbered list', trigger: '1.' },
]

/** Code as a mark inside the line, or as a block of its own. */
export type CodeFormat = 'inline' | 'block'

/**
 * Apply one format to the current block. `set*` wherever Tiptap has one:
 * choosing Heading should make a heading, not turn one off. `false` means
 * nothing changed, not that anything failed.
 */
export function applyFormat(editor: Editor, id: FormatId, code: CodeFormat = 'inline'): boolean {
  const chain = editor.chain().focus()
  /*
    The node's own command, called by name: StarterKit's extensions declare
    them, and this package builds without StarterKit. Its own command, rather
    than the core one it wraps, because a list's runs with the app's options
    (`keepMarks`, `itemTypeName`). An editor without that node changes nothing.
  */
  const run = (command: string, ...args: unknown[]): boolean => {
    const named = (chain as unknown as Record<string, ((...a: unknown[]) => { run: () => boolean }) | undefined>)[command]
    return named ? named(...args).run() : false
  }
  switch (id) {
    case 'paragraph':
      return run('setParagraph')
    case 'heading':
      return run('setHeading', { level: 1 })
    case 'subheading':
      return run('setHeading', { level: 2 })
    case 'quote':
      return run('toggleBlockquote')
    case 'bulletList':
      return run('toggleBulletList')
    case 'orderedList':
      return run('toggleOrderedList')
    case 'code':
      return run(code === 'block' ? 'toggleCodeBlock' : 'toggleCode')
    default:
      return false
  }
}

/** The Format section every app's `/` opens with. */
export function formatSection(code: CodeFormat = 'inline'): SlashSection {
  return {
    label: 'Format',
    commands: FORMATS.map((format) => ({
      key: `format-${format.id}`,
      row: { label: format.label, shortcut: format.trigger },
      keywords: [format.id],
      run: (editor) => {
        applyFormat(editor, format.id, code)
      },
    })),
  }
}

/** A row that types another trigger, so its own list opens — `@` from `/`. */
export function typeTrigger(input: string): SlashCommand['run'] {
  // Deferred a frame: the delete of the `/query` has to land first, or the
  // trigger's plugin sees the character arrive inside a range still being removed.
  return (editor) => {
    requestAnimationFrame(() => editor.commands.insertContent(input))
  }
}

function matches(command: SlashCommand, q: string): boolean {
  return [command.row.label, ...(command.keywords ?? [])].some((text) => text.toLowerCase().includes(q))
}

/** The sections narrowed to a query — the text typed after the `/`. Empty sections stay. */
export function filterSlashSections(sections: readonly SlashSection[], query: string): SlashSection[] {
  const q = query.toLowerCase()
  return sections.map((section) => ({ ...section, commands: q ? section.commands.filter((command) => matches(command, q)) : section.commands }))
}

export interface SlashCommandsOptions {
  /** The sections, in order: {@link formatSection} first, then the app's own. */
  sections: readonly SlashSection[]
}

type SlashRow = SlashCommand & { section: string }

/**
 * `/` — format the line or insert something, at the caret, mid-sentence too.
 * A `/` inside a word (`and/or`, a path) opens nothing: the plugin wants a
 * space or the line's start before it.
 */
export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',
  addOptions() {
    return { sections: [formatSection()] }
  },
  addProseMirrorPlugins() {
    const sections = this.options.sections
    return [
      Suggestion<SlashRow>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        pluginKey: new PluginKey('slashCommands'),
        items: ({ query }) => filterSlashSections(sections, query).flatMap((section) => section.commands.map((command) => ({ ...command, section: section.label }))),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          props.run(editor)
        },
        render: suggestionPopup<SlashRow>({
          ariaLabel: 'Commands',
          width: 'w-[300px]',
          maxHeight: 'max-h-[400px]',
          sections: (rows) => sections.map((section) => ({ label: section.label, items: rows.filter((row) => row.section === section.label) })),
          itemKey: (row) => row.key,
          row: (row) => row.row,
        }),
      }),
    ]
  },
})
