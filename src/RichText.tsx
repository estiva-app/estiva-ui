import type { MouseEvent, ReactNode } from 'react'
import { cn } from './cn'
import { Link } from './Link'

/**
 * Formatted text, drawn: headings, paragraphs, lists, a quote, code, a divider,
 * a table and links.
 *
 * Both apps drew the same thing twice, from the same source — the text tree the
 * protocol package builds (`toRenderTree` → `RenderBlock`, `RenderInline`) —
 * and the two had drifted: headings, list markers, quotes and code differed,
 * one app had tables and the other dropped them, one had links and the other
 * printed the brackets (UIG-30). The look here is Katerina's picks of
 * 28 September, one per difference, most of them Peek's.
 *
 * **It takes the tree, not the text.** The caller parses (the format comes from
 * the item's tag, never from the body) and hands the blocks in. So this package
 * does not depend on the protocol, and a caller can leave out a block it draws
 * elsewhere before passing the rest. The types below are the tree's shape; the
 * protocol's own types fit them.
 *
 * **Safe by construction.** The tree has nothing left to parse, and every
 * string here reaches the page as a React child, so it is text. Nothing is set
 * as HTML.
 *
 * **What a word points at stays the app's.** A person, an item from another
 * app, a name the app recognises in plain text: `renderReference`,
 * `renderText` and `renderBlock` are where each app draws its own.
 */

/** A run of text and the marks on it — the protocol's `RenderInline`. */
export interface RichTextRun {
  text: string
  marks: readonly string[]
  /** A `nostr:` address this run stands for. `text` is the address itself. */
  reference?: string
}

/** A block of the tree — the protocol's `RenderBlock`. */
export interface RichTextBlock {
  type: string
  /** What the document called a block the tree does not know. */
  typeName?: string
  /** The block's address, when it has one. Drawn as `data-block-id`. */
  id?: string
  level?: 1 | 2 | 3
  language?: string
  /** A numbered list's first number. */
  start?: number
  attrs?: Record<string, unknown>
  inline?: readonly RichTextRun[]
  children?: readonly RichTextBlock[]
}

export type RichTextSize = 'default' | 'small'

export interface RichTextProps {
  /** The tree, already parsed. */
  blocks: readonly RichTextBlock[]
  /**
   * Default `default`, the size of text you read. `small` is the same text one
   * step down, with every heading, list, quote and table kept: an item shown
   * inside a card.
   */
  size?: RichTextSize
  /**
   * Draws plain text: what is left of a run once its links are drawn. Where an
   * app turns words it recognises into chips. By default the text as it is.
   */
  renderText?: (text: string) => ReactNode
  /** Draws a run that stands for an address. By default its text. */
  renderReference?: (reference: string, run: RichTextRun) => ReactNode
  /**
   * Draws a block this part has no design for (an attachment, a widget). Return
   * `undefined` to leave it to the part, which draws its words.
   */
  renderBlock?: (block: RichTextBlock) => ReactNode | undefined
}

const SIZE_CLASSES: Record<RichTextSize, { root: string; h1: string; h2: string }> = {
  default: { root: 'text-body-2', h1: 'text-h4', h2: 'text-body-2 font-semibold' },
  small: { root: 'text-caption leading-snug', h1: 'text-body-2 font-semibold', h2: 'text-caption font-semibold' },
}

// eslint-disable-next-line token-values/no-restricted-classes -- @estiva-escape: code is 0.9 of the text around it, so it scales with a heading and with `small`; a named size is fixed
const CODE_SIZE_CLASSES = 'font-mono text-[0.9em] text-text-primary'

const RICH_TEXT_CLASSES = {
  root: 'flex flex-col gap-1 break-words text-text-secondary',
  /* A heading binds to what follows it: 12px above (8 and the 4px gap), 8px below (4 and the gap); two headings in a row, 12px apart. */
  heading: 'mt-2 mb-1 first:mt-0 last:mb-0 [:is(h1,h2,h3)+&]:mt-1',
  bright: 'text-text-primary',
  bulletList: 'list-disc pl-5',
  orderedList: 'list-decimal pl-5',
  item: 'break-words marker:text-text-muted',
  // eslint-disable-next-line token-spacing/no-restricted-classes -- @estiva-escape: the quote line is Peek's, 3px, between the ramp's 2 and 4
  quote: 'border-l-[3px] border-border-strong pl-2.5',
  code: 'rounded-sm bg-bg-code px-1 py-0.5',
  codeBlock: 'whitespace-pre-wrap break-words rounded-md bg-bg-code p-2',
  divider: 'border-border-default',
  table: 'w-full border-collapse',
  cell: 'border border-border-default px-2 py-1 text-left align-top',
  headerCell: 'bg-bg-code font-medium text-text-primary',
  bold: 'font-semibold',
  italic: 'italic',
  underline: 'underline underline-offset-2',
}

