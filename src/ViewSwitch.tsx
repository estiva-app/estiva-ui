import type { ReactNode } from 'react'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { cn } from './cn'
import { MUTED_CONTROL_CLASSES } from './looks'
import { TooltipTrigger } from './Tooltip'

/**
 * Two or three views of one place in one box, one of them chosen (Katerina,
 * 5 October: Peek's Topics column, switched the way Claude's header switches
 * chat and code). On Base UI's ToggleGroup (D6): the chosen view is pressed,
 * the arrow keys walk the options, and the group is one Tab stop.
 *
 * Each option is an icon — its name then its tooltip — or, with no icon, its
 * name in words: "Topics | Folders" in a column's title, where the switch is
 * the title (her second ask the same day: the icons beside the header's
 * buttons were too much).
 *
 * The chosen view's fill slides to the next one, in `bg-nav-active` — the
 * colour of the current row in a sidebar, so the switch and the row it opened
 * are chosen in one colour: Peek's blue tint, Ship's and Leaf's grey. The
 * options share one grid of equal columns, each as wide as the widest, and the
 * fill sits in the first and moves by whole columns — nothing is measured.
 *
 * One is always chosen: pressing the chosen view again changes nothing.
 * More than three views are `Tabs`.
 */
export interface ViewSwitchOption<T extends string> {
  value: T
  /** 16px, stroke 1.5. Absent: the label is shown in words. */
  icon?: ReactNode
  /** Its name: in words when there is no icon; else its tooltip and accessible name. */
  label: string
}

export interface ViewSwitchProps<T extends string> {
  /** Two or three. */
  options: ViewSwitchOption<T>[]
  value: T
  /** Only for a person's choice, and never for the view already chosen. */
  onChange: (value: T) => void
  /** What it switches: "View". Read before the chosen option's name. */
  'aria-label'?: string
  /** Placement only. */
  className?: string
}

/** Each option's column, so the fill can share the first. */
const COLUMN = ['col-start-1', 'col-start-2', 'col-start-3']
/** Where the fill sits, by the chosen option's place: whole columns. */
const SLIDE = ['translate-x-0', 'translate-x-full', 'translate-x-[200%]']

export function ViewSwitch<T extends string>({ options, value, onChange, 'aria-label': ariaLabel = 'View', className }: ViewSwitchProps<T>) {
  const chosen = Math.max(0, options.findIndex((option) => option.value === value))
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        // Single choice: a press on the chosen view empties the group — keep it.
        const picked = next.find((item) => item !== value) as T | undefined
        if (picked !== undefined) onChange(picked)
      }}
      loopFocus
      aria-label={ariaLabel}
      className={cn('inline-grid shrink-0 auto-cols-fr grid-flow-col self-center rounded-lg border border-border-default p-0.5', className)}
    >
      {/* `inline-grid`: as wide as its options, never the room it is given — in a title it kept changing width with the buttons beside it. */}
      {/* The fill, under the options: the first column's box, sliding to the chosen one; still under prefers-reduced-motion. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none col-start-1 row-start-1 rounded-md bg-bg-nav-active transition-transform duration-200 ease-out motion-reduce:transition-none',
          SLIDE[chosen],
        )}
      />
      {options.map((option, index) => {
        const toggle = (
          <Toggle
            key={option.value}
            value={option.value}
            aria-label={option.icon != null ? option.label : undefined}
            // An icon: IconButton's square around it. Words: a Tab's padding
            // and size. The chosen one has no fill of its own — the sliding one
            // is it — and the others light up under the pointer as a muted
            // IconButton does.
            className={(state) =>
              cn(
                'row-start-1 flex cursor-pointer items-center justify-center rounded-md transition-colors',
                COLUMN[index],
                option.icon != null ? 'size-6' : 'px-2 py-1 text-body-2',
                state.pressed ? 'text-text-primary' : MUTED_CONTROL_CLASSES,
              )
            }
          >
            {option.icon ?? option.label}
          </Toggle>
        )
        return option.icon != null ? (
          <TooltipTrigger key={option.value} label={option.label}>
            {toggle}
          </TooltipTrigger>
        ) : (
          toggle
        )
      })}
    </ToggleGroup>
  )
}
