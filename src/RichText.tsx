import type { MouseEvent, ReactNode } from 'react'
import { cn } from './cn'
import { Link } from './Link'
import { codeColours } from './codeColours'

/**
 * Formatted text, drawn: headings, paragraphs, lists, a quote, code, a divider,
 * a table and links.
 *
 * Both apps drew the same thing twice, from the same source — the text tree the
 * protocol package builds (`toRenderTree` → `RenderBlock`, `RenderInline`) —
 * and the two had drifted: headings, list markers, quotes and code differed,
 * one app had tables and the other dropped them, one had links and the other
 * printed the brackets (UIG-30). The look here is Katerina's picks of
 * 28 September, one per difference, most of them Peek's, with the room and
 * colours she changed on 9 October.
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

/**
 * The whole look, as classes on the box around the text: the elements inside
 * carry none. That is so an editor can wear the same classes on its own box and
 * look the same as what it writes — ProseMirror draws the same elements, with a
 * paragraph inside each list item, quote and table cell (the `> p` lines).
 */
const RICH_TEXT_CLASSES = {
  /* Blocks 8px apart (Katerina, 9 October; 4 before). A list's own items stay together. */
  base: 'flex flex-col gap-2 break-words text-text-secondary',
  /* A heading binds to what follows it: 12px above (4 and the 8px gap), 8px below (the gap); two headings in a row, 12px apart. The same as before the gap grew (Katerina, 9 October: headings do not change). Level 3 keeps the text's colour, one step lower: at the same size as level 2, colour is what tells them apart (Katerina, 9 October). */
  headings: '[&>:is(h1,h2,h3)]:mt-1 [&>:is(h1,h2,h3):first-child]:mt-0 [&>:is(h1,h2)]:text-text-primary',
  /* Bullets and numbers in the text's own colour, so a number can be read (Katerina, 9 October; they were the muted grey, 2.4 : 1 in Leaf). */
  lists: '[&_:is(ul,ol)]:pl-5 [&_li>p]:m-0 [&_li]:break-words [&_li]:marker:text-text-secondary [&_ol]:list-decimal [&_ul]:list-disc',
  /* The line in the muted text grey, not the border grey: a border grey was 1.3 : 1 in Leaf (Katerina, 9 October). */
  // eslint-disable-next-line token-spacing/no-restricted-classes -- @estiva-escape: the quote line is Peek's, 3px, between the ramp's 2 and 4
  quote: '[&_blockquote>p]:m-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-text-muted [&_blockquote]:pl-2.5',
  /* Code in a sentence is amber, its own colour (Katerina, 9 October: option I). */
  // eslint-disable-next-line token-values/no-restricted-classes -- @estiva-escape: code is 0.85 of the text around it, so it scales with a heading and with `small`; a named size is fixed
  code: '[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-bg-code [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-text-code [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-text-primary',
  /* 12px either side, 10px above and below, looser lines than the text (Katerina, 9 October; 8px all round before). */
  // eslint-disable-next-line token-values/no-restricted-classes -- @estiva-escape: code is 0.85 of the text around it; the code inside the block is the block's own size, not 0.85 of it again
  codeBlock: '[&_pre>code]:text-[1em] [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-md [&_pre]:bg-bg-code [&_pre]:px-3 [&_pre]:py-2.5 [&_pre]:font-mono [&_pre]:text-[0.85em] [&_pre]:leading-relaxed [&_pre]:text-text-primary',
  /* Colours inside a code block, by language: the classes `codeColours` gives each word, after highlight.js's own GitHub theme (Katerina, 9 October). */
  syntax: '[&_:is(.hljs-keyword,.hljs-doctag,.hljs-type,.hljs-template-tag,.hljs-template-variable)]:text-syntax-keyword [&_.hljs-title]:text-syntax-function [&_:is(.hljs-number,.hljs-literal,.hljs-attr,.hljs-attribute,.hljs-meta,.hljs-variable,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id)]:text-syntax-constant [&_:is(.hljs-string,.hljs-regexp)]:text-syntax-string [&_:is(.hljs-built_in,.hljs-symbol)]:text-syntax-variable [&_.hljs-comment]:text-syntax-comment [&_:is(.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo)]:text-syntax-tag',
  /* A divider splits the text in two: 16px either side (Katerina, 9 October; 4 before). */
  divider: '[&_hr]:my-2 [&_hr]:border-border-default',
  table: '[&_:is(th,td)>p]:m-0 [&_:is(th,td)]:border [&_:is(th,td)]:border-border-default [&_:is(th,td)]:px-2 [&_:is(th,td)]:py-1 [&_:is(th,td)]:text-left [&_:is(th,td)]:align-top [&_table]:w-full [&_table]:border-collapse [&_th]:bg-bg-code [&_th]:font-medium [&_th]:text-text-primary',
  /* Bold in the heading colour, not only heavier. An underlined word draws a faint line, so it does not read as a link (Katerina, 9 October). */
  marks: '[&_em]:italic [&_strong]:font-semibold [&_strong]:text-text-primary [&_u]:underline [&_u]:decoration-text-muted [&_u]:underline-offset-2',
  /* Lines 1.5 apart (Katerina, 9 October; 1.4 before). */
  default: 'text-body-2 leading-normal [&>:is(h2,h3)]:text-body-2 [&>:is(h2,h3)]:font-semibold [&>h1]:text-h4',
  /* Blocks 6px apart; a heading keeps its 12px above and 8px below. */
  small: 'gap-1.5 text-caption leading-snug [&>:is(h1,h2,h3)]:mb-0.5 [&>:is(h1,h2,h3)]:mt-1.5 [&>:is(h1,h2,h3)+:is(h1,h2,h3)]:mt-1 [&>:is(h1,h2,h3):last-child]:mb-0 [&>:is(h2,h3)]:text-caption [&>:is(h2,h3)]:font-semibold [&>h1]:text-body-2 [&>h1]:font-semibold',
}

