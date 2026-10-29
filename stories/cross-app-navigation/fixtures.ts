/**
 * PROTOTYPE (concept/cross-app-navigation): the workspace as Lens would draw
 * it. Team, topic and file names are the real ones from Ship and Leaf
 * (28 October); the teams themselves and the messages are examples.
 */

export type App = 'peek' | 'ship' | 'leaf'
export type PersonId = 'miky' | 'katerina' | 'agent'
export type TeamId = 'company' | 'eng' | 'design' | 'steer' | 'marketing'

export const PEOPLE: Record<PersonId, { name: string }> = {
  miky: { name: 'Miky' },
  katerina: { name: 'Katerina Kelepouri' },
  agent: { name: 'Estiva agent' },
}

export interface Team {
  id: TeamId
  name: string
  /** Private: everyone sees the team exists; only members read its chat and files. */
  private?: boolean
  members: PersonId[]
}

export const TEAMS: Team[] = [
  { id: 'company', name: 'Company', members: ['miky', 'katerina', 'agent'] },
  { id: 'eng', name: 'Engineering', private: true, members: ['miky', 'agent'] },
  { id: 'design', name: 'Design', members: ['katerina', 'miky'] },
  { id: 'steer', name: 'Steer', members: ['miky', 'agent'] },
  { id: 'marketing', name: 'Marketing', private: true, members: ['miky'] },
]

export const teamOf = (id: TeamId) => TEAMS.find((t) => t.id === id)!

/** A Ship project or a Leaf document. It lives in one team, which decides who reads it. */
export interface FileRow {
  id: string
  app: 'ship' | 'leaf'
  title: string
  team: TeamId
  /** Ship: "3 of 11". */
  progress?: string
}

export const FILES: FileRow[] = [
  { id: 'p-leaf-everyday', app: 'ship', title: 'Leaf works for everyday documents', team: 'eng', progress: '7 of 11' },
  { id: 'p-read-only', app: 'ship', title: 'Apps read only what they show', team: 'eng', progress: '6 of 10' },
  { id: 'p-leaf-instant', app: 'ship', title: 'Leaf opens instantly', team: 'eng', progress: '0 of 0' },
  { id: 'p-ship-instant', app: 'ship', title: 'Ship opens instantly', team: 'eng', progress: '0 of 0' },
  { id: 'p-live', app: 'ship', title: 'Live across apps', team: 'eng', progress: '0 of 0' },
  { id: 'p-peek-fast', app: 'ship', title: 'Peek stays fast', team: 'eng', progress: '0 of 0' },
  { id: 'p-peek-bugs', app: 'ship', title: 'Peek: Feedback & Bugs', team: 'eng', progress: '4 of 9' },
  { id: 'p-ship-bugs', app: 'ship', title: 'Ship: Feedback & Bugs', team: 'eng', progress: '5 of 8' },
  { id: 'p-leaf-bugs', app: 'ship', title: 'Leaf: Feedback & Bugs', team: 'eng', progress: '1 of 3' },
  { id: 'p-private', app: 'ship', title: 'Private folders / topic / files', team: 'eng', progress: '0 of 1' },
  { id: 'p-widgets-1', app: 'ship', title: 'Widgets 2: build 1', team: 'eng', progress: '6 of 6' },
  { id: 'p-widgets-2', app: 'ship', title: 'Widgets 2: build 2', team: 'eng', progress: '4 of 5' },
  { id: 'p-one-conversation', app: 'ship', title: 'One conversation in every app', team: 'design', progress: '3 of 7' },
  { id: 'p-agent-cheap', app: 'ship', title: 'The Estiva agent is cheap', team: 'steer', progress: '0 of 0' },
  { id: 'p-agent-feedback', app: 'ship', title: 'Agent: Feedback & Improvements', team: 'steer', progress: '9 of 14' },
  { id: 'p-records-2', app: 'ship', title: 'Decision records 2: the code does what the records say', team: 'steer', progress: '4 of 7' },
  { id: 'p-navigation', app: 'ship', title: 'Navigation & structure in Nostr for Business', team: 'company', progress: '0 of 0' },
  { id: 'p-docs-2', app: 'ship', title: 'docs.estiva.app 2: a grant reviewer sees what it can do', team: 'company', progress: '0 of 3' },
  { id: 'd-navigation', app: 'leaf', title: 'Navigation', team: 'company' },
  { id: 'd-weekly', app: 'leaf', title: 'Weekly Plans', team: 'company' },
  { id: 'd-testing-widgets', app: 'leaf', title: 'Testing Widgets', team: 'design' },
  { id: 'd-grant-research', app: 'leaf', title: 'Grant organisation research', team: 'company' },
  { id: 'd-grant-reusable', app: 'leaf', title: 'Reusable grant content', team: 'company' },
  { id: 'd-grant-application', app: 'leaf', title: 'Application: first grant', team: 'company' },
]

