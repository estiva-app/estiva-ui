import type { ReactNode } from 'react'
import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card'
import { cn } from './cn'
import { ScrollArea } from './ScrollArea'
import { MenuPanel } from './Menu'

/**
 * More of a thing, on hover — a card beside a row that is only a snippet.
 * New at stage 4 (2026-09-07).
 *
 * **It exists because Peek's Screener preview is this, hand-written**: its own
 * `createPortal`, its own "prefer the right, flip left if it would run off
 * screen" arithmetic against `window.innerWidth`, and its own clamp against
 * the bottom edge (`ScreenerPreviewCard.tsx`). Floating UI does all three.
 *
 * **Not a Tooltip.** A tooltip is a word for a control, is
 * `pointer-events: none`, and may hold nothing you can reach. A preview card
 * holds *content* — faces, text, a link — and you can move the pointer into
 * it, which is what a preview is for. If what you have is a label, use
 * `WithTooltip`.
 *
 * The surface is the package's elevated panel, the same one a `Menu` draws, so
 * there is one definition of that box. Width, height and internal rhythm are
 * the caller's: a preview of a conversation is not the size of a preview of a
 * person.
 */
export interface PreviewCardProps {
  /** What the card holds. Rendered only while it is open. */
  content: ReactNode
  /** The row, name or avatar the card previews. */
  children: ReactNode
  /** Which side of the trigger to prefer. It flips when that side has no room. Default right. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Before it opens, in ms. Long enough that crossing a list does not flash a card at every row. */
  delay?: number
  /** After the pointer leaves, in ms — the grace that lets you cross the gap into the card. */
  closeDelay?: number
  /** On the card's surface: its width, its padding, a max height. */
  className?: string
  /** Extra classes on the trigger wrapper — e.g. `block w-full` for a row. */
  wrapperClassName?: string
}

/** The card's own numbers: 12px from the trigger, 8px clear of every screen
 *  edge. Peek's hand-written preview used 12 and 12; the 8 is the package's
 *  viewport margin, shared with every other floating surface. */
const GAP = 12
const VIEWPORT_PAD = 8
/** 350ms, which is Peek's number: `ScreenerItem`'s `HOVER_DELAY_MS`. Long
 *  enough not to flash a card at every row while a pointer crosses a list,
 *  short enough to feel like an answer. Taken rather than invented, because
 *  this component exists to replace that one. */
const OPEN_DELAY = 350
/** The diagonal from the row to the card has to survive. Peek's has no grace
 *  at all — it closes on `mouseleave` — because its card is
 *  `pointer-events: none` and there is nothing to cross to. Which also means
 *  **the `overflow-y-auto` on its 300px-capped card can never be scrolled**;
 *  here the card can be reached, so it can. */
const CLOSE_DELAY = 200

export function PreviewCard({ content, children, side = 'right', delay = OPEN_DELAY, closeDelay = CLOSE_DELAY, className, wrapperClassName }: PreviewCardProps) {
  return (
    <BasePreviewCard.Root>
      {/* The part renders an `<a>` by default, which a row is not; `render`
          makes it the wrapper this component has always been, and the trigger
          inside keeps whatever element it already is. */}
      <BasePreviewCard.Trigger
        delay={delay}
        closeDelay={closeDelay}
        render={<span className={cn('inline-flex', wrapperClassName)} />}
      >
        {children}
      </BasePreviewCard.Trigger>
      <BasePreviewCard.Portal>
        <BasePreviewCard.Positioner
          side={side}
          align="start"
          sideOffset={GAP}
          collisionPadding={VIEWPORT_PAD}
          className="z-50 data-[anchor-hidden]:hidden"
        >
          <BasePreviewCard.Popup
            className={cn('w-[360px] p-3 outline-none', className)}
            render={<MenuPanel />}
          >
            <ScrollArea viewportClassName="max-h-[calc(min(300px,var(--available-height))_-_1.5rem)]" contentClassName="flex flex-col gap-3 [&>*]:shrink-0">
              {content}
            </ScrollArea>
          </BasePreviewCard.Popup>
        </BasePreviewCard.Positioner>
      </BasePreviewCard.Portal>
    </BasePreviewCard.Root>
  )
}
