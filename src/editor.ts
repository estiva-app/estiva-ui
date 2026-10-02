/**
 * `@estiva-app/ui/editor` — the parts that work inside a Tiptap editor (UIG-31,
 * Katerina's ruling 29 September: one editor corner in the package, option A).
 *
 * Its own entry because it imports Tiptap, which only an app with an editor
 * installs: the main entry stays free of it, and the Tiptap peers are optional,
 * as the eslint ones are. The rest of the package it draws with — `Popover`,
 * `Toolbar`, `MenuItem`, `SuggestionMenu` — is the main entry's own, not a copy.
 */
export { KeptSelection, SelectionToolbar, normalizeHref, type MarkId, type SelectionToolbarProps } from './SelectionToolbar'
export { suggestionPopup, isSuggestionActive, isSuggestionOpen, type SuggestionPopupOptions } from './suggestionPopup'
export { EditorBlockHandle, deleteBlock, duplicateBlock, startBlockDrag, type EditorBlockHandleProps, type BlockTurnInto } from './EditorBlockHandle'
export {
  PersonMention,
  UrgentPersonMention,
  CaptionedReference,
  ReferenceTrigger,
  SlashCommands,
  peopleMenu,
  referenceMenu,
  filterPeople,
  urgentPubkeys,
  filterReferences,
  formatSection,
  applyFormat,
  typeTrigger,
  filterSlashSections,
  FORMATS,
  type MentionPerson,
  type PersonMentionOptions,
  type CaptionedItem,
  type CaptionedReferenceOptions,
  type ReferenceTriggerOptions,
  type ReferenceMenuOptions,
  type SlashCommand,
  type SlashSection,
  type SlashCommandsOptions,
  type FormatId,
  type FormatDef,
  type CodeFormat,
} from './ComposerTriggers'
export {
  BlockId,
  UnknownBlock,
  ReferenceNode,
  AttachmentNode,
  type ReferenceNodeOptions,
  type ReferenceViewProps,
  type AttachmentNodeOptions,
  type AttachmentViewProps,
} from './BlockNodes'