/**
 * RichText's look, for a box you draw yourself: an editor's, so that what is
 * being written looks the same as what is read. Put it on the editor's root.
 */
export function richTextClassName(size: RichTextSize = 'default', className?: string) {
  const { base, headings, lists, quote, code, codeBlock, syntax, divider, table, marks } = RICH_TEXT_CLASSES
  return cn(base, headings, lists, quote, code, codeBlock, syntax, divider, table, marks, RICH_TEXT_CLASSES[size], className)
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
          return <code key={i}>{run.text}</code>
        }
        // A line break inside a run is a line break.
        let node: ReactNode = run.text.split('\n').map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {textWithLinks(line, draw.renderText)}
          </span>
        ))
        if (run.marks.includes('underline')) node = <u>{node}</u>
        if (run.marks.includes('italic')) node = <em>{node}</em>
        if (run.marks.includes('bold')) node = <strong>{node}</strong>
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
        >
          {(cell.children ?? []).map((child, j) => <Runs key={j} runs={child.inline} draw={draw} />)}
          <Runs runs={cell.inline} draw={draw} />
        </Cell>
      )
    })
  const first = rows[0].children ?? []
  const headerRow = first.length > 0 && first.every((cell) => named(cell) === 'tableHeader')
  return (
    <table data-block-id={block.id}>
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
  switch (block.type) {
    case 'heading': {
      if (block.level === 1) return <h1 data-block-id={block.id}>{runs}</h1>
      if (block.level === 3) return <h3 data-block-id={block.id}>{runs}</h3>
      return <h2 data-block-id={block.id}>{runs}</h2>
    }
    case 'paragraph':
      return <p data-block-id={block.id}>{runs}</p>
    case 'bulletList':
    case 'orderedList': {
      const items = (block.children ?? []).map((item, i) => (
        <li key={item.id ?? i} data-block-id={item.id}>
          <Runs runs={item.inline} draw={draw} />
        </li>
      ))
      return block.type === 'bulletList'
        ? <ul data-block-id={block.id}>{items}</ul>
        : <ol data-block-id={block.id} start={block.start}>{items}</ol>
    }
    case 'blockquote':
      return <blockquote data-block-id={block.id}>{runs}</blockquote>
    case 'codeBlock':
      // Literal: no marks, no links, no chips. A long line wraps; nothing scrolls sideways.
      // In a language highlight.js knows, each word takes its colour; in any other, the text as it is.
      return (
        <pre data-block-id={block.id} data-language={block.language}>
          <code>{codeColours((block.inline ?? []).map((run) => run.text).join(''), block.language)}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr data-block-id={block.id} />
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
  const draw: Draw = { renderText, renderReference, renderBlock }
  return (
    <div data-rich-text className={richTextClassName(size)}>
      {blocks.map((block, i) => <Block key={block.id ?? i} block={block} draw={draw} />)}
    </div>
  )
}
