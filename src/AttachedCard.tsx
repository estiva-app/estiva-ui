/**
 * The one card attached to a piece of text, and the ✕ that removes it (why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-link-on-words-counts-toward-the-card.md).
 *
 * Its ✕ is a file's (Katerina, 29 Oct): the round one on the card's corner, from
 * `AttachmentCard`, shown when the pointer is over the card or the ✕ has focus.
 * On a screen that cannot hover it always shows, so a tap reaches it (Miky, 16
 * Oct, kickoff). Inside a box being written in, `CommentBox` places it with the
 * files, and the card there reads as words on the files' fill (`inTheBox`).
 */
import type { ReactNode } from 'react'
import { RemoveBadge } from './AttachmentCard'
import { LinkCard } from './LinkCard'
import type { LinkState } from './linked'

interface AttachedCardBase {
  /** Draws the ✕. Without it the card shows with none, as it does to anyone but the author. */
  onRemove?: () => void
}

/**
 * The card is a `LinkCard` of `link`, or the app's own card as `children`: an
 * app that draws a sent card itself draws the one in its box the same way.
 */
export type AttachedCardProps = AttachedCardBase & ({ link: LinkState; children?: never } | { link?: never; children: ReactNode })

export function AttachedCard({ link, children, onRemove }: AttachedCardProps) {
  return (
    <div className="group/card relative max-w-[480px]">
      {link ? <LinkCard link={link} /> : children}
      {onRemove && (
        <RemoveBadge
          label="Remove card"
          onRemove={onRemove}
          className="opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        />
      )}
    </div>
  )
}
