import { useState } from 'react'
import { IconUserMinus, IconUserPlus } from '@tabler/icons-react'
import { Button } from './Button'
import { DialogShell } from './DialogShell'
import { EmptyState } from './EmptyState'
import { AddPeopleLayer, AddRow, LEADING_CLASSES, RosterRow, type MembersDialogCandidate, type MembersDialogMember, type MembersDialogSelfAction } from './MembersDialog'
import { MenuItem } from './Menu'
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
  /**
   * The viewer's own Join or Leave, as `MembersDialog`'s: Leave on their own row, which comes first in its group; with no
   * row of their own (not in it, or in it at no level shown here), Join or Leave on top, beside "Add someone".
   */
  self?: {
    action: MembersDialogSelfAction
    onToggle: () => void | Promise<unknown>
    /** The viewer's id: the row in `all` or `important` that carries Leave. */
    id: string
  }
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
export function WhoFollowsDialog({ title, all, important, candidates = [], onAdd, self, initialView = 'list', onClose }: WhoFollowsDialogProps) {
  const [view, setView] = useState<'list' | 'add'>(onAdd ? initialView : 'list')
  const [toggling, setToggling] = useState(false)
  const toggle = async () => {
    if (!self) return
    setToggling(true)
    try {
      await self.onToggle()
    } finally {
      setToggling(false)
    }
  }
  // Leave sits on the viewer's own row, first in its group; with no row of their own, Join or Leave goes on top.
  const ownId = self?.action === 'leave' && [...all, ...important].some((m) => m.id === self.id) ? self.id : undefined
  const ownFirst = (rows: MembersDialogMember[]) => {
    const own = rows.find((m) => m.id === ownId)
    return own ? [own, ...rows.filter((m) => m !== own)] : rows
  }
  const selfOnTop = self && !ownId
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
        ownFirst(rows).map((m) => (
          <RosterRow
            key={m.id}
            member={m}
            trailing={
              m.id === ownId && (
                <Button variant="destructive" size="small" disabled={toggling} onClick={() => void toggle()}>
                  Leave
                </Button>
              )
            }
          />
        ))
      )}
    </div>
  )

  return (
    <DialogShell title={heading} onClose={onClose} bodyMaxHeight="max-h-[400px]" bodyClassName="p-0 py-2">
      {(selfOnTop || onAdd) && (
        <div className="flex flex-col px-2">
          {selfOnTop && (
            <MenuItem
              size="tall"
              className="py-2"
              disabled={toggling}
              onClick={() => void toggle()}
              leading={<span className={LEADING_CLASSES}>{self.action === 'join' ? <IconUserPlus size={16} stroke={1.5} /> : <IconUserMinus size={16} stroke={1.5} />}</span>}
              label={self.action === 'join' ? 'Join' : 'Leave'}
            />
          )}
          {onAdd && <AddRow label="Add someone" onClick={() => setView('add')} />}
        </div>
      )}
      {group('All', all)}
      {group('Important', important)}
    </DialogShell>
  )
}
