import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { cn } from './cn'

/**
 * Peek's Textarea (2026-08-28), verbatim: TextInput's look on a textarea
 * that does not resize. Plus a disabled look (Ship's addition). On Base UI's
 * `Field.Control` since stage 3 of the migration (2026-09-07).
 *
 * Base UI has an `Input` part but no textarea, so this is `Field.Control`
 * rendering a `<textarea>` — the same part `Input` is built on, told which
 * element to be. It finds a surrounding `Field` on its own, which is what
 * retired `useFieldControlId`; outside one it renders a plain textarea, as
 * before.
 */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return (
    <BaseField.Control
      ref={ref as React.Ref<HTMLElement>}
      render={<textarea />}
      className={cn(
        // The border strengthens on hover, as Select's and ChipInput's do (Katerina, 16 September:
        // "aren't there hover states in text input and text area?"). Focus comes after hover in
        // Tailwind's order, so a focused field keeps the focus border under the pointer.
        'bg-bg-inset border border-border-default hover:border-border-strong focus:border-border-focus rounded-lg px-3 py-2',
        'text-input-value text-text-primary placeholder:text-text-muted',
        'resize-none outline-none transition-colors',
        'disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
        'signal:transition-shadow signal:focus:shadow-focus-ring',
        className,
      )}
      {...(props as object)}
    />
  )
})