export const fileOf = (id: string) => FILES.find((f) => f.id === id)!

/**
 * A topic: a conversation, led by a team, that lists files from any team.
 * One with an end is what the company is focused on (the Topics list); one
 * without an end is a team's lasting space and shows under the team.
 */
export interface Topic {
  id: string
  title: string
  lead: TeamId
  /** False: a lasting space, listed under its team(s). */
  ends: boolean
  /**
   * Who reads its conversation. `team`: the lead team's members (a private
   * team's chat). `teams`: the members of every team in `shared`.
   * `everyone`: the whole company.
   */
  readers: 'team' | 'teams' | 'everyone'
  /** A space two teams share: listed under each, read by both. */
  shared?: TeamId[]
  /** How it shows under its team. */
  role?: 'chat' | 'front-door' | 'space'
  lists: string[]
}

export const TOPICS: Topic[] = [
  {
    id: 'fast',
    title: 'Peek, Ship and Leaf are fast',
    lead: 'eng',
    ends: true,
    readers: 'everyone',
    lists: ['p-read-only', 'p-leaf-instant', 'p-ship-instant', 'p-live', 'p-peek-fast', 'p-agent-cheap'],
  },
  {
    id: 'widgets',
    title: 'Widgets',
    lead: 'company',
    ends: true,
    readers: 'everyone',
    lists: ['p-widgets-1', 'p-widgets-2', 'd-testing-widgets'],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    lead: 'company',
    ends: true,
    readers: 'everyone',
    lists: ['d-navigation', 'p-navigation', 'p-private'],
  },
  {
    id: 'grants',
    title: 'Grants',
    lead: 'company',
    ends: true,
    readers: 'everyone',
    lists: ['d-grant-research', 'd-grant-reusable', 'd-grant-application', 'p-docs-2'],
  },
  { id: 'osnova', title: 'Naming the protocol', lead: 'company', ends: true, readers: 'everyone', lists: [] },

  { id: 'general', title: 'General', lead: 'company', ends: false, readers: 'everyone', role: 'chat', lists: [] },
  { id: 'suits', title: 'Estiva Suits Updates', lead: 'company', ends: false, readers: 'everyone', role: 'space', lists: ['d-weekly'] },
  { id: 'eng-chat', title: 'Engineering', lead: 'eng', ends: false, readers: 'team', role: 'chat', lists: [] },
  { id: 'eng-door', title: 'Ask Engineering', lead: 'eng', ends: false, readers: 'everyone', role: 'front-door', lists: [] },
  {
    id: 'bugs',
    title: 'Bugs',
    lead: 'eng',
    ends: false,
    readers: 'everyone',
    role: 'front-door',
    lists: ['p-peek-bugs', 'p-ship-bugs', 'p-leaf-bugs'],
  },
  {
    id: 'eng-design',
    title: 'Engineering × Design',
    lead: 'eng',
    ends: false,
    readers: 'teams',
    shared: ['eng', 'design'],
    role: 'space',
    lists: [],
  },
  { id: 'design-chat', title: 'Design', lead: 'design', ends: false, readers: 'team', role: 'chat', lists: [] },
  { id: 'steer-chat', title: 'Steer', lead: 'steer', ends: false, readers: 'team', role: 'chat', lists: ['p-agent-feedback', 'p-records-2'] },
  { id: 'mkt-chat', title: 'Marketing', lead: 'marketing', ends: false, readers: 'team', role: 'chat', lists: [] },
  { id: 'mkt-door', title: 'Talk to Marketing', lead: 'marketing', ends: false, readers: 'everyone', role: 'front-door', lists: [] },
]

