import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
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
  /** On the card's surface: its width. */
  className?: string
  /**
   * On the scrolling content: its padding (default 12px) and rhythm. The
   * padding sits inside the scrolling box, as in `Popover`, so the scrollbar
   * hugs the card's edge — its thumb 3px from it, like every panel's
   * (Katerina, 19 September; it sat 12px in, behind the card's padding).
   */
  contentClassName?: string
  /** Extra classes on the trigger wrapper — e.g. `block w-full` for a row. */
  wrapperClassName?: string
  /**
   * A tap on the trigger opens the card, and a second tap closes it, for a
   * touch screen, where nothing hovers (ACT-4: the dot beside a page's title).
   * A mouse still opens it by resting. Off by default: a row's card stays
   * hover-only, because a tap on a row opens the row.
   */
  openOnTap?: boolean
  /**
   * Called once each time the card opens (`true`) and once each time it closes (`false`), however it got there: a
   * pointer resting, keyboard focus, a tap with `openOnTap`, Escape, a press outside, or the card unmounted while
   * open. Never twice in a row with the same value, and never on a render. For a caller that counts what the card
   * held as seen, the seen moment is the `false` that follows a `true` — leaving the card after it was open — never
   * the `true`.
   */
  onOpenChange?: (open: boolean) => void
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

export function PreviewCard({ content, children, side = 'right', delay = OPEN_DELAY, closeDelay = CLOSE_DELAY, className, contentClassName, wrapperClassName, openOnTap = false, onOpenChange: onOpenChangeProp }: PreviewCardProps) {
  // Held here always, so turning `openOnTap` on or off never switches the card between controlled and not; without it
  // every change is Base UI's own (hover, focus, Escape, a press outside), as before.
  const [open, setOpen] = useState(false)
  // The caller hears the open state itself change, never a report of it: Base UI may report open again when focus
  // lands in a card the pointer opened, and a tap may set what is already there, and neither changes `open`. The
  // cleanup is the close, and it runs once whether the card closes or is unmounted while open.
  const tell = useRef(onOpenChangeProp)
  useEffect(() => {
    tell.current = onOpenChangeProp
  })
  useEffect(() => {
    if (!open) return
    tell.current?.(true)
    return () => tell.current?.(false)
  }, [open])
  // The press the next click belongs to: its pointer type, and whether the card was open when it went down. A tap
  // focuses a button inside, and focus may open the card before the click, so the click sets the opposite of what was
  // there before the press, not of what focus just did. The click uses it up.
  const press = useRef<{ pointerType: string; wasOpen: boolean } | undefined>(undefined)
  // The last press's pointer type, which outlives the click: it says whether a focus that opens the card came from a tap.
  const lastPointer = useRef<string | undefined>(undefined)
  const onOpenChange = (next: boolean, details: BasePreviewCard.Root.ChangeEventDetails) => {
    // Base UI opens on focus after its delay, on a timer a tap's close does not cancel: after a touch, a tapped-shut
    // card would open again a moment later. On a touch screen only a tap opens it.
    if (openOnTap && next && details.reason === 'trigger-focus' && lastPointer.current === 'touch') return
    setOpen(next)
  }
  const tapHandlers = openOnTap
    ? {
        onPointerDown: (event: PointerEvent) => {
          press.current = { pointerType: event.pointerType, wasOpen: open }
          lastPointer.current = event.pointerType
        },
        onClick: () => {
          const last = press.current
          press.current = undefined
          // A mouse or a pen opens it by resting, as Base UI treats both as able to hover. A touch, or a click with no
          // press before it (a screen reader's double-tap sends only the click), sets the opposite.
          if (last?.pointerType === 'mouse' || last?.pointerType === 'pen') return
          setOpen(!(last ? last.wasOpen : open))
        },
      }
    : {}
  return (
    <BasePreviewCard.Root open={open} onOpenChange={onOpenChange}>
      {/* The part renders an `<a>` by default, which a row is not; `render`
          makes it the wrapper this component has always been, and the trigger
          inside keeps whatever element it already is. */}
      <BasePreviewCard.Trigger
        delay={delay}
        closeDelay={closeDelay}
        render={<span className={cn('inline-flex', wrapperClassName)} />}
        {...tapHandlers}
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
            className={cn('w-[360px] p-0 outline-none', className)}
            render={<MenuPanel />}
          >
            <ScrollArea viewportClassName="max-h-[min(300px,var(--available-height))]" contentClassName={cn('flex flex-col gap-3 p-3', contentClassName)}>
              {content}
            </ScrollArea>
          </BasePreviewCard.Popup>
        </BasePreviewCard.Positioner>
      </BasePreviewCard.Portal>
    </BasePreviewCard.Root>
  )
}
