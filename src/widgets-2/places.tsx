/**
 * Where a link sits decides how it draws (Miky, 15 Oct, on the brief "Where a
 * Link Sits"; why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/where-a-link-sits-decides-how-it-draws.md),
 * drawn once here so Peek, Ship and Leaf place the same widgets the same way
 * (WID-3). Each app's own stories put these inside its own frames.
 *
 * - A link in a sentence is a chip; a link alone on its line is a row.
 * - In a message: the one file it links gets its card under it, added by
 *   default and removed with ✕; a message that is only one link shows the card
 *   instead of the row; two or more files, no card. No layout choice.
 * - In a document: no card is ever added. The chip menu on a lone-line link
 *   offers Open and its card, and the card takes that line's place.
 */
import {
  IconCheck,
  IconExternalLink,
  IconH1,
  IconLetterT,
  IconLink,
  IconListCheck,
  IconPaperclip,
  IconTable,
  IconX,
} from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../cn'
import { IconButton } from '../IconButton'
import { MenuItem, MenuPanel, MenuSection, MenuSeparator } from '../Menu'
import type { Thing } from './fixtures'
import { CardLoading, CardUnavailable, CompactCard, DetailedCard, loadingShapeOf, MessageCard, ReferenceChip, ThingIcon } from './proposed'

/** A piece of a sentence: words, or a link to a file. */
export type Piece = string | Thing
/** One line of text: a link alone on its line, or a sentence of words and links. */
export type Line = Thing | Piece[]

const isLink = (piece: Piece | Line): piece is Thing => typeof piece === 'object' && !Array.isArray(piece)

/** Every file the lines link to, each once. */
export function linksIn(lines: Line[]): Thing[] {
  return [...new Set(lines.flatMap((line) => (isLink(line) ? [line] : line.filter(isLink))))]
}

/** The file whose card goes under a message: the one it links. None when it links two or more. */
export function cardFileOf(lines: Line[]): Thing | undefined {
  const files = linksIn(lines)
  return files.length === 1 ? files[0] : undefined
}

/** A message that is nothing but one link: it shows the card, not the row. */
export function isOnlyOneLink(lines: Line[]): boolean {
  return lines.length === 1 && isLink(lines[0])
}

/** A file's card: a linked message draws as a message, every other file as its detailed card; loading and not available as the proposed kit draws them. */
export function CardOf({ thing }: { thing: Thing }) {
  if (thing.state === 'loading') return <CardLoading kind={thing.kind} layout="detailed" shape={loadingShapeOf(thing)} />
  if (thing.state === 'unavailable') return <CardUnavailable kind={thing.kind} noun={thing.noun} app={thing.app} />
  return thing.kind === 'message' ? <MessageCard thing={thing} /> : <DetailedCard thing={thing} />
}

/** A link alone on its line: its row, or loading, or not available. */
function Row({ thing, preview = false }: { thing: Thing; preview?: boolean }) {
  if (thing.state === 'loading') return <CardLoading kind={thing.kind} layout="compact" />
  if (thing.state === 'unavailable') return <CardUnavailable kind={thing.kind} noun={thing.noun} app={thing.app} />
  return <CompactCard thing={thing} preview={preview} />
}

/** A sentence: its words, and a chip for each link in it. */
function Sentence({ pieces }: { pieces: Piece[] }) {
  return (
    <p className="text-body-2 text-text-primary">
      {pieces.map((piece, i) => (typeof piece === 'string' ? <span key={i}>{piece}</span> : <ReferenceChip key={i} thing={piece} state={piece.state} preview={!piece.state} />))}
    </p>
  )
}

export interface PlacedLinesProps {
  lines: Line[]
  /** In a document: the lone-line links switched to their card, by line index. */
  cards?: number[]
  /** In a document: a click on a lone-line link, which opens its chip menu. */
  onLink?: (index: number) => void
  /** Drawn under a line, by line index: the chip menu, open. */
  under?: (index: number) => ReactNode
  className?: string
}

