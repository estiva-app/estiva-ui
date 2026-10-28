/**
 * archivedLine, the one sentence every app shows on an archived file (PEEKM-2).
 * It lives in @estiva-app/conversation since PEEKM-8, so the agent prints the
 * same words; this package hands it on unchanged.
 */
import { archivedLine as sentence } from '@estiva-app/conversation'

/**
 * The line in the comment box's place on an archived file (CommentBox's
 * `closed.reason`), in every app's words alike.
 *
 * A file archived itself says so; one archived with a file above it names the
 * closest archived one by its kind — "Unarchive the page to comment." — so a
 * person unarchives the right thing. `options.in` names where to unarchive, for
 * an app with no Unarchive of its own; `options.to` is what waits, "comment"
 * unless said.
 *
 * Typed here rather than inferred, so this package's types never point at
 * @estiva-app/conversation (bundled, not a dependency of an app's).
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-file-is-archived-with-the-closest-archived-file-above-it.md
 */
export const archivedLine: (
  archive: { with?: string } | undefined,
  noun?: string,
  options?: { in?: string; to?: string },
) => string | undefined = sentence
