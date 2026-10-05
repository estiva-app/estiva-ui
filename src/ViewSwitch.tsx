import type { ReactNode } from 'react'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { cn } from './cn'
import { MUTED_CONTROL_CLASSES } from './looks'
import { TooltipTrigger } from './Tooltip'

/**
 * Two or three views of one place, as icons in one box, one of them chosen
 * (Katerina, 5 October: Peek's Topics column, Mine or All folders, switched
 * the way Claude's header switches chat and code). On Base UI's ToggleGroup
 * (D6): the chosen icon is pressed, the arrow keys walk the icons, and the
 * group is one Tab stop.
 *
 * The chosen view's fill slides to the next one (her ask, the same day), in
 * `bg-nav-active` — the colour of the current row in a sidebar, so the switch
 * and the row it opened are chosen in one colour: Peek's blue tint, Ship's
 * and Leaf's grey. Every icon is the same 24px square, so the fill moves by
 * whole squares (`translate-x-6`, `-12`) and nothing is measured.
 *
 * Icons only, so each has its name as a tooltip and as its accessible name;
 * the place it sits in should say which view is showing too — a column's
 * title — so nobody has to read an icon to know where they are.
 *
 * One is always chosen: pressing the chosen icon again changes nothing.
 * Words instead of icons, or more than three views, are `Tabs`.
 */
export interface ViewSwitchOption<T extends string> {
  value: T
  /** 16px, stroke 1.5. */
  icon: ReactNode
  /** Its tooltip and its accessible name: "Mine", "All folders". */
  label: string
}

export interface ViewSwitchProps<T extends string> {
  /** Two or three. */
  options: ViewSwitchOption<T>[]
  value: T
  /** Only for a person's choice, and never for the view already chosen. */
  onChange: (value: T) => void
  /** What it switches: "View". Read before the chosen icon's name. */
  'aria-label'?: string
  /** Placement only. */
  className?: string
}

/** Where the fill sits, by the chosen icon's place: whole 24px squares. */
const SLIDE = ['translate-x-0', 'translate-x-6', 'translate-x-12']

export function ViewSwitch<T extends string>({ options, value, onChange, 'aria-label': ariaLabel = 'View', className }: ViewSwitchProps<T>) {
  const chosen = Math.max(0, options.findIndex((option) => option.value === value))
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        // Single choice: a press on the chosen icon empties the group — keep it.
        const picked = next.find((item) => item !== value) as T | undefined
        if (picked !== undefined) onChange(picked)
      }}
      loopFocus
      aria-label={ariaLabel}
      className={cn('relative flex shrink-0 items-center self-center rounded-lg border border-border-default p-0.5', className)}
    >
      {/* The fill, under the icons: one square, sliding to the chosen one; still under prefers-reduced-motion. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0.5 top-0.5 size-6 rounded-md bg-bg-nav-active transition-transform duration-200 ease-out motion-reduce:transition-none',
          SLIDE[chosen],
        )}
      />
      {options.map((option) => (
        <TooltipTrigger key={option.value} label={option.label}>
          <Toggle
            value={option.value}
            aria-label={option.label}
            // IconButton's square around a 16px icon, above the fill. The chosen
            // one has no fill of its own — the sliding one is it — and the
            // others light up under the pointer as a muted IconButton does.
            className={(state) =>
              cn(
                'relative flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors',
                state.pressed ? 'text-text-primary' : MUTED_CONTROL_CLASSES,
              )
            }
          >
            {option.icon}
          </Toggle>
        </TooltipTrigger>
      ))}
    </ToggleGroup>
  )
}