/** Text whose links draw by where they sit: a chip in a sentence, a row alone on its line, or (in a document) the card chosen for that line. */
export function PlacedLines({ lines, cards = [], onLink, under, className }: PlacedLinesProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {lines.map((line, i) => (
        <div key={i} className="relative flex flex-col">
          {isLink(line) ? (
            onLink ? (
              // While writing, a click on the link opens its menu instead of following it (the record clicking-a-chip-while-editing-opens-a-menu).
              <div
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                className="w-full min-w-0 cursor-pointer"
                onClickCapture={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onLink(i)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onLink(i)
                }}
              >
                {cards.includes(i) ? <CardOf thing={line} /> : <Row thing={line} />}
              </div>
            ) : cards.includes(i) ? (
              <CardOf thing={line} />
            ) : (
              <Row thing={line} preview />
            )
          ) : (
            <Sentence pieces={line} />
          )}
          {under?.(i)}
        </div>
      ))}
    </div>
  )
}

export interface CardUnderProps {
  thing: Thing
  /** The ✕ that removes it: under the message box before sending, or the author's own on a sent message. */
  onRemove?: () => void
  /** On a sent message the ✕ shows on hover; under the box it always shows. */
  removeOnHover?: boolean
  className?: string
}

/** The one file's card under a message, and the ✕ that removes it. */
export function CardUnder({ thing, onRemove, removeOnHover = false, className }: CardUnderProps) {
  return (
    <div className={cn('group/card flex items-start gap-1', className)}>
      <div className="min-w-0 flex-1">
        <CardOf thing={thing} />
      </div>
      {onRemove && (
        // At the card's top corner, not its middle: a tall card's ✕ halfway down reads as belonging to nothing.
        <div className="flex shrink-0 self-start pt-2">
          <IconButton aria-label="Remove card" tooltip="Remove card" onClick={onRemove} className={cn(removeOnHover && 'opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100')}>
            <IconX size={16} />
          </IconButton>
        </div>
      )}
    </div>
  )
}

export interface PlacedMessageProps {
  lines: Line[]
  /** The card was removed with ✕: before sending, or by the author afterwards. */
  removed?: boolean
  /** Draws the ✕; without it the card shows with none, as to anyone but the author. */
  onRemove?: () => void
  removeOnHover?: boolean
  /**
   * An old message, sent before Widgets 2 with a `compact` tag for each of
   * these: no card was added to it, and each still draws as a row under it.
   */
  oldCompact?: Thing[]
  className?: string
}

/**
 * A message's text, and under it the one file's card. A file with its card
 * under the message draws no row in it (a chip in a sentence still draws), so
 * a message that is only one link shows its card alone.
 */
export function PlacedMessage({ lines, removed = false, onRemove, removeOnHover, oldCompact, className }: PlacedMessageProps) {
  const file = removed || oldCompact ? undefined : cardFileOf(lines)
  const shown = file ? lines.filter((line) => line !== file) : lines
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {shown.length > 0 && <PlacedLines lines={shown} />}
      {file && <CardUnder thing={file} onRemove={onRemove} removeOnHover={removeOnHover} className="max-w-[480px]" />}
      {oldCompact?.map((thing, i) => (
        <CompactCard key={i} thing={thing} preview />
      ))}
    </div>
  )
}

/** A sent message whose author can remove its card with ✕, live: try it. */
export function SentMessage({ lines, author = true, className }: { lines: Line[]; author?: boolean; className?: string }) {
  const [removed, setRemoved] = useState(false)
  return <PlacedMessage lines={lines} removed={removed} onRemove={author ? () => setRemoved(true) : undefined} removeOnHover className={className} />
}

export interface ChipMenuProps {
  thing: Thing
  /**
   * A lone-line link offers its card; a chip in a sentence offers Open only,
   * and so does a link to what has no card worth choosing (a Folder, a file
   * that is not a picture).
   */
  alone?: boolean
  shownAs?: 'row' | 'card'
  onShowAs?: (as: 'row' | 'card') => void
  onOpen?: () => void
}