/**
 * A link written as `[words](address)`, then a bare address. The written form
 * first, so its address is not found a second time on its own.
 */
const LINK_SPLIT = /(\[[^[\]\n]+\]\((?:https?:\/\/|mailto:)[^\s)]+\)|https?:\/\/[^\s]+)/g
const WRITTEN_LINK = /^\[([^[\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)$/
/** Punctuation after a bare address ends the sentence, not the address. */
const BARE_LINK = /^(https?:\/\/\S+?)([.,;:!?)\]]*)$/

/** A link in text is not also a click on what the text sits in, such as a card. */
const keepToLink = (event: MouseEvent) => event.stopPropagation()

function textWithLinks(text: string, renderText: (text: string) => ReactNode): ReactNode {
  const parts = text.split(LINK_SPLIT)
  if (parts.length === 1) return renderText(text)
  return parts.map((part, i) => {
    const written = part.match(WRITTEN_LINK)
    if (written) {
      return (
        <span key={i} className="break-words">
          <Link href={written[2]} external onClick={keepToLink}>{written[1]}</Link>
        </span>
      )
    }
    const bare = i % 2 === 1 ? part.match(BARE_LINK) : null
    if (bare) {
      return (
        // An address has no spaces to wrap at, so it may break anywhere.
        <span key={i} className="break-all">
          <Link href={bare[1]} external onClick={keepToLink}>{bare[1]}</Link>
          {bare[2]}
        </span>
      )
    }
    return part ? <span key={i}>{renderText(part)}</span> : null
  })
}

interface Draw {
  size: RichTextSize
  renderText: (text: string) => ReactNode
  renderReference: (reference: string, run: RichTextRun) => ReactNode
  renderBlock?: (block: RichTextBlock) => ReactNode | undefined
}

function Runs({ runs, draw }: { runs?: readonly RichTextRun[]; draw: Draw }) {
  return (
    <>
      {(runs ?? []).map((run, i) => {
        if (run.reference) return <span key={i}>{draw.renderReference(run.reference, run)}</span>
        // Code carries no other mark, and its words are never read for links.
        if (run.marks.includes('code')) {
          return <code key={i} className={cn(RICH_TEXT_CLASSES.code, CODE_SIZE_CLASSES)}>{run.text}</code>
        }
        // A line break inside a run is a line break.
        let node: ReactNode = run.text.split('\n').map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {textWithLinks(line, draw.renderText)}
          </span>
        ))
        if (run.marks.includes('underline')) node = <u className={RICH_TEXT_CLASSES.underline}>{node}</u>
        if (run.marks.includes('italic')) node = <em className={RICH_TEXT_CLASSES.italic}>{node}</em>
        if (run.marks.includes('bold')) node = <strong className={RICH_TEXT_CLASSES.bold}>{node}</strong>
        return <span key={i}>{node}</span>
      })}
    </>
  )
}

const named = (block: RichTextBlock) => block.typeName ?? block.type

/**
 * A table's rows and cells are named by whatever wrote the document; these are
 * the editor's names. A first row of header cells is the header. Returns null
 * for a nesting it does not recognise, which is then drawn as words.
 */
