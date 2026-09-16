import { type InputHTMLAttributes } from 'react'
import { Input } from '@base-ui/react/input'
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
 *
 * On Base UI's `Input` since stage 3 of the migration (2026-09-07), so a
 * search field inside a `Field` is labelled by it without the caller wiring
 * an id. The surround stays ours: the border, the focus-within rule and the
 * `Kbd` hint are this component's, not the input's.
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
        // Hover strengthens the border as it does on every other field (16 September). Here that
        // is also the focus look, which was the stronger border before hover existed.
        'hover:border-border-strong focus-within:border-border-strong transition-colors',
        className,
      )}
    >
      <Input
        className="flex-1 min-w-0 bg-transparent text-input-value text-text-primary placeholder:text-text-muted outline-none"
        placeholder={placeholder}
        {...props}
      />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </div>
  )
}
