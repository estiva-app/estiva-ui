import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * A row of tabs. Ship's Tabs (2026-09-01), which was Peek's TopicTabs with
 * the topic-specific ids taken out.
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
  /** 16px, stroke 1.5 — as Peek draws them. */
  icon?: ReactNode
}

export interface TabsProps<T extends string> {
  tabs: TabDef<T>[]
  active: T
  onChange: (id: T) => void
  /** `default` 14px (Ship's); `small` 12px (Peek's TopicTabs as it ships). */
  size?: 'default' | 'small'
  className?: string
}

export function Tabs<T extends string>({ tabs, active, onChange, size = 'default', className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex items-center gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 transition-colors',
            // Arbitrary sizes (the body-2 and caption tokens): the colour branch below
            // follows them through cn(), and tw-merge drops a custom text-{size}
            // once a text-{colour} lands after it. Measured: tabs rendered 16px.
            size === 'default' ? 'rounded-md px-2 py-1 text-[14px] leading-[140%]' : 'rounded px-1.5 py-0.5 text-[12px] leading-[120%]',
            active === tab.id ? 'bg-bg-active text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined ? (
            <span className="ml-1 font-mono text-caption tabular-nums text-text-secondary">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
