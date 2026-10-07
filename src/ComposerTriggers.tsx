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

/**
 * A list keeps listening across spaces, so a name or a title can be more than
 * one word (f586437a, Miky 2026-10-06). It stops at a new line, Escape, a pick
 * or the cursor leaving — Suggestion's own — and once the query holds `stop`:
 * `]` for `[`, so "see [the notes] above" ends as text. While nothing matches,
 * the list is hidden rather than closed, and comes back if the words match again.
 * A space straight after the key is prose ("meet @ 5pm", "- [ ] task"), not a
 * query: every two-word name holds a space.
 */
const listening = (stop: string) => ({
  allowSpaces: true,
  shouldShow: ({ query }: { query: string }) => !/^\s/.test(query) && !query.includes(stop),
})

/** `@`'s list and pick, or `!@`'s, for the node `name` — the extension's own, so a renamed one still finds its people. */
function personSuggestion(urgent: boolean, name: string) {
  return {
    ...(urgent ? { char: '!@' } : {}),
    // A second `@` starts another mention; the first one has ended.
    ...listening('@'),
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

/*
  What a chip keeps through HTML — a copy and paste, inside an editor or
  between two. The chip's own `renderHTML` writes each as a `data-*` attribute
  and these read them back. Until CON-27 none was written, so a pasted chip
  came back with every value null and was sent as `@null`. What is read is
  checked: a crafted `data-pubkey` that is not a key, or a `data-uri` that is
  not a `nostr:` reference, is dropped rather than written into the body.
*/
const HEX_KEY = /^[0-9a-f]{64}$/
const NOSTR_URI = /^nostr:[a-z0-9]+$/i
const fromData = (name: string, valid?: RegExp) => ({
  parseHTML: (element: HTMLElement) => {
    const value = element.getAttribute(`data-${name}`)
    return value !== null && (!valid || valid.test(value)) ? value : null
  },
  // The node's own `renderHTML` writes it.
  renderHTML: () => ({}),
})

const personAttributes = () => ({
  id: { default: null, ...fromData('id') },
  label: { default: null, ...fromData('label') },
  /**
   * The person's Nostr key, when they have one — SPEC §13.1. `id` is the app's
   * own and means nothing to another app; this is what the body is written
   * with, so a mention survives a rename.
   */
  pubkey: { default: null, ...fromData('pubkey', HEX_KEY) },
})

/** The `data-*` a person chip is written with, so a paste reads it back. */
function personData(attrs: Record<string, unknown>): Record<string, string> {
  return {
    'data-id': String(attrs.id ?? ''),
    'data-label': String(attrs.label ?? ''),
    ...(typeof attrs.pubkey === 'string' && attrs.pubkey ? { 'data-pubkey': attrs.pubkey } : {}),
  }
}

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
    return { ...this.parent!(), HTMLAttributes: {}, people: () => [], suggestion: personSuggestion(false, this.name) }
  },
  addAttributes: personAttributes,
  renderHTML({ node }) {
    // No node view, so this spec is what the editor draws: the one chip.
    return ['span', { 'data-mention': 'true', ...personData(node.attrs), class: inlineChipClassName('person', 'cursor-default') }, `@${node.attrs.label}`]
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
    return { ...this.parent!(), HTMLAttributes: {}, people: () => [], suggestion: personSuggestion(true, this.name) }
  },
  addAttributes: personAttributes,
  renderHTML({ node }) {
    return [
      'span',
      { 'data-urgent-mention': 'true', ...personData(node.attrs), class: inlineChipClassName('urgent', 'cursor-default') },
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
  /** The row's second line, e.g. where the thing sits. The chip does not wear it. */
  description?: string
  /**
   * This row's own 16px icon, in place of the list's `icon`: what the thing is,
   * when the list holds several kinds — a topic, a project, a message
   * (Katerina, 7 October). Absent, the list's icon.
   */
  icon?: ReactNode
}

/** One labelled group of `[`'s rows, in the order the list draws them. */
export interface ReferenceSection {
  label: string
  items: readonly CaptionedItem[]
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
  /**
   * The chip's 14px icon from what it points at — its `uri` — when chips name
   * several kinds of thing; `undefined` from it, or no `iconFor`, draws `icon`.
   * The same answer the list's row gave (Katerina, 7 October).
   */
  iconFor?: (uri: string | null) => ReactNode | undefined
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
    return { ...this.parent!(), HTMLAttributes: {}, icon: null, iconFor: undefined, suggestion: { char: '\0', items: () => [] } }
  },
  addAttributes() {
    return {
      id: { default: null, ...fromData('id') },
      label: { default: null, ...fromData('label') },
      snippet: { default: '', parseHTML: (element: HTMLElement) => element.getAttribute('data-snippet') ?? '', renderHTML: () => ({}) },
      uri: { default: null, ...fromData('uri', NOSTR_URI) },
    }
  },
  renderHTML({ node }) {
    return [
      'span',
      { [`data-${this.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`]: 'true', 'data-id': String(node.attrs.id ?? ''), 'data-label': String(node.attrs.label ?? ''), 'data-snippet': String(node.attrs.snippet ?? ''), ...(node.attrs.uri ? { 'data-uri': String(node.attrs.uri) } : {}), class: inlineChipClassName('neutral', 'cursor-default') },
      captionOf(node.attrs.label, node.attrs.snippet),
    ]
  },
  parseHTML() {
    return [{ tag: `span[data-${this.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]` }]
  },
  addNodeView() {
    const { icon, iconFor } = this.options
    return ReactNodeViewRenderer(
      ({ node }: ReactNodeViewProps) => (
        <NodeViewWrapper as="span" className={inlineChipClassName('neutral', 'max-w-[24ch] cursor-default')}>
          <span className="flex items-center justify-center w-4 h-4 shrink-0 text-text-secondary">{iconFor?.(node.attrs.uri ?? null) ?? icon}</span>
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
  /** At each row's start: a 16px icon — unless the row brings its own (`CaptionedItem.icon`). */
  icon: ReactNode
}

/** A row as the list holds it: which section it is drawn under, when the list has several. */
type ListedItem = CaptionedItem & { section?: string }

/**
 * The list `[` opens: `label: snippet` rows, the same box as the people list.
 * One section headed `sectionLabel`, or — when the rows say which section they
 * are in — a heading for each, in the order the rows arrive.
 */
export function referenceMenu({ ariaLabel, sectionLabel, icon }: ReferenceMenuOptions): SuggestionPopupOptions<CaptionedItem> {
  return {
    ariaLabel,
    width: 'w-[658px]',
    maxHeight: 'max-h-[360px]',
    sections: (items: ListedItem[]) => {
      const groups: { label: string; items: CaptionedItem[]; className: string }[] = []
      for (const item of items) {
        const label = item.section ?? sectionLabel
        const last = groups[groups.length - 1]
        if (last?.label === label) last.items.push(item)
        else groups.push({ label, items: [item], className: 'px-2' })
      }
      return groups
    },
    itemKey: (item) => `reference-${item.id}`,
    row: (item) => ({ leading: item.icon ?? icon, label: captionOf(item.label, item.snippet), description: item.description, hint: <EnterHint /> }),
  }
}

export interface ReferenceTriggerOptions extends ReferenceMenuOptions {
  /** Everything `[` can offer, asked each time the query changes. Narrowed by {@link filterReferences}. */
  items: () => readonly CaptionedItem[]
  /**
   * In place of `items`: the sections to draw for what was typed, already
   * narrowed and ordered by the app. Empty sections are not drawn.
   */
  sections?: (query: string) => readonly ReferenceSection[]
  /**
   * Called with a listener while the list is open; the app calls it when what
   * `sections` would answer has changed — a search landing — and the open list
   * is drawn again for the same query. Returns the unsubscribe.
   */
  subscribe?: (listener: () => void) => () => void
  /** The node a pick inserts. Default `captionedReference`. */
  nodeName: string
}

const listed = (options: ReferenceTriggerOptions, query: string): ListedItem[] =>
  options.sections
    ? options.sections(query).flatMap((section) => section.items.map((item) => ({ ...item, section: section.label })))
    : filterReferences(options.items(), query)

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
        ...listening(']'),
        // As a mention's: only where the chip may go.
        allow: ({ state, range }) => {
          const type = state.schema.nodes[options.nodeName]
          return !!type && !!state.doc.resolve(range.from).parent.type.contentMatch.matchType(type)
        },
        items: ({ query }) => listed(options, query),
        render: suggestionPopup({ ...referenceMenu(options), subscribe: options.subscribe, refresh: (query) => listed(options, query) }),
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
  /** The trigger when the format makes a block instead — Code's fence. Blank when it is the same. */
  blockTrigger?: string
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
  { id: 'code', label: 'Code', trigger: '`', blockTrigger: '```' },
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
      row: { label: format.label, shortcut: (code === 'block' && format.blockTrigger) || format.trigger },
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

type SlashRow = SlashCommand & { section: number }

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
        items: ({ query }) => filterSlashSections(sections, query).flatMap((section, at) => section.commands.map((command) => ({ ...command, section: at }))),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          props.run(editor)
        },
        render: suggestionPopup<SlashRow>({
          ariaLabel: 'Commands',
          width: 'w-[300px]',
          maxHeight: 'max-h-[400px]',
          sections: (rows) => sections.map((section, at) => ({ label: section.label, items: rows.filter((row) => row.section === at) })),
          itemKey: (row) => row.key,
          row: (row) => row.row,
        }),
      }),
    ]
  },
})
