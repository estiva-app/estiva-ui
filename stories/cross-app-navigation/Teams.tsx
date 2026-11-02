import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  IconCheck,
  IconCircle,
  IconCircleDashed,
  IconCircleDashedPlus,
  IconDotsVertical,
  IconLayoutDashboard,
  IconLock,
  IconRobot,
  IconTarget,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconUsersPlus,
} from '@tabler/icons-react'
import { AppShell } from '../../src/AppShell'
import { Avatar } from '../../src/Avatar'
import { AvatarGroup } from '../../src/AvatarGroup'
import { Banner } from '../../src/Banner'
import { Button } from '../../src/Button'
import { Checkbox } from '../../src/Checkbox'
import { Chip } from '../../src/Chip'
import { DialogShell } from '../../src/DialogShell'
import { EmptyState } from '../../src/EmptyState'
import { IconButton } from '../../src/IconButton'
import { ListColumn } from '../../src/ListColumn'
import { Menu, MenuItem, MenuSection } from '../../src/Menu'
import { NavItem } from '../../src/NavItem'
import { PersonTrigger } from '../../src/PersonTrigger'
import { Rail } from '../../src/Rail'
import { RailItem } from '../../src/RailItem'
import { ScrollArea } from '../../src/ScrollArea'
import { SectionHeader } from '../../src/SectionHeader'
import { SectionLabel } from '../../src/SectionLabel'
import { Select } from '../../src/Select'
import { SkeletonBar, SkeletonList } from '../../src/Skeleton'
import { LinkCard } from '../../src/LinkCard'
import { PEOPLE, fileOf, type Message as PeekMessage, type PersonId } from './fixtures'
import { Header, go, icon16 } from './Lens'
import { ActivityDot, NewDot, cardOf, hasNewActivity } from './PeekConversation'

/**
 * Teams and following: Miky's answers of 2 November, as Peek would draw them.
 * Every Folder is a team (nothing private yet); a team has members and
 * followers and holds three kinds of place: its chat, its spaces (topics it
 * marks on its own list) and the topics it leads. You follow each place at
 * All, at Important or not at all, with one switch before its title. Someone
 * adding you puts you in at Important; a team's default is worked out, never
 * written; your own choice wins over both.
 *
 * Self-contained: its own example workspace and state, kept for the story's
 * life. The 29–30 Oct stories beside it keep their own model.
 */

// ── The example workspace ────────────────────────────────────────────────

type TeamId = 'company' | 'eng' | 'design' | 'steer' | 'marketing'
type Kind = 'chat' | 'space' | 'topic'
type Level = 'all' | 'important'
/** Your own act on a place: a level, or Not following. */
type Choice = Level | 'off'

interface Team {
  id: TeamId
  name: string
  members: PersonId[]
  /** Who follows the team without being in it. Each person sees only their own. */
  followers: PersonId[]
}

interface Place {
  id: string
  title: string
  team: TeamId
  kind: Kind
  /** Who started a topic: in it at Important from its first record. */
  author?: PersonId
  /** The files it lists, in the column beside it. */
  files?: string[]
}

/** Something said in a place: a new conversation, or a reply in one the people in `in` are part of. */
interface Said {
  id: string
  by: PersonId
  at: string
  body: string
  reply?: { to: string; in: PersonId[] }
  /** Per app's Activity: someone named, and reactions to the writer's message. */
  mentions?: PersonId
  reactions?: { emoji: string; by: PersonId[] }[]
}

const AGENTS: PersonId[] = ['agent']
const isAgent = (p: PersonId) => AGENTS.includes(p)

const FIRST_TEAMS: Team[] = [
  { id: 'company', name: 'Company', members: ['miky', 'katerina', 'agent'], followers: [] },
  { id: 'eng', name: 'Engineering', members: ['miky', 'agent'], followers: ['katerina'] },
  { id: 'design', name: 'Design', members: ['katerina', 'miky'], followers: [] },
  { id: 'steer', name: 'Steer', members: ['miky', 'agent'], followers: [] },
  { id: 'marketing', name: 'Marketing', members: ['miky'], followers: [] },
]

const FIRST_PLACES: Place[] = [
  { id: 'general', title: 'general', team: 'company', kind: 'chat' },
  { id: 'suits', title: 'suits-updates', team: 'company', kind: 'space', files: ['d-weekly'] },
  { id: 'widgets', title: 'Widgets', team: 'company', kind: 'topic', author: 'miky', files: ['p-widgets-1', 'p-widgets-2', 'd-testing-widgets'] },
  { id: 'grants', title: 'Grants', team: 'company', kind: 'topic', author: 'miky', files: ['d-grant-research', 'd-grant-reusable', 'd-grant-application'] },

  { id: 'eng-chat', title: 'engineering', team: 'eng', kind: 'chat' },
  { id: 'bug', title: 'bug', team: 'eng', kind: 'space', files: ['p-bugs', 'p-peek-bugs'] },
  { id: 'releases', title: 'releases', team: 'eng', kind: 'space' },
  { id: 'fast', title: 'Peek, Ship and Leaf are fast', team: 'eng', kind: 'topic', author: 'miky', files: ['p-peek-fast', 'p-ship-instant', 'd-speed'] },
  { id: 'teams-release', title: 'Teams release', team: 'eng', kind: 'topic', author: 'agent' },

  { id: 'design-chat', title: 'design', team: 'design', kind: 'chat' },
  { id: 'design-review', title: 'design-review', team: 'design', kind: 'space', files: ['p-one-conversation'] },
  { id: 'navigation', title: 'Navigation', team: 'design', kind: 'topic', author: 'katerina', files: ['p-navigation', 'd-navigation'] },

  { id: 'steer-chat', title: 'steer', team: 'steer', kind: 'chat' },
  { id: 'agent-feedback', title: 'agent-feedback', team: 'steer', kind: 'space', files: ['p-agent-feedback'] },
  { id: 'records', title: 'Decision records', team: 'steer', kind: 'topic', author: 'agent', files: ['p-records-2'] },

  { id: 'marketing-chat', title: 'marketing', team: 'marketing', kind: 'chat' },
]

