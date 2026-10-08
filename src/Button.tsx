import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn } from './cn'
import { useFormBusy } from './formBusy'
import { TooltipTrigger } from './Tooltip'

/**
 * Peek's Button (2026-08-28), verbatim, plus what Ship added and Peek should
 * adopt: a `destructive` variant — the muted button in the error colour, for
 * "Delete project" and its kind; a destructive action is a button like any
 * other, not a dotted link — and `type="button"` by default, so a button
 * inside a form submits it only when asked to. On Base UI's Button since
 * stage 2 of the migration (2026-09-07).
 *
 * Three variants and two sizes: 32px default / 24px small, 6px radius, 500
 * weight. The sizes are the `btn-default` and `btn-small` type tokens.
 *
 * The primary reads in `text-inverse` on the accent — a theme decides what
 * that is (dark on Peek's light accents, light on Ship's dark one). Under
 * Signal it is also semibold, as Peek has it.
 *
 * `disabledReason` is the package's own rule, "only offer actions that can
 * succeed", done once: the button is disabled, stays reachable by keyboard
 * (Base UI's `focusableWhenDisabled`), and shows the reason as a tooltip on
 * hover. Ship wrote that wrapper by hand six times.
 */
/**
 * `resolve` is `primary` in every theme but Signal, where it is outlined at rest
 * and green when pointed at — Peek's Resolve (UIG-9, 17 September; Peek passed
 * it as classes before). `IconButton` has the same look.
 */
export type ButtonVariant = 'primary' | 'outlined' | 'muted' | 'destructive' | 'resolve'
export type ButtonSize = 'default' | 'small'

/**
 * `ComponentPropsWithRef`, not `ButtonHTMLAttributes`, so a `ref` reaches the
 * element. React 19 passes `ref` to a function component as an ordinary prop,
 * so nothing here forwards it by hand — it rides in on the spread below. What
 * was missing was only the *type* saying so, which is enough to stop a caller.
 *
 * It matters because a Base UI part composes through `render`: at stage 4 a
 * `Menu.Trigger` or a `Dialog.Close` **is** this Button rather than wrapping
 * one, and a trigger that cannot be measured or focused is not a trigger.
 */
export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 16px, stroke 1.5 on the default size; 14px on small. */
  leadingIcon?: ReactNode
  /** Why the action cannot succeed right now. Disables the button, keeps it
   *  reachable by keyboard, and shows the reason as a tooltip on hover. */
  disabledReason?: string
  children: ReactNode
}

export function Button({
  variant = 'muted',
  size = 'default',
  leadingIcon,
  className,
  children,
  disabled,
  disabledReason,
  type = 'button',
  ...props
}: ButtonProps) {
  const hasLeadingIcon = !!leadingIcon
  // Inside a busy Form: switched off, and looking it (formBusy.ts).
  const formBusy = useFormBusy()
  const button = (
    <BaseButton
      type={type}
      disabled={disabled || !!disabledReason || formBusy}
      focusableWhenDisabled={!!disabledReason}
      className={(state) =>
        cn(
          // No `self-center` here, deliberately — `IconButton` needs it and this
          // does not, and the difference is the `h-8` / `h-6` on the next two
          // lines. `align-items: stretch` only stretches a child whose cross
          // size is `auto`; a Button always states its height, so a stretching
          // parent cannot change it. Measured in Chrome on 2026-09-12, in the
          // 260px row of Finding 49: 32px with `self-center` and 32px without.
          // What the class DID do was override the caller on the other axis —
          // in a column it beats the parent's `items-start`, which centred the
          // four actions in Ship's `ProjectRail` and the trigger in five of
          // this package's own story frames, each of which asks for the top.
          // A control does not get to decide where its caller puts it.
          'inline-flex items-center justify-center gap-1 rounded-md transition-colors font-sans font-medium',
          size === 'default' && 'h-8 min-h-8 text-btn-default',
          size === 'small' && 'h-6 min-h-6 text-btn-small',
          // Extra right padding beside a leading icon, for optical balance.
          size === 'default' && (hasLeadingIcon ? 'pl-2 pr-3' : 'px-2'),
          size === 'small' && (hasLeadingIcon ? 'pl-1.5 pr-2' : 'px-1.5'),
          !state.disabled && (variant === 'primary' || variant === 'resolve') && 'bg-accent-primary hover:bg-accent-hover text-text-inverse cursor-pointer signal:font-semibold',
          // @estiva-escape(no-copied-look): W2 (Katerina, 24 September: leave alone): an outlined button shares four words with Reaction's pill by coincidence
          !state.disabled && variant === 'outlined' && 'border border-border-default hover:bg-bg-hover text-text-primary cursor-pointer',
          !state.disabled && variant === 'muted' && 'hover:bg-bg-hover text-text-primary cursor-pointer',
          !state.disabled && variant === 'destructive' && 'hover:bg-error-muted text-error-default cursor-pointer',
          state.disabled && 'bg-bg-disabled text-text-disabled',
          // `pointer-events-none` only where the button is truly out of reach.
          // With a `disabledReason` the button IS the tooltip's trigger, and a
          // trigger the pointer cannot land on never opens one — Base UI already
          // swallows the click (`focusableWhenDisabled` gives `aria-disabled`
          // and a prevented `onClick`), so nothing else needs it.
          state.disabled && !disabledReason && 'pointer-events-none',
          state.disabled && variant === 'outlined' && 'border border-border-default',
          // Disabled too, as it always drew.
          variant === 'resolve' &&
            'signal:bg-transparent signal:border signal:border-border-default signal:text-text-primary signal:shadow-none signal:hover:bg-success-muted signal:hover:border-success-outline signal:hover:text-success-default signal:transition-colors',
          className,
        )
      }
      {...props}
    >
      {leadingIcon}
      {children}
    </BaseButton>
  )
  return disabledReason ? <TooltipTrigger label={disabledReason}>{button}</TooltipTrigger> : button
}
