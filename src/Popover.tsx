import { useMemo, type ReactElement, type ReactNode, type RefObject } from 'react'
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
 * **The API is `Menu`'s**: it takes the `trigger` and owns everything after —
 * the toggle, the placement, the dismissal and the focus return. What differs
 * is inside: a `Popover` announces itself as a dialog, its contents are
 * ordinary content, and Tab walks them in order.
 *
 * The one thing a `Menu` has no use for is the second mode below: a panel with
 * no trigger element at all, hung from a rect the caller measured — a toolbar
 * over a text selection. That mode is controlled, because there is nothing for
 * Base UI to watch.
 */
export interface PopoverProps {
  /**
   * The control that opens the panel. Any element that forwards its ref and
   * spreads its props — this package's `Button`, `IconButton` and
   * `PersonTrigger` all do.
   *
   * Base UI can only do the toggle, the placement, the dismissal and the focus
   * return if it knows which element opened the panel. Give it the trigger
   * unless there is genuinely no element to give — see `anchor`.
   */
  trigger?: ReactElement
  /**
   * For a panel with **no trigger element**: an element, or a rect the caller
   * measured — a text selection's. Pair it with `open`, since there is nothing
   * for Base UI to watch.
   *
   * An anchored panel **does not take focus**, because the person is still in
   * whatever produced it. That also means it cannot be reached by keyboard, so
   * everything in one must be reachable another way.
   *
   * Render it always and toggle `open`; do not mount it only while it is open.
   */
  anchor?: HTMLElement | DOMRect | null
  /** Which of the panel's edges hangs from the trigger's. Default left. */
  align?: 'left' | 'right'
  /**
   * Which side of the trigger, or of the anchor, the panel prefers. Default
   * `bottom`.
   *
   * **A toolbar over a text selection wants `top`** (Katerina, 2026-09-08):
   * below, it covers the line you are about to read next, and it is the line
   * *after* the selection that tells you what you have selected. It is a
   * preference, not a promise — Base UI flips it when that side has no room.
   */
  side?: 'top' | 'bottom'
  /** Controlled, for a caller that must know or must force it. Required with
   *  `anchor`; with a `trigger`, leave both off and the panel keeps its own. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Where focus goes when the panel closes. With a `trigger` it goes back to
   * the trigger and this is not needed. An anchored panel never took focus, so
   * this only matters when something inside it did — a field the person tabbed
   * or clicked into: point it at what they came from, or focus is left on the
   * document body.
   */
  finalFocus?: RefObject<HTMLElement | null>
  /** Base UI's imperative handle. `actions.current?.close()` shuts the panel —
   *  for the Cancel and Save buttons a form panel ends with. */
  actionsRef?: RefObject<{ close: () => void; unmount: () => void } | null>
  /** Names the panel for assistive tech. A panel with a visible heading can
   *  point at it instead, with `aria-labelledby`. */
  ariaLabel?: string
  children: ReactNode
  /** On the panel's surface — its width, its internal rhythm. */
  className?: string
}

/** The 4px between the panel and what it hangs from, and the 8px it keeps
 *  clear of every screen edge — `Menu`'s numbers, because it is the same box. */
const GAP = 4
const VIEWPORT_PAD = 8

export function Popover({ trigger, anchor, align = 'left', side = 'bottom', open, onOpenChange, finalFocus, actionsRef, ariaLabel, children, className }: PopoverProps) {
  /* A rect is not an element, so it becomes a virtual anchor — the one shape
     Floating UI takes besides an element. */
  const anchorTarget = useMemo(() => {
    if (!anchor) return undefined
    if (anchor instanceof Element) return anchor
    return { getBoundingClientRect: () => anchor }
  }, [anchor])

  return (
    <BasePopover.Root
      open={open}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      actionsRef={actionsRef}
      /* Non-modal: the page behind keeps its scrollbar, so opening a panel
         never shifts the layout, and a toolbar over a text selection must not
         take the page away from the person using it. */
      modal={false}
    >
      {trigger && <BasePopover.Trigger render={trigger} />}
      <BasePopover.Portal>
        <BasePopover.Positioner
          anchor={anchorTarget}
          side={side}
          align={align === 'right' ? 'end' : 'start'}
          sideOffset={GAP}
          collisionPadding={VIEWPORT_PAD}
          className="z-50 data-[anchor-hidden]:hidden"
        >
          <BasePopover.Popup
            aria-label={ariaLabel}
            /*
             * From a trigger, focus lands on the first thing in the panel —
             * the field, in the panel this component exists for — and goes
             * back to the trigger when it closes.
             *
             * From an anchor, it does not move at all. A panel with no trigger
             * appeared rather than being asked for, and the person is still in
             * the middle of what produced it: a toolbar over a text selection
             * that took the caret out of the text would end the edit it exists
             * to serve. Measured 2026-09-08: with focus moved into the panel,
             * the first control's tooltip opens on `:focus-visible` and eats
             * the Escape that should have closed the panel, and the caller's
             * re-read of the selection fights the panel's own dismissal — both
             * intermittently. Neither happens once focus stays put.
             *
             * The cost is stated on the page: an anchored panel cannot be
             * reached by keyboard, so what is in one must also be reachable
             * some other way.
             */
            initialFocus={trigger ? undefined : false}
            finalFocus={finalFocus}
            className={cn('min-w-[180px] max-h-[var(--available-height)] overflow-y-auto outline-none', className)}
            render={<MenuPanel />}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}
