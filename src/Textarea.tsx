import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from './cn'
import { useFieldControlId } from './Field'

/**
 * Peek's Textarea (2026-08-28), verbatim: TextInput's look on a textarea
 * that does not resize. Plus a disabled look (Ship's addition).
 */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, id, ...props }, ref) {
  // A surrounding Field names this control (SHA-17); an explicit id still wins.
  const controlId = useFieldControlId(id)
  return (
    <textarea
      ref={ref}
      id={controlId}
      className={cn(
        'bg-bg-inset border border-border-default focus:border-border-focus rounded-lg px-3 py-2',
        'text-[14px] leading-[1.4] font-normal text-text-primary placeholder:text-text-muted',
        'resize-none outline-none transition-colors',
        'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
        'signal:transition-shadow signal:focus:shadow-focus-ring',
        className,
      )}
      {...props}
    />
  )
})
