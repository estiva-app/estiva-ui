import { useState } from 'react'
import { IconCheck, IconCircle, IconCircleDashed, IconCircleDashedPlus, IconUsers, IconUsersPlus } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuSection } from './Menu'

/** A level someone follows a place at. Not following is `undefined`. */
export type FollowLevel = 'all' | 'important'

/** One pick on the switch: a level, Not following, or back to the default a group gives. */
export type FollowChoice = FollowLevel | 'off' | 'default'

const ICON = { size: 16, stroke: 1.5 } as const

/** Tabler has no filled people: IconUsers' two people, drawn solid. */
function IconUsersSolid() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2z" />
      <circle cx="17.5" cy="7.5" r="3" />
      <path d="M16.6 15h0.9a3.5 3.5 0 0 1 3.5 3.5v2.5h-4.4v-2a5.6 5.6 0 0 0 -1.6 -4z" />
    </svg>
  )
}

export interface LevelIconProps {
  /** The level it is followed at; `undefined` draws Not following. */
  level: FollowLevel | undefined
  /** People rather than circles: for a place that is a group's own (Miky, 2 Nov). */
  people?: boolean
}

/**
 * How a place is followed, as one 16px icon: a dashed circle for Important, a
 * full one for All, a dashed one with a plus, muted, for Not following. With
 * `people`, the same three as people: outline, solid, and a plus.
 */
export function LevelIcon({ level, people = false }: LevelIconProps) {
  if (people) {
    if (level === 'all') return <IconUsersSolid />
    if (level === 'important') return <IconUsers {...ICON} aria-hidden />
    return <IconUsersPlus {...ICON} aria-hidden className="text-text-muted" />
  }
  if (level === 'all') return <IconCircle {...ICON} aria-hidden />
  if (level === 'important') return <IconCircleDashed {...ICON} aria-hidden />
  return <IconCircleDashedPlus {...ICON} aria-hidden className="text-text-muted" />
}

const LABEL: Record<FollowLevel, string> = { important: 'Important', all: 'All' }

/**
 * The line under each level: what the place shows at it, and what lights its
 * dot (ACT-5; the activity indicator prototype Miky approved on 10 November).
 * A place that lists files (a topic, a space) says what of them it shows; a
 * place with none (a team's chat) says only what lights. Important's third
 * part restates the record on what names you on a listed file. Not following
 * says a mention still lights: a message that names you lights a place at every
 * level (`lightsOnPlace` in @estiva-app/conversation; Miky, 13 November).
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/at-important-what-names-you-on-a-listed-file-lights-the-topic.md
 */
const WORDS: Record<'files' | 'noFiles', Record<'off' | FollowLevel, string>> = {
  files: {
    off: 'Shows its own conversation. Lights only when someone names you.',
    important: 'Shows its own conversation. Lights for new conversations, replies in yours, and what names you on its files.',
    all: 'Shows its files’ threads too. Lights for all of it.',
  },
  noFiles: {
    off: 'Lights only when someone names you.',
    important: 'Lights for new conversations and replies in yours.',
    all: 'Lights for every message.',
  },
}

export interface FollowSwitchProps {
  /** What lights for the viewer now: a level, or `undefined` for Not following. */
  level: FollowLevel | undefined
  /** The place's name, for the button's accessible name. */
  label: string
  /** Changes it. While its promise runs the button waits; a rejection is the caller's to report. Without it the switch shows the level and cannot change it. */
  onChoose?: (choice: FollowChoice) => void | Promise<unknown>
  /** Without `onChoose`: why it cannot be changed, said under the pointer ("This team is archived"). */
  readOnlyReason?: string
  /** People rather than circles, as `LevelIcon`'s `people`. */
  people?: boolean
  /**
   * Whether the place lists files (a topic, a space): each level then says what of
   * them it shows. `false` for a place with none (a team's chat): the levels say only
   * what lights.
   */
  files?: boolean
  /**
   * The name of the group whose default reaches the viewer, when they chose
   * against it: offers "Back to <name>’s default". Leave it out otherwise.
   */
  backTo?: string
}

/**
 * The one switch on a place: Not following, Important or All, each with what
 * the place shows at it and what lights, and "Back to <name>’s default" when
 * the viewer chose against a group's default. It sits before the place's
 * title, drawn as `LevelIcon`.
 */
export function FollowSwitch({ level, label, onChoose, readOnlyReason, people = false, files = true, backTo }: FollowSwitchProps) {
  const [busy, setBusy] = useState(false)
  const words = WORDS[files ? 'files' : 'noFiles']
  const now = level ? `You follow it at ${LABEL[level]}` : 'Not following'
  const button = (
    <IconButton aria-label={`${now}: change how you follow ${label}`} tooltip={now} disabled={!onChoose || busy} disabledReason={onChoose ? undefined : readOnlyReason}>
      <LevelIcon level={level} people={people} />
    </IconButton>
  )
  if (!onChoose) return button

  const choose = async (choice: FollowChoice) => {
    if (busy) return
    setBusy(true)
    try {
      await onChoose(choice)
    } catch {
      // The caller says it could not save; the switch only stops waiting, and keeps drawing the `level` it is given.
    } finally {
      setBusy(false)
    }
  }
  const item = (choice: 'off' | FollowLevel, text: string, description: string, leading: FollowLevel | undefined) => {
    const on = choice === 'off' ? !level : level === choice
    return (
      <MenuItem
        leading={<LevelIcon level={leading} people={people} />}
        label={text}
        description={description}
        selected={on}
        trailing={on ? <IconCheck {...ICON} aria-hidden /> : undefined}
        onClick={() => void choose(choice)}
      />
    )
  }
  return (
    <Menu trigger={button}>
      <MenuSection label="How you follow it">
        {item('off', 'Not following', words.off, undefined)}
        {item('important', LABEL.important, words.important, 'important')}
        {item('all', LABEL.all, words.all, 'all')}
      </MenuSection>
      {backTo && (
        <MenuSection label={`${backTo} gives you Important`}>
          <MenuItem label={`Back to ${backTo}’s default`} description={level ? 'Your choice no longer applies' : 'Your choice no longer applies; only you see that you changed it'} onClick={() => void choose('default')} />
        </MenuSection>
      )}
    </Menu>
  )
}
