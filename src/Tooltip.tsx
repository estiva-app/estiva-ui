import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { cn } from './cn'
import { Kbd } from './Kbd'

/**
 * Peek's Tooltip and WithTooltip (2026-08-28) — the same 30px elevated pill,
 * on Base UI's `Tooltip` since stage 4 of the migration (2026-09-07).
 *
 * **What that fixed, and this page used to say it did not: it shows on
 * keyboard focus.** `WithTooltip` was hover-only, which meant the reason a
 * disabled control gives — the whole point of `disabledReason` — could not be
 * read without a mouse. Base UI opens it on `:focus-visible` too, so tabbing
 * to a control says what it is.
 *
 * Gone with it: the `createPortal`, the `getBoundingClientRect` arithmetic and
 * the two clamps this file kept against the viewport's edges. Floating UI
 * places and flips it now.
 */

/**
 * How long the pointer must rest on a trigger before the tooltip appears
 * (Katerina, D23, 2026-09-07). It was instant, which flashed a pill per
 * button when sweeping a toolbar; 300ms is long enough to be a decision and
 * short enough not to feel like waiting.
 *
 * Inside a `TooltipProvider` the *neighbours* then open instantly, so a row
 * of icon buttons pauses once and reads freely after that.
 */
const OPEN_DELAY = 300

export interface TooltipProviderProps {
  /** Before the first tooltip in the group opens. Default 300ms (D23). */
  delay?: number
  /** Before one closes. Default: immediately, as it always has. */
  closeDelay?: number
  /** How long after one closes its neighbours still open instantly. */
  timeout?: number
  children: ReactNode
}

/**
 * Mount once at the top of an app: it makes every tooltip below it share one
 * delay, so the second and third open instantly while the group is warm.
 *
 * Without it each tooltip still waits its own 300ms — nothing breaks, the row
 * simply pauses on every button instead of once.
 */
export function TooltipProvider({ delay = OPEN_DELAY, closeDelay, timeout, children }: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay} timeout={timeout}>
      {children}
    </BaseTooltip.Provider>
  )
}

/** `ComponentPropsWithRef` because the pill is what `Tooltip.Popup` renders —
 *  Base UI merges its own props and ref into this element, so both must land. */
export interface TooltipProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  label: string
  /** The key that does the same thing, drawn as the `Kbd` chip after the label.
   *  Pass it already formatted for the platform — this renders, it does not
   *  decide whether the modifier is a glyph or a word. */
  shortcut?: string
}

export function Tooltip({ label, shortcut, className, ...props }: TooltipProps) {
  return (
    <div role="tooltip" className={cn('bg-bg-elevated border border-border-default rounded-lg h-[30px] flex items-center justify-center gap-1.5 px-2 shadow-lg', className)} {...props}>
      <span className="text-caption text-text-primary whitespace-nowrap">{label}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </div>
  )
}

export interface WithTooltipProps {
  label: string
  /** Passed straight to the surface — see `TooltipProps.shortcut`. */
  shortcut?: string
  placement?: 'top' | 'bottom'
  /** Extra classes on the wrapper — e.g. `min-w-0 shrink` so a truncating label keeps truncating inside it. */
  wrapperClassName?: string
  children: ReactNode
}

/** The 6px between the trigger and the pill, and the 8px it keeps clear of
 *  every viewport edge — the two numbers the deleted arithmetic used. */
const GAP = 6
const VIEWPORT_PAD = 8

/**
 * The portalled surface: everything after the trigger, written once because
 * `WithTooltip` and the two buttons all need it.
 *
 * `pointer-events-none` and `disableHoverablePopup` together keep the pill
 * untouchable, as it has always been — a tooltip is not somewhere you can put
 * the pointer, and anything you must reach belongs in a Menu or a dialog.
 */
function TooltipSurface({ label, shortcut, placement }: { label: string; shortcut?: string; placement: 'top' | 'bottom' }) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={placement}
        align="center"
        sideOffset={GAP}
        collisionPadding={VIEWPORT_PAD}
        // `fixed`, as the hand-written one was: the pill is placed against the
        // viewport, so a scroll container between it and the body cannot drag
        // it out of place.
        positionMethod="fixed"
        className="pointer-events-none z-[9999]"
      >
        <BaseTooltip.Popup
          render={
            <Tooltip
              label={label}
              shortcut={shortcut}
              /*
               * The motion (Katerina, D26, 2026-09-07). It had none — it was
               * mounted and instantly there — and Base UI is what makes one
               * possible: `data-starting-style` on the opening frame,
               * `data-ending-style` while it closes, and the popup is kept in
               * the DOM until the transition finishes, which is the half a
               * hand-written tooltip cannot do.
               *
               * It fades and travels 4px away from the trigger: from below
               * when it stands above the control (`data-side=top`), from above
               * when it hangs beneath it. 120ms in, 80ms out.
               *
               * `data-instant` is Base UI saying skip it — the pointer moved
               * to a neighbouring trigger inside the warm delay group, or the
               * tooltip was dismissed. Sweeping a toolbar therefore moves the
               * pill without re-animating it, which is the whole point of the
               * shared delay (D23).
               */
              className={cn(
                'transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none',
                'data-[ending-style]:duration-[80ms] data-[instant]:duration-0',
                'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
                'data-[side=top]:data-[starting-style]:translate-y-[4px] data-[side=top]:data-[ending-style]:translate-y-[4px]',
                'data-[side=bottom]:data-[starting-style]:-translate-y-[4px] data-[side=bottom]:data-[ending-style]:-translate-y-[4px]',
              )}
            />
          }
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

export function WithTooltip({ label, shortcut, placement = 'top', wrapperClassName, children }: WithTooltipProps) {
  return (
    <BaseTooltip.Root disableHoverablePopup>
      {/* The wrapper stays the trigger: `WithTooltip` wraps whatever it is
          given — a raw button, a span, a Chip — and only an element of its own
          can carry the handlers for all of them. A control that IS the trigger
          (Button, IconButton) composes the part onto itself instead, which is
          what lets a `Dialog.Close` or a `Menu.Trigger` be one of those. */}
      <BaseTooltip.Trigger delay={OPEN_DELAY} render={<div className={cn('inline-flex shrink-0', wrapperClassName)} />}>
        {children}
      </BaseTooltip.Trigger>
      <TooltipSurface label={label} shortcut={shortcut} placement={placement} />
    </BaseTooltip.Root>
  )
}

/**
 * The tooltip a control wears itself, rather than through a wrapper.
 *
 * `Button` and `IconButton` call this: the Base UI button element becomes the
 * `Tooltip.Trigger`, so the component's root stays the `<button>`. That is
 * what stage 3 ran into and could not fix — an `IconButton` with a tooltip
 * returned the wrapper `<div>`, so a `Dialog.Close` composed onto the wrapper
 * and the ✕ could never be the part.
 *
 * Internal: the two buttons' `tooltip` / `disabledReason` props are the API.
 */
export function TooltipTrigger({ label, shortcut, placement = 'top', children }: { label: string; shortcut?: string; placement?: 'top' | 'bottom'; children: ReactElement }) {
  return (
    <BaseTooltip.Root disableHoverablePopup>
      {/* `children` is the control itself, so it is what the part renders —
          a `ReactElement`, not a `ReactNode`, because `render` takes one
          element and there is nothing sensible to do with two. */}
      <BaseTooltip.Trigger delay={OPEN_DELAY} render={children} />
      <TooltipSurface label={label} shortcut={shortcut} placement={placement} />
    </BaseTooltip.Root>
  )
}
