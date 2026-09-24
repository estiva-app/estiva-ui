import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { Select as BaseSelect } from '@base-ui/react/select'
import type { ReactNode } from 'react'
import { cn } from './cn'
import { ScrollArea } from './ScrollArea'
import { MenuPanel, menuItemClassName } from './Menu'
import { TooltipTrigger } from './Tooltip'
import { FIELD_DISABLED_CLASSES, FIELD_SIZE_CLASSES, FIELD_TEXT_CLASSES } from './looks'

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
 * Two sizes. `disabled` explains nothing by itself; `disabledReason` says
 * why, as Button's does: the select looks disabled, will not open, stays
 * reachable by Tab, and shows the reason on hover and on keyboard focus.
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
  /** Set by a `Field` with `required`; a caller inside one owes nothing. */
  'aria-required'?: boolean | 'true' | 'false'
  placeholder?: string
  disabled?: boolean
  /**
   * Why it cannot be changed right now (UIG-14, Katerina, 19 September). It
   * looks disabled and will not open, but Tab still reaches it, and the reason
   * shows as its tooltip — a native disabled button cannot be focused, so it
   * could never say why. Takes the place of wrapping it in `WithTooltip`.
   * Given with `disabled`, the reason wins, as on `Button`.
   */
  disabledReason?: string
  className?: string
}

/** The 4px between the trigger and the list, and the 8px the list keeps clear
 *  of every screen edge — the two numbers `fitMenu` used. */
const GAP = 4
const VIEWPORT_PAD = 8

export function Select({ value, onChange, options, size = 'default', ariaLabel, placeholder = 'Select…', disabled, disabledReason, className, ...aria }: SelectProps) {
  const selected = options.find((o) => o.value === value)
  // With a reason it is held shut rather than disabled: a disabled trigger is
  // a native `disabled` button, which Tab skips and a tooltip cannot open on.
  const held = Boolean(disabledReason)
  const trigger = (
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        aria-required={aria['aria-required']}
        aria-disabled={held || undefined}
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
          'border-border-default outline-none transition-colors',
          FIELD_TEXT_CLASSES,
          // The focused border survives a hover: hover alone strengthens the
          // hairline, but hover while focused must not grey the focus colour —
          // the stacked variant outranks plain hover by specificity.
          !held && 'hover:border-border-strong focus-visible:hover:border-border-focus aria-expanded:hover:border-border-focus',
          FIELD_DISABLED_CLASSES,
          held && 'cursor-not-allowed bg-bg-disabled text-text-disabled',
          'focus-visible:border-border-focus aria-expanded:border-border-focus',
          'signal:transition-shadow signal:focus-visible:shadow-focus-ring',
          FIELD_SIZE_CLASSES[size],
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
  )
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(next) => {
        if (!held) onChange(next as string)
      }}
      {...(held ? { open: false, onOpenChange: () => {} } : {})}
      disabled={disabled && !held}
      // Non-modal, as it has always been: the page behind stays scrollable and
      // keeps its scrollbar, so opening a select never shifts the layout.
      modal={false}
    >
      {held ? <TooltipTrigger label={disabledReason ?? ''}>{trigger}</TooltipTrigger> : trigger}

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
            /* The list is the package's one list (Katerina, 2026-09-13: "i
               thought the type to search menu would be from estiva-ui and be
               the one used in select component"). The box is `MenuPanel` —
               the same border, fill, radius and shadow this used to spell out
               — with its padding moved onto the scrolling content (D63). */
            render={<MenuPanel />}
            className="min-w-[var(--anchor-width)] p-0"
          >
            {/* The list scrolls in a ScrollArea: the bar takes no width, so a
                long list is exactly as wide as a short one (Katerina,
                2026-09-08).
             *
             * **The padding is on the scrolling content, not on the panel**
             * (D63, applied here 2026-09-13). On the panel it inset the
             * scrolling box, so the thumb sat 7px from the panel's edge where
             * DialogShell, Popover, Menu and ChipInput all draw it at 3px —
             * Katerina: "the position of the scrollbar in select … not closer
             * to the right side". The rows keep their 4px inset, because the
             * padding that was the panel's is the content's; and the cap loses
             * its `- 0.5rem`, because that padding is inside the box that
             * scrolls now, so 288px stays 288px. */}
            <ScrollArea viewportClassName="max-h-[min(288px,var(--available-height))]" contentClassName="flex flex-col p-2">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                /* The highlight is Base UI's `data-highlighted` — pointer and
                   keyboard set the same attribute, so what the DOM says and
                   what the row looks like cannot disagree. It used to be an
                   index this component counted. */
                /* A menu row, exactly (`menuItemClassName`): 36px floor, 8px
                   in from a panel padded 8px, so the label lands 17px from the
                   panel's edge — the same pixel as the old 4px + 12px. What
                   Select adds is its own: the ✓ at the end, and the chosen
                   row in medium weight. No fade on the highlight, as in every
                   menu (Katerina, 2026-09-05). */
                className={cn(menuItemClassName({ size: 'default' }), 'justify-between data-[selected]:font-medium')}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {option.leading && <span className="flex shrink-0 items-center">{option.leading}</span>}
                  <BaseSelect.ItemText className="truncate text-body-2 text-text-primary">{option.label}</BaseSelect.ItemText>
                </span>
                <BaseSelect.ItemIndicator
                  render={<IconCheck size={16} stroke={1.5} className="shrink-0 text-text-secondary" />}
                />
              </BaseSelect.Item>
            ))}
            </ScrollArea>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
