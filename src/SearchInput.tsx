import { type InputHTMLAttributes } from 'react'
import { cn } from './cn'
import { Kbd } from './Kbd'

/**
 * Peek's SearchInput (2026-09-01), verbatim: an inset field with a hairline
 * border that strengthens on focus, and an optional keyboard hint at the
 * right edge — under Signal, the hint becomes the mono `kbd` chip with the
 * thicker bottom edge.
 *
 * The one product string — Peek's default placeholder "Search Peek..." —
 * stays in Peek; the default here says only "Search…".
 *
 * In Peek's top bar this is a launcher affordance rather than a live field:
 * the input is `pointer-events-none` and clicking the surround opens the
 * command launcher. The component is the same either way.
 */
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** A keyboard hint drawn at the right edge, e.g. "Ctrl+K". */
  shortcut?: string
  className?: string
}

export function SearchInput({ shortcut, className, placeholder = 'Search…', ...props }: SearchInputProps) {
  return (
    <div
      className={cn(
        'flex gap-2 items-center px-3 py-2 rounded-lg',
        'bg-bg-inset border border-border-default',
        'focus-within:border-border-strong transition-colors',
        className,
      )}
    >
      <input
        className="flex-1 min-w-0 bg-transparent text-input-value text-text-primary placeholder:text-text-muted outline-none"
        placeholder={placeholder}
        {...props}
      />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </div>
  )
}