export const topicOf = (id: string) => TOPICS.find((t) => t.id === id)!

const inTeam = (who: PersonId, team: TeamId) => teamOf(team).members.includes(who)

/** Whether this person reads the file: its team's members, or everyone when the team is not private. */
export const canReadFile = (who: PersonId, file: FileRow) => !teamOf(file.team).private || inTeam(who, file.team)

export const canReadTopic = (who: PersonId, topic: Topic) =>
  topic.readers === 'everyone' ||
  (topic.readers === 'team' && (topic.lead === 'company' || inTeam(who, topic.lead))) ||
  (topic.readers === 'teams' && (topic.shared ?? []).some((t) => inTeam(who, t)))

/** The lasting spaces listed under a team, its chat first. */
export const spacesOf = (team: TeamId) =>
  TOPICS.filter((t) => !t.ends && (t.lead === team || t.shared?.includes(team))).sort(
    (a, b) => Number(b.role === 'chat') - Number(a.role === 'chat'),
  )

/** Peek's highlights (peek-app `HighlightType`). */
export type HighlightType = 'insight' | 'concern' | 'conclusion' | 'question' | 'summary'

/** One reply in a message's thread. */
export interface Reply {
  by: PersonId
  at: string
  body: string
  highlight?: HighlightType
}

/** One message in a conversation. `on` names the listed file it was written on; absent, the topic itself. */
export interface Message {
  id: string
  by: PersonId
  at: string
  body: string
  on?: string
  /** Shared up to the topic's Main from a file, with Resolve or Share. */
  sharedUp?: 'resolved' | 'shared'
  /** Who resolved its thread, and what they said: drawn under the message's heading. */
  resolved?: { by: PersonId; note: string }
  /** Names this person: shown in their Main even when written on a file. */
  mentions?: PersonId
  /** The replies, in the order written. A highlighted one is a step of the timeline in the thread's card. */
  thread?: Reply[]
  reactions?: { emoji: string; by: PersonId[] }[]
  replies?: { by: PersonId[]; count: number; last: string; unread?: boolean }
  /** A listed file whose card the message was sent with. */
  card?: string
}

/** Peek's reactions, as `@estiva-app/conversation`'s REACTION_EMOJI names them. */
export const REACTION_OPTIONS = [
  { emoji: '👍', label: 'Makes sense' },
  { emoji: '💯', label: 'Agree' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '🚀', label: "Let's go!" },
  { emoji: '🎉', label: 'Congrats' },
]

