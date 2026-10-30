/**
 * A part of something longer, shared live: its blocks as they are now, under
 * the header of what it is part of (why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-shared-part-of-a-page-is-a-selected-run-of-blocks.md).
 * There is no row or card choice for a part: it draws itself. The app draws
 * the blocks and passes them as `children`.
 *
 * Look C (Katerina, 29 Oct): what it is part of as a card starts, its kind in a
 * file's 36px tile, its title and "A part of ABC-2" under it; then the blocks
 * behind a quote bar that starts where the tile does.
 */
import { useContext, type ReactNode } from 'react'
import { Card } from './Card'
import { cn } from './cn'
import { Link } from './Link'
import { LinkCardLoading } from './LinkCard'
import { inTheBox, type LinkedKind } from './linked'
import { kindNounOf, LinkTile } from './LinkParts'
import { LinkUnavailable, UnavailableRow } from './LinkRow'
import { QUOTE_BAR_CLASSES } from './looks'
import { ShowMore } from './ShowMore'

/**
 * Where a part's lookup stands, SPEC §13.6.1's five states and loading:
 * `ready` (resolved), `unaddressable` (what it is part of has no blocks),
 * `detached` (readable, its block gone), `deleted` (a trusted deletion names
 * what it is part of) and `unavailable` (not the reader's to see).
 */
export type PartCardState = 'ready' | 'loading' | 'unavailable' | 'deleted' | 'detached' | 'unaddressable'

export interface PartCardProps {
  /** Where its lookup stands. Default `ready`. */
  state?: PartCardState
  /** What it is part of, by its icon. */
  kind: LinkedKind
  /** The title of what it is part of. */
  heading?: string
  /** Opens what it is part of, at the part; `unaddressable`, the whole of it. */
  href?: string
  /** The key of what it is part of: "ABC-2". */
  partKey?: string
  /** What it is part of, in a word, for "A part of this issue not available". Absent, its kind's word. */
  noun?: string
  /** Where it may still open, for someone who can, when it is not available. */
  openIn?: { app: string; href: string }
  /** The part's blocks, drawn by the app. */
  children?: ReactNode
  /**
   * The way out to where the part lives: a small `Button` with a leading icon ("Open in Leaf"). Drawn under the
   * blocks at the right, level with Show more, outside the quote bar (Katerina, 30 Oct: "the vertical line should not
   * be covering the button"). Peek and Ship put it in ShowMore's row inside the blocks before.
   */
  action?: ReactNode
  /** Cut the blocks at this height, in px, behind ShowMore's fade and its Show more. Absent, they are drawn whole. */
  maxHeight?: number
}

export function PartCard({ state = 'ready', kind, heading, href, partKey, noun, openIn, children, action, maxHeight }: PartCardProps) {
  const word = noun ?? kindNounOf({ kind }) ?? 'File'
  const boxed = useContext(inTheBox)
  if (state === 'loading') return <LinkCardLoading kind={kind} shape={{ summary: true, rows: 0, footer: 'none' }} />
  if (state === 'unavailable' || state === 'deleted') {
    return <LinkUnavailable kind={kind} noun={`A part of this ${word.toLowerCase()}`} openIn={openIn} deleted={state === 'deleted'} card />
  }
  // The SPEC's words (§13.6.1): what it is part of is still there; the part is not, or cannot be one.
  if (state === 'detached') return <UnavailableRow kind={kind} words="This part was deleted" card />
  if (state === 'unaddressable') return <UnavailableRow kind={kind} words="This part can't be shown" href={href} card />
  return (
    // At most 480px wide, in a box too; in a box being written in, on the files' fill as the card beside it is.
    <Card fill={boxed ? 'elevated' : 'inset'} className="flex max-w-[480px] flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <LinkTile kind={kind} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="block min-w-0 text-body-2-strong text-text-primary">
            {/* In a box being written in, its words alone: the draft is not left for it. */}
            {href && !boxed ? (
              <Link href={href} variant="quiet" truncate className="block">
                {heading}
              </Link>
            ) : (
              <span className="block truncate">{heading}</span>
            )}
          </span>
          <span className="truncate text-caption text-text-secondary">{partKey ? `A part of ${partKey}` : `A part of this ${word.toLowerCase()}`}</span>
        </span>
      </div>
      {/* The quote bar starts where the tile above it starts (Katerina, 29 Oct), and runs beside the blocks only. */}
      {action || maxHeight !== undefined ? (
        <ShowMore maxHeight={maxHeight ?? Infinity} surface={boxed ? 'elevated' : 'inset'} action={action} contentClassName={QUOTE_BAR_CLASSES}>
          {children}
        </ShowMore>
      ) : (
        <div className={QUOTE_BAR_CLASSES}>{children}</div>
      )}
    </Card>
  )
}