/** Levels people chose themselves. */
const FIRST_CHOICES: Partial<Record<PersonId, Record<string, Choice>>> = {
  miky: { fast: 'all', bug: 'all' },
  katerina: { widgets: 'important', 'design-review': 'all' },
}

/** Who someone added to a place, and who added them. */
const FIRST_ADDED: Record<string, Partial<Record<PersonId, PersonId>>> = {
  navigation: { miky: 'katerina' },
  widgets: { agent: 'miky' },
}

const SAID: Record<string, Said[]> = {
  general: [
    { id: 'g1', by: 'miky', at: 'Fri 09:10', body: 'Friday meeting moves to 14:00 this week.' },
    { id: 'g2', by: 'katerina', at: 'Fri 09:20', body: 'Works for me.', reply: { to: 'g1', in: ['miky', 'katerina'] } },
  ],
  suits: [{ id: 's1', by: 'agent', at: 'Thu 18:00', body: 'Estiva Suits Update, week 44: Leaf links, faster Ship, Teams shaped.' }],
  widgets: [{ id: 'w1', by: 'miky', at: 'Fri 11:00', body: 'Widgets 3 is next after Teams. Katerina, the card spacing is yours.' }],
  grants: [{ id: 'gr1', by: 'miky', at: 'Wed 15:00', body: 'The reusable answers are in the grant document.' }],
  'eng-chat': [{ id: 'e1', by: 'agent', at: 'Fri 10:02', body: 'Relay deploy at 16:00; Peek is unaffected.' }],
  bug: [
    { id: 'b1', by: 'katerina', at: 'Fri 12:30', body: 'The Move dialog closes before the team list loads.' },
    { id: 'b2', by: 'agent', at: 'Fri 12:41', body: 'Reproduced on Ship; fix in review.', reply: { to: 'b1', in: ['katerina', 'agent'] } },
    { id: 'b3', by: 'katerina', at: 'Fri 12:55', body: 'Miky, can it wait for Monday’s release?', mentions: 'miky' },
  ],
  releases: [{ id: 'r1', by: 'agent', at: 'Thu 17:00', body: 'interop 0.61 is out: a team is the Folder, called a team.' }],
  fast: [
    { id: 'f1', by: 'agent', at: 'Fri 08:40', body: 'Ship opens in 0.6 s on Miky’s workspace.' },
    // Activity alone for Miky: read, yet Katerina reacted after he last looked (the orange dot).
    { id: 'f2', by: 'miky', at: 'Fri 12:20', body: 'Next: Peek on my workspace, the same way.', reactions: [{ emoji: '👍', by: ['katerina'] }] },
  ],
  'teams-release': [{ id: 't1', by: 'agent', at: 'Fri 13:00', body: 'Order: SPEC, relay rule, shared fold, then Peek.' }],
  'design-chat': [{ id: 'd1', by: 'katerina', at: 'Thu 10:00', body: 'New icons are in the kit.' }],
  'design-review': [{ id: 'dr1', by: 'katerina', at: 'Fri 14:00', body: 'Review of the Teams sidebar on Monday.' }],
  navigation: [{ id: 'n1', by: 'katerina', at: 'Fri 15:30', body: 'Teams first, then Topics, in the rail. Miky, does that order work?', mentions: 'miky' }],
  'steer-chat': [{ id: 'st1', by: 'miky', at: 'Wed 09:00', body: 'Handoffs carry the paste-ready prompt from today.' }],
  'agent-feedback': [{ id: 'af1', by: 'miky', at: 'Tue 16:00', body: 'The agent asked a naming question as a protocol one again.' }],
  records: [{ id: 'rc1', by: 'agent', at: 'Mon 12:00', body: 'Eight records from 2 Nov wait on Miky’s merge.' }],
}

/** What each person has not read yet, at the start. */
const FIRST_UNREAD: Partial<Record<PersonId, string[]>> = {
  miky: ['bug', 'navigation', 'design-review'],
  katerina: ['general', 'bug', 'widgets', 'fast', 'releases'],
}

// ── The state, and the one rule every app works out ──────────────────────

interface World {
  teams: Team[]
  places: Place[]
  choices: Partial<Record<PersonId, Record<string, Choice>>>
  added: Record<string, Partial<Record<PersonId, PersonId>>>
  said: Record<string, Said[]>
  /** How many of a place's messages each person has read; the rule decides whether the rest light. */
  read: Partial<Record<PersonId, Record<string, number>>>
}

/** At the start each person has read everything but the last message of the places FIRST_UNREAD names. */
const firstRead = () =>
  Object.fromEntries(
    (Object.keys(PEOPLE) as PersonId[]).map((p) => [
      p,
      Object.fromEntries(FIRST_PLACES.map((pl) => [pl.id, (SAID[pl.id] ?? []).length - Number((FIRST_UNREAD[p] ?? []).includes(pl.id))])),
    ]),
  )

const firstWorld = (): World => ({
  teams: FIRST_TEAMS,
  places: FIRST_PLACES,
  choices: FIRST_CHOICES,
  added: FIRST_ADDED,
  said: SAID,
  read: firstRead(),
})

