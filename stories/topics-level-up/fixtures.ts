import type { LinkState, StatusColour } from '../../src/linked'

/**
 * The data behind every story of "Topics: level up the topic experience". Real
 * topic names from Estiva HQ, invented contents. A topic's `at` is when anything
 * last happened in it (a message by anyone, the agent's too, a file added, a save,
 * status or comment on a file it lists): the one order all three apps sort by.
 */

export type Person = 'miky' | 'katerina' | 'agent'
export const PEOPLE: Record<Person, string> = { miky: 'Miky', katerina: 'Katerina Kelepouri', agent: 'Estiva agent' }

export type FileKind = 'project' | 'issue' | 'file'
export type Look = 'row' | 'card'

export interface File {
  id: string
  kind: FileKind
  title: string
  /** Ship: a project's status; an issue's. */
  status?: { label: string; colour: StatusColour; active: boolean }
  lead?: Person
  /** When it last changed, in the apps' words. */
  edited: string
  editedBy?: Person
  /** A document's child pages. */
  children?: string[]
  archived?: boolean
  summary?: string
  done?: { done: number; total: number }
  comments?: number
}

export interface Topic {
  id: string
  title: string
  summary: string
  team: string
  members: Person[]
  /** Newest activity, in minutes ago: the order. */
  at: number
  atLabel: string
  archived?: boolean
  /** The files it lists, in the team's order, each with its look. */
  files: { id: string; look: Look }[]
}

const S = {
  progress: { label: 'In progress', colour: 'blue', active: true },
  planned: { label: 'Planned', colour: 'neutral', active: true },
  done: { label: 'Completed', colour: 'green', active: false },
  todo: { label: 'Todo', colour: 'neutral', active: true },
} as const

export const FILES: File[] = [
  { id: 'w2b2', kind: 'project', title: 'Widgets 2: build 2', status: S.progress, lead: 'miky', edited: '20m ago', editedBy: 'agent', summary: 'Row and card widgets draw every file the same in Peek, Ship and Leaf.', done: { done: 3, total: 7 }, comments: 12 },
  { id: 'spec', kind: 'file', title: 'Widgets spec', edited: '2h ago', editedBy: 'katerina', children: ['row', 'card'], comments: 4 },
  { id: 'row', kind: 'file', title: 'Row widget', edited: 'Yesterday', editedBy: 'katerina' },
  { id: 'card', kind: 'file', title: 'Card widget', edited: 'Tue', editedBy: 'miky' },
  { id: 'status', kind: 'issue', title: 'Card widget draws status and lead', status: S.todo, lead: 'agent', edited: '1h ago', editedBy: 'agent', comments: 3 },
  { id: 'w2b1', kind: 'project', title: 'Widgets 2: build 1', status: S.done, lead: 'miky', edited: 'Mon', editedBy: 'miky', summary: 'The first widgets, in Peek.', done: { done: 6, total: 6 }, comments: 31 },
  { id: 'sketch', kind: 'file', title: 'Widget sketches', edited: 'Mon', editedBy: 'katerina' },
  { id: 'w3', kind: 'project', title: 'Widgets 3', status: S.planned, lead: 'katerina', edited: 'Mon', editedBy: 'katerina', done: { done: 0, total: 4 } },
  { id: 'v0', kind: 'file', title: 'Widgets v0 notes', edited: '12 Oct', editedBy: 'miky', archived: true },
  { id: 'pickers', kind: 'project', title: 'Widget pickers', status: S.done, lead: 'agent', edited: '20 Oct', editedBy: 'agent', archived: true },
  // Other topics' files, for the sidebar folds.
  { id: 'speed', kind: 'project', title: 'Peek opens instantly', status: S.progress, lead: 'agent', edited: '2m ago', editedBy: 'agent' },
  { id: 'speedkit', kind: 'file', title: 'Speed kit', edited: 'Yesterday', editedBy: 'agent' },
  { id: 'level', kind: 'project', title: 'Topics: level up the topic experience', status: S.progress, lead: 'miky', edited: '20m ago', editedBy: 'miky' },
  { id: 'proto', kind: 'issue', title: 'Topics level-up, prototyped', status: S.progress, lead: 'agent', edited: '20m ago', editedBy: 'agent' },
  { id: 'navdoc', kind: 'file', title: 'Navigation notes', edited: '3h ago', editedBy: 'miky' },
  { id: 'suits', kind: 'file', title: 'Estiva Suits Update, 6 Nov', edited: 'Yesterday', editedBy: 'agent' },
  { id: 'onb', kind: 'file', title: 'Onboarding checklist', edited: 'Tue', editedBy: 'katerina' },
  { id: 'price', kind: 'file', title: 'Pricing draft', edited: 'Last week', editedBy: 'miky' },
]
export const fileOf = (id: string) => FILES.find((f) => f.id === id)!

