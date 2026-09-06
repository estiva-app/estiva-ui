import type { ReactNode } from 'react'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cn } from './cn'

/**
 * A row of tabs. Ship's Tabs (2026-09-01), which was Peek's TopicTabs with
 * the topic-specific ids taken out; on Base UI Tabs since stage 1 of the
 * migration (2026-09-06), which is where the keyboard comes from: one Tab
 * stop for the row, arrow keys between the tabs.
 *
 * A selected tab is a neutral fill (bg-active), not the accent tint —
 * Katerina's ruling (2026-08-27), extended to every app (2026-09-01). Two
 * sizes: `default` is 14px, a little more room; `small` is Peek's own
 * geometry (its inline `fontSize: 12` was the caption token spelled by hand).
 *
 * A tab's count is the sidebar's number, not a chip (Katerina, 2026-09-01,
 * superseding the chip ruling of 2026-08-26): mono, caption size, muted,
 * tabular — the one way a number sits beside a label everywhere. A count of
 * `0` is still drawn ("Assigned to me 0" is an answer); an absent count draws
 * nothing.
 */
export interface TabDef<T extends string> {
  id: T
  label: string
  /** Shown as a muted mono number after the label. Absent draws nothing; 0 is drawn. */
  count?: number
  /** 16px, stroke 1.5. */
  icon?: ReactNode
}

export interface TabsProps<T extends string> {
  tabs: TabDef<T>[]
  active: T
  onChange: (id: T) => void
  /** `default` 14px; `small` 12px, the denser geometry. */
  size?: 'default' | 'small'
  /** Lands on the outer box, around the row. */
  className?: string
}

export function Tabs<T extends string>({ tabs, active, onChange, size = 'default', className }: TabsProps<T>) {
  return (
    <BaseTabs.Root
      value={active}
      onValueChange={(value, details) => {
        // Only a person's choice reaches the caller. Base UI also reports its
        // own fallbacks (an `active` that matches no tab), and those carry
        // `null`, which is not a T.
        if (details.reason === 'none') onChange(value as T)
      }}
      className={className}
    >
      <BaseTabs.List activateOnFocus className="flex items-center gap-2">
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.id}
            value={tab.id}
            className={(state) =>
              cn(
                'flex cursor-pointer items-center transition-colors',
                // gap: default is Ship's 6px; small keeps Peek's original 4px, or
                // "small is Peek's geometry" stops being true.
                size === 'default' ? 'gap-1.5 rounded-md px-2 py-1 text-body-2' : 'gap-1 rounded px-1.5 py-0.5 text-caption',
                state.active ? 'bg-bg-active text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
              )
            }
          >
            {tab.icon}
            {/* Label and count share a baseline: a smaller text centred as a box
                (items-center) floats above the label's baseline — the digits
                read as riding high. Baseline alignment is what makes two sizes
                sit on one line. */}
            <span className="flex items-baseline">
              {tab.label}
              {tab.count !== undefined ? (
                <span className="ml-2.5 font-mono text-caption tabular-nums text-text-secondary">{tab.count}</span>
              ) : null}
            </span>
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
    </BaseTabs.Root>
  )
}