const teamIn = (w: World, id: TeamId) => w.teams.find((t) => t.id === id)!
const placeIn = (w: World, id: string) => w.places.find((p) => p.id === id)
const isMember = (w: World, p: PersonId, team: TeamId) => teamIn(w, team).members.includes(p)
const isFollower = (w: World, p: PersonId, team: TeamId) => teamIn(w, team).followers.includes(p)

/** What a team gives this person on a place: members its chat and spaces, followers its spaces, nobody its topics. */
function teamDefault(w: World, p: PersonId, place: Place): Level | undefined {
  const team = teamIn(w, place.team)
  if (place.kind === 'chat') return team.members.includes(p) ? 'important' : undefined
  if (place.kind === 'space') return team.members.includes(p) || team.followers.includes(p) ? 'important' : undefined
  return undefined
}

/** Why someone is in a place, besides a level they chose. */
function reasonIn(w: World, p: PersonId, place: Place): 'added' | 'author' | 'default' | undefined {
  if (w.added[place.id]?.[p]) return 'added'
  if (place.author === p) return 'author'
  if (teamDefault(w, p, place)) return 'default'
  return undefined
}

/** The level a person follows a place at, or nothing: your choice, else Important if you were added or started it, else the team's default. */
function levelOf(w: World, p: PersonId, place: Place): Level | undefined {
  const choice = w.choices[p]?.[place.id]
  if (choice === 'off') return undefined
  if (choice) return choice
  return reasonIn(w, p, place) ? 'important' : undefined
}

/** A new conversation lights at Important and All; a reply only at All, or for the people in that conversation. */
const lights = (level: Level | undefined, p: PersonId, s: Said) =>
  s.by !== p && !!level && (!s.reply || level === 'all' || s.reply.in.includes(p))

function isUnread(w: World, p: PersonId, place: Place) {
  const level = levelOf(w, p, place)
  return (w.said[place.id] ?? []).slice(w.read[p]?.[place.id] ?? 0).some((s) => lights(level, p, s))
}

/** A place's messages in Per app's shape, so its Activity is Per app's: the same dot, list and rules (Miky, 2 Nov). */
const messagesIn = (w: World, place: Place): PeekMessage[] => (w.said[place.id] ?? []).map(({ id, by, at, body, mentions, reactions }) => ({ id, by, at, body, mentions, reactions }))

/** Activity about you since you last looked, and nothing new to read: the orange dot. */
const activityOnly = (w: World, p: PersonId, place: Place) => !isUnread(w, p, place) && hasNewActivity(p, place.id, messagesIn(w, place))

/** A topic a team leads shows in its section only for people in or following the team. */
const showsInSection = (w: World, p: PersonId, place: Place) =>
  place.kind === 'chat' ? isMember(w, p, place.team) : isMember(w, p, place.team) || isFollower(w, p, place.team)

interface Actions {
  choose: (place: string, choice: Choice | undefined) => void
  add: (place: string, who: PersonId) => void
  read: (place: string) => void
  join: (team: TeamId) => void
  leave: (team: TeamId) => void
  follow: (team: TeamId) => void
  unfollow: (team: TeamId) => void
  addToTeam: (team: TeamId, who: PersonId) => void
  markSpace: (place: string, space: boolean) => void
  move: (place: string, to: TeamId, keepSpace: boolean) => void
  /** Someone else says something in a place, to see what lights for whom. */
  say: (place: string, by: PersonId, reply: boolean) => void
}

const Ctx = createContext<{ w: World; viewer: PersonId; act: Actions } | null>(null)
const useWorld = () => useContext(Ctx)!

function useActions(viewer: PersonId, set: (f: (w: World) => World) => void): Actions {
  const without = <T,>(xs: T[], x: T) => xs.filter((y) => y !== x)
  const withTeam = (id: TeamId, f: (t: Team) => Team) => set((w) => ({ ...w, teams: w.teams.map((t) => (t.id === id ? f(t) : t)) }))
  return {
    choose: (place, choice) =>
      set((w) => {
        const mine = { ...(w.choices[viewer] ?? {}) }
        if (choice) mine[place] = choice
        else delete mine[place]
        // Not following is also a Leave: an Add before it no longer counts.
        const added = choice === 'off' ? { ...w.added, [place]: { ...w.added[place], [viewer]: undefined } } : w.added
        return { ...w, choices: { ...w.choices, [viewer]: mine }, added }
      }),
    add: (place, who) =>
      set((w) => {
        // An Add after they left puts them back in, at Important.
        const theirs = { ...(w.choices[who] ?? {}) }
        if (theirs[place] === 'off') delete theirs[place]
        return { ...w, added: { ...w.added, [place]: { ...w.added[place], [who]: viewer } }, choices: { ...w.choices, [who]: theirs } }
      }),
    read: (place) => set((w) => ({ ...w, read: { ...w.read, [viewer]: { ...w.read[viewer], [place]: (w.said[place] ?? []).length } } })),
    join: (id) => withTeam(id, (t) => ({ ...t, members: [...t.members, viewer], followers: without(t.followers, viewer) })),
    leave: (id) => withTeam(id, (t) => ({ ...t, members: without(t.members, viewer) })),
    follow: (id) => withTeam(id, (t) => ({ ...t, followers: [...t.followers, viewer] })),
    unfollow: (id) => withTeam(id, (t) => ({ ...t, followers: without(t.followers, viewer) })),
    addToTeam: (id, who) => withTeam(id, (t) => ({ ...t, members: [...t.members, who], followers: without(t.followers, who) })),
    markSpace: (place, space) => set((w) => ({ ...w, places: w.places.map((p) => (p.id === place ? { ...p, kind: space ? 'space' : 'topic' } : p)) })),
    move: (place, to, keepSpace) =>
      set((w) => ({ ...w, places: w.places.map((p) => (p.id === place ? { ...p, team: to, kind: keepSpace ? 'space' : 'topic' } : p)) })),
    say: (place, by, reply) =>
      set((w) => {
        const said = w.said[place] ?? []
        const first = said.find((s) => !s.reply)
        const next: Said = {
          id: `x${Date.now()}`,
          by,
          at: 'Now',
          body: reply ? 'A reply in a conversation you are not in.' : 'A new conversation.',
          reply: reply ? { to: first?.id ?? '', in: [by] } : undefined,
        }
        return { ...w, said: { ...w.said, [place]: [...said, next] } }
      }),
  }
}