/** What a link in a document offers its writer: Open, and on a lone-line link of a kind that has one, its card in that line's place. */
export function ChipMenu({ thing, alone = true, shownAs = 'row', onShowAs, onOpen }: ChipMenuProps) {
  return (
    <MenuPanel className="w-[200px]">
      <div role="menu" aria-label="Link" className="flex flex-col gap-0.5">
        <MenuItem role="menuitem" label="Open" leading={<IconExternalLink size={16} />} onClick={onOpen} />
        {alone && (
          <>
            <MenuSeparator />
            <div role="group" aria-label="Show as">
              <MenuSection label="Show as">
                {(['row', 'card'] as const).map((as) => (
                  <MenuItem
                    key={as}
                    role="menuitemradio"
                    aria-checked={shownAs === as}
                    label={as === 'row' ? 'Row' : 'Card'}
                    trailing={shownAs === as ? <IconCheck size={16} aria-hidden /> : undefined}
                    onClick={() => onShowAs?.(as)}
                  />
                ))}
              </MenuSection>
            </div>
          </>
        )}
      </div>
    </MenuPanel>
  )
}

/** A document's text with its chip menu, live: click a lone-line link, then choose Row or Card. */
export function PlacedDocument({ lines, initialCards = [], className }: { lines: Line[]; initialCards?: number[]; className?: string }) {
  const [cards, setCards] = useState(initialCards)
  const [open, setOpen] = useState<number | null>(null)
  return (
    <PlacedLines
      lines={lines}
      cards={cards}
      className={className}
      onLink={(i) => setOpen(open === i ? null : i)}
      under={(i) => {
        const line = lines[i]
        if (open !== i || !isLink(line)) return null
        return (
          <div className="absolute left-0 top-full z-10 mt-1">
            <ChipMenu
              thing={line}
              shownAs={cards.includes(i) ? 'card' : 'row'}
              onOpen={() => setOpen(null)}
              onShowAs={(as) => {
                setCards(as === 'card' ? [...cards, i] : cards.filter((c) => c !== i))
                setOpen(null)
              }}
            />
          </div>
        )
      }}
    />
  )
}

/**
 * A description's and a page's `/` menu with the widget entry (Miky's QA note,
 * 15 Oct: "`/` section where you can use `[` to insert a widget"). Format rows
 * shortened to three; Insert as the app has it, plus the link.
 */
export function SlashMenuWithLink({ file = true, table = true }: { file?: boolean; table?: boolean }) {
  return (
    <MenuPanel className="w-[260px]">
      <div role="menu" aria-label="Insert" className="flex flex-col gap-0.5">
        <MenuSection label="Format">
          <MenuItem label="Text" leading={<IconLetterT size={16} />} />
          <MenuItem label="Heading" leading={<IconH1 size={16} />} shortcut="#" />
          <MenuItem label="Checklist" leading={<IconListCheck size={16} />} shortcut="[]" />
        </MenuSection>
        <MenuSeparator />
        <MenuSection label="Insert">
          {table && <MenuItem label="Table" leading={<IconTable size={16} />} />}
          {file && <MenuItem label="File" leading={<IconPaperclip size={16} />} />}
          <MenuItem label="Link to a file" leading={<IconLink size={16} />} shortcut="[" selected />
        </MenuSection>
      </div>
    </MenuPanel>
  )
}

/** The `[` list the widget entry opens: the files to link, each led by its kind's icon. */
export function LinkPicker({ files, query = '' }: { files: Thing[]; query?: string }) {
  return (
    <MenuPanel className="w-[320px]">
      <div role="listbox" aria-label="Link to a file" className="flex flex-col gap-0.5">
        <MenuSection label={query ? `Files matching “${query}”` : 'Recent files'}>
          {files.map((thing, i) => (
            <MenuItem key={i} role="option" label={thing.kind === 'message' ? `${thing.author}: ${thing.body}` : thing.title} leading={<ThingIcon kind={thing.kind} />} hint={thing.key && <span className="text-caption text-text-secondary">{thing.key}</span>} selected={i === 0} />
          ))}
        </MenuSection>
      </div>
    </MenuPanel>
  )
}