const t = (id: string, title: string, at: number, atLabel: string, files: string[], extra: Partial<Topic> = {}): Topic => ({
  id,
  title,
  summary: '',
  team: 'Company',
  members: ['miky', 'katerina', 'agent'],
  at,
  atLabel,
  files: files.map((f) => ({ id: f, look: fileOf(f).kind === 'project' ? 'card' : 'row' })),
  ...extra,
})

export const TOPICS: Topic[] = [
  t('fast', 'Peek, Ship and Leaf are fast', 2, '2m ago', ['speed', 'speedkit'], { summary: 'Every app opens in under a second on Miky’s workspace.', team: 'Engineering' }),
  t('level', 'Topics level-up', 20, '20m ago', ['level', 'proto']),
  t('widgets', 'Widgets', 60, '1h ago', ['w2b2', 'spec', 'status', 'w2b1', 'sketch', 'w3', 'v0', 'pickers'], { summary: 'One way to draw a file inside another, in every app.' }),
  t('nav', 'Universal Navigation', 180, '3h ago', ['navdoc']),
  t('suits', 'Estiva Suits Update', 1440, 'Yesterday', ['suits'], { members: ['miky', 'agent'] }),
  t('onb', 'Onboarding', 4000, 'Tue', ['onb'], { team: 'Design' }),
  t('price', 'Pricing', 9000, 'Last week', ['price'], { members: ['miky'] }),
  t('hiring', 'Hiring', 300, '5h ago', [], { members: ['katerina'], summary: 'Who we look for next.' }),
  t('brand', 'Brand refresh', 2000, 'Mon', [], { members: ['katerina'], team: 'Design', summary: 'Logo, colours and the site.' }),
  t('interviews', 'Customer interviews', 6000, 'Last week', [], { members: [], summary: 'What five companies told us.' }),
  t('comments', 'Comments everywhere', 30000, '17 Oct', [], { archived: true, summary: 'One comment box in Peek, Ship and Leaf.' }),
  t('signin', 'Stay signed in', 40000, '19 Oct', [], { archived: true }),
]
export const topicOf = (id: string) => TOPICS.find((x) => x.id === id)!

/** Your topics, newest activity first: the sidebars' order and Explore's "Your topics". */
export const yourTopics = (who: Person, topics: Topic[] = TOPICS) => topics.filter((x) => !x.archived && x.members.includes(who)).sort((a, b) => a.at - b.at)
export const byTitle = (a: Topic, b: Topic) => a.title.localeCompare(b.title)

/** How a file draws as a link, from the kit's LinkRow / LinkCard. */
export function linkOf(f: File, readOnly = false): LinkState {
  return {
    state: 'ready',
    linked: {
      id: f.id,
      kind: f.kind,
      title: f.title,
      href: '#',
      noun: f.kind === 'project' ? 'Project' : f.kind === 'issue' ? 'Issue' : 'Document',
      archived: f.archived,
      summary: f.summary,
      updated: f.edited,
      done: f.done,
      conversation: f.comments ? { count: f.comments, href: '#' } : undefined,
      status: f.status ? { value: f.status.label, options: [{ value: f.status.label, label: f.status.label, colour: f.status.colour }], ...(readOnly ? {} : { onChange: () => {} }) } : undefined,
      owner: f.lead ? { value: f.lead, options: [{ value: f.lead, label: PEOPLE[f.lead] }], ...(readOnly ? {} : { onChange: () => {} }) } : undefined,
      ownerLabel: f.kind === 'project' ? 'Lead' : 'Assignee',
    },
  }
}

/** The state a list's read is in when the story opens. */
export type Read = 'ok' | 'loading' | 'failed'
