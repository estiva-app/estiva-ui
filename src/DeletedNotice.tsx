import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import { Button } from './Button'
import { Card } from './Card'

export interface DeletedNoticeProps {
  /** Who deleted it, in the app's words: "You", a name. */
  by: string
  /** When, in the app's words, with its day: "Today", "Mon, Nov 2". */
  when: string
  /** Bring it back; the button waits for it. Absent for someone who may not edit it: the card offers nothing. */
  onRestore?: () => void | Promise<unknown>
}

/**
 * What a link to a deleted file opens on: who deleted it and when, and Restore for anyone who may edit it. A deleted
 * file is gone from lists and search; a link to it still opens, and this is what stops it reading as live work.
 * `ArchivedNotice`'s card and words, so the two states read alike (the story `Project changes`, approved 2 November).
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/every-file-is-an-artifact-the-relay-keeps-in-order.md
 */
export function DeletedNotice({ by, when, onRestore }: DeletedNoticeProps) {
  const [restoring, setRestoring] = useState(false)
  return (
    <Card fill="inset" className="flex items-start gap-3 px-4 py-3">
      <IconTrash size={16} stroke={1.5} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="min-w-0 flex-1 text-body-2-strong text-text-primary">{`Deleted by ${by} · ${when}`}</span>
      {onRestore && (
        <Button
          variant="outlined"
          size="small"
          className="shrink-0"
          disabled={restoring}
          onClick={() => {
            // One restore at a time: a second press while the first is written would write it twice.
            setRestoring(true)
            void Promise.resolve()
              .then(onRestore)
              .finally(() => setRestoring(false))
          }}
        >
          Restore
        </Button>
      )}
    </Card>
  )
}
