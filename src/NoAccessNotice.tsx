import { IconLock } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'

export interface NoAccessNoticeProps {
  /** What the link names, in the app's words: "project", "page". The line never says which one: no title. */
  what: string
}

/**
 * Where a link to a file you can't read opens: "You can't open this …", with no title, so a link tells someone who
 * can't read the file nothing about it (the story `Project changes`, approved 2 November). Under a message the same
 * moment is `LinkRow`'s and `LinkCard`'s own card, in the same words (Miky, ALO-4's review, 3 November).
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-file-is-named-by-its-id-in-a-capital-and-small-tag.md
 */
export function NoAccessNotice({ what }: NoAccessNoticeProps) {
  return <EmptyState scope="page" icon={<IconLock size={16} stroke={1.5} />} message={`You can't open this ${what}`} />
}