export const MESSAGES: Record<string, Message[]> = {
  fast: [
    { id: 'f1', by: 'miky', at: 'Mon 09:12', body: 'Order for the next weeks: Leaf opens instantly first, then Ship, then live across apps. Peek stays fast last.', reactions: [{ emoji: '👍', by: ['katerina', 'agent'] }] },
    {
      id: 'f3',
      by: 'miky',
      at: 'Mon 10:02',
      on: 'p-read-only',
      sharedUp: 'resolved',
      resolved: { by: 'agent', note: 'Under a second on Miky’s workspace, measured with the QA probe.' },
      body: 'Can Leaf read only what it draws? First paint on my workspace is 6 seconds.',
      thread: [
        { by: 'agent', at: 'Mon 10:11', body: 'Most of the 6 s is reading every block of the page before drawing any. I can try reading the first screenful first.' },
        { by: 'katerina', at: 'Mon 10:20', highlight: 'question', body: 'Does a skeleton count as drawn, or only blocks with words in them?' },
        { by: 'agent', at: 'Mon 10:26', body: 'The skeleton shows at 0.3 s today, so counting it would make this done already.' },
        { by: 'miky', at: 'Mon 10:34', highlight: 'conclusion', body: 'Words count, a skeleton does not. Measure first paint to the first block with text, on my workspace.' },
        { by: 'agent', at: 'Mon 11:41', body: 'Done: 0.9 s to the first block with text on your workspace.' },
      ],
      reactions: [{ emoji: '💯', by: ['katerina'] }],
      replies: { by: ['agent', 'katerina'], count: 5, last: '11:41' },
    },
    { id: 'f2', by: 'agent', at: 'Mon 11:40', on: 'p-read-only', body: 'Leaf now asks only for the blocks the page draws. First paint on your workspace: 6.1 s → 0.9 s.', reactions: [{ emoji: '🚀', by: ['miky'] }] },
    { id: 'f4', by: 'katerina', at: 'Tue 10:05', body: 'Does "instantly" include the skeleton, or is a skeleton already too slow?', thread: [{ by: 'miky', at: 'Tue 10:20', body: 'Only words count. A skeleton is still waiting.' }], replies: { by: ['miky'], count: 1, last: '10:20', unread: true } },
    {
      id: 'f4b',
      by: 'agent',
      at: 'Tue 11:02',
      on: 'p-ship-instant',
      sharedUp: 'resolved',
      body: 'Ship opens in 4 s on Miky’s workspace. Should Ship keep its own copy of the workspace on the device, or read the one Peek already keeps?',
      thread: [
        { by: 'katerina', at: 'Tue 11:05', body: 'What is in the copy today? Only Peek’s conversations?' },
        { by: 'agent', at: 'Tue 11:09', body: 'Every file Peek has opened, its conversation and its read state. Ship’s issues are not in it yet.' },
        { by: 'miky', at: 'Tue 11:20', body: 'And Leaf?' },
        { by: 'agent', at: 'Tue 11:22', body: 'Leaf keeps nothing on the device yet.' },
        {
          by: 'miky',
          at: 'Tue 11:40',
          highlight: 'question',
          body: 'Before we pick: what does a person see in each case when they open Ship on a new laptop, where neither app has run yet? If Ship reads Peek’s copy, does Peek have to be opened first, or does Ship fill the copy itself? And when Peek is a newer version than Ship and the shape of the copy has changed, does Ship read stale data, wait, or start from nothing?',
        },
        { by: 'agent', at: 'Tue 11:52', body: 'Today: on a new laptop Ship would wait for Peek, because only Peek fills the copy.' },
        { by: 'katerina', at: 'Tue 12:03', body: 'That can’t be right for someone who only uses Ship.' },
        { by: 'agent', at: 'Tue 12:10', body: 'Agreed. Any app could fill it; the cost is that each app must know the whole shape.' },
        { by: 'miky', at: 'Tue 12:31', body: 'Or each app fills only its own part?' },
        { by: 'agent', at: 'Tue 12:40', body: 'That works if the parts don’t overlap. Conversations do: Ship shows them too.' },
        { by: 'katerina', at: 'Tue 12:58', body: 'And on a version change, I never want to see an empty page again.' },
        { by: 'miky', at: 'Tue 13:02', body: 'Katerina, can you write down what we agree?' },
        {
          by: 'katerina',
          at: 'Tue 13:15',
          highlight: 'conclusion',
          body: 'One copy per device, shared by every app and written by whichever app opens first. Each app reads only the parts it shows, so Ship never waits for Peek. When the shape changes, the copy is rebuilt in the background and the screen keeps what it had, with a quiet “Updating…” line, never an empty page. We measure it on Miky’s workspace on a clean laptop, not on QA-1’s.',
        },
        { by: 'miky', at: 'Tue 13:20', body: 'Yes. Build it.' },
        { by: 'agent', at: 'Tue 16:48', body: 'Built and measured; resolving with the numbers.' },
      ],
      resolved: {
        by: 'agent',
        note: 'Ship now opens from the shared copy: first paint 0.6 s on Miky’s workspace from a clean profile, 0.4 s after that. After a shape change the copy rebuilds in the background; opening Ship with an old copy as QA-1 and QA-2 never showed an empty page. Peek and Leaf read the same copy from next week.',
      },
      reactions: [{ emoji: '🚀', by: ['miky', 'katerina'] }],
      replies: { by: ['miky', 'katerina', 'agent'], count: 15, last: '16:48' },
    },
    { id: 'f5', by: 'agent', at: 'Tue 17:10', on: 'p-ship-instant', mentions: 'miky', body: '@Miky the shared copy is on staging. Can you open Ship there on your own laptop before Friday?' },
    { id: 'f6', by: 'agent', at: 'Tue 16:03', on: 'p-live', body: 'A reaction in Peek reaches Ship in ~2 s today; the watch drops reactions on wide watches.', card: 'p-live' },
    { id: 'f7', by: 'miky', at: 'Wed 08:30', on: 'p-peek-fast', body: 'Screener → Open work is still the slow move on my workspace.' },
  ],
  widgets: [
    { id: 'w1', by: 'katerina', at: 'Thu 10:00', body: 'Build 2 is close. I would like one more look at the card before we call it done.' },
    { id: 'w2', by: 'miky', at: 'Thu 10:30', on: 'd-testing-widgets', body: 'Added the three cases from yesterday to Testing Widgets.' },
    {
      id: 'w3',
      by: 'katerina',
      at: 'Thu 11:30',
      on: 'p-widgets-2',
      sharedUp: 'resolved',
      resolved: { by: 'agent', note: 'Fixed in ui 0.88, checked as QA-1 and QA-2.' },
      body: 'The card jumps when it loads. Can it keep its height?',
      thread: [
        { by: 'agent', at: 'Thu 12:02', body: 'It loads with no height set; the placeholder can take the card’s shape.' },
        { by: 'agent', at: 'Thu 15:12', body: 'Fixed in ui 0.88.' },
      ],
      replies: { by: ['agent'], count: 2, last: '15:12' },
    },
  ],
  navigation: [
    { id: 'n1', by: 'miky', at: 'Wed 21:00', body: 'Top level is Teams or Topics. No Folders as a third thing to learn.' },
    { id: 'n2', by: 'miky', at: 'Wed 21:20', on: 'd-navigation', mentions: 'katerina', card: 'd-navigation', body: '@Katerina I wrote down some thinking based on our conversation, so we can pick it up with something more concrete.' },
    { id: 'n3', by: 'agent', at: 'Wed 21:40', on: 'p-private', body: 'A front door is read by everyone while its team is private, so who leads a space is not who reads it.' },
  ],
  grants: [{ id: 'g1', by: 'miky', at: 'Fri 09:00', on: 'd-grant-reusable', body: 'The reusable text is ready for the next application.' }],
  osnova: [{ id: 'o1', by: 'miky', at: 'Sat 12:00', body: 'Osnova, or keep Nostr for Business as the name people see?' }],
  general: [
    { id: 'g-1', by: 'miky', at: 'Mon 08:00', body: '@company Estiva Suits Update 12 is out: one conversation in every app, and Leaf is fast.' },
    { id: 'g-2', by: 'katerina', at: 'Mon 08:20', body: 'Nice!' },
  ],
  suits: [{ id: 's1', by: 'miky', at: 'Mon 08:00', body: 'Estiva Suits Update 12: one conversation in every app.' }],
  'eng-chat': [{ id: 'e1', by: 'agent', at: 'Tue 12:00', body: 'The relay timer deployed buzz at 11:58. Probe green.' }],
  'eng-door': [
    { id: 'ed1', by: 'katerina', at: 'Tue 09:00', body: 'Can someone tell me why Leaf asks me to sign in again after a week?' },
    { id: 'ed2', by: 'miky', at: 'Tue 09:30', sharedUp: 'shared', body: 'Shared to the Engineering chat: we look at it there and answer here.' },
  ],
  bugs: [
    { id: 'b1', by: 'katerina', at: 'Wed 10:10', body: 'The image in a Leaf comment shows twice after a reload.' },
    { id: 'b2', by: 'miky', at: 'Wed 10:30', on: 'p-leaf-bugs', body: 'Filed as an issue in Leaf: Feedback & Bugs.' },
  ],
  'eng-design': [{ id: 'x1', by: 'katerina', at: 'Thu 11:00', body: 'Story for the replies row is up; can you check it builds from the shared piece?' }],
  'design-chat': [{ id: 'dc1', by: 'katerina', at: 'Thu 09:00', body: 'Moodboard for the Teams sidebar.' }],
  'steer-chat': [{ id: 'st1', by: 'agent', at: 'Fri 10:00', on: 'p-agent-feedback', body: 'ship edit-issue now keeps every unchanged block.' }],
  'mkt-chat': [{ id: 'm1', by: 'miky', at: 'Thu 17:00', body: 'Draft of the Suits Update 13 post is in. Ship it Monday with the release?' }],
  'mkt-door': [{ id: 'md1', by: 'katerina', at: 'Thu 16:00', body: 'Can the release post use the new Leaf screenshots? I can export them tonight.' }],
}