// ── The switch, and how a place's icon says how you follow it ────────────

const LEVEL_WORDS: Record<Level, { label: string; what: string }> = {
  important: { label: 'Important', what: 'New conversations, and replies in the ones you are in' },
  all: { label: 'All', what: 'Every new conversation and every reply' },
}

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

/**
 * One icon per place, drawn by how you follow (Miky, 2 Nov). A team's chat is
 * the team, so people: outline Important, solid All, a plus when not following.
 * Spaces and topics keep the circles: dashed Important, full All, dashed with a
 * plus when not following.
 */
function LevelIcon({ level, team = false }: { level: Level | undefined; team?: boolean }) {
  if (team) {
    if (level === 'all') return <IconUsersSolid />
    if (level === 'important') return <IconUsers {...icon16} aria-hidden />
    return <IconUsersPlus {...icon16} aria-hidden className="text-text-muted" />
  }
  if (level === 'all') return <IconCircle {...icon16} aria-hidden />
  if (level === 'important') return <IconCircleDashed {...icon16} aria-hidden />
  return <IconCircleDashedPlus {...icon16} aria-hidden className="text-text-muted" />
}

/** The one switch on a place: Not following, Important or All, and back to the team's default when one applies. */
function FollowSwitch({ place }: { place: Place }) {
  const { w, viewer, act } = useWorld()
  const level = levelOf(w, viewer, place)
  const choice = w.choices[viewer]?.[place.id]
  const given = teamDefault(w, viewer, place)
  const team = teamIn(w, place.team)
  const chat = place.kind === 'chat'
  const item = (c: Choice, label: string, what: string, icon: ReactNode) => {
    const on = c === 'off' ? !level : level === c
    return <MenuItem leading={icon} label={label} description={what} selected={on} trailing={on ? <IconCheck {...icon16} /> : undefined} onClick={() => act.choose(place.id, c)} />
  }
  return (
    <Menu
      trigger={
        <button
          type="button"
          aria-label={`${level ? `You follow ${LEVEL_WORDS[level].label}` : 'Not following'}: change how you follow ${place.title}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        >
          <LevelIcon level={level} team={chat} />
        </button>
      }
    >
      <MenuSection label="How you follow it">
        {item('off', 'Not following', place.kind === 'topic' ? 'You are not in it; it stays listed in its team' : 'Nothing here lights for you', <LevelIcon level={undefined} team={chat} />)}
        {item('important', LEVEL_WORDS.important.label, LEVEL_WORDS.important.what, <LevelIcon level="important" team={chat} />)}
        {item('all', LEVEL_WORDS.all.label, LEVEL_WORDS.all.what, <LevelIcon level="all" team={chat} />)}
      </MenuSection>
      {given && choice && (
        <MenuSection label={`${team.name} gives you Important`}>
          <MenuItem label={`Back to ${team.name}’s default`} description="Your choice no longer applies; only you see that you changed it" onClick={() => act.choose(place.id, undefined)} />
        </MenuSection>
      )}
    </Menu>
  )
}

/** A place's icon in a list says how you follow it: people for a team's chat, circles for the rest. */
function PlaceIcon({ place }: { place: Place }) {
  const { w, viewer } = useWorld()
  return <LevelIcon level={levelOf(w, viewer, place)} team={place.kind === 'chat'} />
}

/** A place is called by its title alone: no # (Miky, 2 Nov). */
const placeLabel = (place: Place) => place.title

// ── Who follows a place ──────────────────────────────────────────────────

interface Listed {
  who: PersonId
  level: Level
  why: string
}

/**
 * Who a place lists, worked out from public facts alone: everyone who chose a
 * level, everyone added, who started it, and the team's members at their
 * default. Someone following only through a team they follow is not named
 * until they choose; a member's own opt-out of a default is private, so
 * others still see them at the default.
 */
function listedOn(w: World, viewer: PersonId, place: Place): Listed[] {
  const team = teamIn(w, place.team)
  return (Object.keys(PEOPLE) as PersonId[]).flatMap((p): Listed[] => {
    const choice = w.choices[p]?.[place.id]
    const by = w.added[place.id]?.[p]
    const member = team.members.includes(p) && place.kind !== 'topic'
    if (choice && choice !== 'off') return [{ who: p, level: choice, why: 'Chose it' }]
    if (choice === 'off') return p !== viewer && member ? [{ who: p, level: 'important', why: `In ${team.name}` }] : []
    if (by) return [{ who: p, level: 'important', why: `Added by ${by === viewer ? 'you' : PEOPLE[by].name}` }]
    if (place.author === p) return [{ who: p, level: 'important', why: 'Started it' }]
    if (member) return [{ who: p, level: 'important', why: `In ${team.name}` }]
    return []
  })
}

const nameOf = (p: PersonId, viewer: PersonId) => (p === viewer ? `${PEOPLE[p].name} (you)` : PEOPLE[p].name)

function PersonRow({ who, viewer, caption, trailing }: { who: PersonId; viewer: PersonId; caption?: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-1 py-1.5">
      <Avatar name={PEOPLE[who].name} size={28} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-body-2 text-text-primary">
          {nameOf(who, viewer)}
          {isAgent(who) && <Chip label="Agent" leadingIcon={<IconRobot size={12} stroke={1.5} />} />}
        </span>
        {caption && <span className="text-caption text-text-muted">{caption}</span>}
      </div>
      {trailing}
    </div>
  )
}

/**
 * Who follows a place, and where you add someone: there is no Add button of its
 * own (Miky, 2 Nov); the avatars and ⋮ → Add someone both open this. Add puts
 * the person in at Important; their own choice still wins, and they leave with
 * the same switch.
 */
function WhoFollowsDialog({ place, onClose }: { place: Place; onClose: () => void }) {
  const { w, viewer, act } = useWorld()
  const listed = listedOn(w, viewer, place)
  const team = teamIn(w, place.team)
  const out = place.kind === 'chat' ? [] : (Object.keys(PEOPLE) as PersonId[]).filter((p) => p !== viewer && !levelOf(w, p, place))
  const group = (level: Level) => {
    const rows = listed.filter((l) => l.level === level)
    return (
      <div className="flex flex-col pb-3">
        <SectionLabel tone="muted">{`${LEVEL_WORDS[level].label} · ${rows.length}`}</SectionLabel>
        {rows.length === 0 ? <span className="px-1 py-1.5 text-body-2 text-text-muted">Nobody</span> : rows.map((l) => <PersonRow key={l.who} who={l.who} viewer={viewer} caption={l.why} />)}
      </div>
    )
  }
  return (
    <DialogShell title={`Who follows ${placeLabel(place)}`} onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="flex flex-col">
        {group('all')}
        {group('important')}
        {out.length > 0 && (
          <div className="flex flex-col pb-3">
            <SectionLabel tone="muted">Add someone</SectionLabel>
            {out.map((p) => (
              <PersonRow
                key={p}
                who={p}
                viewer={viewer}
                caption="Joins at Important; they can leave"
                trailing={
                  <Button variant="muted" size="small" leadingIcon={<IconUserPlus {...icon16} />} onClick={() => act.add(place.id, p)} aria-label={`Add ${PEOPLE[p].name}`}>
                    Add
                  </Button>
                }
              />
            ))}
          </div>
        )}
        {place.kind !== 'chat' && <p className="text-caption text-text-muted">{`People who follow ${team.name} without being in it are not named until they choose a level here.`}</p>}
      </div>
    </DialogShell>
  )
}

// ── Move, and marking a space ────────────────────────────────────────────

/** A move drops the old team's mark; "Keep it a space in <team>", ticked when it was one, makes it the new team's space in the same step. */
function MoveDialog({ place, onClose, onMoved }: { place: Place; onClose: () => void; onMoved: (to: TeamId) => void }) {
  const { w, viewer, act } = useWorld()
  const others = w.teams.filter((t) => t.id !== place.team)
  const [to, setTo] = useState<TeamId>(others[0].id)
  const [keep, setKeep] = useState(place.kind === 'space')
  const target = teamIn(w, to)
  const canMark = target.members.includes(viewer)
  return (
    <DialogShell
      title={`Move ${placeLabel(place)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="muted" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              act.move(place.id, to, keep && canMark)
              onMoved(to)
            }}
          >
            Move
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-body-2 text-text-secondary">To team</span>
          <Select ariaLabel="To team" value={to} onChange={(v) => setTo(v as TeamId)} options={others.map((t) => ({ value: t.id, label: t.name }))} />
        </label>
        <div className="flex flex-col gap-1">
          <Checkbox checked={keep && canMark} disabled={!canMark} onChange={setKeep} label={`Keep it a space in ${target.name}`} />
          <span className="pl-6 text-caption text-text-muted">
            {!canMark
              ? `Only ${target.name}’s members can mark its spaces. It moves as a topic ${target.name} leads.`
              : keep
                ? `${target.name}’s members and followers follow it at Important. ${teamIn(w, place.team).name} no longer lists it.`
                : `A topic ${target.name} leads: nobody follows it until they join or are added.`}
          </span>
        </div>
      </div>
    </DialogShell>
  )
}

// ── Peek's list columns: Teams and Topics ────────────────────────────────

type Open = { type: 'place'; id: string } | { type: 'team'; id: TeamId } | { type: 'link'; id: string }
type RailId = 'desk' | 'topics' | 'teams' | 'people'

function PlaceRow({ place, open, onOpen }: { place: Place; open: Open; onOpen: (o: Open) => void }) {
  const { w, viewer } = useWorld()
  const level = levelOf(w, viewer, place)
  const row = (
    <NavItem
      href="#"
      label={placeLabel(place)}
      tooltip={place.kind === 'chat' ? `${teamIn(w, place.team).name}’s chat` : place.kind === 'space' ? `A space of ${teamIn(w, place.team).name}` : level ? `You follow ${LEVEL_WORDS[level].label}` : 'Not following: open it to join'}
      icon={<PlaceIcon place={place} />}
      unread={isUnread(w, viewer, place)}
      active={open.type === 'place' && open.id === place.id}
      onClick={go(() => onOpen({ type: 'place', id: place.id }))}
    />
  )
  if (!activityOnly(w, viewer, place)) return row
  // Per app's row: orange in the blue dot's place for new activity alone (Miky, 29 Oct).
  return (
    <div className="relative [&>:first-child]:pr-8">
      {row}
      <span className="pointer-events-none absolute right-1 top-0 flex h-full w-6 items-center justify-center">
        <NewDot tone="activity" />
      </span>
    </div>
  )
}

function TeamsColumn({ open, onOpen }: { open: Open; onOpen: (o: Open) => void }) {
  const { w, viewer } = useWorld()
  const mine = w.teams.filter((t) => t.members.includes(viewer))
  const followed = w.teams.filter((t) => !t.members.includes(viewer) && t.followers.includes(viewer))
  const others = w.teams.filter((t) => !mine.includes(t) && !followed.includes(t))
  // A team's section: its chat, spaces, then the topics it leads, with no label between them (Miky, 2 Nov).
  const section = (team: Team) => {
    const places = w.places.filter((p) => p.team === team.id && showsInSection(w, viewer, p))
    const order: Kind[] = ['chat', 'space', 'topic']
    const rows = order.flatMap((k) => places.filter((p) => p.kind === k))
    return (
      <div key={team.id} className="flex flex-col gap-0.5 pb-2">
        {/* The team's name opens the team, where Join, Follow, Leave and Add are; no ⋮ here (Miky, 2 Nov). */}
        <SectionHeader
          title={team.name}
          look="quiet"
          render={<button type="button" aria-label={`Open ${team.name}`} onClick={() => onOpen({ type: 'team', id: team.id })} className="cursor-pointer hover:[&_span]:text-text-primary" />}
        />
        {rows.map((p) => <PlaceRow key={p.id} place={p} open={open} onOpen={onOpen} />)}
        {rows.every((p) => p.kind === 'chat') && <span className="px-2 py-1 text-caption text-text-muted">No spaces or topics yet</span>}
      </div>
    )
  }
  // Teams you are in and teams you follow live apart, so following never reads as being in one (Miky, 2 Nov).
  const group = (title: string, body: ReactNode) => (
    <div className="flex flex-col pb-2">
      <SectionHeader title={title} />
      {body}
    </div>
  )
  return (
    <>
      {mine.length > 0 && group('My teams', mine.map(section))}
      {followed.length > 0 && group('Following', followed.map(section))}
      {others.length > 0 &&
        group(
          'Other teams',
          <div className="flex flex-col gap-0.5">
            {others.map((t) => (
              <NavItem key={t.id} href="#" label={t.name} tooltip="You are not in it and don’t follow it" active={open.type === 'team' && open.id === t.id} onClick={go(() => onOpen({ type: 'team', id: t.id }))} />
            ))}
          </div>,
        )}
    </>
  )
}

/** Topics: every topic you follow, from every team. The same row, and the same dot, as in its team's section. */
function TopicsColumn({ open, onOpen }: { open: Open; onOpen: (o: Open) => void }) {
  const { w, viewer } = useWorld()
  const followed = w.places.filter((p) => p.kind === 'topic' && levelOf(w, viewer, p))
  if (followed.length === 0) return <span className="px-2 py-2 text-body-2 text-text-muted">Topics you join or are added to show here.</span>
  return followed.map((p) => <PlaceRow key={p.id} place={p} open={open} onOpen={onOpen} />)
}

// ── The place and the team, beside the list ─────────────────────────────

function Message({ s, viewer }: { s: Said; viewer: PersonId }) {
  return (
    <div id={`said-${s.id}`} className={s.reply ? 'flex gap-3 py-2 pl-10' : 'flex gap-3 py-2'}>
      <Avatar name={PEOPLE[s.by].name} size={s.reply ? 20 : 28} />
      <div className="flex min-w-0 flex-col">
        <span className="flex items-baseline gap-2">
          <span className="text-body-2-strong text-text-primary">{nameOf(s.by, viewer)}</span>
          <span className="text-caption text-text-muted">{s.at}</span>
          {s.reply && <span className="text-caption text-text-muted">reply</span>}
        </span>
        <span className="text-body-2 text-text-primary">{s.body}</span>
      </div>
    </div>
  )
}

/** The files a space or topic lists, beside it, as in Per app's dot variant: Activity is behind the dot, so the column is only the files. */
function FilesColumn({ place }: { place: Place }) {
  const files = (place.files ?? []).map(fileOf)
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-border-subtle p-4 lg:flex">
      <SectionLabel tone="muted">Files</SectionLabel>
      {files.length === 0 ? (
        <p className="text-body-2 text-text-muted">None yet. A place can be only a conversation.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {files.map((f) => (
            <LinkCard key={f.id} link={cardOf(f, '')} />
          ))}
        </div>
      )}
    </aside>
  )
}

