/**
 * A part of something longer, shared live: its blocks as they are now, under
 * the header of what it is part of (why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-shared-part-of-a-page-is-a-selected-run-of-blocks.md).
 * There is no row or card choice for a part: it draws itself. The app draws
 * the blocks and passes them as `children`.
 */
import { useContext, type ReactNode } from 'react'
import { Card } from './Card'
import { Link } from './Link'
import { LinkCardLoading } from './LinkCard'
import { inTheBox, type LinkedKind } from './linked'
import { LinkedIcon, LinkKey } from './LinkParts'
import { LinkUnavailable } from './LinkRow'

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
  /** What it is part of, in a word, for "A part of this item — not available.". */
  noun?: string
  /** Where it may still open, for someone who can, when it is not available. */
  openIn?: { app: string; href: string }
  /** The part's blocks, drawn by the app. */
  children?: ReactNode
}

export function PartCard({ state = 'ready', kind, heading, href, partKey, noun = 'Item', openIn, children }: PartCardProps) {
  const boxed = useContext(inTheBox)
  if (state === 'loading') return <LinkCardLoading kind={kind} shape={{ summary: true, rows: 0, footer: 'none' }} />
  if (state === 'unavailable') return <LinkUnavailable kind={kind} noun={`A part of this ${noun.toLowerCase()}`} openIn={openIn} />
  const header = (
    <>
      <LinkedIcon kind={kind} />
      {partKey && <LinkKey>{partKey}</LinkKey>}
      <span className="truncate">{heading}</span>
    </>
  )
  return (
    // In a box being written in, on the files' fill as the card beside it is.
    <Card fill={boxed ? 'elevated' : 'inset'} className="flex flex-col gap-2 p-3">
      <span className="flex min-w-0 items-center gap-2 text-body-2-strong text-text-primary">
        {href ? (
          <Link href={href} variant="quiet" className="flex min-w-0 items-center gap-2">
            {header}
          </Link>
        ) : (
          header
        )}
      </span>
      <div className="border-l-2 border-border-default pl-3">{children}</div>
    </Card>
  )
}
