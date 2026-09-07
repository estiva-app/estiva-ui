import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn } from './cn'
import { WithTooltip } from './Tooltip'

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
export type IconButtonVariant = 'muted' | 'outlined' | 'primary'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
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
  const button = (
    <BaseButton
      type={type}
      disabled={disabled || !!disabledReason}
      focusableWhenDisabled={!!disabledReason}
      className={(state) =>
        cn(
          'flex items-center justify-center p-1 rounded-lg transition-colors shrink-0 cursor-pointer',
          !state.disabled && variant === 'primary' && 'bg-accent-primary hover:bg-accent-hover text-text-inverse',
          !state.disabled && variant === 'muted' && 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
          !state.disabled && variant === 'outlined' && 'border border-border-default hover:bg-bg-hover text-text-secondary',
          state.disabled && variant === 'primary' && 'bg-bg-disabled text-text-disabled',
          state.disabled && variant === 'muted' && 'text-text-disabled',
          state.disabled && variant === 'outlined' && 'border border-border-default text-text-disabled',
          state.disabled && 'pointer-events-none cursor-not-allowed',
          className,
        )
      }
      {...props}
    >
      {children}
    </BaseButton>
  )

  const label = disabledReason ?? tooltip
  if (label) {
    return (
      <WithTooltip label={label} shortcut={disabledReason ? undefined : tooltipShortcut} placement={tooltipPlacement}>
        {button}
      </WithTooltip>
    )
  }
  return button
}
