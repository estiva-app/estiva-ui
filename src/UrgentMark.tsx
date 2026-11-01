import { IconAlertSquareRounded } from '@tabler/icons-react'

/**
 * Urgent and new: a 12px warning mark on its tint, in the unread dot's 24px slot. A row of the navigation that is
 * urgent and unread, and a comment or reply that is urgent and new, draw this one mark.
 */
export function UrgentMark() {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center" data-urgent>
      <div className="flex items-center rounded-full bg-warning-muted p-0.5 signal:shadow-glow-warning">
        <IconAlertSquareRounded size={12} stroke={2.5} className="text-warning-default" />
      </div>
    </div>
  )
}
