import type { ReactElement } from 'react'

/**
 * Whether the element a `Menu` or `Popover` was handed as its trigger is
 * disabled — by `disabled`, or by a `disabledReason` (which disables the
 * button and keeps it reachable). Base UI's trigger parts keep a disabled
 * state of their own and write it over the rendered button's, so they have to
 * be told (Finding 39, 2026-09-08).
 */
export function triggerDisabled(trigger: ReactElement): boolean {
  const props = trigger.props as { disabled?: boolean; disabledReason?: string }
  return !!(props.disabled || props.disabledReason)
}
