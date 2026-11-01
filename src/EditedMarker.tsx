import { WithTooltip } from './Tooltip'

export interface EditedMarkerProps {
  /** When it was edited, in the app's words for the tooltip ("Edited 11:20 AM"). Absent: nothing is drawn. */
  edited?: string
}

/**
 * "(edited)" beside a comment's time: the reader is told the words changed, so a reply written to the old words is
 * not misread. The time it was edited is in the tooltip, so the line stays one line. Peek's, moved with the
 * conversation (the record that makes one conversation ends its "stays Peek's" ruling).
 */
export function EditedMarker({ edited }: EditedMarkerProps) {
  if (!edited) return null
  return (
    <WithTooltip label={edited} wrapperClassName="shrink-0">
      <span className="whitespace-nowrap text-caption text-text-muted">(edited)</span>
    </WithTooltip>
  )
}
