import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * Peek's TextInput (2026-08-28): the inset field with a 8px radius, 14px
 * text, the focus border in every theme (Katerina, 2026-08-28: Ship's inputs
 * focus like Signal's) — and Signal's glow on top.
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
        'bg-bg-inset border border-border-default focus:border-border-focus rounded-lg px-3 py-2',
        'text-[14px] leading-[1.4] font-normal text-text-primary placeholder:text-text-muted',
        'outline-none transition-colors',
        'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
        'signal:transition-shadow signal:focus:shadow-focus-ring',
        className,
      )}
      {...props}
    />
  )
})
