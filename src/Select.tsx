import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { Select as BaseSelect } from '@base-ui/react/select'
import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * Peek's Select (2026-08-28), verbatim, plus what Ship added: an option may
 * carry a `leading` node — an avatar beside a person's name — shown in the
 * trigger and in the list. On Base UI's `Select` since stage 4 of the
 * migration (2026-09-07).
 *
 * A button that shows the choice and opens a listbox under it. **Under it:
 * Base UI would rather lay the list over the trigger so the chosen option's
 * text covers the trigger's, the way macOS does — `alignItemWithTrigger` is
 * off, because every Select in both apps opens below one today (Katerina,
 * D24).**
 *
 * What the port deleted: `createPortal`, the whole `onKeyDown` switch, the
 * outside-click, resize and scroll listeners, the `aria-activedescendant`
 * bookkeeping, the `scrollIntoView` that kept the highlight visible, and
 * `fit.ts` — the pure geometry this component grew and then shared with the
 * Menu shell. Floating UI does the fitting; `--available-height` is where the
 * old 288px cap now meets the room the screen actually has.
 *
 * What it gained, and none of it was written here: **typeahead** — type the
 * first letters of an option and the list jumps to it — a listbox whose
 * highlight is managed rather than counted, and a value that can be part of a
 * form.
 *
 * Two sizes; `disabled` explains nothing by itself — wrap it in a tooltip
 * that does.
 */
export interface SelectOption {
  value: string
  label: string
  /** Drawn before the label, 16px — an Avatar, an icon. */
  leading?: ReactNode
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  size?: 'default' | 'small'
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** The 4px between the trigger and the list, and the 8px the list keeps clear
 *  of every screen edge — the two numbers `fitMenu` used. */
const GAP = 4
const VIEWPORT_PAD = 8

export function Select({ value, onChange, options, size = 'default', ariaLabel, placeholder = 'Select…', disabled, className }: SelectProps) {
  const selected = options.find((o) => o.value === value)
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(next) => onChange(next as string)}
      disabled={disabled}
      // Non-modal, as it has always been: the page behind stays scrollable and
      // keeps its scrollbar, so opening a select never shifts the layout.
      modal={false}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          /*
           * `min-w-0 max-w-full`: a trigger must never outgrow its container
           * (Katerina, 2026-09-01 — a long label stretched the files panel's
           * Lead row past its card). In a flex row the default min-width:auto
           * forbids shrinking below the label's width, which is what kept
           * `truncate` from ever engaging; in a block container max-w-full is
           * the cap. Full-width callers are unaffected.
           */
          'flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border bg-bg-inset text-left',
          'border-border-default text-text-primary outline-none transition-colors',
          // The focused border survives a hover: hover alone strengthens the
          // hairline, but hover while focused must not grey the focus colour —
          // the stacked variant outranks plain hover by specificity.
          'hover:border-border-strong focus-visible:hover:border-border-focus aria-expanded:hover:border-border-focus disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
          'focus-visible:border-border-focus aria-expanded:border-border-focus',
          'signal:transition-shadow signal:focus-visible:shadow-focus-ring',
          size === 'default' && 'px-3 py-2 text-[14px] leading-[1.4] font-normal',
          size === 'small' && 'h-6 px-2 text-[12px] leading-[1.4] font-normal',
          className,
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2', !selected && 'text-text-muted')}>
          {selected?.leading && <span className="flex shrink-0 items-center">{selected.leading}</span>}
          <BaseSelect.Value className="truncate">{() => selected?.label ?? placeholder}</BaseSelect.Value>
        </span>
        <BaseSelect.Icon
          render={<IconChevronDown size={size === 'small' ? 14 : 16} stroke={1.5} className="shrink-0 text-text-secondary" />}
        />
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          side="bottom"
          align="start"
          sideOffset={GAP}
          collisionPadding={VIEWPORT_PAD}
          /* D24: hang the list under the trigger, as it always has, rather
             than laying it over the trigger with the chosen option on top. */
          alignItemWithTrigger={false}
          /*
           * The list follows its trigger now rather than closing when the page
           * scrolls — it was `fixed` to where the trigger had been, so closing
           * was the only way it could avoid being left behind. `anchor-hidden`
           * is the other half of that: when the trigger scrolls out of view
           * entirely the list goes with it, instead of floating over whatever
           * has scrolled into its place.
           */
          className="z-50 data-[anchor-hidden]:hidden"
        >
          <BaseSelect.Popup
            /* `--anchor-width` is the trigger's width and `--available-height`
               the room the list actually has after Floating UI has flipped and
               clamped it — the two numbers `fitMenu` used to compute here. The
               288px is the old `max-h-72`, now a ceiling on that room rather
               than a height applied blind. */
            className="max-h-[min(288px,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-border-default bg-bg-elevated p-1 shadow-lg"
          >
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                /* The highlight is Base UI's `data-highlighted` — pointer and
                   keyboard set the same attribute, so what the DOM says and
                   what the row looks like cannot disagree. It used to be an
                   index this component counted. */
                className="flex h-9 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-[14px] font-normal leading-[1.4] text-text-primary transition-colors data-[highlighted]:bg-bg-hover data-[selected]:font-medium"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {option.leading && <span className="flex shrink-0 items-center">{option.leading}</span>}
                  <BaseSelect.ItemText className="truncate">{option.label}</BaseSelect.ItemText>
                </span>
                <BaseSelect.ItemIndicator
                  render={<IconCheck size={16} stroke={1.5} className="shrink-0 text-text-secondary" />}
                />
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
