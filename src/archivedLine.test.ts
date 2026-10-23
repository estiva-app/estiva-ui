/**
 * The line in the comment box's place on an archived file names what to
 * unarchive: the file itself, or the closest archived one above it by its kind
 * (PEEKM-2, record a-file-is-archived-with-the-closest-archived-file-above-it).
 */
import { describe, expect, it } from 'vitest'
import { archivedLine } from './archivedLine'

const ABOVE = '30023:aaaa:plan'

describe('archivedLine', () => {
  it('says nothing for a file that is not archived', () => {
    expect(archivedLine(undefined, 'page')).toBeUndefined()
  })

  it('tells a person to unarchive the file itself when it is archived itself', () => {
    expect(archivedLine({}, 'page')).toBe('Archived. Unarchive it to comment.')
  })

  it('names the closest archived file above by its kind', () => {
    expect(archivedLine({ with: ABOVE }, 'page')).toBe('Unarchive the page to comment.')
    expect(archivedLine({ with: ABOVE }, 'project')).toBe('Unarchive the project to comment.')
    expect(archivedLine({ with: ABOVE }, 'PDF')).toBe('Unarchive the PDF to comment.')
  })

  it('writes Folder as a proper noun', () => {
    expect(archivedLine({ with: ABOVE }, 'folder')).toBe('Unarchive the Folder to comment.')
  })

  it('still says what to do when the app has no noun for what is above', () => {
    expect(archivedLine({ with: ABOVE })).toBe('Unarchive the parent to comment.')
    expect(archivedLine({ with: ABOVE }, '  ')).toBe('Unarchive the parent to comment.')
  })
})