function Table({ block, draw }: { block: RichTextBlock; draw: Draw }) {
  const rows = (block.children ?? []).filter((row) => named(row) === 'tableRow')
  if (!rows.length) return null
  const cells = (row: RichTextBlock) =>
    (row.children ?? []).map((cell, i) => {
      const header = named(cell) === 'tableHeader'
      const Cell = header ? 'th' : 'td'
      const { colspan, rowspan } = (cell.attrs ?? {}) as { colspan?: number; rowspan?: number }
      return (
        <Cell
          key={cell.id ?? i}
          data-block-id={cell.id}
          colSpan={colspan && colspan > 1 ? colspan : undefined}
          rowSpan={rowspan && rowspan > 1 ? rowspan : undefined}
          className={cn(RICH_TEXT_CLASSES.cell, header && RICH_TEXT_CLASSES.headerCell)}
        >
          {(cell.children ?? []).map((child, j) => <Runs key={j} runs={child.inline} draw={draw} />)}
          <Runs runs={cell.inline} draw={draw} />
        </Cell>
      )
    })
  const first = rows[0].children ?? []
  const headerRow = first.length > 0 && first.every((cell) => named(cell) === 'tableHeader')
  return (
    <table data-block-id={block.id} className={RICH_TEXT_CLASSES.table}>
      {headerRow && (
        <thead>
          <tr data-block-id={rows[0].id}>{cells(rows[0])}</tr>
        </thead>
      )}
      <tbody>
        {(headerRow ? rows.slice(1) : rows).map((row, i) => (
          <tr key={row.id ?? i} data-block-id={row.id}>{cells(row)}</tr>
        ))}
      </tbody>
    </table>
  )
}

function Block({ block, draw }: { block: RichTextBlock; draw: Draw }): ReactNode {
  const own = draw.renderBlock?.(block)
  if (own !== undefined) return own
  const runs = <Runs runs={block.inline} draw={draw} />
  const size = SIZE_CLASSES[draw.size]
  switch (block.type) {
    case 'heading': {
      if (block.level === 1) return <h1 data-block-id={block.id} className={cn(size.h1, RICH_TEXT_CLASSES.heading, RICH_TEXT_CLASSES.bright)}>{runs}</h1>
      // Level 3 looks like level 2 in the text's own colour, one step lower.
      if (block.level === 3) return <h3 data-block-id={block.id} className={cn(size.h2, RICH_TEXT_CLASSES.heading)}>{runs}</h3>
      return <h2 data-block-id={block.id} className={cn(size.h2, RICH_TEXT_CLASSES.heading, RICH_TEXT_CLASSES.bright)}>{runs}</h2>
    }
    case 'paragraph':
      return <p data-block-id={block.id}>{runs}</p>
    case 'bulletList':
    case 'orderedList': {
      const items = (block.children ?? []).map((item, i) => (
        <li key={item.id ?? i} data-block-id={item.id} className={RICH_TEXT_CLASSES.item}>
          <Runs runs={item.inline} draw={draw} />
        </li>
      ))
      return block.type === 'bulletList'
        ? <ul data-block-id={block.id} className={RICH_TEXT_CLASSES.bulletList}>{items}</ul>
        : <ol data-block-id={block.id} start={block.start} className={RICH_TEXT_CLASSES.orderedList}>{items}</ol>
    }
    case 'blockquote':
      return <blockquote data-block-id={block.id} className={RICH_TEXT_CLASSES.quote}>{runs}</blockquote>
    case 'codeBlock':
      // Literal: no marks, no links, no chips. A long line wraps; nothing scrolls sideways.
      return (
        <pre data-block-id={block.id} data-language={block.language} className={cn(RICH_TEXT_CLASSES.codeBlock, CODE_SIZE_CLASSES)}>
          <code>{(block.inline ?? []).map((run) => run.text).join('')}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr data-block-id={block.id} className={RICH_TEXT_CLASSES.divider} />
    case 'table': {
      const table = <Table block={block} draw={draw} />
      if ((block.children ?? []).some((row) => named(row) === 'tableRow')) return table
      break
    }
  }
  /*
    Anything else — a type this part has no design for, or one published after
    it was written — is drawn as its words, never dropped: a block that
    vanishes looks like one you are not allowed to see.
  */
  return (
    <div data-block-id={block.id} data-block-type={named(block)}>
      {runs}
      {(block.children ?? []).map((child, i) => <Block key={child.id ?? i} block={child} draw={draw} />)}
    </div>
  )
}

export function RichText({
  blocks,
  size = 'default',
  renderText = (text) => text,
  renderReference = (_reference, run) => run.text,
  renderBlock,
}: RichTextProps) {
  if (blocks.length === 0) return null
  const draw: Draw = { size, renderText, renderReference, renderBlock }
  return (
    <div data-rich-text className={cn(RICH_TEXT_CLASSES.root, SIZE_CLASSES[size].root)}>
      {blocks.map((block, i) => <Block key={block.id ?? i} block={block} draw={draw} />)}
    </div>
  )
}
