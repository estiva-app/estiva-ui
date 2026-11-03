import { IconLock } from '@tabler/icons-react'
import { Card } from './Card'
import { EmptyState } from './EmptyState'

export interface NoAccessNoticeProps {
  /** What the link names, in the app's words: "project", "page". The line never says which one: no title. */
  what: string
  /** `page` where the link opens; `card` where a message draws the card of what it names. */
  place?: 'page' | 'card'
}

/**
 * Where a link to a file you can't read opens, and the card a message draws for it: "You can't open this …", with no
 * title, so a link tells someone who can't read the file nothing about it (the story `Project changes`, approved
 * 2 November).
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-file-is-named-by-its-id-in-a-capital-and-small-tag.md
 */
export function NoAccessNotice({ what, place = 'page' }: NoAccessNoticeProps) {
  const line = `You can't open this ${what}`
  if (place === 'page') return <EmptyState scope="page" icon={<IconLock size={16} stroke={1.5} />} message={line} />
  return (
    <Card fill="inset" className="flex items-center gap-2 p-3">
      <IconLock size={16} stroke={1.5} className="shrink-0 text-text-muted" aria-hidden />
      <span className="text-body-2 text-text-secondary">{line}</span>
    </Card>
  )
}
