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
import { LinkUnavailable } from './LinkRow'
import { QUOTE_BAR_CLASSES } from './looks'

export interface PartCardProps {
  /** Where its lookup stands. Default `ready`. */
  state?: 'ready' | 'loading' | 'unavailable'
  /** What it is part of, by its icon. */
  kind: LinkedKind
  /** The title of what it is part of. */
  heading?: string
  /** Opens what it is part of, at the part. */
  href?: string
  /** The key of what it is part of: "ABC-2". */
  partKey?: string
  /** What it is part of, in a word, for "A part of this issue — not available.". Absent, its kind's word. */
  noun?: string
  /** Where it may still open, for someone who can, when it is not available. */
  openIn?: { app: string; href: string }
  /** The part's blocks, drawn by the app. */
  children?: ReactNode
}

export function PartCard({ state = 'ready', kind, heading, href, partKey, noun, openIn, children }: PartCardProps) {
  const word = noun ?? kindNounOf({ kind }) ?? 'File'
  const boxed = useContext(inTheBox)
  if (state === 'loading') return <LinkCardLoading kind={kind} shape={{ summary: true, rows: 0, footer: 'none' }} />
  if (state === 'unavailable') return <LinkUnavailable kind={kind} noun={`A part of this ${word.toLowerCase()}`} openIn={openIn} card />
  return (
    // In a box being written in, on the files' fill as the card beside it is; elsewhere at most 480px.
    <Card fill={boxed ? 'elevated' : 'inset'} className={cn('flex flex-col gap-3 p-3', !boxed && 'max-w-[480px]')}>
      <div className="flex items-center gap-3">
        <LinkTile kind={kind} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="block min-w-0 text-body-2-strong text-text-primary">
            {href ? (
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
      {/* The quote bar starts where the tile above it starts (Katerina, 29 Oct). */}
      <div className={QUOTE_BAR_CLASSES}>{children}</div>
    </Card>
  )
}