/**
 * A place: the switch, its title, the Activity dot, who follows it and the ⋮
 * menu; its files beside it. No kind label and no line explaining the level
 * (Miky, 2 Nov); the team is named only when the sidebar is not already
 * showing its section. A team's chat lists no files, so it has no column.
 */
function PlacePage({ place, onOpen, teamShown }: { place: Place; onOpen: (o: Open) => void; teamShown: boolean }) {
  const { w, viewer, act } = useWorld()
  const [dialog, setDialog] = useState<'who' | 'move' | null>(null)
  const [moved, setMoved] = useState<TeamId | null>(null)
  const team = teamIn(w, place.team)
  const listed = listedOn(w, viewer, place)
  const member = team.members.includes(viewer)
  const someoneElse = (Object.keys(PEOPLE) as PersonId[]).find((p) => p !== viewer && !isAgent(p)) ?? 'agent'
  const messages = messagesIn(w, place)
  const jump = (id: string) => document.getElementById(`said-${id}`)?.scrollIntoView({ block: 'center' })
  return (
    <div className="flex h-full min-h-0">
    <div className="flex min-w-0 flex-1 flex-col">
      <Header
        title={placeLabel(place)}
        right={
          <>
            <Button variant="muted" size="small" onClick={() => setDialog('who')} aria-label={`Who follows ${placeLabel(place)}: ${listed.length}`}>
              <span className="flex items-center gap-2">
                <AvatarGroup size={20} members={listed.map((l) => ({ name: PEOPLE[l.who].name }))} />
                {listed.length}
              </span>
            </Button>
            {place.kind !== 'chat' && (
              <Menu
                align="right"
                trigger={
                  <IconButton aria-label="More" tooltip="More">
                    <IconDotsVertical {...icon16} />
                  </IconButton>
                }
              >
                <MenuItem label="Add someone…" onClick={() => setDialog('who')} />
                <MenuItem label="Move to another team…" onClick={() => setDialog('move')} />
                {member &&
                  (place.kind === 'space' ? (
                    <MenuItem label={`Stop being a space of ${team.name}`} description="It stays a topic the team leads" onClick={() => act.markSpace(place.id, false)} />
                  ) : (
                    <MenuItem label={`Make it a space of ${team.name}`} description="Members and followers follow it at Important" onClick={() => act.markSpace(place.id, true)} />
                  ))}
              </Menu>
            )}
          </>
        }
      >
        {/* The switch sits before the title in Peek; the Header draws the title first, so it leads the facts here. */}
        <span className="order-first">
          <FollowSwitch place={place} />
        </span>
        {/* Per app's Activity dot, right after the title (Miky, 2 Nov): blue new messages, orange new activity, a ring with neither. */}
        <ActivityDot viewer={viewer} messages={messages} unread={isUnread(w, viewer, place)} onOpen={jump} onJump={jump} />
        {!teamShown && (
          <button type="button" onClick={() => onOpen({ type: 'team', id: team.id })} className="flex items-center gap-1.5 text-body-2 text-text-secondary hover:text-text-primary">
            <Avatar name={team.name} size={20} />
            {team.name}
          </button>
        )}
      </Header>
      {moved && (
        <Banner tone="ok" onDismiss={() => setMoved(null)}>
          {`Moved to ${teamIn(w, moved).name}${place.kind === 'space' ? ', as one of its spaces' : ', as a topic it leads'}.`}
        </Banner>
      )}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col px-4 py-2">
          {(w.said[place.id] ?? []).map((s) => <Message key={s.id} s={s} viewer={viewer} />)}
        </div>
      </ScrollArea>
      {/* The prototype's own controls: someone else says something here, to see what lights for whom. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border-subtle px-4 py-2 text-caption text-text-muted">
        <span>{`Try it, as ${PEOPLE[someoneElse].name}:`}</span>
        <Button variant="muted" size="small" onClick={() => act.say(place.id, someoneElse, false)}>Start a conversation</Button>
        <Button variant="muted" size="small" onClick={() => act.say(place.id, someoneElse, true)}>Reply in one you are not in</Button>
        <span>then switch to the sidebar and look at the dot.</span>
      </div>
      {dialog === 'who' && <WhoFollowsDialog place={place} onClose={() => setDialog(null)} />}
      {dialog === 'move' && (
        <MoveDialog
          place={place}
          onClose={() => setDialog(null)}
          onMoved={(to) => {
            setDialog(null)
            setMoved(to)
          }}
        />
      )}
    </div>
    {place.kind !== 'chat' && <FilesColumn place={place} />}
    </div>
  )
}

/** A team: its places and its people. Who is in it is public; which teams you follow is yours alone. */
function TeamPage({ id, onOpen }: { id: TeamId; onOpen: (o: Open) => void }) {
  const { w, viewer, act } = useWorld()
  const team = teamIn(w, id)
  const member = team.members.includes(viewer)
  const follower = team.followers.includes(viewer)
  const places = w.places.filter((p) => p.team === id)
  const people = team.members.filter((p) => !isAgent(p))
  const agents = team.members.filter(isAgent)
  const candidates = (Object.keys(PEOPLE) as PersonId[]).filter((p) => !team.members.includes(p))
  const kindWords: Record<Kind, string> = { chat: 'Chat · members, at Important', space: 'Space · members and followers, at Important', topic: 'Topic it leads · join or be added' }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header
        title={team.name}
        icon={<Avatar name={team.name} size={20} />}
        right={
          member ? (
            <>
              {candidates.length > 0 && (
                <Menu align="right" trigger={<Button variant="muted" size="small" leadingIcon={<IconUserPlus {...icon16} />}>Add</Button>}>
                  <MenuSection label={`Add to ${team.name}`}>
                    {candidates.map((p) => <MenuItem key={p} leading={<Avatar name={PEOPLE[p].name} size={20} />} label={PEOPLE[p].name} onClick={() => act.addToTeam(id, p)} />)}
                  </MenuSection>
                </Menu>
              )}
              <Button variant="muted" size="small" onClick={() => act.leave(id)}>Leave</Button>
            </>
          ) : (
            <>
              {follower ? <Button variant="muted" size="small" onClick={() => act.unfollow(id)}>Unfollow</Button> : <Button variant="muted" size="small" onClick={() => act.follow(id)}>Follow</Button>}
              <Button size="small" onClick={() => act.join(id)}>Join</Button>
            </>
          )
        }
      >
        {follower && <Chip label="You follow it · only you see this" />}
      </Header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex max-w-2xl flex-col gap-6 px-4 py-4">
          <section className="flex flex-col gap-1">
            <SectionLabel tone="muted">Places</SectionLabel>
            {places.filter((p) => p.kind !== 'chat').length === 0 && (
              <EmptyState scope="section" message={`${team.name} has no spaces or topics yet. Make a topic one of its spaces, or move one here.`} />
            )}
            {places.map((p) => (
              <button key={p.id} type="button" onClick={() => onOpen({ type: 'place', id: p.id })} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-bg-hover">
                <PlaceIcon place={p} />
                <span className="text-body-2 text-text-primary">{placeLabel(p)}</span>
                <span className="ml-auto text-caption text-text-muted">{kindWords[p.kind]}</span>
              </button>
            ))}
          </section>
          <section className="flex flex-col">
            <SectionLabel tone="muted">{`Members · ${people.length}`}</SectionLabel>
            {people.map((p) => <PersonRow key={p} who={p} viewer={viewer} />)}
          </section>
          {agents.length > 0 && (
            <section className="flex flex-col">
              <SectionLabel tone="muted">{`Agents · ${agents.length}`}</SectionLabel>
              {agents.map((p) => <PersonRow key={p} who={p} viewer={viewer} caption="Acts for whoever steers it" />)}
            </section>
          )}
          <p className="text-caption text-text-muted">{`Anyone in the company may join ${team.name}; only its members add someone or mark a space. Who follows a team is seen only by the person following it.`}</p>
        </div>
      </ScrollArea>
    </div>
  )
}

function NoAccess() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <EmptyState icon={<IconLock size={24} stroke={1.5} />} message="You can’t open this. It is a conversation between Miky and Estiva agent; only the people in it read it." />
    </div>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-busy>
      <SkeletonBar className="h-6 w-60" />
      <SkeletonBar className="h-4 w-96" />
      <SkeletonBar className="h-4 w-80" />
    </div>
  )
}

