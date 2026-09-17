import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn } from './cn'
import { useFormBusy } from './formBusy'
import { TooltipTrigger } from './Tooltip'

/**
 * Peek's IconButton (2026-08-28), verbatim: a square 4px-padded button
 * around a 16px icon, 8px radius, three variants, an optional tooltip that
 * portals above or below. Plus `type="button"` by default (Ship's addition),
 * so it never submits a form by accident. On Base UI's Button since stage 2
 * of the migration (2026-09-07).
 *
 * `disabledReason` disables it, keeps it reachable by keyboard, and shows
 * the reason in place of the tooltip — see Button.
 */
export type IconButtonVariant = 'muted' | 'outlined' | 'primary' | 'current' | 'resolve'

/** `ComponentPropsWithRef` so a `ref` reaches the element — see Button. */
export interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  /**
   * `current` takes the colour of what it sits in — the ✕ on a `Banner` wears
   * the banner's tone. `resolve` is `muted` that turns green when pointed at in
   * Signal, Peek's Resolve (UIG-9, 17 September; before, each app passed these
   * as classes).
   */
  variant?: IconButtonVariant
  /** On, like a Bold button while the selection is bold: the active fill, and `aria-pressed`. */
  pressed?: boolean
  /** A glow in Signal — the send arrow while there is something to send. */
  glow?: boolean
  tooltip?: string
  /** A key hint drawn as the `Kbd` chip inside the tooltip — for a button
   *  whose only other affordance is a keyboard shortcut. */
  tooltipShortcut?: string
  tooltipPlacement?: 'top' | 'bottom'
  /** Why the action cannot succeed right now. Disables the button, keeps it
   *  reachable by keyboard, and shows the reason as the tooltip. */
  disabledReason?: string
  /** The icon: 16px, stroke 1.5. */
  children: ReactNode
}

export function IconButton({
  variant = 'muted',
  pressed,
  glow = false,
  className,
  children,
  disabled,
  disabledReason,
  tooltip,
  tooltipShortcut,
  tooltipPlacement,
  type = 'button',
  ...props
}: IconButtonProps) {
  // Inside a busy Form: switched off, and looking it (formBusy.ts).
  const formBusy = useFormBusy()
  const button = (
    <BaseButton
      type={type}
      disabled={disabled || !!disabledReason || formBusy}
      focusableWhenDisabled={!!disabledReason}
      className={(state) =>
        cn(
          // `shrink-0` stops a flex parent squashing the button; `self-center`
          // stops one stretching it. Two different failures, and both have
          // happened here: a row with no `items-*` drew this 24 wide and 228
          // tall in Peek's TopicMoreMenu story (Katerina, 2026-09-11). A button
          // is the size of its icon and its padding, whatever box it lands in.
          //
          // This is the one of the two that needs it: an IconButton states no
          // height, so its cross size is `auto` and a stretching parent takes
          // it. Measured in the same 260px row on 2026-09-12: 24px with this
          // class, 226px without. `Button` states `h-8`/`h-6`, so it cannot be
          // stretched and carries no `self-center` — see the note there.
          'flex items-center justify-center p-1 rounded-lg transition-colors shrink-0 self-center cursor-pointer',
          !state.disabled && variant === 'primary' && 'bg-accent-primary hover:bg-accent-hover text-text-inverse',
          !state.disabled && (variant === 'muted' || variant === 'resolve') && 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
          !state.disabled && variant === 'outlined' && 'border border-border-default hover:bg-bg-hover text-text-secondary',
          !state.disabled && variant === 'current' && 'hover:bg-bg-hover',
          state.disabled && variant === 'primary' && 'bg-bg-disabled text-text-disabled',
          state.disabled && (variant === 'muted' || variant === 'resolve') && 'text-text-disabled',
          state.disabled && variant === 'outlined' && 'border border-border-default text-text-disabled',
          // Always, disabled too: the colour of where it sits, and Resolve's green.
          variant === 'current' && 'text-current',
          variant === 'resolve' && 'signal:hover:bg-success-muted signal:hover:text-success-default',
          pressed && 'bg-bg-active text-text-primary',
          glow && 'signal:shadow-glow-accent',
          // `pointer-events-none` only where the button is truly out of reach:
          // with a `disabledReason` the button IS the tooltip's trigger, and a
          // trigger the pointer cannot land on never opens one. Base UI already
          // swallows the click.
          state.disabled && !disabledReason && 'pointer-events-none',
          state.disabled && 'cursor-not-allowed',
          className,
        )
      }
      aria-pressed={pressed}
      {...props}
    >
      {children}
    </BaseButton>
  )

  const label = disabledReason ?? tooltip
  if (label) {
    return (
      <TooltipTrigger label={label} shortcut={disabledReason ? undefined : tooltipShortcut} placement={tooltipPlacement}>
        {button}
      </TooltipTrigger>
    )
  }
  return button
}
