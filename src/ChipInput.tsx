import { useState, useRef, useMemo, useEffect, useLayoutEffect, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'
import { MenuItem } from './Menu'

/**
 * The chip a `ChipInput` is made of: a 24px pill with an optional 16px
 * leading (a face, an icon), a 12px label, and the ✕ that removes it.
 * Exported on its own (Katerina, 2026-09-01) under a name that promises
 * nothing about people — a chip like this may one day hold a label, a file,
 * a filter.
 */
export interface InputChipProps {
  label: string
  /** Before the label, 16px — an Avatar, an icon. */
  leading?: ReactNode
  /** Draws the ✕; absent, the chip is display-only. */
  onRemove?: () => void
  className?: string
}

export function InputChip({ label, leading, onRemove, className }: InputChipProps) {
  return (
    <div
      className={cn(
        // Curved, not a pill (Katerina, 2026-09-01): the Avatar keeps its own
        // rounded-sm corners — never a forced circle — and the chip's corner
        // follows concentrically: 4px face + 2px inset = rounded-md.
        'inline-flex items-center gap-1.5 bg-bg-elevated border border-border-subtle rounded-md py-0.5 max-h-[24px]',
        // The padding follows the contents (Katerina, 2026-09-01): a face
        // sits 2px from the edge, a bare label needs 8px of air; the ✕
        // brings its own box, so 4px behind it — 8px when there isn't one.
        leading ? 'pl-[2px]' : 'pl-2',
        onRemove ? 'pr-1' : 'pr-2',
        className,
      )}
    >
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="text-caption font-medium text-text-primary">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="size-4 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary"
          aria-label={`Remove ${label}`}
        >
          <IconX size={10} stroke={1.5} />
        </button>
      )}
    </div>
  )
}

/**
 * A multi-select input: chips for the chosen, a typeahead for the rest —
 * Peek's PersonChipInput (2026-09-01), generalised on the way in. Peek's
 * version knew it was picking people: it read the directory from Peek's own
 * data layer and drew every face itself. Here the caller hands in `options`,
 * and — when the entries have faces or icons — the two leading slots: 16px
 * in a chip, 32px in a suggestion row. Nothing in this file knows what is
 * being picked.
 *
 * Suggestions appear only once the user types — focusing (or auto-focus on
 * dialog open) must not drop the full directory over the surface below.
 * Backspace on an empty query removes the last chip; Escape clears the query
 * when there is one and bubbles when there is not, so the surface around it
 * (dialog, launcher) can act.
 *
 * Generic over the option type: the objects handed back through `onChange`
 * are the caller's own, extra fields and all — no re-mapping on the way out.
 */
export interface ChipInputOption {
  id: string
  label: string
  /** The suggestion row's second line — a role, an address. Also searched. */
  description?: string
}

export interface ChipInputProps<T extends ChipInputOption = ChipInputOption> {
  value: T[]
  onChange: (next: T[]) => void
  /** The directory the typeahead searches. */
  options: T[]
  placeholder?: string
  autoFocus?: boolean
  /** Option ids excluded from the suggestion list (e.g., the current user). */
  excludeIds?: string[]
  /** Before a chip's label, 16px — a face, an icon. */
  chipLeading?: (option: T) => ReactNode
  /** Before a suggestion row's label, 32px. */
  rowLeading?: (option: T) => ReactNode
}

export function ChipInput<T extends ChipInputOption = ChipInputOption>({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  autoFocus,
  excludeIds = [],
  chipLeading,
  rowLeading,
}: ChipInputProps<T>) {
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const selectedIds = new Set(value.map((o) => o.id))
    const excludedIds = new Set(excludeIds)
    const q = query.trim().toLowerCase()
    return options.filter((o) => {
      if (selectedIds.has(o.id)) return false
      if (excludedIds.has(o.id)) return false
      if (!q) return true
      return o.label.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q)
    })
  }, [query, value, excludeIds, options])

  useEffect(() => {
    setHighlight(0)
  }, [query, matches.length])

  const showDropdown = isFocused && query.trim().length > 0 && matches.length > 0

  useLayoutEffect(() => {
    if (!showDropdown) return
    const update = () => {
      if (wrapperRef.current) setAnchorRect(wrapperRef.current.getBoundingClientRect())
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [showDropdown, value.length])

  function addOption(option: T) {
    onChange([...value, option])
    setQuery('')
    inputRef.current?.focus()
  }

  function removeOption(id: string) {
    onChange(value.filter((o) => o.id !== id))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      // Consumed: removing a chip must not double as the surface's "back".
      e.preventDefault()
      removeOption(value[value.length - 1].id)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, Math.max(0, matches.length - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const target = matches[highlight]
      if (target) addOption(target)
      return
    }
    if (e.key === 'Escape') {
      // Consume it only when there is something to clear; an idle input lets
      // Escape bubble so the surface around it (dialog, launcher) can act.
      if (query !== '') {
        e.preventDefault()
        setQuery('')
      }
    }
  }

  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        className="bg-bg-inset border border-border-default hover:border-border-strong focus-within:border-border-focus focus-within:hover:border-border-focus rounded-lg px-3 py-1.5 flex flex-wrap items-center gap-1.5 transition-colors min-h-[38px] cursor-text signal:transition-shadow signal:focus-within:shadow-focus-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((o) => (
          <InputChip key={o.id} label={o.label} leading={chipLeading?.(o)} onRemove={() => removeOption(o.id)} />
        ))}

        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 150)
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-body-2 text-text-primary placeholder:text-text-muted outline-none border-none"
        />
      </div>

      {showDropdown && anchorRect && createPortal(
        <div
          className="fixed z-[60] max-h-[240px] overflow-y-auto bg-bg-elevated border border-border-default rounded-lg shadow-lg"
          style={{
            top: anchorRect.bottom + 4,
            left: anchorRect.left,
            width: anchorRect.width,
          }}
        >
          {matches.map((o, i) => (
            <MenuItem
              key={o.id}
              size="tall"
              className="h-12 rounded-none"
              leading={rowLeading?.(o)}
              label={o.label}
              description={o.description}
              selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                addOption(o)
              }}
            />
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
