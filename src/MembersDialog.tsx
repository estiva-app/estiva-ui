import { useId, useState, type ReactNode } from 'react'
import { IconArrowLeft, IconUserMinus, IconUserPlus } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Chip } from './Chip'
import { ChipInput, type ChipInputOption } from './ChipInput'
import { DialogShell } from './DialogShell'
import { Field } from './Field'
import { Form } from './Form'
import { IconButton } from './IconButton'
import { MenuItem } from './Menu'

/** One row of the roster: a face, a name, and an optional second line. */
export interface MembersDialogMember {
  id: string
  name: string
  /** A picture URL, resolved by the caller, as `Avatar` takes its `src`. */
  picture?: string
  /** The line under the name: a role, a relation ("Assignee"), or a state. */
  caption?: string
}

/** Somebody who can be added: a `ChipInput` option with a face. */
export interface MembersDialogCandidate extends ChipInputOption {
  picture?: string
}

/** What the viewer's own row offers: in when they are out, out when they are in. */
export type MembersDialogSelfAction = 'join' | 'leave'

export interface MembersDialogProps {
  /** The roster, in the order to draw it. The viewer's own row is the caller's to name ("You"). */
  members: MembersDialogMember[]
  /** The number in the title's chip. Defaults to how many rows there are. */
  count?: number
  /**
   * The viewer's own row on top: "Join" when they are not in, "Leave" when
   * they are. Absent while it is not known, or where they cannot change it —
   * no row is better than a wrong one.
   */
  self?: {
    action: MembersDialogSelfAction
    onToggle: () => void | Promise<unknown>
  }
  /** Who "Add members" may offer. Members are left out by id. */
  candidates?: MembersDialogCandidate[]
  /**
   * Adds the people chosen. With it, the "Add members" row shows and opens the
   * add layer. Return `false` (or a promise of it) to stay on the add layer —
   * nothing was added; anything else goes back to the roster.
   */
  onAdd?: (chosen: MembersDialogCandidate[]) => void | boolean | Promise<void | boolean>
  /** One line under the roster — what membership does and does not cover. */
  note?: ReactNode
  /** `add` opens straight on the add layer. */
  initialView?: 'list' | 'add'
  onClose: () => void
}

const LEADING_CLASSES = 'size-8 rounded-md bg-accent-muted flex items-center justify-center shrink-0 text-accent-primary'

/**
 * Who is in this, with joining, leaving and adding people — the list a
 * `MembersPill` opens.
 *
 * Moved from Peek's `MembersDialog` (2026-10-06; Katerina's design of 22 July,
 * with the row and inset rulings of 15 September). Two layers in one dialog:
 * the roster, with the viewer's Join or Leave and "Add members" on top, and the
 * add layer, whose back arrow returns to the roster. Adding returns to the
 * roster so the new people are visible at once.
 */
export function MembersDialog({ members, count, self, candidates = [], onAdd, note, initialView = 'list', onClose }: MembersDialogProps) {
  const [view, setView] = useState<'list' | 'add'>(onAdd ? initialView : 'list')
  const [chosen, setChosen] = useState<MembersDialogCandidate[]>([])
  const [toggling, setToggling] = useState(false)
  const formId = useId()

  const toggle = async () => {
    if (!self || toggling) return
    setToggling(true)
    try {
      await self.onToggle()
    } finally {
      setToggling(false)
    }
  }

  const add = async () => {
    if (!onAdd || chosen.length === 0) return
    if ((await onAdd(chosen)) === false) return
    setChosen([])
    setView('list')
  }

  if (view === 'add' && onAdd) {
    return (
      <DialogShell
        title="Add members"
        onClose={onClose}
        headerContent={
          <div className="flex min-w-0 items-center gap-2">
            <IconButton tooltip="Back to members" aria-label="Back to members" className="-ml-2" onClick={() => setView('list')}>
              <IconArrowLeft size={16} stroke={1.5} />
            </IconButton>
            <span className="truncate text-h4 text-text-primary">Add members</span>
          </div>
        }
        bodyClassName="flex flex-col gap-6"
        footer={
          <>
            <Button variant="muted" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" form={formId} disabled={chosen.length === 0}>Invite</Button>
          </>
        }
      >
        <Form id={formId} onSubmit={add}>
          <Field label="Invite people" required>
            <ChipInput
              value={chosen}
              onChange={setChosen}
              options={candidates}
              placeholder="Search people..."
              excludeIds={members.map((m) => m.id)}
              chipLeading={(o) => <Avatar name={o.label} src={o.picture} size={16} />}
              rowLeading={(o) => <Avatar name={o.label} src={o.picture} size={32} />}
              autoFocus
            />
          </Field>
        </Form>
      </DialogShell>
    )
  }

  return (
    <DialogShell
      title="Members"
      onClose={onClose}
      headerContent={
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-h4 text-text-primary">Members</span>
          <Chip label={String(count ?? members.length)} />
        </div>
      }
      bodyMaxHeight="max-h-[400px]"
      bodyClassName="p-0 py-2"
    >
      {/* MenuItem outside a Menu is a plain button. Its fill sits 8px in from the dialog's sides,
          and its own 12px inset puts the square over the rows' faces, 20px in, at the same 48px. */}
      {(self || onAdd) && (
        <div className="flex flex-col px-2">
          {self && (
            <MenuItem
              size="tall"
              className="py-2"
              disabled={toggling}
              onClick={() => void toggle()}
              leading={<span className={LEADING_CLASSES}>{self.action === 'join' ? <IconUserPlus size={16} stroke={1.5} /> : <IconUserMinus size={16} stroke={1.5} />}</span>}
              label={self.action === 'join' ? 'Join' : 'Leave'}
            />
          )}
          {onAdd && (
            <MenuItem
              size="tall"
              className="py-2"
              onClick={() => setView('add')}
              leading={<span className={LEADING_CLASSES}><IconUserPlus size={16} stroke={1.5} /></span>}
              label="Add members"
            />
          )}
        </div>
      )}
      {members.map((member) => (
        <div key={member.id} className="flex h-12 items-center gap-3 px-5">
          <Avatar size={32} name={member.name} src={member.picture} />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-[2px]">
            <div className="truncate text-body-2 text-text-primary">{member.name}</div>
            {member.caption && <div className="truncate text-caption text-text-secondary">{member.caption}</div>}
          </div>
        </div>
      ))}
      {note && <div className="px-5 pb-2 pt-3 text-caption text-text-secondary">{note}</div>}
    </DialogShell>
  )
}
