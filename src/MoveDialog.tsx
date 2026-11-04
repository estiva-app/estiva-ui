import { useEffect, useRef, useState } from 'react'
import { Checkbox } from './Checkbox'
import { EmptyState } from './EmptyState'
import { Field } from './Field'
import { FormDialog } from './FormDialog'
import { Select } from './Select'

const TOP = '__top__'

/** A Folder a file may be moved to. */
export interface MoveFolder {
  id: string
  name: string
}

/** One place a file may be put under, in the Folder the dialog is showing. */
export interface MovePlace {
  /** What it goes under: that file's address; `''` for the top of the Folder (or, for a file whose parent is one kind, none). */
  id: string
  /** Its breadcrumb, outermost first, ending in its own title; empty for the top. */
  path: readonly string[]
}

/** Where the person put it: the Folder, and, for a file that nests, what it goes under (`''` for the top). */
export interface MoveChoice {
  folder: string
  parent?: string
  /** Whether `check`'s box was ticked; only when it was shown for the Folder picked. */
  checked?: boolean
}

/** A box under the choice that only some Folders offer, such as "Keep it a space in <team>" where the person may mark one. */
export interface MoveCheck {
  /** The box's words for a Folder, or `undefined` to leave it out there. */
  label: (folder: string) => string | undefined
  /** Ticked when the dialog opens. */
  checked: boolean
}

/**
 * Move a file: to another Folder, under another file there, or both (FOL-45)
 * — Peek's MoveDialog, moved into the kit (C11, 2 November), which Leaf's
 * and Ship's moves copied. The Folder first, then what it goes under there:
 * two `Select`s, the second read from the first when it is picked, never for
 * every Folder up front. Nothing is chosen for the person but the top, and
 * only when asked (`startAtTop`): a preselected destination is a move nobody
 * chose.
 *
 * A file that nests under nothing (no `placesIn`) is asked only for the
 * Folder, and the one it is in is not offered. One that is not in exactly one
 * Folder passes `from` empty, and no Folder is held back: listed in none, or
 * in two after a move that half-worked, where moving into either takes it out
 * of the other and Move again is the retry (Ship's rule). A Folder that could
 * not be read says so as the section's empty line does, with its Try again (B8).
 */
export interface MoveDialogProps {
  /** The file's name, said above the choice. */
  title: string
  /** The sentence under the name, in the app's words: "Everyone who can read it now still can." */
  description: string
  /** The Folder it is in now, not offered to a file that nests under nothing. `''` when it is not in exactly one: then no Folder is held back. */
  from: string
  /** The Folders it may go to. Undefined while they are still read: the list says "Reading…". */
  folders: readonly MoveFolder[] | undefined
  /** Where it may go in `from`, already read. Absent with `placesIn`, the Folder it opens on is read at once. */
  places?: readonly MovePlace[]
  /** Where it may go in another Folder, read when that Folder is picked; a rejection is said beside a Try again. Absent: it nests under nothing. */
  placesIn?: (folder: string) => Promise<readonly MovePlace[]>
  /** Choose the top for the person when a Folder offers it: where a file that may sit at any Folder's top lands. Off: Move waits for a pick. */
  startAtTop?: boolean
  /** What the place with an empty `id` says. "The top of" the Folder when absent; "None — under none of these" for a file whose parent is one kind. */
  topLabel?: string
  /** The Folder it opens on, when that is not the one it is in. */
  startIn?: string
  /** The dialog's heading. "Move" when absent. */
  heading?: string
  /** The team field's label. "Team" when absent. */
  folderLabel?: string
  /** Said when no team is offered. "There is no other team it can be moved to." when absent. */
  noFolder?: string
  /** A box under the choice, asked only where `label` names it; its answer comes back as `checked`. */
  check?: MoveCheck
  /** Answer `false` to keep the dialog open (you have said why); anything else closes it. */
  onMove: (choice: MoveChoice) => Promise<boolean | void> | boolean | void
  onClose: () => void
}

