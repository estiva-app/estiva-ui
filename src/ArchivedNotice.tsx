import { useState } from 'react'
import { IconArchive } from '@tabler/icons-react'
import { Button } from './Button'
import { Card } from './Card'

export interface ArchivedNoticeProps {
  /** Who archived it, in the app's words: "You", a name. */
  by: string
  /** When, in the app's words, with its day: "Today", "Tue, Oct 28". */
  when: string
  /** What they wrote when they archived it. */
  resolution?: string
  /** Archived with the closest archived one above it: what that is, "project", "page", "Folder". */
  withWhat?: string
  /** The title of the one it is archived with, named in quotes. */
  withTitle?: string
  /** Restore it; the button waits for it. Absent when it is archived with one above it, or cannot be restored here. */
  onUnarchive?: () => void | Promise<unknown>
  /** Open the one it is archived with. Absent while that is still being read. */
  onOpenParent?: () => void
}

/**
 * The first thing an archived file shows: who archived it and when, the resolution they gave, and the way back
 * (FOL-46). A link still opens an archived file, so this is what stops it reading as live work. A quiet grey card,
 * not a banner: archived is a state the file is in, not news. Peek's, Ship's and Leaf's card, moved here so the three
 * say it in the same words and order (Katerina, 31 October).
 *
 * One archived by itself offers Unarchive; one archived with a file above it is restored there, so it opens that one.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-file-is-archived-with-the-closest-archived-file-above-it.md
 */
export function ArchivedNotice({ by, when, resolution, withWhat, withTitle, onUnarchive, onOpenParent }: ArchivedNoticeProps) {
  const [unarchiving, setUnarchiving] = useState(false)
  const parent = withWhat ?? (withTitle ? 'parent' : undefined)
  const named = withTitle ? ` “${withTitle}”` : ''
  const line = parent ? `Archived with its ${parent}${named} by ${by} · ${when}` : `Archived by ${by} · ${when}`
  return (
    <Card fill="inset" className="flex items-start gap-3 px-4 py-3">
      <IconArchive size={16} stroke={1.5} className="mt-0.5 shrink-0 text-text-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body-2-strong text-text-primary">{line}</span>
        {resolution && <p className="whitespace-pre-wrap text-caption text-text-secondary">{resolution}</p>}
      </div>
      {parent
        ? onOpenParent && (
            <Button variant="outlined" size="small" className="shrink-0" onClick={onOpenParent}>
              {`Open ${parent}`}
            </Button>
          )
        : onUnarchive && (
            <Button
              variant="outlined"
              size="small"
              className="shrink-0"
              disabled={unarchiving}
              onClick={() => {
                // One unarchive at a time: a second press while the first is written would write it twice.
                setUnarchiving(true)
                void Promise.resolve(onUnarchive()).finally(() => setUnarchiving(false))
              }}
            >
              Unarchive
            </Button>
          )}
    </Card>
  )
}
