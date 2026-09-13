import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'
import { MenuItem, MenuPanel } from './Menu'
import { ScrollArea } from './ScrollArea'

/* The chip's own look, written once: `InputChip` draws it for a caller who
   wants a chip on its own, and `ChipInput` gives the same classes to Base UI's
   `Combobox.Chip`, which is the one that joins the input's keyboard. */
const CHIP_BOX =
  // Curved, not a pill (Katerina, 2026-09-01): the Avatar keeps its own
  // rounded-sm corners — never a forced circle — and the chip's corner
  // follows concentrically: 4px face + 2px inset = rounded-md.
  'inline-flex items-center gap-1.5 bg-bg-elevated border border-border-subtle rounded-md py-0.5 max-h-[24px]'
const CHIP_LABEL = 'text-caption font-medium text-text-primary'
const CHIP_REMOVE = 'size-4 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary'
// The padding follows the contents (Katerina, 2026-09-01): a face sits 2px
// from the edge, a bare label needs 8px of air; the ✕ brings its own box, so
// 4px behind it — 8px when there isn't one.
const chipPadding = (leading: boolean, removable: boolean) => cn(leading ? 'pl-[2px]' : 'pl-2', removable ? 'pr-1' : 'pr-2')

/**
 * The chip a `ChipInput` is made of: a 24px pill with an optional 16px
 * leading (a face, an icon), a 12px label, and the ✕ that removes it.
 * Exported on its own (Katerina, 2026-09-01) under a name that promises
 * nothing about people — a chip like this may one day hold a label, a file,
 * a filter.
 *
 * Inside a `ChipInput` the chip is Base UI's `Combobox.Chip` wearing these
 * same classes, because there it has to answer the arrow keys and Backspace
 * along with the input. This component is for a chip standing alone.
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
    <div className={cn(CHIP_BOX, chipPadding(!!leading, !!onRemove), className)}>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className={CHIP_LABEL}>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className={CHIP_REMOVE}
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
 * Peek's PersonChipInput (2026-09-01), generalised on the way in, and on Base
 * UI's `Combobox` since stage 5 of the migration (2026-09-13).
 *
 * **What the part brought, and what it took away from this file.** The list is
 * a real listbox now: the input keeps focus and says which row is highlighted
 * through `aria-activedescendant`, where before the rows were plain buttons in
 * a `<div>` and nothing was announced. With it went the highlight index, the
 * arrow keys, Enter, the filter loop, the blur timeout that kept a click on a
 * row from closing the list under the pointer, the `createPortal`, the
 * measured anchor rect, the resize and scroll listeners that re-measured it,
 * and `fit.ts` — the flip-up-when-low arithmetic this package carried for one
 * caller (PLAN Finding 22). Base UI's positioner does the flipping, and it
 * does it against the element rather than against a rect read a frame ago.
 *
 * **What this file still decides**, because none of it is the part's business:
 * which options are on offer (the chosen and the excluded are not), that a
 * match is on the label *or* the description, that suggestions appear only
 * once you type — focusing must not drop the whole directory over the surface
 * below — and that Backspace on an empty query takes the last chip.
 *
 * Escape clears the query when there is one and bubbles when there is not, so
 * the surface around it (dialog, launcher) can act.
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
  /** Set by a `Field` with `required`; a caller inside one owes nothing. */
  'aria-required'?: boolean | 'true' | 'false'
  /**
   * The field's name, for a caller that is not inside a `Field` — a `Field`'s
   * label names it already. With neither this nor `aria-labelledby`, the
   * placeholder is the name, and it stays the name once a chip is in.
   */
  'aria-label'?: string
  /** The id of what names the field on the page — a visible "To:", say. */
  'aria-labelledby'?: string
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
  ...aria
}: ChipInputProps<T>) {
  const [query, setQuery] = useState('')
  /* The box the list hangs from. Base UI hangs a combobox's list from its
     input by default, and the input sits inside this box's 12px of padding
     and its border, so the list came out 26px narrower than the field it
     belongs to (measured: 358 against 384) and started inside it. Held as an
     element, not a measured rect, so the positioner re-measures it. */
  const [box, setBox] = useState<HTMLDivElement | null>(null)

  /* What is on offer: never what is already chosen, never what the caller
     excluded. The part filters by the query; which options exist at all is
     this component's question. */
  const available = useMemo(() => {
    const chosen = new Set(value.map((o) => o.id))
    const excluded = new Set(excludeIds)
    return options.filter((o) => !chosen.has(o.id) && !excluded.has(o.id))
  }, [options, value, excludeIds])

  /* A match is on the label or the description — "who is the engineer" finds
     the person by their role. Base UI's own filter reads one string per item. */
  const filter = useMemo(
    () => (item: T, q: string) => {
      const needle = q.trim().toLowerCase()
      if (!needle) return true
      return item.label.toLowerCase().includes(needle) || (item.description ?? '').toLowerCase().includes(needle)
    },
    [],
  )

  /* Suggestions appear only once you type. Focus — or a dialog's autoFocus —
     must not drop the whole directory over the surface below, which is why
     the open state is this component's and not the part's. */
  const open = query.trim().length > 0

  /* The field's name (PLAN Finding 6). With no chip, Chrome names the field
     by its placeholder; the first chip takes the placeholder away, and the
     field was left with no name at all (measured: ""). So the placeholder
     stays on as the name once it is no longer drawn. A caller's own name
     wins, and so does a `Field`'s label: Base UI points `aria-labelledby` at
     it, and a label by reference outranks `aria-label`.
     Only a name that exists is passed. Base UI copies a caller's prop over its
     own even when the value is `undefined`, so an `aria-labelledby` written
     out empty would wipe the `Field`'s. */
  const ariaLabel = aria['aria-label'] ?? (value.length > 0 ? placeholder : undefined)
  const naming = {
    ...(ariaLabel !== undefined && { 'aria-label': ariaLabel }),
    ...(aria['aria-labelledby'] !== undefined && { 'aria-labelledby': aria['aria-labelledby'] }),
  }

  function removeLast() {
    if (value.length > 0) onChange(value.slice(0, -1))
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && query === '' && value.length > 0) {
      // Consumed: removing a chip must not double as the surface's "back",
      // and Base UI would otherwise walk focus into the chips first.
      event.preventDefault()
      event.stopPropagation()
      removeLast()
      return
    }
    if (event.key === 'Escape' && query !== '') {
      // Consume it only when there is something to clear; an idle input lets
      // Escape bubble so the surface around it (dialog, launcher) can act.
      event.preventDefault()
      event.stopPropagation()
      setQuery('')
    }
  }

  return (
    <Combobox.Root
      multiple
      items={available}
      value={value}
      onValueChange={(next) => {
        onChange(next as T[])
        setQuery('')
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      open={open}
      /* The list is the query's, not the click's — see `open` above. */
      openOnInputClick={false}
      filter={filter}
      itemToStringLabel={(option) => (option as T).label}
    >
      {/* The box the chips and the input share. `Combobox.Chips` is what makes
          the two one control for the keyboard; the look is what it always was. */}
      <Combobox.Chips ref={setBox} className="bg-bg-inset border border-border-default hover:border-border-strong focus-within:border-border-focus focus-within:hover:border-border-focus rounded-lg px-3 py-1.5 flex flex-wrap items-center gap-1.5 transition-colors min-h-[38px] cursor-text signal:transition-shadow signal:focus-within:shadow-focus-ring">
        {value.map((option) => (
          <Combobox.Chip key={option.id} className={cn(CHIP_BOX, chipPadding(!!chipLeading, true))}>
            {chipLeading && <span className="flex shrink-0 items-center">{chipLeading(option)}</span>}
            <span className={CHIP_LABEL}>{option.label}</span>
            <Combobox.ChipRemove className={CHIP_REMOVE} aria-label={`Remove ${option.label}`}>
              <IconX size={10} stroke={1.5} />
            </Combobox.ChipRemove>
          </Combobox.Chip>
        ))}
        <Combobox.Input
          autoFocus={autoFocus}
          placeholder={value.length === 0 ? placeholder : ''}
          aria-required={aria['aria-required']}
          {...naming}
          onKeyDown={onInputKeyDown}
          className="flex-1 min-w-[120px] bg-transparent text-body-2 text-text-primary placeholder:text-text-muted outline-none border-none"
        />
      </Combobox.Chips>

      <Combobox.Portal>
        <Combobox.Positioner
          anchor={box}
          sideOffset={GAP}
          collisionPadding={VIEWPORT_PAD}
          className="z-50 data-[anchor-hidden]:hidden"
        >
          {/* As wide as the box, which is what the hand-measured rect was
              for; `--anchor-width` is the positioner's own answer, and the
              anchor is the box (see `box` above), not the input. The padding
              is on the scrolling content so the bar hugs the panel (D63), and
              240px is the cap this list has always had. */}
          <Combobox.Popup className="w-[var(--anchor-width)] p-0" render={<MenuPanel />}>
            <ScrollArea viewportClassName="max-h-[240px]" contentClassName="flex flex-col p-2">
              <Combobox.List>
                {(option: T) => (
                  <Combobox.Item
                    key={option.id}
                    value={option}
                    render={
                      <MenuItem
                        size="tall"
                        leading={rowLeading?.(option)}
                        label={option.label}
                        description={option.description}
                      />
                    }
                  />
                )}
              </Combobox.List>
            </ScrollArea>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

/** `Menu`'s numbers, because the list hangs the same way a menu does. */
const GAP = 4
const VIEWPORT_PAD = 8