export function MoveDialog({
  title,
  description,
  from,
  folders,
  places,
  placesIn,
  startAtTop = false,
  topLabel,
  startIn,
  heading = 'Move',
  folderLabel = 'Team',
  noFolder = 'There is no other team it can be moved to.',
  check,
  onMove,
  onClose,
}: MoveDialogProps) {
  const [ticked, setTicked] = useState(check?.checked ?? false)
  const nests = !!placesIn
  // Moving a file that nests under nothing into the Folder it is in would do nothing, so that one is not offered.
  const destinations = folders && (nests ? folders : folders.filter((folder) => folder.id !== from))
  const offered = (id: string | undefined): id is string => !!id && !!destinations?.some((candidate) => candidate.id === id)
  const [pickedFolder, setPickedFolder] = useState<string>()
  // Until another is picked, the one it opens on — worked out, not set at open, so Folders read after it opened still land on it.
  const folder = pickedFolder ?? [startIn, from].find(offered) ?? ''
  const [read, setRead] = useState<Record<string, readonly MovePlace[] | 'reading' | 'failed'>>(() => (places ? { [from]: places } : {}))
  const [picked, setPicked] = useState<string>()

  // The Folders read or being read, known now rather than at the next render: two picks of one Folder before its read lands read it once.
  const requested = useRef(new Set(places ? [from] : []))
  const readPlaces = (id: string) => {
    if (!placesIn || requested.current.has(id)) return
    requested.current.add(id)
    setRead((current) => ({ ...current, [id]: 'reading' }))
    placesIn(id).then(
      (found) => setRead((current) => ({ ...current, [id]: found })),
      () => {
        requested.current.delete(id)
        setRead((current) => ({ ...current, [id]: 'failed' }))
      },
    )
  }
  const readNow = useRef(readPlaces)
  readNow.current = readPlaces
  // The Folder on show is read once, after render: a pick, or the one it opens on when its places were not handed in.
  useEffect(() => {
    if (folder) readNow.current(folder)
  }, [folder])

  const chooseFolder = (id: string) => {
    setPickedFolder(id)
    setPicked(undefined)
  }

  const chosenName = destinations?.find((candidate) => candidate.id === folder)?.name
  const folderName = chosenName || 'this team'
  const status = nests && folder ? read[folder] : undefined
  const targets = Array.isArray(status) ? (status as readonly MovePlace[]) : []
  const valueOf = (place: MovePlace) => place.id || TOP
  const parent = picked ?? (startAtTop && targets[0] && !targets[0].id ? TOP : undefined)
  const ready = !!folder && (!nests || !!parent)
  const checkLabel = folder ? check?.label(folder) : undefined
  const asked = checkLabel === undefined ? {} : { checked: ticked }

  return (
    <FormDialog
      title={heading}
      submitLabel="Move"
      busyLabel="Moving…"
      ready={ready}
      onSubmit={() => onMove({ ...(nests ? { folder, parent: parent === TOP ? '' : parent } : { folder }), ...asked })}
      onClose={onClose}
    >
      {destinations?.length === 0 ? (
        <EmptyState scope="section" message={noFolder} />
      ) : (
        <>
          {/* The name and its sentence are one block, 8px apart; the form puts 24px between it and the fields. */}
          <div className="flex flex-col gap-2">
            <p className="text-body-2-strong text-text-primary">{title}</p>
            <p className="text-body-2 text-text-secondary">{description}</p>
          </div>
          <Field label={folderLabel}>
            <Select
              value={folder}
              onChange={chooseFolder}
              options={(destinations ?? []).map((candidate) => ({ value: candidate.id, label: candidate.name }))}
              placeholder={destinations ? 'Pick a team' : 'Reading…'}
              ariaLabel={folderLabel}
            />
          </Field>
          {nests &&
            folder &&
            (status === 'failed' ? (
              <EmptyState scope="section" message={`${chosenName || 'This team'} could not be read.`} action={{ label: 'Try again', onClick: () => readPlaces(folder) }} />
            ) : Array.isArray(status) && targets.length === 0 ? (
              <EmptyState scope="section" message={`There is nowhere in ${folderName} to put it.`} />
            ) : (
              <Field label="Put it under">
                <Select
                  value={parent ?? ''}
                  onChange={setPicked}
                  options={targets.map((place) => ({
                    value: valueOf(place),
                    label: place.id ? place.path.join(' › ') : (topLabel ?? `The top of ${folderName}`),
                  }))}
                  placeholder={Array.isArray(status) ? 'Pick where it goes' : 'Reading…'}
                  disabled={!Array.isArray(status)}
                  ariaLabel="Put it under"
                />
              </Field>
            ))}
          {checkLabel !== undefined && <Checkbox checked={ticked} onChange={setTicked} label={checkLabel} />}
        </>
      )}
    </FormDialog>
  )
}
