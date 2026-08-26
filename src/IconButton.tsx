import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'
import { WithTooltip } from './Tooltip'

/**
 * Peek's IconButton (2026-08-28), verbatim: a square 4px-padded button
 * around a 16px icon, 8px radius, three variants, an optional tooltip that
 * portals above or below. Plus `type="button"` by default (Ship's addition),
 * so it never submits a form by accident.
 */
export type IconButtonVariant = 'muted' | 'outlined' | 'primary'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  tooltip?: string
  tooltipPlacement?: 'top' | 'bottom'
  /** The icon: 16px, stroke 1.5. */
  children: ReactNode
}

export function IconButton({
  variant = 'muted',
  className,
  children,
  disabled,
  tooltip,
  tooltipPlacement,
  type = 'button',
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      className={cn(
        'flex items-center justify-center p-1 rounded-lg transition-colors shrink-0 cursor-pointer',
        !disabled && variant === 'primary' && 'bg-accent-primary hover:bg-accent-hover text-text-inverse',
        !disabled && variant === 'muted' && 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
        !disabled && variant === 'outlined' && 'border border-border-default hover:bg-bg-hover text-text-secondary',
        disabled && variant === 'primary' && 'bg-bg-disabled text-text-disabled',
        disabled && variant === 'muted' && 'text-text-disabled',
        disabled && variant === 'outlined' && 'border border-border-default text-text-disabled',
        disabled && 'pointer-events-none cursor-not-allowed',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )

  if (tooltip) {
    return (
      <WithTooltip label={tooltip} placement={tooltipPlacement}>
        {button}
      </WithTooltip>
    )
  }
  return button
}
