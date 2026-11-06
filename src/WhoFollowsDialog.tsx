import { useState } from 'react'
import { DialogShell } from './DialogShell'
import { EmptyState } from './EmptyState'
import { AddPeopleLayer, AddRow, RosterRow, type MembersDialogCandidate, type MembersDialogMember } from './MembersDialog'
import { SectionLabel } from './SectionLabel'

export interface WhoFollowsDialogProps {
  /** The place's name: the title reads "Who follows <title>". */
  title: string
  /** Who follows it at All, in the order to draw them. A row is a `MembersDialogMember`; its caption says how they are in it. */
  all: MembersDialogMember[]
  /** Who follows it at Important. */
  important: MembersDialogMember[]
  /** Who "Add someone" may offer. Everyone listed is left out by id; leave the viewer out yourself — they join with the switch, not by adding themselves. */
  candidates?: MembersDialogCandidate[]
  /**
   * Adds the people chosen. With it, the "Add someone" row shows and opens the
   * same add layer as `MembersDialog`'s. Return `false` to stay on it.
   */
  onAdd?: (chosen: MembersDialogCandidate[]) => void | boolean | Promise<void | boolean>
  /** `add` opens straight on the add layer, as a menu's "Add someone…" does. */
  initialView?: 'list' | 'add'
  onClose: () => void
}

/**
 * Who follows a place, in two groups, All then Important, each with its count
 * and "Nobody" when empty; and "Add someone" on top, which opens the add layer
 * `MembersDialog` uses. Nobody's level is changed here: each person changes
 * their own on the place's `FollowSwitch`.
 */
export function WhoFollowsDialog({ title, all, important, candidates = [], onAdd, initialView = 'list', onClose }: WhoFollowsDialogProps) {
  const [view, setView] = useState<'list' | 'add'>(onAdd ? initialView : 'list')
  const heading = `Who follows ${title}`

  if (view === 'add' && onAdd) {
    return (
      <AddPeopleLayer
        title="Add someone"
        backLabel="Back to who follows"
        candidates={candidates}
        excludeIds={[...all, ...important].map((m) => m.id)}
        onAdd={onAdd}
        onBack={() => setView('list')}
        onClose={onClose}
      />
    )
  }

  const group = (label: string, rows: MembersDialogMember[]) => (
    <div className="flex flex-col pt-2">
      <SectionLabel tone="muted" className="px-5">{`${label} · ${rows.length}`}</SectionLabel>
      {rows.length === 0 ? (
        <div className="px-5">
          <EmptyState scope="rows" message="Nobody" />
        </div>
      ) : (
        rows.map((m) => <RosterRow key={m.id} member={m} />)
      )}
    </div>
  )

  return (
    <DialogShell title={heading} onClose={onClose} bodyMaxHeight="max-h-[400px]" bodyClassName="p-0 py-2">
      {onAdd && (
        <div className="flex flex-col px-2">
          <AddRow label="Add someone" onClick={() => setView('add')} />
        </div>
      )}
      {group('All', all)}
      {group('Important', important)}
    </DialogShell>
  )
}
