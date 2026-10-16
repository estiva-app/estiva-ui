/**
 * The one card added under a piece of text, and the ✕ that removes it (why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/where-a-link-sits-and-which-file-gets-the-card.md).
 *
 * Under a box being written in, the ✕ always shows. Under text already sent
 * (`revealOnHover`) it shows when the pointer is over the card or the ✕ has
 * focus, and always on a screen that cannot hover, so a tap reaches it (Miky,
 * 16 Oct, kickoff).
 */
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { LinkCard } from './LinkCard'
import type { LinkState } from './linked'

export interface CardUnderProps {
  link: LinkState
  /** Draws the ✕. Without it the card shows with none, as it does to anyone but the author. */
  onRemove?: () => void
  /** The ✕ waits for hover or focus: under text already sent. Always shown on a screen that cannot hover. */
  revealOnHover?: boolean
}

export function CardUnder({ link, onRemove, revealOnHover = false }: CardUnderProps) {
  return (
    <div className="group/card flex max-w-[480px] items-start gap-1">
      <div className="min-w-0 flex-1">
        <LinkCard link={link} />
      </div>
      {onRemove && (
        // At the card's top corner: halfway down a tall card a ✕ reads as belonging to nothing.
        <div
          className={cn(
            'flex shrink-0 self-start pt-2',
            revealOnHover && 'opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100',
          )}
        >
          <IconButton aria-label="Remove card" tooltip="Remove card" onClick={onRemove}>
            <IconX size={16} />
          </IconButton>
        </div>
      )}
    </div>
  )
}
