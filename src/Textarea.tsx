import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * Peek's Textarea (2026-08-28), verbatim: TextInput's look on a textarea
 * that does not resize. Plus a disabled look (Ship's addition).
 */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'bg-bg-inset border border-border-default focus:border-border-strong rounded-lg px-3 py-2',
        'text-[14px] leading-[1.4] font-normal text-text-primary placeholder:text-text-muted',
        'resize-none outline-none transition-colors',
        'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
        'signal:transition-shadow signal:focus:border-border-focus signal:focus:shadow-[shadow:var(--focus-ring)]',
        className,
      )}
      {...props}
    />
  )
})
