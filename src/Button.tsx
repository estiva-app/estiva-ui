import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

/**
 * Peek's Button (2026-08-28), verbatim, plus what Ship added and Peek should
 * adopt: a `destructive` variant — the muted button in the error colour, for
 * "Delete project" and its kind; a destructive action is a button like any
 * other, not a dotted link — and `type="button"` by default, so a button
 * inside a form submits it only when asked to.
 *
 * Three variants and two sizes: 32px default / 24px small, 6px radius, 500
 * weight. Sizes are spelled as arbitrary values for the reason the README
 * records: tailwind-merge drops a custom `text-{size}` that is followed by a
 * `text-{colour}`.
 *
 * The primary reads in `text-inverse` on the accent — a theme decides what
 * that is (dark on Peek's light accents, light on Ship's dark one). Under
 * Signal it is also semibold, as Peek has it.
 */
export type ButtonVariant = 'primary' | 'outlined' | 'muted' | 'destructive'
export type ButtonSize = 'default' | 'small'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 16px, stroke 1.5 on the default size; 14px on small. */
  leadingIcon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'muted',
  size = 'default',
  leadingIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const hasLeadingIcon = !!leadingIcon
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md transition-colors font-sans font-medium',
        size === 'default' && 'h-8 text-[14px] leading-[14px]',
        size === 'small' && 'h-6 text-[12px] leading-[12px]',
        // Extra right padding beside a leading icon, for optical balance.
        size === 'default' && (hasLeadingIcon ? 'pl-2 pr-3' : 'px-2'),
        size === 'small' && (hasLeadingIcon ? 'pl-1.5 pr-2' : 'px-1.5'),
        !disabled && variant === 'primary' && 'bg-accent-primary hover:bg-accent-hover text-text-inverse cursor-pointer signal:font-semibold',
        !disabled && variant === 'outlined' && 'border border-border-default hover:bg-bg-hover text-text-primary cursor-pointer',
        !disabled && variant === 'muted' && 'hover:bg-bg-hover text-text-primary cursor-pointer',
        !disabled && variant === 'destructive' && 'hover:bg-error-muted text-error-default cursor-pointer',
        disabled && 'bg-bg-disabled text-text-disabled pointer-events-none',
        disabled && variant === 'outlined' && 'border border-border-default',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  )
}
