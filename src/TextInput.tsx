import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * Peek's TextInput (2026-08-28), verbatim: the inset field with a 8px
 * radius, 14px text, a stronger border on focus — and Signal's focus ring.
 * Plus a disabled look (Ship's addition): the disabled surface and text,
 * no pointer.
 */
export type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'bg-bg-inset border border-border-default focus:border-border-strong rounded-lg px-3 py-2',
        'text-[14px] leading-[1.4] font-normal text-text-primary placeholder:text-text-muted',
        'outline-none transition-colors',
        'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
        'signal:transition-shadow signal:focus:border-border-focus signal:focus:shadow-[shadow:var(--focus-ring)]',
        className,
      )}
      {...props}
    />
  )
})
