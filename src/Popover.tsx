import { useMemo, useRef, type ReactNode } from 'react'
import { Popover as BasePopover } from '@base-ui/react/popover'
import { cn } from './cn'
import { MenuPanel } from './Menu'

/**
 * A floating panel from a trigger — the same elevated surface a `Menu` uses,
 * with none of a menu's semantics. New at stage 4 (2026-09-07).
 *
 * **It exists because `Menu` was being used for this.** Peek's selection
 * toolbar puts a text field inside one, and its debug panel fills one with
 * toggle rows; neither is a list of actions, and since the menus moved onto
 * Base UI a `Menu` gives its contents roving focus and typeahead, which is
 * wrong for both and fights a text field outright. Beyond those two, Peek
 * hand-writes overlay behaviour in thirteen files — six `createPortal`, five
 * outside-click listeners, seven position calculations against
 * `window.innerWidth` (`COMPONENTS-PEEK.md` F5). This is what they become.
 *
 * The API is `Menu`'s, deliberately, so moving a surface across is a change of
 * one word: the same `onClose`, the same three anchorings, the same `trigger`.
 * What differs is inside — a `Popover` announces itself as a dialog, its
 * contents are ordinary content, and Tab walks them in order.
 */
export interface PopoverProps {
  onClose: () => void
  /** The trigger — an element, or the rect a click handler already measured.
   *  The panel portals to the body and places itself against it. */
  anchor?: HTMLElement | DOMRect | null
  /** With `anchor`: which of the panel's edges hangs from the anchor's. Default left. */
  align?: 'left' | 'right'
  /** Viewport coordinates; the panel is portalled, hung from `top`, aligned to whichever edge is given, and kept on screen. */
  position?: { top: number; right: number } | { top: number; left: number }
  /**
   * The control that opens this panel, when it is not the `anchor`. A press on
   * it is that control's own toggle, not a press outside — see `Menu`, which
   * has the same trap for the same reason.
   */
  trigger?: HTMLElement | null
  /** Names the panel for assistive tech. A panel with a visible heading can
   *  point at it instead, with `aria-labelledby`. */
  ariaLabel?: string
  children: ReactNode
  className?: string
}

/** The 4px between the panel and what it hangs from, and the 8px it keeps
 *  clear of every screen edge — `Menu`'s numbers, because it is the same box. */
const GAP = 4
const VIEWPORT_PAD = 8

function virtualAnchor(x: number, y: number) {
  return { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }
}

export function Popover({ onClose, anchor, align = 'left', position, trigger, ariaLabel, children, className }: PopoverProps) {
  const markerRef = useRef<HTMLSpanElement>(null)
  const inFlow = !anchor && !position
  const posLeft = position && 'left' in position ? position.left : undefined
  const posRight = position && 'right' in position ? position.right : undefined
  const posTop = position?.top

  const anchorTarget = useMemo(() => {
    if (anchor) return anchor instanceof Element ? anchor : { getBoundingClientRect: () => anchor }
    if (posTop !== undefined) {
      const x = posLeft ?? (posRight !== undefined ? window.innerWidth - posRight : 0)
      return virtualAnchor(x, posTop)
    }
    return () => markerRef.current?.parentElement ?? null
  }, [anchor, posLeft, posRight, posTop])

  const alignEnd = inFlow || align === 'right' || posRight !== undefined

  return (
    <>
      {inFlow && <span ref={markerRef} className="hidden" aria-hidden="true" />}
      <BasePopover.Root
        open
        onOpenChange={(next, details) => {
          if (next) return
          const opener = trigger ?? (anchor instanceof Element ? anchor : null) ?? markerRef.current?.parentElement
          /* A press on the control this panel hangs from is that control's own
             toggle, not a press outside — the same trap `Menu` documents. */
          if (details.reason === 'outside-press' && opener?.contains(details.event.target as Node)) return
          onClose()
        }}
        /* Non-modal: the page behind keeps its scrollbar, so opening a panel
           never shifts the layout, and a toolbar over a text selection must not
           take the page away from the person using it. */
        modal={false}
      >
        <BasePopover.Portal>
          <BasePopover.Positioner
            anchor={anchorTarget}
            side="bottom"
            align={alignEnd ? 'end' : 'start'}
            sideOffset={position ? 0 : GAP}
            collisionPadding={VIEWPORT_PAD}
            className="z-50 data-[anchor-hidden]:hidden"
          >
            <BasePopover.Popup
              aria-label={ariaLabel}
              /* A field inside the panel keeps the focus its `autoFocus` asks
                 for — the link editor's URL box is the reason this component
                 exists, and a popup that steals focus from it is useless. Base
                 UI does not move focus that has already landed inside. */
              className={cn('min-w-[180px] max-h-[var(--available-height)] overflow-y-auto outline-none', className)}
              render={<MenuPanel />}
            >
              {children}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </>
  )
}