/**
 * One row on the Desk: something from any app that is waiting on you, that you
 * are running, or that just happened. `topic` or `file` is what it opens.
 */
export interface DeskRow {
  id: string
  app: App
  title: string
  detail: string
  topic?: string
  file?: string
  /** Marked urgent by whoever wrote it: Peek's Desk lists it under Urgent, not in the Screener. */
  urgent?: boolean
}

/** The Desk, the same in every app (Miky's question, 28 October: is Desk one idea across apps?). */
export const DESK: Record<'miky' | 'katerina', { needs: DeskRow[]; managing: DeskRow[]; activity: DeskRow[] }> = {
  miky: {
    needs: [
      { id: 'dn1', app: 'ship', title: 'Ship opens instantly', detail: 'Estiva agent asked you: keep Peek’s copy on the device, or its own?', file: 'p-ship-instant' },
      { id: 'dn2', app: 'peek', title: 'Ask Engineering', detail: 'Katerina: why does Leaf ask me to sign in again after a week?', topic: 'eng-door' },
      { id: 'dn3', app: 'peek', title: 'Talk to Marketing', detail: 'Katerina: can the release post use the new Leaf screenshots?', topic: 'mkt-door', urgent: true },
    ],
    managing: [
      { id: 'dm1', app: 'ship', title: 'Navigation & structure in Nostr for Business', detail: 'Project you lead · Company', file: 'p-navigation' },
      { id: 'dm2', app: 'leaf', title: 'Navigation', detail: 'Your document · in Navigation', file: 'd-navigation' },
      { id: 'dm3', app: 'peek', title: 'Peek, Ship and Leaf are fast', detail: 'Topic you follow as a member · 3 new', topic: 'fast' },
    ],
    activity: [
      { id: 'da1', app: 'ship', title: 'Apps read only what they show', detail: 'Estiva agent resolved “Leaf reads only what it draws”', file: 'p-read-only' },
      { id: 'da2', app: 'peek', title: 'Widgets', detail: 'Katerina: one more look at the card before we call it done', topic: 'widgets' },
      { id: 'da3', app: 'leaf', title: 'Testing Widgets', detail: 'You added three cases', file: 'd-testing-widgets' },
    ],
  },
  katerina: {
    needs: [
      { id: 'kn1', app: 'leaf', title: 'Navigation', detail: 'Miky mentioned you: some thinking to pick up together', file: 'd-navigation' },
      { id: 'kn2', app: 'peek', title: 'Bugs', detail: 'Miky filed your report in Leaf: Feedback & Bugs', topic: 'bugs' },
    ],
    managing: [
      { id: 'km1', app: 'ship', title: 'One conversation in every app', detail: 'Project you lead · Design', file: 'p-one-conversation' },
      { id: 'km2', app: 'leaf', title: 'Testing Widgets', detail: 'Your document · in Widgets', file: 'd-testing-widgets' },
    ],
    activity: [
      { id: 'ka1', app: 'peek', title: 'General', detail: 'Miky: Estiva Suits Update 12 is out', topic: 'general' },
      { id: 'ka2', app: 'ship', title: 'Widgets 2: build 2', detail: 'Estiva agent resolved “the card keeps its height while loading”', file: 'p-widgets-2' },
    ],
  },
}
