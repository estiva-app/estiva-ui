/**
 * `@estiva-app/ui/editor` — the parts that work inside a Tiptap editor (UIG-31,
 * Katerina's ruling 29 September: one editor corner in the package, option A).
 *
 * Its own entry because it imports Tiptap, which only an app with an editor
 * installs: the main entry stays free of it, and the Tiptap peers are optional,
 * as the eslint ones are. The rest of the package it draws with — `Popover`,
 * `Toolbar`, `MenuItem`, `SuggestionMenu` — is the main entry's own, not a copy.
 */
export { KeptSelection, SelectionToolbar, keepSelection, releaseSelection, normalizeHref, type MarkId, type SelectionAction, type SelectionToolbarProps } from './SelectionToolbar'

export {
  CommentBox,
  commentBoxRows,
  keepCommentBoxWarm,
  type CommentBoxProps,
  type CommentBoxDraft,
  type CommentBoxEdit,
  type BoxFile,
  type BoxFileState,
  type BoxUnder,
  type BoxUnderRead,
  type BoxSentUnder,
  type SendAnswer,
  type UploadAnswer,
} from './CommentBox'
export { InlineText, type InlineTextProps, type InlineTextHandle } from './InlineText'
export {
  CommentHighlights,
  setCommentAnchors,
  commentPlace,
  commentElement,
  anchorOfSelection,
  quoteText,
  type CommentAnchor,
  type CommentHighlightsOptions,
  type CommentPlace,
  type CommentQuote,
  type SelectionAnchor,
} from './CommentHighlights'
export { PastedImages, pastedImages, pastedImageName, type PastedImagesOptions, type ClipboardSource } from './PastedImages'
export { PastedMarkdown, type PastedMarkdownOptions } from './PastedMarkdown'
export { CodeBlockColours } from './CodeBlockColours'
export { suggestionPopup, isSuggestionActive, isSuggestionOpen, type SuggestionPopupOptions } from './suggestionPopup'
export {
  EditorBlockHandle,
  blockDropCursor,
  deleteBlock,
  moveBlock,
  duplicateBlock,
  startBlockDrag,
  turnIntoRows,
  turnListInto,
  turnQuoteInto,
  type EditorBlockHandleProps,
  type BlockTurnInto,
  type ListKind,
  type QuoteKind,
} from './EditorBlockHandle'
export { EditorTableControls, appendTableRow, appendTableColumn, deleteTableRow, deleteTableColumn, toggleTableHeaderRow, type EditorTableControlsProps } from './EditorTableControls'
export {
  PersonMention,
  UrgentPersonMention,
  PersonReference,
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
  type PersonReferenceOptions,
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
  Checklist,
  Callout,
  isChecklistTick,
  UnknownBlock,
  ReferenceNode,
  AttachmentNode,
  type ReferenceNodeOptions,
  type ReferenceViewProps,
  type AttachmentNodeOptions,
  type AttachmentViewProps,
} from './BlockNodes'
export {
  referenceAtSelection,
  referenceCardPlacements,
  setReferenceCard,
  setReferenceCardAt,
  type ReferenceCard,
  type ReferenceCardLayout,
} from './ReferenceCards'
export { LinkChips, findLinkChips, refreshLinkChips, type LinkChipsOptions, type PastedRange } from './LinkChips'
export { LinkPlaces, linkPlaceAt, staysChip, type LinkPlace } from './LinkPlaces'
export { ReferenceMenu, ReferenceMenuView, isReferenceMenuOpen, referenceMenuClick, type ReferenceMenuViewProps } from './ReferenceMenu'
export {
  DocumentEditor,
  type DocumentEditorProps,
  type DocumentCodec,
  type DocumentReferences,
  type DocumentMentions,
  type HeldTyping,
} from './DocumentEditor'
