/**
 * archivedLine, the one sentence every app shows on an archived file (PEEKM-2).
 */

/**
 * The line in the comment box's place on an archived file (CommentBox's
 * `closed.reason`), in every app's words alike.
 *
 * A file archived itself says so; one archived with a file above it names the
 * closest archived one by its kind — "Unarchive the page to comment." — so a
 * person unarchives the right thing, and once it is unarchived the next one up
 * is named. Which file that is comes from interop: `archive.with` is its
 * address, and the app reads its noun.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-file-is-archived-with-the-closest-archived-file-above-it.md
 */
export function archivedLine(archive: { with?: string } | undefined, noun?: string): string | undefined {
  if (!archive) return undefined
  if (!archive.with) return 'Archived. Unarchive it to comment.'
  // A noun arrives as the manifest wrote it; a Folder is a proper noun in every
  // app's copy. With no noun, Peek's ArchivedNotice word.
  const word = noun?.trim()
  return `Unarchive the ${word === 'folder' ? 'Folder' : word || 'parent'} to comment.`
}