// ── The frame ────────────────────────────────────────────────────────────

function ViewAs({ viewer, onViewer }: { viewer: PersonId; onViewer: (p: PersonId) => void }) {
  return (
    <Menu align="right" trigger={<PersonTrigger name={PEOPLE[viewer].name} />}>
      <MenuItem label="View as Miky" description="A member of every team" selected={viewer === 'miky'} onClick={() => onViewer('miky')} />
      <MenuItem label="View as Katerina" description="Follows Engineering without being in it" selected={viewer === 'katerina'} onClick={() => onViewer('katerina')} />
    </Menu>
  )
}

export interface TeamsProps {
  viewer?: PersonId
  start?: Open
  rail?: RailId
  /** The first load, or a failed one. */
  state?: 'ready' | 'loading' | 'error'
}

export function Teams({ viewer: firstViewer = 'miky', start = { type: 'place', id: 'eng-chat' }, rail: firstRail = 'teams', state: firstState = 'ready' }: TeamsProps) {
  // What is open is read, for whoever is looking: at the start, and after switching who you are.
  const readOpen = (w: World, p: PersonId, o: Open): World =>
    o.type === 'place' ? { ...w, read: { ...w.read, [p]: { ...w.read[p], [o.id]: (w.said[o.id] ?? []).length } } } : w
  const [w, set] = useState<World>(() => readOpen(firstWorld(), firstViewer, start))
  const [viewer, setViewer] = useState<PersonId>(firstViewer)
  const [open, setOpen] = useState<Open>(start)
  const [rail, setRail] = useState<RailId>(firstRail)
  const [state, setState] = useState(firstState)
  const act = useActions(viewer, set)
  const onOpen = (o: Open) => {
    setOpen(o)
    if (o.type === 'place') act.read(o.id)
  }
  const onViewer = (p: PersonId) => {
    setViewer(p)
    set((current) => readOpen(current, p, open))
  }
  const rails: { id: RailId; label: string; icon: ReactNode }[] = [
    { id: 'desk', label: 'Desk', icon: <IconLayoutDashboard size={20} stroke={1.5} /> },
    { id: 'topics', label: 'Topics', icon: <IconTarget size={20} stroke={1.5} /> },
    { id: 'teams', label: 'Teams', icon: <IconUsers size={20} stroke={1.5} /> },
    { id: 'people', label: 'People', icon: <IconUser size={20} stroke={1.5} /> },
  ]
  const place = open.type === 'place' ? placeIn(w, open.id) : undefined
  const list =
    state === 'loading' ? (
      <SkeletonList rows={10} />
    ) : state === 'error' ? (
      <Banner tone="error" action={{ label: 'Try again', onClick: () => setState('ready') }}>
        Your teams didn’t load.
      </Banner>
    ) : rail === 'teams' ? (
      <TeamsColumn open={open} onOpen={onOpen} />
    ) : rail === 'topics' ? (
      <TopicsColumn open={open} onOpen={onOpen} />
    ) : (
      <span className="px-2 py-2 text-body-2 text-text-muted">{`${rails.find((r) => r.id === rail)!.label} is in the Per app stories.`}</span>
    )
  const content =
    state !== 'ready' ? (
      <Loading />
    ) : open.type === 'link' ? (
      <NoAccess />
    ) : open.type === 'team' ? (
      <TeamPage id={open.id} onOpen={onOpen} />
    ) : place ? (
      <PlacePage key={place.id} place={place} onOpen={onOpen} teamShown={rail === 'teams'} />
    ) : (
      <NoAccess />
    )
  return (
    <Ctx.Provider value={{ w, viewer, act }}>
      <div className="h-screen overflow-hidden">
        <AppShell
          variant="floating"
          logo={<span className="px-2 text-body-2-strong text-text-primary">Peek</span>}
          onSearch={() => {}}
          searchPlaceholder="Search Peek, Ship and Leaf…"
          identity={<ViewAs viewer={viewer} onViewer={onViewer} />}
          nav={
            <Rail aria-label="peek navigation">
              {rails.map((r) => (
                <RailItem key={r.id} href="#" label={r.label} icon={r.icon} active={rail === r.id} onClick={go(() => setRail(r.id))} />
              ))}
            </Rail>
          }
        >
          <div className="flex h-full min-h-0">
            <ListColumn title={rails.find((r) => r.id === rail)!.label}>{list}</ListColumn>
            <div className="flex min-w-0 flex-1 flex-col">{content}</div>
          </div>
        </AppShell>
      </div>
    </Ctx.Provider>
  )
}
