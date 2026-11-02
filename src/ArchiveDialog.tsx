import { useState } from 'react'
import { Field } from './Field'
import { FormDialog } from './FormDialog'
import { Textarea } from './Textarea'

/** "a, b and c". */
const listOf = (parts: readonly string[]) => (parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`)

/**
 * The question asked before archiving a file or a Folder (FOL-46): what goes
 * out of the lists with it, counted, and an optional resolution — Peek's
 * ArchiveDialog, moved into the kit (C11, 2 November), whose sentences were
 * already Ship's. The app passes its words: the apps it goes out of, and the
 * last line, which says where an archived file waits in that app.
 *
 * A `FormDialog`, not a `ConfirmDialog` (1 October): it asks for a resolution,
 * and a question with a field is a form. So Ctrl+Enter archives from the
 * field, everything waits while it archives, and Escape or a press outside
 * closes it. Archive hides and never deletes, so the button is not destructive.
 */
export interface ArchiveDialogProps {
  /** The file's name, for the title. */
  title: string
  /** What it is, in a word: "topic", "project", "issue", "folder". */
  what: string
  /**
   * What goes out of the lists with it, already counted and worded — "14
   * issues". Empty: nothing else. `null` while it is still being counted: the
   * dialog opens at once and says so, and Archive waits for the count.
   */
  hides: readonly string[] | null
  /** What it lists that stays visible somewhere else, worded — "2 files also in Steer". */
  staysVisible?: readonly string[]
  /** The apps whose lists it goes out of, in the order to name them: `['Peek', 'Ship']` reads "in Peek and in Ship". */
  apps: readonly string[]
  /** The last line, in the app's words: that nothing is deleted, and how to get it back there. */
  getBack: string
  onClose: () => void
  /** With the resolution, trimmed (`''` for none). Resolve `false` to keep the dialog open (you have said why). */
  onArchive: (resolution: string) => Promise<boolean | void> | boolean | void
}

export function ArchiveDialog({ title, what, hides, staysVisible = [], apps, getBack, onClose, onArchive }: ArchiveDialogProps) {
  const [resolution, setResolution] = useState('')
  const where = apps.length ? `, ${listOf(apps.map((app) => `in ${app}`))}` : ''
  return (
    <FormDialog title={`Archive “${title}”?`} submitLabel={`Archive ${what}`} ready={hides !== null} onSubmit={() => onArchive(resolution.trim())} onClose={onClose}>
      {/* The words are one block, 8px apart, before the field; the Form puts 24px between them (1 October). Ctrl+Enter archives from the resolution; Enter there is a new line. */}
      <div className="flex flex-col gap-2 text-body-2 text-text-primary">
        <p>
          {hides === null
            ? `Counting what archiving this ${what} would hide…`
            : hides.length
              ? `This hides the ${what} and ${listOf(hides)} from every list${where}.`
              : `This hides the ${what} from every list${where}.`}
        </p>
        {staysVisible.length > 0 && <p>{`${listOf(staysVisible)} stay visible there.`}</p>}
        <p className="text-text-secondary">{getBack}</p>
      </div>
      <Field label="Resolution (optional)">
        <Textarea
          value={resolution}
          rows={3}
          placeholder={`What happened with this ${what}? Shown first to anyone who opens it.`}
          onChange={(event) => setResolution(event.target.value)}
        />
      </Field>
    </FormDialog>
  )
}
